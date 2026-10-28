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
const BASE = `http://localhost:${PORT}/odata/v4/users`
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spendwise-test-'))
// The UI5 dev plugin loads a second copy of @sap/cds (via the global cds-dk), which breaks draft
// handling, so it is switched off for the API tests.
const env = {
  ...process.env,
  CDS_PLUGIN_UI5_ACTIVE: 'false',
  CDS_REQUIRES_DB_KIND: 'sqlite',
  CDS_REQUIRES_DB_CREDENTIALS_URL: path.join(dir, 'test.db'),
}
let server

const call = async (user, method, url, body) => {
  const res = await fetch(`${BASE}/${url}`, {
    method,
    headers: {
      ...(user ? { Authorization: `Basic ${Buffer.from(`${user}:`).toString('base64')}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
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

before(async () => {
  execFileSync(bin('cds-deploy'), { cwd: root, env, stdio: 'ignore' })
  server = spawn(bin('cds-serve'), ['--port', String(PORT)], { cwd: root, env, stdio: 'ignore' })
  for (let i = 0; i < 60; i++) {
    try {
      await fetch(`${BASE}/$metadata`)
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

const active = (id) => `Me(ID=${id},IsActiveEntity=true)`
const draft = (id) => `Me(ID=${id},IsActiveEntity=false)`

test('the profile needs authentication and never exposes the password hash', async () => {
  assert.equal((await call(null, 'GET', 'Me')).status, 401)
  const res = await call('alice', 'GET', 'Me')
  assert.equal(res.status, 200)
  assert.deepEqual(
    res.json.value.map((u) => u.ID),
    ['alice']
  )
  assert.ok(!res.text.includes('passwordHash'))
})

test('a profile is edited through a draft and validated when it is saved', async () => {
  assert.equal(
    (
      await call('alice', 'POST', `${active('alice')}/UserService.draftEdit`, {
        PreserveChanges: true,
      })
    ).status,
    201
  )
  assert.equal(
    (
      await call('alice', 'PATCH', draft('alice'), {
        displayName: 'Alice A',
        defaultCurrency_code: 'USD',
      })
    ).status,
    200
  )
  assert.equal(
    (await call('alice', 'POST', `${draft('alice')}/UserService.draftActivate`, {})).status,
    400
  )
  assert.equal(
    (await call('alice', 'PATCH', draft('alice'), { defaultCurrency_code: 'EUR' })).status,
    200
  )
  const saved = await call('alice', 'POST', `${draft('alice')}/UserService.draftActivate`, {})
  assert.equal(saved.status, 200)
  assert.equal(saved.json.displayName, 'Alice A')
})

test('bob cannot edit alice profile, and profiles cannot be created', async () => {
  const denied = await call('bob', 'POST', `${active('alice')}/UserService.draftEdit`, {
    PreserveChanges: true,
  })
  assert.ok([403, 404].includes(denied.status))
  assert.equal((await call('alice', 'POST', 'Me', { ID: 'mallory' })).status, 405)
})
