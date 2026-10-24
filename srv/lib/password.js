const crypto = require('node:crypto')
const { promisify } = require('node:util')

const scrypt = promisify(crypto.scrypt)
const KEY_LENGTH = 64

// Stored as scrypt$<salt>$<hash>, both base64, with a random salt per password.
async function hashPassword(plain) {
  const salt = crypto.randomBytes(16)
  const hash = await scrypt(plain, salt, KEY_LENGTH)
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`
}

async function verifyPassword(plain, stored) {
  const [scheme, saltB64, hashB64] = String(stored || '').split('$')
  if (scheme !== 'scrypt' || !saltB64 || !hashB64) return false

  const expected = Buffer.from(hashB64, 'base64')
  if (expected.length !== KEY_LENGTH) return false

  const actual = await scrypt(plain, Buffer.from(saltB64, 'base64'), KEY_LENGTH)
  return crypto.timingSafeEqual(actual, expected)
}

module.exports = { hashPassword, verifyPassword }
