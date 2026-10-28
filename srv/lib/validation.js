// Input rules shared by registration and the password action. Pure functions, no CAP needed.

const PASSWORD_MIN = 12
const PASSWORD_MAX = 128

// Same pattern as @assert.format on Users.email in db/schema/users.cds.
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

const isString = (v) => typeof v === 'string'

/**
 * Normalizes an email address. Registered users are keyed by their normalized email, so it must
 * equal the later req.user.id.
 * @param {string} email The address as typed.
 * @returns {string} Trimmed and lower-cased address.
 */
const normalizeEmail = (email) => String(email).trim().toLowerCase()

/**
 * Checks that a password has an allowed length.
 * @param {unknown} password The value sent by the client.
 * @returns {boolean} True for a string of PASSWORD_MIN to PASSWORD_MAX characters.
 */
const isPasswordLengthValid = (password) =>
  isString(password) && password.length >= PASSWORD_MIN && password.length <= PASSWORD_MAX

/**
 * Checks the fields of a registration request and collects every problem.
 * @param {{displayName?: unknown, email?: unknown, password?: unknown, acceptTerms?: unknown}} data
 *   The request data, which the client controls.
 * @returns {{status: number, message: string, target: string, args?: number[]}[]} One entry per
 *   bad field, with the message key (REGISTRATION_DISPLAYNAME_INVALID, REGISTRATION_EMAIL_INVALID,
 *   REGISTRATION_PASSWORD_LENGTH, REGISTRATION_TERMS_REQUIRED) and the field to mark.
 */
function registrationErrors({ displayName, email, password, acceptTerms }) {
  const errors = []

  const name = isString(displayName) ? displayName.trim() : ''
  if (!name || name.length > 100) {
    errors.push({ status: 400, message: 'REGISTRATION_DISPLAYNAME_INVALID', target: 'displayName' })
  }

  const mail = isString(email) ? normalizeEmail(email) : ''
  if (!mail || mail.length > 255 || !EMAIL_PATTERN.test(mail)) {
    errors.push({ status: 400, message: 'REGISTRATION_EMAIL_INVALID', target: 'email' })
  }

  if (!isPasswordLengthValid(password)) {
    errors.push({
      status: 400,
      message: 'REGISTRATION_PASSWORD_LENGTH',
      target: 'password',
      args: [PASSWORD_MIN, PASSWORD_MAX],
    })
  }

  if (acceptTerms !== true) {
    errors.push({ status: 400, message: 'REGISTRATION_TERMS_REQUIRED', target: 'acceptTerms' })
  }

  return errors
}

module.exports = {
  PASSWORD_MIN,
  PASSWORD_MAX,
  EMAIL_PATTERN,
  normalizeEmail,
  isPasswordLengthValid,
  registrationErrors,
}
