// Unit test for the production rule that closes the public registration endpoint.
const { test } = require('node:test')
const assert = require('node:assert/strict')

const { disableRegistration } = require('../../srv/lib/production')

test('disableRegistration marks RegistrationService as not served and leaves other services alone', () => {
  const model = {
    definitions: {
      RegistrationService: { kind: 'service' },
      ExpenseService: { kind: 'service' },
      'spendwise.Users': { kind: 'entity' },
    },
  }
  disableRegistration(model)
  assert.equal(model.definitions.RegistrationService['@protocol'], 'none')
  assert.equal(model.definitions.ExpenseService['@protocol'], undefined)
  assert.equal(model.definitions['spendwise.Users']['@protocol'], undefined)
})

test('disableRegistration does nothing when the model has no registration service', () => {
  const model = { definitions: { ExpenseService: { kind: 'service' } } }
  assert.doesNotThrow(() => disableRegistration(model))
  assert.equal(model.definitions.ExpenseService['@protocol'], undefined)
})
