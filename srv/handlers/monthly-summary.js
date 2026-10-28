// Handler for the monthlySummary function of ExpenseService. Maths live in srv/lib/money.js and
// srv/lib/month.js. Messages are keys from _i18n/messages*.properties.
const { monthRange } = require('../lib/month')
const { summarize } = require('../lib/money')

/**
 * Registers the monthlySummary handler.
 * @param {import('@sap/cds').ApplicationService} srv The ExpenseService instance.
 */
module.exports = function registerMonthlySummaryHandler(srv) {
  const { Expenses } = srv.entities

  // on monthlySummary: totals of one calendar month; rejects a bad month (EXPENSE_MONTH_FORMAT)
  // and mixed currencies (EXPENSE_CURRENCY_UNSUPPORTED)
  srv.on('monthlySummary', async (req) => {
    const { month } = req.data
    const range = monthRange(month)
    if (!range) return req.reject(400, 'EXPENSE_MONTH_FORMAT', 'month')

    // The entity restriction already limits rows to the current user; filtering again keeps
    // this handler safe even if the restriction is ever changed.
    const rows = await srv.run(
      SELECT.from(Expenses)
        .columns('amount', 'currency_code', 'description')
        .where('date >=', range.start, 'and date <', range.end, 'and createdBy =', req.user.id)
    )

    // Single currency (EUR) for now. Refuse to add up mixed currencies.
    if (rows.some((r) => r.currency_code !== 'EUR')) {
      return req.reject(501, 'EXPENSE_CURRENCY_UNSUPPORTED')
    }

    return { month, currency: 'EUR', ...summarize(rows) }
  })
}
