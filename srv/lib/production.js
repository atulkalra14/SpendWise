// Rules that only apply in the production profile. Pure functions on the CSN model, no CAP needed.

/**
 * Stops RegistrationService from being served. Registration creates a local account with a
 * password and is only meant for local/custom login; on BTP the identity provider owns sign-up,
 * and a public endpoint there would let anyone create user rows. `@protocol: 'none'` is the CAP
 * annotation for a service that no protocol adapter exposes.
 * @param {{definitions?: Record<string, object>}} model The loaded CSN model, changed in place.
 */
function disableRegistration(model) {
  const service = model?.definitions?.RegistrationService
  if (service) service['@protocol'] = 'none'
}

module.exports = { disableRegistration }
