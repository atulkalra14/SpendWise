// Starts real servers to prove that srv/server.js closes the public registration endpoint
// wherever local login is not in use. The unit tests cover the decision; this covers the wiring.
// The servers run with mocked auth or the dummy kind, since no XSUAA binding exists here.
const { test, after } = require('node:test')
const assert = require('node:assert/strict')
const { spawn, execFileSync } = require('node:child_process')
const os = require('node:os')
const path = require('node:path')
const fs = require('node:fs')

const root = path.join(__dirname, '..', '..')
const bin = (name) => path.join(root, 'node_modules', '.bin', name)
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spendwise-closed-test-'))
const servers = []

// Own port range, so this file never collides with the other test files running in parallel.
let nextPort = 6400 + Math.floor(Math.random() * 300)

// Starts a server with the given environment settings and returns its base URL.
async function start(settings) {
  const port = nextPort++
  const env = { ...process.env, NODE_ENV: undefined, CDS_ENV: undefined, ...settings }
  env.CDS_PLUGIN_UI5_ACTIVE = 'false'
  env.CDS_REQUIRES_DB_KIND = 'sqlite'
  env.CDS_REQUIRES_DB_CREDENTIALS_URL = path.join(dir, `${port}.db`)
  for (const key of Object.keys(env)) if (env[key] === undefined) delete env[key]

  execFileSync(bin('cds-deploy'), { cwd: root, env, stdio: 'ignore' })
  const server = spawn(bin('cds-serve'), ['--port', String(port)], {
    cwd: root,
    env,
    stdio: 'ignore',
  })
  servers.push(server)
  const base = `http://localhost:${port}/odata/v4`
  for (let i = 0; i < 60; i++) {
    try {
      await fetch(`${base}/expenses/$metadata`)
      return base
    } catch {
      await new Promise((r) => setTimeout(r, 500))
    }
  }
  throw new Error('server did not start')
}

const register = (base) =>
  fetch(`${base}/registration/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName: '' }),
  })

after(() => {
  for (const server of servers) server.kill()
  fs.rmSync(dir, { recursive: true, force: true })
})

test('in the production profile registration is not served, but the other services still are', async () => {
  const base = await start({ CDS_ENV: 'production', CDS_REQUIRES_AUTH_KIND: 'mocked' })
  assert.equal((await register(base)).status, 404)
  // Anonymous is still stopped by authentication, so the other services are up and protected.
  assert.equal((await fetch(`${base}/expenses/Expenses`)).status, 401)
  assert.equal((await fetch(`${base}/users/Me`)).status, 401)
})

test('with an identity provider kind registration is not served, even outside production', async () => {
  const base = await start({ CDS_REQUIRES_AUTH_KIND: 'dummy' })
  assert.equal((await register(base)).status, 404)
})

test('with local login in development registration is served', async () => {
  const base = await start({ CDS_ENV: 'development' })
  assert.equal((await register(base)).status, 400) // reaches the handler, which validates the input
})
