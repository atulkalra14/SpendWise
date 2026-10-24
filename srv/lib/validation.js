const PASSWORD_MIN = 12
const PASSWORD_MAX = 128

// Same pattern as @assert.format on Users.email in db/schema.cds.
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

// Registered users are keyed by their normalized email, so it must equal the later req.user.id.
const normalizeEmail = (email) => String(email).trim().toLowerCase()

module.exports = { PASSWORD_MIN, PASSWORD_MAX, EMAIL_PATTERN, normalizeEmail }
