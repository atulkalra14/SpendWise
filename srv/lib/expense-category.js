// Rules that tie an expense's category and subcategory together, without touching the database.

/**
 * Checks the category and subcategory of an expense against the rows the handler looked up.
 * @param {object} input
 * @param {string} [input.category_ID] The category the expense points to, if any.
 * @param {string} [input.subcategory_ID] The subcategory the expense points to, if any.
 * @param {object} [input.category] The category row, or undefined if it does not exist.
 * @param {{category_ID: string}} [input.subcategory] The subcategory row, or undefined.
 * @returns {{message: string, target: string}[]} One entry per broken rule, with the message key
 *   (EXPENSE_CATEGORY_NOT_FOUND, EXPENSE_SUBCATEGORY_NOT_FOUND, EXPENSE_SUBCATEGORY_REQUIRES_CATEGORY,
 *   EXPENSE_SUBCATEGORY_CATEGORY_MISMATCH) and the field to mark.
 */
function categoryErrors({ category_ID, subcategory_ID, category, subcategory }) {
  const errors = []

  if (category_ID && !category) {
    errors.push({ message: 'EXPENSE_CATEGORY_NOT_FOUND', target: 'category_ID' })
  }

  if (subcategory_ID) {
    if (!subcategory) {
      errors.push({ message: 'EXPENSE_SUBCATEGORY_NOT_FOUND', target: 'subcategory_ID' })
    } else if (!category_ID) {
      errors.push({ message: 'EXPENSE_SUBCATEGORY_REQUIRES_CATEGORY', target: 'category_ID' })
    } else if (subcategory.category_ID !== category_ID) {
      errors.push({ message: 'EXPENSE_SUBCATEGORY_CATEGORY_MISMATCH', target: 'subcategory_ID' })
    }
  }

  return errors
}

module.exports = { categoryErrors }
