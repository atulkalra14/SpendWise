// Handlers for the public register action of RegistrationService. Field rules live in
// srv/lib/validation.js. Messages are keys from _i18n/messages*.properties.
const cds = require('@sap/cds')
const { hashPassword } = require('../lib/password')
const { normalizeEmail, registrationErrors } = require('../lib/validation')

const LOCALES = ['en', 'de']
const log = cds.log('registration')

// SQLite reports a violated key as SQLITE_CONSTRAINT*; HANA uses error code 301.
const isDuplicate = (err) =>
  /^SQLITE_CONSTRAINT/.test(err?.code) ||
  err?.code === 301 ||
  /unique constraint/i.test(err?.message || '')

/**
 * Registers the register handlers.
 * @param {import('@sap/cds').ApplicationService} srv The RegistrationService instance.
 */
module.exports = function registerRegisterHandlers(srv) {
  const { Users } = cds.entities('spendwise')

  // before register: validate every field (REGISTRATION_DISPLAYNAME_INVALID, _EMAIL_INVALID,
  // _PASSWORD_LENGTH, _TERMS_REQUIRED). Errors are collected with req.error, so the client gets
  // them all in one response; req.data is never logged.
  srv.before('register', (req) => {
    for (const error of registrationErrors(req.data)) req.error(error)
  })

  // on register: create the Users row; a taken email is a generic 409 (REGISTRATION_FAILED)
  srv.on('register', async (req) => {
    const displayName = req.data.displayName.trim()
    const ID = normalizeEmail(req.data.email)
    const locale = LOCALES.includes(req.data.locale) ? req.data.locale : undefined

    // Hashing happens before the insert on every path, so a duplicate takes about as long as a success.
    const passwordHash = await hashPassword(req.data.password)

    try {
      // The caller is anonymous, so createdBy/modifiedBy are set explicitly to the new user.
      // The primary key is the duplicate guard, which also covers two parallel registrations.
      await cds.db.run(
        INSERT.into(Users).entries({
          ID,
          email: ID,
          displayName,
          ...(locale && { locale }),
          passwordHash,
          termsAcceptedAt: new Date().toISOString(),
          createdBy: ID,
          modifiedBy: ID,
        })
      )
    } catch (err) {
      if (isDuplicate(err)) return req.reject(409, 'REGISTRATION_FAILED')
      log.error('registration failed', err.code)
      throw err
    }

    return { ID, displayName }
  })
}
