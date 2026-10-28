// Handlers for the Expenses entity of ExpenseService. The rules live in srv/lib/expense-category.js.
// Messages are keys from _i18n/messages*.properties; the key is also the error code clients see.
const ensureUser = require('../lib/ensure-user')
const { categoryErrors } = require('../lib/expense-category')

/**
 * Registers the Expenses handlers.
 * @param {import('@sap/cds').ApplicationService} srv The ExpenseService instance.
 */
module.exports = function registerExpenseHandlers(srv) {
  const { Expenses, Categories, Subcategories } = srv.entities

  // before SAVE: set the owner and check category and subcategory (EXPENSE_CATEGORY_NOT_FOUND,
  // EXPENSE_SUBCATEGORY_*). Expenses are draft-enabled, so this runs when a draft is activated or
  // on a direct CREATE/UPDATE; editing a draft is not validated until the user saves it.
  srv.before('SAVE', 'Expenses', async (req) => {
    await ensureUser(req)
    req.data.user_ID = req.user.id

    // A PATCH may send only one of the two fields, so check the merged result.
    let { category_ID, subcategory_ID } = req.data
    const touched = 'category_ID' in req.data || 'subcategory_ID' in req.data
    if (!touched) return

    if (req.event === 'UPDATE') {
      const stored = await srv.run(
        SELECT.one
          .from(Expenses)
          .columns('category_ID', 'subcategory_ID')
          .where({ ID: req.data.ID, createdBy: req.user.id })
      )
      if (!stored) return // the restriction answers 404 for rows that are not the caller's
      if (!('category_ID' in req.data)) category_ID = stored.category_ID
      if (!('subcategory_ID' in req.data)) subcategory_ID = stored.subcategory_ID
    }

    const category = category_ID
      ? await srv.run(SELECT.one.from(Categories).columns('ID').where({ ID: category_ID }))
      : undefined
    const subcategory = subcategory_ID
      ? await srv.run(
          SELECT.one.from(Subcategories).columns('category_ID').where({ ID: subcategory_ID })
        )
      : undefined

    for (const error of categoryErrors({ category_ID, subcategory_ID, category, subcategory })) {
      req.error({ status: 400, ...error })
    }
  })
}
