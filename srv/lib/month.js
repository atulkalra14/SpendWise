// Calendar month helper for monthlySummary.

/**
 * Turns a month written as YYYY-MM into the first day of that month and of the next one,
 * so a query can use `date >= start and date < end`.
 * @param {string} month The month, for example "2026-10".
 * @returns {{start: string, end: string}|null} Dates as YYYY-MM-DD, or null if `month` is not a
 *   valid YYYY-MM (the caller rejects with EXPENSE_MONTH_FORMAT).
 */
function monthRange(month) {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month || '')
  if (!match) return null

  const year = Number(match[1])
  const mon = Number(match[2])
  const end = mon === 12 ? `${year + 1}-01-01` : `${year}-${String(mon + 1).padStart(2, '0')}-01`
  return { start: `${month}-01`, end }
}

module.exports = { monthRange }
