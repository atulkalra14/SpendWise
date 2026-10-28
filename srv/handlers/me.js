// Handlers for the Me entity (the signed-in user's profile) of UserService.
// Messages are keys from _i18n/messages*.properties; the key is also the error code clients see.
const ensureUser = require('../lib/ensure-user')

/**
 * Registers the Me handlers.
 * @param {import('@sap/cds').ApplicationService} srv The UserService instance.
 */
module.exports = function registerMeHandlers(srv) {
  // before READ/UPDATE: make sure the caller has a profile row (created on first use)
  srv.before(['READ', 'UPDATE'], 'Me', (req) => ensureUser(req))

  // Me is draft-enabled so the profile can be edited and saved as a whole. Profiles are created
  // by ensureUser on first use, never by the client, so starting a draft of a new one is refused.
  // before NEW (draft): refuse to start a profile (USER_PROFILE_CREATE_FORBIDDEN)
  srv.before('NEW', 'Me.drafts', (req) => req.reject(405, 'USER_PROFILE_CREATE_FORBIDDEN'))

  // before UPDATE: only EUR is allowed as default currency for now (USER_CURRENCY_UNSUPPORTED).
  // The key needs no check: it is @readonly, so the framework drops it, and the restriction
  // `ID = $user` limits every request to the caller's own row.
  srv.before('UPDATE', 'Me', (req) => {
    if (req.data.defaultCurrency_code && req.data.defaultCurrency_code !== 'EUR') {
      req.reject(400, 'USER_CURRENCY_UNSUPPORTED', 'defaultCurrency_code')
    }
  })
}
