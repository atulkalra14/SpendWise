// Money helpers: amounts are summed as integer cents so results never depend on floating point.

/**
 * Converts a decimal amount to integer cents.
 * @param {string|number} amount Decimal amount as delivered by the database, for example "12.34".
 * @returns {number} The amount in cents.
 */
const toCents = (amount) => Math.round(Number(amount) * 100)

/**
 * Formats integer cents as a decimal string with two digits, for example 1234 -> "12.34".
 * @param {number} cents Amount in cents; may be negative.
 * @returns {string} The decimal string.
 */
const fromCents = (cents) => {
  const abs = Math.abs(cents)
  return `${cents < 0 ? '-' : ''}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`
}

/**
 * Totals a list of expenses of one currency and finds the largest one.
 * @param {{amount: string|number, description?: string}[]} rows Expenses of one currency.
 * @returns {{total: string, count: number, largestAmount: string, largestDescription: string}}
 *   Total and largest amount as decimal strings, and the number of rows.
 */
function summarize(rows) {
  let total = 0
  let largest = null
  for (const row of rows) {
    const cents = toCents(row.amount)
    total += cents
    if (!largest || cents > largest.cents) largest = { cents, description: row.description }
  }
  return {
    total: fromCents(total),
    count: rows.length,
    largestAmount: fromCents(largest ? largest.cents : 0),
    largestDescription: largest?.description || '',
  }
}

module.exports = { toCents, fromCents, summarize }
