// xs-security.json must stay in step with the roles used in the CDS model: XSUAA checks the scope
// names at runtime, so a role in a @requires / @restrict without a scope would lock everyone out.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
const path = require('node:path')

const root = path.join(__dirname, '..', '..')
const descriptor = require(path.join(root, 'xs-security.json'))
const generated = JSON.parse(
  execFileSync(
    path.join(root, 'node_modules', '.bin', 'cds'),
    ['compile', 'srv', '--to', 'xsuaa'],
    {
      cwd: root,
      encoding: 'utf8',
    }
  )
)

const names = (list) => list.map((item) => item.name).sort()

test('every role in the CDS model has a scope and a role template in xs-security.json', () => {
  assert.deepEqual(names(descriptor.scopes), names(generated.scopes))
  assert.deepEqual(names(descriptor['role-templates']), names(generated['role-templates']))
})

test('every role template references its own scope, and a role collection hands them out', () => {
  for (const template of descriptor['role-templates']) {
    assert.deepEqual(template['scope-references'], [`$XSAPPNAME.${template.name}`])
  }
  const handedOut = descriptor['role-collections'].flatMap((c) => c['role-template-references'])
  for (const template of descriptor['role-templates']) {
    assert.ok(
      handedOut.includes(`$XSAPPNAME.${template.name}`),
      `${template.name} has no role collection`
    )
  }
})

test('xs-security.json declares an app name and a tenant mode', () => {
  assert.equal(descriptor.xsappname, 'spendwise')
  assert.equal(descriptor['tenant-mode'], 'dedicated')
})
