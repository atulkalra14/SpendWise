// Handlers for UserService: the signed-in user's profile and password.
// Messages are keys from _i18n/messages*.properties; the key is also the error code clients see.
const cds = require('@sap/cds')
const { hashPassword } = require('./lib/password')
const ensureUser = require('./lib/ensure-user')
const {
  PASSWORD_MIN: MIN_PASSWORD_LENGTH,
  PASSWORD_MAX: MAX_PASSWORD_LENGTH,
} = require('./lib/validation')

module.exports = class UserService extends cds.ApplicationService {
  init() {
    const { Users } = cds.entities('spendwise')

    this.before(['READ', 'UPDATE'], 'Me', (req) => ensureUser(req))

    // Me is draft-enabled so the profile can be edited and saved as a whole. Profiles are created
    // by ensureUser on first use, never by the client, so starting a draft of a new one is refused.
    // before NEW (draft): refuse to start a profile (USER_PROFILE_CREATE_FORBIDDEN)
    this.before('NEW', 'Me.drafts', (req) => req.reject(405, 'USER_PROFILE_CREATE_FORBIDDEN'))

    // before UPDATE: the key stays the caller's (USER_ID_IMMUTABLE), and only EUR is allowed as
    // default currency for now (USER_CURRENCY_UNSUPPORTED)
    this.before('UPDATE', 'Me', (req) => {
      if (req.data.ID && req.data.ID !== req.user.id) {
        req.reject(400, 'USER_ID_IMMUTABLE', 'ID')
      }
      if (req.data.defaultCurrency_code && req.data.defaultCurrency_code !== 'EUR') {
        req.reject(400, 'USER_CURRENCY_UNSUPPORTED', 'defaultCurrency_code')
      }
    })

    // on setPassword: the length limits come from srv/lib/validation.js (USER_PASSWORD_LENGTH)
    this.on('setPassword', async (req) => {
      const { newPassword } = req.data
      if (
        typeof newPassword !== 'string' ||
        newPassword.length < MIN_PASSWORD_LENGTH ||
        newPassword.length > MAX_PASSWORD_LENGTH
      ) {
        return req.reject({
          status: 400,
          message: 'USER_PASSWORD_LENGTH',
          target: 'newPassword',
          args: [MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH],
        })
      }

      await ensureUser(req)
      const passwordHash = await hashPassword(newPassword)
      await UPDATE(Users).set({ passwordHash }).where({ ID: req.user.id })
      return true
    })

    return super.init()
  }
}
