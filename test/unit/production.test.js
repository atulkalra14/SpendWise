// Unit tests for the rules that decide where the public registration endpoint is served.
const { test } = require('node:test')
const assert = require('node:assert/strict')

const { registrationAllowed, disableRegistration } = require('../../srv/lib/production')

const env = (profiles, kind) => ({ profiles, requires: { auth: { kind } } })

test('registration is allowed only with local login outside production', () => {
  assert.equal(registrationAllowed(env(['development'], 'mocked')), true)
  assert.equal(registrationAllowed(env(['development'], 'basic')), true)
  // CAP adds `development` to profiles such as hybrid, so these still count as development.
  assert.equal(registrationAllowed(env(['development', 'hybrid'], 'mocked')), true)
})

test('registration is closed in production and for every identity provider', () => {
  assert.equal(registrationAllowed(env(['production'], 'jwt')), false)
  assert.equal(registrationAllowed(env(['production'], 'mocked')), false)
  assert.equal(registrationAllowed(env(['development'], 'xsuaa')), false)
  assert.equal(registrationAllowed(env(['development', 'hybrid'], 'ias')), false)
})

test('registration fails closed when the configuration is missing or unknown', () => {
  assert.equal(registrationAllowed(undefined), false)
  assert.equal(registrationAllowed({}), false)
  assert.equal(registrationAllowed(env(['development'], undefined)), false)
  assert.equal(registrationAllowed(env(['development'], 'something-new')), false)
})

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
