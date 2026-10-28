// Starts the real server against a throw-away SQLite file and calls the OData API with fetch.
// Uses only Node's built-in test runner, so no extra dependency is needed.
const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const { spawn, execFileSync } = require('node:child_process')
const os = require('node:os')
const path = require('node:path')
const fs = require('node:fs')

const root = path.join(__dirname, '..')
const bin = (name) => path.join(root, 'node_modules', '.bin', name)
const PORT = 4300 + Math.floor(Math.random() * 500)
const BASE = `http://localhost:${PORT}/odata/v4/expenses`
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spendwise-test-'))
// The UI5 dev plugin loads a second copy of @sap/cds (via the global cds-dk), which breaks draft
// handling, so it is switched off for the API tests.
const env = { ...process.env, CDS_PLUGIN_UI5_ACTIVE: 'false', CDS_REQUIRES_DB_KIND: 'sqlite', CDS_REQUIRES_DB_CREDENTIALS_URL: path.join(dir, 'test.db') }
let server

const GROCERIES = 'c0000001-0000-0000-0000-000000000001'
const MARKET = 'a0000001-0000-0000-0000-000000000102'
const FUEL = 'a0000001-0000-0000-0000-000000000302'
const ALICE_EXPENSE = '11111111-1111-1111-1111-111111111111'

