// i18n tests for runtime messages: every rule message comes from _i18n/messages*.properties,
// is returned as a key in `error.code`, and is translated by Accept-Language (en, de, fallback).
// Starts the real server against a throw-away SQLite file, like the service tests do.
const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const { spawn, execFileSync } = require('node:child_process')
const os = require('node:os')
const path = require('node:path')
const fs = require('node:fs')

const root = path.join(__dirname, '..', '..')
const bin = (name) => path.join(root, 'node_modules', '.bin', name)
// Own port range, so this file never collides with the service tests that run in parallel.
const PORT = 5300 + Math.floor(Math.random() * 500)
const BASE = `http://localhost:${PORT}/odata/v4`
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spendwise-i18n-test-'))
// The UI5 dev plugin loads a second copy of @sap/cds, which breaks draft handling.
const env = {
  ...process.env,
  CDS_PLUGIN_UI5_ACTIVE: 'false',
  CDS_REQUIRES_DB_KIND: 'sqlite',
  CDS_REQUIRES_DB_CREDENTIALS_URL: path.join(dir, 'test.db'),
}
let server

const GROCERIES = 'c0000001-0000-0000-0000-000000000001'
const FUEL = 'a0000001-0000-0000-0000-000000000302'

const call = async (user, method, url, body, lang) => {
  const res = await fetch(`${BASE}/${url}`, {
    method,
    headers: {
      ...(user ? { Authorization: `Basic ${Buffer.from(`${user}:`).toString('base64')}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(lang ? { 'Accept-Language': lang } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = undefined
  }
  return { status: res.status, json, text }
}

// One error comes back flat, several come back under details.
const firstError = (res) => {
  const err = res.json?.error
  return err?.details?.length ? err.details[0] : err
}

// An expense whose subcategory (fuel) belongs to another category than the one given (groceries).
const mismatch = (lang) =>
  call(
    'alice',
    'PATCH',
    'expenses/Expenses(11111111-1111-1111-1111-111111111111)',
    { category_ID: GROCERIES, subcategory_ID: FUEL },
    lang
  )

before(async () => {
  execFileSync(bin('cds-deploy'), { cwd: root, env, stdio: 'ignore' })
  server = spawn(bin('cds-serve'), ['--port', String(PORT)], { cwd: root, env, stdio: 'ignore' })
  for (let i = 0; i < 60; i++) {
    try {
      await fetch(`${BASE}/expenses/$metadata`)
      return
    } catch {
      await new Promise((r) => setTimeout(r, 500))
    }
  }
  throw new Error('server did not start')
})

after(() => {
  server?.kill()
  fs.rmSync(dir, { recursive: true, force: true })
})

test('an expense rule message is returned as a key and translated into en and de', async () => {
  const en = firstError(await mismatch('en'))
  assert.equal(en.code, 'EXPENSE_SUBCATEGORY_CATEGORY_MISMATCH')
  assert.equal(en.message, 'The subcategory does not belong to the category.')
  const de = firstError(await mismatch('de'))
  assert.equal(de.code, 'EXPENSE_SUBCATEGORY_CATEGORY_MISMATCH')
  assert.equal(de.message, 'Die Unterkategorie gehört nicht zur Kategorie.')
})

test('a language without a translation falls back to English', async () => {
  const fr = firstError(await mismatch('fr'))
  assert.equal(fr.message, 'The subcategory does not belong to the category.')
})

test('the monthlySummary month format error is a key and translated', async () => {
  const de = await call('alice', 'GET', "expenses/monthlySummary(month='2026-13')", null, 'de')
  assert.equal(de.status, 400)
  assert.equal(de.json.error.code, 'EXPENSE_MONTH_FORMAT')
  assert.equal(de.json.error.message, 'Geben Sie den Monat im Format JJJJ-MM ein.')
  const en = await call('alice', 'GET', "expenses/monthlySummary(month='2026-13')", null, 'en')
  assert.equal(en.json.error.message, 'Enter the month as YYYY-MM.')
})

test('the password length message fills both placeholders in en and de', async () => {
  const en = await call('alice', 'POST', 'users/setPassword', { newPassword: 'short' }, 'en')
  assert.equal(en.status, 400)
  assert.equal(en.json.error.code, 'USER_PASSWORD_LENGTH')
  assert.equal(en.json.error.message, 'The password must be 12 to 128 characters long.')
  const de = await call('alice', 'POST', 'users/setPassword', { newPassword: 'short' }, 'de')
  assert.equal(de.json.error.message, 'Das Passwort muss 12 bis 128 Zeichen lang sein.')
})

test('profile rules are keys and translated: no creation, only EUR as default currency', async () => {
  const create = await call('alice', 'POST', 'users/Me', { ID: 'mallory' }, 'de')
  assert.equal(create.status, 405)
  assert.equal(create.json.error.code, 'USER_PROFILE_CREATE_FORBIDDEN')
  assert.equal(create.json.error.message, 'Profile können nicht angelegt werden.')

  // Given alice's seeded profile in a draft, When USD is set as default currency and the draft
  // is saved, Then the save is rejected: the rule only runs on SAVE, not while editing.
  const active = 'users/Me(ID=alice,IsActiveEntity=true)'
  const draft = 'users/Me(ID=alice,IsActiveEntity=false)'
  const edit = await call('alice', 'POST', `${active}/UserService.draftEdit`, {
    PreserveChanges: true,
  })
  assert.equal(edit.status, 201)
  const patch = await call('alice', 'PATCH', draft, { defaultCurrency_code: 'USD' })
  assert.equal(patch.status, 200)
  const save = await call('alice', 'POST', `${draft}/UserService.draftActivate`, {}, 'de')
  assert.equal(save.status, 400)
  assert.equal(save.json.error.code, 'USER_CURRENCY_UNSUPPORTED')
  assert.equal(save.json.error.message, 'Derzeit wird nur EUR als Standardwährung unterstützt.')
})

test('registration messages use the REGISTRATION_ prefix and fill placeholders', async () => {
  const body = {
    displayName: 'Carol',
    email: 'carol@example.com',
    password: 'short',
    acceptTerms: true,
  }
  const en = firstError(await call(null, 'POST', 'registration/register', body, 'en'))
  assert.equal(en.code, 'REGISTRATION_PASSWORD_LENGTH')
  assert.equal(en.message, 'The password must be 12 to 128 characters long.')
  const de = firstError(await call(null, 'POST', 'registration/register', body, 'de'))
  assert.equal(de.message, 'Das Passwort muss 12 bis 128 Zeichen lang sein.')
})
