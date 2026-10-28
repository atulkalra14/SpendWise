const cds = require('@sap/cds')
const ensureUser = require('./lib/ensure-user')

// Money is summed as integer cents so results never depend on floating point rounding.
const toCents = (amount) => Math.round(Number(amount) * 100)
const fromCents = (cents) => {
  const abs = Math.abs(cents)
  return `${cents < 0 ? '-' : ''}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`
}

module.exports = class ExpenseService extends cds.ApplicationService {
  init() {
    const { Expenses, Categories, Subcategories } = this.entities

    // Expenses are draft-enabled, so these checks run on SAVE: when a draft is activated, or on a
    // direct CREATE/UPDATE. Editing a draft is not validated until the user saves it.
    this.before('SAVE', 'Expenses', async (req) => {
      await ensureUser(req)
      req.data.user_ID = req.user.id

      // A PATCH may send only one of the two fields, so check the merged result.
      let { category_ID, subcategory_ID } = req.data
      const touched = 'category_ID' in req.data || 'subcategory_ID' in req.data
      if (!touched) return

      if (req.event === 'UPDATE') {
        const stored = await this.run(
          SELECT.one
            .from(Expenses)
            .columns('category_ID', 'subcategory_ID')
            .where({ ID: req.data.ID, createdBy: req.user.id })
        )
        if (!stored) return // the restriction answers 404 for rows that are not the caller's
        if (!('category_ID' in req.data)) category_ID = stored.category_ID
        if (!('subcategory_ID' in req.data)) subcategory_ID = stored.subcategory_ID
      }

      if (category_ID) {
        const category = await this.run(
          SELECT.one.from(Categories).columns('ID').where({ ID: category_ID })
        )
        if (!category)
          req.error({
            status: 400,
            code: 'CATEGORY_NOT_FOUND',
            message: 'Category does not exist',
            target: 'category_ID',
          })
      }

      if (subcategory_ID) {
        const sub = await this.run(
          SELECT.one.from(Subcategories).columns('category_ID').where({ ID: subcategory_ID })
        )
        if (!sub) {
          req.error({
            status: 400,
            code: 'SUBCATEGORY_NOT_FOUND',
            message: 'Subcategory does not exist',
            target: 'subcategory_ID',
          })
        } else if (!category_ID) {
          req.error({
            status: 400,
            code: 'SUBCATEGORY_REQUIRES_CATEGORY',
            message: 'A subcategory needs a category',
            target: 'category_ID',
          })
        } else if (sub.category_ID !== category_ID) {
          req.error({
            status: 400,
            code: 'SUBCATEGORY_CATEGORY_MISMATCH',
            message: 'Subcategory does not belong to the category',
            target: 'subcategory_ID',
          })
        }
      }
    })

    this.on('monthlySummary', async (req) => {
      const { month } = req.data
      const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month || '')
      if (!match) return req.reject(400, 'month must be formatted as YYYY-MM')

      const year = Number(match[1])
      const mon = Number(match[2])
      const start = `${month}-01`
      const end =
        mon === 12 ? `${year + 1}-01-01` : `${year}-${String(mon + 1).padStart(2, '0')}-01`

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
        largestDescription: largest?.description || '',
      }
    })

    return super.init()
  }
}
