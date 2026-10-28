// Handlers for RegistrationService: the public register action for local/custom login.
// Messages are keys from _i18n/messages*.properties; the key is also the error code clients see.
const cds = require('@sap/cds')
const { hashPassword } = require('./lib/password')
const { PASSWORD_MIN, PASSWORD_MAX, EMAIL_PATTERN, normalizeEmail } = require('./lib/validation')

const LOCALES = ['en', 'de']
const log = cds.log('registration')

const isString = (v) => typeof v === 'string'

// SQLite reports a violated key as SQLITE_CONSTRAINT*; HANA uses error code 301.
const isDuplicate = (err) =>
  /^SQLITE_CONSTRAINT/.test(err?.code) ||
  err?.code === 301 ||
  /unique constraint/i.test(err?.message || '')

module.exports = class RegistrationService extends cds.ApplicationService {
  init() {
    const { Users } = cds.entities('spendwise')

    // before register: validate every field (REGISTRATION_DISPLAYNAME_INVALID, _EMAIL_INVALID,
    // _PASSWORD_LENGTH, _TERMS_REQUIRED). Errors are collected with req.error, so the client gets
    // them all in one response; req.data is never logged.
    this.before('register', (req) => {
      const { displayName, email, password, acceptTerms } = req.data

      const name = isString(displayName) ? displayName.trim() : ''
      if (!name || name.length > 100)
        req.error({
          status: 400,
          message: 'REGISTRATION_DISPLAYNAME_INVALID',
          target: 'displayName',
        })

      const mail = isString(email) ? normalizeEmail(email) : ''
      if (!mail || mail.length > 255 || !EMAIL_PATTERN.test(mail)) {
        req.error({ status: 400, message: 'REGISTRATION_EMAIL_INVALID', target: 'email' })
      }

      if (!isString(password) || password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
        req.error({
          status: 400,
          message: 'REGISTRATION_PASSWORD_LENGTH',
          target: 'password',
          args: [PASSWORD_MIN, PASSWORD_MAX],
        })
      }

      if (acceptTerms !== true)
        req.error({ status: 400, message: 'REGISTRATION_TERMS_REQUIRED', target: 'acceptTerms' })
    })

    // on register: create the Users row; a taken email is a generic 409 (REGISTRATION_FAILED)
    this.on('register', async (req) => {
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

    return super.init()
  }
}