const call = async (user, method, url, body, headers = {}) => {
  const res = await fetch(url.startsWith('http') ? url : `${BASE}/${url}`, {
    method,
    headers: {
      ...(user ? { Authorization: `Basic ${Buffer.from(`${user}:`).toString('base64')}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  })
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { json = undefined }
  return { status: res.status, json, text }
}

// Expenses are draft-enabled: a POST creates a draft, and draftActivate saves it (and validates it).
// Returns the result of the first step that failed, or of the activation.
const createExpense = async (user, body) => {
  const draft = await call(user, 'POST', 'Expenses', body)
  if (draft.status !== 201) return draft
  return call(user, 'POST', `Expenses(ID=${draft.json.ID},IsActiveEntity=false)/ExpenseService.draftActivate`, {})
}

const newExpense = (extra = {}) => ({ date: '2026-10-10', amount: 9.99, ...extra })

before(async () => {
  execFileSync(bin('cds-deploy'), { cwd: root, env, stdio: 'ignore' })
  server = spawn(bin('cds-serve'), ['--port', String(PORT)], { cwd: root, env, stdio: 'ignore' })
  for (let i = 0; i < 60; i++) {
    try { await fetch(`${BASE}/$metadata`); return } catch { await new Promise((r) => setTimeout(r, 500)) }
  }
  throw new Error('server did not start')
})

after(() => {
  server?.kill()
  fs.rmSync(dir, { recursive: true, force: true })
})

test('categories need authentication', async () => {
  assert.equal((await call(null, 'GET', 'Categories')).status, 401)
})

test('categories are returned with subcategories, localized by Accept-Language', async () => {
  const q = "Categories?$filter=code eq 'transport'&$expand=subcategories($select=code)"
  const en = await call('alice', 'GET', encodeURI(q))
  assert.equal(en.status, 200)
  assert.equal(en.json.value[0].name, 'Transport')
  assert.deepEqual(en.json.value[0].subcategories.map((s) => s.code).sort(), ['fuel', 'public-transport'])
  const de = await call('alice', 'GET', encodeURI(q), null, { 'Accept-Language': 'de' })
  assert.equal(de.json.value[0].name, 'Verkehr')
})

test('categories and subcategories are read-only', async () => {
  for (const [method, url, body] of [
    ['POST', 'Categories', { code: 'x', name: 'x' }],
    ['PATCH', `Categories(${GROCERIES})`, { name: 'x' }],
    ['DELETE', `Categories(${GROCERIES})`],
    ['POST', 'Subcategories', { code: 'x', name: 'x', category_ID: GROCERIES }]
  ]) {
    const res = await call('alice', method, url, body)
    assert.ok([403, 405].includes(res.status), `${method} ${url} gave ${res.status}`)
  }
})

test('create with category and subcategory ignores a client-supplied user_ID', async () => {
  const res = await createExpense('alice', newExpense({ category_ID: GROCERIES, subcategory_ID: MARKET, user_ID: 'bob' }))
  assert.equal(res.status, 201)
  assert.equal(res.json.user_ID, 'alice')
  assert.equal(res.json.createdBy, 'alice')
  assert.equal(res.json.category_ID, GROCERIES)
})

test('category is optional', async () => {
  const res = await createExpense('alice', newExpense())
  assert.equal(res.status, 201)
  assert.equal(res.json.category_ID, null)
})

test('a user without a profile row can still create an expense', async () => {
  const res = await createExpense('dave', newExpense())
  assert.equal(res.status, 201)
  assert.equal(res.json.user_ID, 'dave')
})

test('subcategory of another category is rejected with a code and target', async () => {
  const res = await createExpense('alice', newExpense({ category_ID: GROCERIES, subcategory_ID: FUEL }))
  assert.equal(res.status, 400)
  assert.equal(res.json.error.code, 'SUBCATEGORY_CATEGORY_MISMATCH')
  assert.equal(res.json.error.target, 'subcategory_ID')
})

test('unknown category and subcategory without category are rejected', async () => {
  const unknown = await createExpense('alice', newExpense({ category_ID: 'c0000001-0000-0000-0000-0000000000ff' }))
  assert.equal(unknown.status, 400)
  assert.equal(unknown.json.error.code, 'CATEGORY_NOT_FOUND')
  const noCategory = await createExpense('alice', newExpense({ subcategory_ID: MARKET }))
  assert.equal(noCategory.status, 400)
  assert.equal(noCategory.json.error.code, 'SUBCATEGORY_REQUIRES_CATEGORY')
})

test('PATCH with only one of the two fields is checked against the stored row', async () => {
  const bad = await call('alice', 'PATCH', `Expenses(${ALICE_EXPENSE})`, { subcategory_ID: FUEL })
  assert.equal(bad.status, 400)
  assert.equal(bad.json.error.code, 'SUBCATEGORY_CATEGORY_MISMATCH')
  const ok = await call('alice', 'PATCH', `Expenses(${ALICE_EXPENSE})`, { notes: 'weekly shop' })
  assert.equal(ok.status, 200)
  assert.equal(ok.json.notes, 'weekly shop')
})

test('too long notes are rejected by the framework', async () => {
  const res = await createExpense('alice', newExpense({ notes: 'x'.repeat(501) }))
  assert.equal(res.status, 400)
})

test('bob cannot read, change or delete alice expenses, also not through $expand', async () => {
  const list = await call('bob', 'GET', encodeURI('Expenses?$expand=category($select=code)'))
  assert.equal(list.status, 200)
  assert.ok(list.json.value.length > 0)
  assert.ok(list.json.value.every((e) => e.createdBy === 'bob' || e.createdBy === undefined))
  assert.ok(!list.text.includes(ALICE_EXPENSE))
  assert.ok([403, 404].includes((await call('bob', 'PATCH', `Expenses(${ALICE_EXPENSE})`, { notes: 'x' })).status))
  assert.ok([403, 404].includes((await call('bob', 'DELETE', `Expenses(${ALICE_EXPENSE})`)).status))
})

test('a draft is private, is not validated until saved and is not an expense yet', async () => {
  const draft = await call('alice', 'POST', 'Expenses', newExpense({ category_ID: GROCERIES, subcategory_ID: FUEL }))
  assert.equal(draft.status, 201)
  assert.equal(draft.json.IsActiveEntity, false)
  const key = `Expenses(ID=${draft.json.ID},IsActiveEntity=false)`
  assert.ok([403, 404].includes((await call('bob', 'GET', key)).status))
  assert.ok([403, 404].includes((await call('bob', 'POST', `${key}/ExpenseService.draftActivate`, {})).status))
  assert.equal((await call('alice', 'GET', `Expenses(ID=${draft.json.ID},IsActiveEntity=true)`)).status, 404)
  const activate = await call('alice', 'POST', `${key}/ExpenseService.draftActivate`, {})
  assert.equal(activate.status, 400)
  assert.equal(activate.json.error.code, 'SUBCATEGORY_CATEGORY_MISMATCH')
  const fixed = await call('alice', 'PATCH', key, { subcategory_ID: MARKET })
  assert.equal(fixed.status, 200)
  assert.equal((await call('alice', 'POST', `${key}/ExpenseService.draftActivate`, {})).status, 201)
})

test('an existing expense can be edited through a draft, and bob cannot start one', async () => {
  const active = `Expenses(ID=${ALICE_EXPENSE},IsActiveEntity=true)`
  const denied = await call('bob', 'POST', `${active}/ExpenseService.draftEdit`, { PreserveChanges: true })
  assert.ok([403, 404].includes(denied.status))
  const edit = await call('alice', 'POST', `${active}/ExpenseService.draftEdit`, { PreserveChanges: true })
  assert.equal(edit.status, 201)
  const draft = `Expenses(ID=${ALICE_EXPENSE},IsActiveEntity=false)`
  assert.equal((await call('alice', 'PATCH', draft, { notes: 'edited in a draft', user_ID: 'bob' })).status, 200)
  const saved = await call('alice', 'POST', `${draft}/ExpenseService.draftActivate`, {})
  assert.equal(saved.status, 200)
  assert.equal(saved.json.notes, 'edited in a draft')
  assert.equal(saved.json.user_ID, 'alice')
})

test('monthlySummary totals are unchanged for the seeded October data', async () => {
  const bob = await call('bob', 'GET', "monthlySummary(month='2026-10')")
  assert.equal(bob.json.total, '89.00')
  assert.equal(bob.json.count, 1)
  const carol = await call('carol', 'GET', "monthlySummary(month='2026-10')")
  assert.equal(carol.json.total, '0.00')
})
