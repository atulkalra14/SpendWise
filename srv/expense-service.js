const cds = require('@sap/cds')

// Money is summed as integer cents so results never depend on floating point rounding.
const toCents = (amount) => Math.round(Number(amount) * 100)
const fromCents = (cents) => {
  const abs = Math.abs(cents)
  return `${cents < 0 ? '-' : ''}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`
}

module.exports = class ExpenseService extends cds.ApplicationService {
  init() {
    const { Expenses } = this.entities

    this.on('monthlySummary', async (req) => {
      const { month } = req.data
      const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month || '')
      if (!match) return req.reject(400, 'month must be formatted as YYYY-MM')

      const year = Number(match[1])
      const mon = Number(match[2])
      const start = `${month}-01`
      const end = mon === 12 ? `${year + 1}-01-01` : `${year}-${String(mon + 1).padStart(2, '0')}-01`

      // The entity restriction already limits rows to the current user; filtering again keeps
      // this handler safe even if the restriction is ever changed.
      const rows = await this.run(
        SELECT.from(Expenses)
          .columns('amount', 'currency_code', 'description')
          .where('date >=', start, 'and date <', end, 'and createdBy =', req.user.id)
      )

      // Single currency (EUR) for now. Refuse to add up mixed currencies.
      if (rows.some((r) => r.currency_code !== 'EUR')) {
        return req.reject(501, 'Totals for currencies other than EUR are not supported yet')
      }

      let total = 0
      let largest = null
      for (const row of rows) {
        const cents = toCents(row.amount)
        total += cents
        if (!largest || cents > largest.cents) largest = { cents, description: row.description }
      }

      return {
        month,
        currency: 'EUR',
        total: fromCents(total),
        count: rows.length,
        largestAmount: fromCents(largest ? largest.cents : 0),
        largestDescription: largest?.description || ''
      }
    })

    return super.init()
  }
}
