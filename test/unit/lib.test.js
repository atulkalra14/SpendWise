// Unit tests for the pure modules in srv/lib/: no CAP runtime, no database, no server.
const { test } = require('node:test')
const assert = require('node:assert/strict')

const { toCents, fromCents, summarize } = require('../../srv/lib/money')
const { monthRange } = require('../../srv/lib/month')
const { categoryErrors } = require('../../srv/lib/expense-category')
const {
  isPasswordLengthValid,
  normalizeEmail,
  registrationErrors,
} = require('../../srv/lib/validation')

// --- money ---

test('toCents and fromCents round trip without floating point drift', () => {
  assert.equal(toCents('0.1') + toCents('0.2'), 30)
  assert.equal(fromCents(toCents('12.34')), '12.34')
  assert.equal(fromCents(5), '0.05')
  assert.equal(fromCents(-1234), '-12.34')
  assert.equal(fromCents(0), '0.00')
})

test('summarize totals the rows and finds the largest one', () => {
  const result = summarize([
    { amount: '10.10', description: 'lunch' },
    { amount: '99.99', description: 'shoes' },
    { amount: '0.01', description: 'coin' },
  ])
  assert.deepEqual(result, {
    total: '110.10',
    count: 3,
    largestAmount: '99.99',
    largestDescription: 'shoes',
  })
})

test('summarize of no rows is zero with an empty description', () => {
  assert.deepEqual(summarize([]), {
    total: '0.00',
    count: 0,
    largestAmount: '0.00',
    largestDescription: '',
  })
})

// --- month ---

test('monthRange gives the first day of the month and of the next one', () => {
  assert.deepEqual(monthRange('2026-10'), { start: '2026-10-01', end: '2026-11-01' })
  assert.deepEqual(monthRange('2026-12'), { start: '2026-12-01', end: '2027-01-01' })
})

test('monthRange rejects anything that is not YYYY-MM', () => {
  for (const bad of ['2026-13', '2026-00', '2026-1', '26-10', '2026-10-01', '', undefined, null]) {
    assert.equal(monthRange(bad), null, String(bad))
  }
})

// --- category and subcategory rules ---

test('categoryErrors accepts no category, a known category, and a matching subcategory', () => {
  assert.deepEqual(categoryErrors({}), [])
  assert.deepEqual(categoryErrors({ category_ID: 'c1', category: { ID: 'c1' } }), [])
  assert.deepEqual(
    categoryErrors({
      category_ID: 'c1',
      subcategory_ID: 's1',
      category: { ID: 'c1' },
      subcategory: { category_ID: 'c1' },
    }),
    []
  )
})

test('categoryErrors names the key and the field for each broken rule', () => {
  assert.deepEqual(categoryErrors({ category_ID: 'x' }), [
    { message: 'EXPENSE_CATEGORY_NOT_FOUND', target: 'category_ID' },
  ])
  assert.deepEqual(categoryErrors({ subcategory_ID: 's1' }), [
    { message: 'EXPENSE_SUBCATEGORY_NOT_FOUND', target: 'subcategory_ID' },
  ])
  assert.deepEqual(categoryErrors({ subcategory_ID: 's1', subcategory: { category_ID: 'c1' } }), [
    { message: 'EXPENSE_SUBCATEGORY_REQUIRES_CATEGORY', target: 'category_ID' },
  ])
  assert.deepEqual(
    categoryErrors({
      category_ID: 'c2',
      subcategory_ID: 's1',
      category: { ID: 'c2' },
      subcategory: { category_ID: 'c1' },
    }),
    [{ message: 'EXPENSE_SUBCATEGORY_CATEGORY_MISMATCH', target: 'subcategory_ID' }]
  )
})

// --- validation ---

test('isPasswordLengthValid accepts 12 to 128 characters of text only', () => {
  assert.equal(isPasswordLengthValid('x'.repeat(11)), false)
  assert.equal(isPasswordLengthValid('x'.repeat(12)), true)
  assert.equal(isPasswordLengthValid('x'.repeat(128)), true)
  assert.equal(isPasswordLengthValid('x'.repeat(129)), false)
  assert.equal(isPasswordLengthValid(123456789012), false)
  assert.equal(isPasswordLengthValid(undefined), false)
})

test('normalizeEmail trims and lower-cases', () => {
  assert.equal(normalizeEmail('  Carol@Example.COM '), 'carol@example.com')
})

test('registrationErrors collects one entry per bad field and none for valid input', () => {
  const valid = {
    displayName: 'Carol',
    email: 'carol@example.com',
    password: 'correct horse battery',
    acceptTerms: true,
  }
  assert.deepEqual(registrationErrors(valid), [])

  const all = registrationErrors({ displayName: '  ', email: 'nope', password: 'x' })
  assert.deepEqual(
    all.map((e) => [e.message, e.target]),
    [
      ['REGISTRATION_DISPLAYNAME_INVALID', 'displayName'],
      ['REGISTRATION_EMAIL_INVALID', 'email'],
      ['REGISTRATION_PASSWORD_LENGTH', 'password'],
      ['REGISTRATION_TERMS_REQUIRED', 'acceptTerms'],
    ]
  )
  assert.deepEqual(all[2].args, [12, 128])
})
