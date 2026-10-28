// Starts the real server against a throw-away SQLite file and calls the public registration API.
const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const { spawn, execFileSync } = require('node:child_process')
const os = require('node:os')
const path = require('node:path')
const fs = require('node:fs')

const root = path.join(__dirname, '..')
const bin = (name) => path.join(root, 'node_modules', '.bin', name)
const PORT = 4800 + Math.floor(Math.random() * 500)
const SERVICE = `http://localhost:${PORT}/odata/v4`
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spendwise-reg-test-'))
const dbFile = path.join(dir, 'test.db')
const env = {
  ...process.env,
  CDS_PLUGIN_UI5_ACTIVE: 'false',
  CDS_REQUIRES_DB_KIND: 'sqlite',
  CDS_REQUIRES_DB_CREDENTIALS_URL: dbFile,
}
let server
let output = ''

const call = async (method, url, body, headers = {}) => {
  const res = await fetch(`${SERVICE}/${url}`, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
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
const register = (body, headers) => call('POST', 'registration/register', body, headers)

const valid = {
  displayName: 'Carol',
  email: 'Carol@Example.com',
  password: 'correct horse battery',
  acceptTerms: true,
}
const rows = (sql) => {
  const { DatabaseSync } = require('node:sqlite')
  const db = new DatabaseSync(dbFile, { readOnly: true })
  try {
    return db.prepare(sql).all()
  } finally {
    db.close()
  }
}
// One error comes back flat, several come back under details.
const errors = (res) => {
  const err = res.json?.error
  return err?.details?.length ? err.details : [err]
}
const targets = (res) =>
  errors(res)
    .map((d) => d.target)
    .sort()
const codes = (res) =>
  errors(res)
    .map((d) => d.code)
    .sort()

before(async () => {
  execFileSync(bin('cds-deploy'), { cwd: root, env, stdio: 'ignore' })
  server = spawn(bin('cds-serve'), ['--port', String(PORT)], { cwd: root, env })
  server.stdout.on('data', (d) => {
    output += d
  })
  server.stderr.on('data', (d) => {
    output += d
  })
  for (let i = 0; i < 60; i++) {
    try {
      await fetch(`${SERVICE}/registration/$metadata`)
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

test('an anonymous caller can register and only the id and name come back', async () => {
  const res = await register(valid)
  assert.equal(res.status, 200)
  assert.equal(res.json.ID, 'carol@example.com')
  assert.equal(res.json.displayName, 'Carol')
  assert.ok(!res.text.includes('passwordHash') && !res.text.includes(valid.password))

  const [row] = rows("select * from spendwise_Users where ID = 'carol@example.com'")
  assert.match(row.passwordHash, /^scrypt\$/)
  assert.ok(row.termsAcceptedAt)
  assert.equal(row.email, 'carol@example.com')
  assert.equal(row.createdBy, 'carol@example.com')
})

test('the service exposes only the register action and no password hash', async () => {
  const meta = await call('GET', 'registration/$metadata')
  assert.ok(!meta.text.includes('passwordHash'))
  assert.ok(!meta.text.includes('EntitySet'))
  assert.ok(meta.text.includes('Name="register"'))
})

test('a duplicate email in another case is a generic 409 and creates no second row', async () => {
  const res = await register({ ...valid, email: 'carol@EXAMPLE.com', displayName: 'Other' })
  assert.equal(res.status, 409)
  assert.equal(res.json.error.code, 'REGISTRATION_FAILED')
  assert.equal(
    rows("select ID from spendwise_Users where lower(ID) = 'carol@example.com'").length,
    1
  )
})

test('two parallel registrations of one email give one success and one 409', async () => {
  const body = { ...valid, email: 'dave@example.com' }
  const results = await Promise.all([register(body), register(body)])
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 409])
})

test('invalid input returns one error per bad field with its target', async () => {
  const res = await register({
    displayName: '  ',
    email: 'nope',
    password: 'short',
    acceptTerms: false,
  })
  assert.equal(res.status, 400)
  assert.deepEqual(targets(res), ['acceptTerms', 'displayName', 'email', 'password'])
  assert.deepEqual(codes(res), [
    'REGISTRATION_DISPLAYNAME_INVALID',
    'REGISTRATION_EMAIL_INVALID',
    'REGISTRATION_PASSWORD_LENGTH',
    'REGISTRATION_TERMS_REQUIRED',
  ])

  assert.deepEqual(targets(await register({ ...valid, password: 'x'.repeat(129) })), ['password'])
  assert.deepEqual(targets(await register({ ...valid, acceptTerms: undefined })), ['acceptTerms'])
  assert.equal(
    (await register({ ...valid, email: 'a@b.co', displayName: 'x'.repeat(101) })).status,
    400
  )
})

test('client-supplied key, hash and audit fields are rejected, an unknown locale is ignored', async () => {
  for (const extra of [{ ID: 'admin' }, { passwordHash: 'scrypt$x$y' }, { createdBy: 'admin' }]) {
    assert.equal((await register({ ...valid, email: 'erin@example.com', ...extra })).status, 400)
  }
  assert.equal(rows("select ID from spendwise_Users where email = 'erin@example.com'").length, 0)

  assert.equal((await register({ ...valid, email: 'erin@example.com', locale: 'xx' })).status, 200)
  const [row] = rows("select * from spendwise_Users where email = 'erin@example.com'")
  assert.equal(row.ID, 'erin@example.com')
  assert.equal(row.createdBy, 'erin@example.com')
  assert.equal(row.locale, 'en')
})

test('the same password gets a different hash for each user', async () => {
  await register({ ...valid, email: 'f1@example.com' })
  await register({ ...valid, email: 'f2@example.com' })
  const [a, b] = rows(
    "select passwordHash from spendwise_Users where ID in ('f1@example.com','f2@example.com')"
  )
  assert.notEqual(a.passwordHash, b.passwordHash)
})

// Translated texts are asserted in test/i18n/messages.test.js; here only the key is checked.
test('an invalid email is reported with its message key', async () => {
  const res = await register({ ...valid, email: 'bad' }, { 'Accept-Language': 'de' })
  assert.deepEqual(codes(res), ['REGISTRATION_EMAIL_INVALID'])
})

test('the plain password never reaches the database or the server log', () => {
  const dump = fs.readFileSync(dbFile).toString('latin1')
  assert.ok(!dump.includes(valid.password))
  assert.ok(!output.includes(valid.password))
})

test('the other services still require authentication', async () => {
  assert.equal((await call('GET', 'users/Me')).status, 401)
  assert.equal((await call('GET', 'expenses/Expenses')).status, 401)
})
