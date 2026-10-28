// Handler for the setPassword action of UserService: stores a salted hash, nothing else.
// Messages are keys from _i18n/messages*.properties.
const cds = require('@sap/cds')
const { hashPassword } = require('../lib/password')
const ensureUser = require('../lib/ensure-user')
const { PASSWORD_MIN, PASSWORD_MAX, isPasswordLengthValid } = require('../lib/validation')

/**
 * Registers the setPassword handler.
 * @param {import('@sap/cds').ApplicationService} srv The UserService instance.
 */
module.exports = function registerSetPasswordHandler(srv) {
  const { Users } = cds.entities('spendwise')

  // on setPassword: the length limits come from srv/lib/validation.js (USER_PASSWORD_LENGTH)
  srv.on('setPassword', async (req) => {
    const { newPassword } = req.data
    if (!isPasswordLengthValid(newPassword)) {
      return req.reject({
        status: 400,
        message: 'USER_PASSWORD_LENGTH',
        target: 'newPassword',
        args: [PASSWORD_MIN, PASSWORD_MAX],
      })
    }

    await ensureUser(req)
    const passwordHash = await hashPassword(newPassword)
    await UPDATE(Users).set({ passwordHash }).where({ ID: req.user.id })
    return true
  })
}
