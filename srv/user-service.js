const cds = require('@sap/cds')
const { hashPassword } = require('./lib/password')

const MIN_PASSWORD_LENGTH = 12
const MAX_PASSWORD_LENGTH = 128

module.exports = class UserService extends cds.ApplicationService {
  init() {
    const { Users } = cds.entities('spendwise')

    // The profile row is created the first time a signed-in user touches the service.
    // It goes through cds.db so the service restriction does not apply, and the key always
    // comes from the authenticated user, never from the request payload.
    const ensureUser = async (req) => {
      const id = req.user.id
      const existing = await SELECT.one.from(Users).columns('ID').where({ ID: id })
      if (!existing) await INSERT.into(Users).entries({ ID: id, displayName: id })
    }

    this.before(['READ', 'UPDATE'], 'Me', (req) => ensureUser(req))

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
        return req.reject(400, `Password must be ${MIN_PASSWORD_LENGTH} to ${MAX_PASSWORD_LENGTH} characters long`)
      }

      await ensureUser(req)
      const passwordHash = await hashPassword(newPassword)
      await UPDATE(Users).set({ passwordHash }).where({ ID: req.user.id })
      return true
    })

    return super.init()
  }
}
