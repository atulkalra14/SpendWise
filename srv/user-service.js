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
    this.before('NEW', 'Me.drafts', (req) => req.reject(405, 'Profiles cannot be created'))

    this.before('UPDATE', 'Me', (req) => {
      if (req.data.ID && req.data.ID !== req.user.id) req.reject(400, 'ID cannot be changed')
      if (req.data.defaultCurrency_code && req.data.defaultCurrency_code !== 'EUR') {
        req.reject(400, 'Only EUR is supported as default currency for now')
      }
    })

    this.on('setPassword', async (req) => {
      const { newPassword } = req.data
      if (
        typeof newPassword !== 'string' ||
        newPassword.length < MIN_PASSWORD_LENGTH ||
        newPassword.length > MAX_PASSWORD_LENGTH
      ) {
        return req.reject(
          400,
          `Password must be ${MIN_PASSWORD_LENGTH} to ${MAX_PASSWORD_LENGTH} characters long`
        )
      }

      await ensureUser(req)
      const passwordHash = await hashPassword(newPassword)
      await UPDATE(Users).set({ passwordHash }).where({ ID: req.user.id })
      return true
    })

    return super.init()
  }
}
