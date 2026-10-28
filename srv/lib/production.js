// Rules for where RegistrationService may be served. Pure functions, no CAP runtime needed.

// Authentication kinds where SpendWise itself knows the users (local development and tests).
// Every other kind (jwt, xsuaa, ias, ...) means an identity provider owns sign-up.
const LOCAL_LOGIN_KINDS = ['mocked', 'basic']

/**
 * Decides whether the public registration endpoint may be served. It is a fail-closed rule:
 * registration is allowed only with local login and outside the production profile, and closed
 * in every other case. CAP adds the `development` profile to any profile that is not
 * `production` (so `hybrid` or a mistyped name still count as development), which is why the
 * decision is based on the authentication kind and not on the profile alone.
 * @param {{profiles?: string[], requires?: {auth?: {kind?: string}}}} env The cds.env object.
 * @returns {boolean} True if RegistrationService may be served.
 */
function registrationAllowed(env) {
  const production = (env?.profiles || []).includes('production')
  const kind = env?.requires?.auth?.kind
  return !production && LOCAL_LOGIN_KINDS.includes(kind)
}

/**
 * Stops RegistrationService from being served. Registration creates a local account with a
 * password; where an identity provider owns sign-up, a public endpoint would let anyone create
 * user rows. `@protocol: 'none'` is the CAP annotation for a service that no protocol adapter
 * exposes.
 * @param {{definitions?: Record<string, object>}} model The loaded CSN model, changed in place.
 */
function disableRegistration(model) {
  const service = model?.definitions?.RegistrationService
  if (service) service['@protocol'] = 'none'
}

module.exports = { registrationAllowed, disableRegistration }
