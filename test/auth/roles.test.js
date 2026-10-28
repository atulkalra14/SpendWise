// Role matrix for the SpendWise services: every endpoint needs the CDS role `User`.
// Given the mocked users from .cdsrc.json (alice has the role, fred has none), When each endpoint
// is called, Then anonymous gets 401, a user without the role gets 403, and a user with it gets
// through. RegistrationService is the one public service and is tested separately.
const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const { spawn, execFileSync } = require('node:child_process')
const os = require('node:os')
const path = require('node:path')
const fs = require('node:fs')

const root = path.join(__dirname, '..', '..')
const bin = (name) => path.join(root, 'node_modules', '.bin', name)
// Own port range, so this file never collides with the other test files that run in parallel.
const PORT = 5900 + Math.floor(Math.random() * 400)
const BASE = `http://localhost:${PORT}/odata/v4`
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spendwise-auth-test-'))
// The UI5 dev plugin loads a second copy of @sap/cds, which breaks draft handling.
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
  return { status: res.status, json: await res.json().catch(() => undefined) }
}

before(async () => {
  execFileSync(bin('cds-deploy'), { cwd: root, env, stdio: 'ignore' })
  server = spawn(bin('cds-serve'), ['--port', String(PORT)], { cwd: root, env, stdio: 'ignore' })
  for (let i = 0; i < 60; i++) {
    try {
      await fetch(`${BASE}/registration/$metadata`)
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

// One row per protected endpoint: what to call, and what a user with the role gets.
const endpoints = [
  ['read expenses', 'GET', 'expenses/Expenses?$top=1'],
  ['read categories', 'GET', 'expenses/Categories?$top=1'],
  ['read subcategories', 'GET', 'expenses/Subcategories?$top=1'],
  ['monthlySummary', 'GET', "expenses/monthlySummary(month='2026-10')"],
  ['read own profile', 'GET', 'users/Me'],
  ['setPassword', 'POST', 'users/setPassword', { newPassword: 'a long enough password' }],
]

for (const [name, method, url, body] of endpoints) {
  test(`${name}: anonymous gets 401, a user without the role gets 403, a user with it succeeds`, async () => {
    assert.equal((await call(null, method, url, body)).status, 401)
    assert.equal((await call('fred', method, url, body)).status, 403)
    const allowed = await call('alice', method, url, body)
    assert.ok(allowed.status >= 200 && allowed.status < 300, `alice got ${allowed.status}`)
  })
}

test('creating an expense also needs the role', async () => {
  const body = { date: '2026-10-10', amount: 1.5 }
  assert.equal((await call(null, 'POST', 'expenses/Expenses', body)).status, 401)
  assert.equal((await call('fred', 'POST', 'expenses/Expenses', body)).status, 403)
})

test('the registration service stays public in development: anonymous reaches the handler', async () => {
  // Invalid input proves the request got past authorization and was validated by the handler.
  const res = await call(null, 'POST', 'registration/register', { displayName: '' })
  assert.equal(res.status, 400)
})
