// ExpenseService implementation: only registers handlers. The rules are in srv/handlers/ and
// srv/lib/.
const cds = require('@sap/cds')
const registerExpenseHandlers = require('./handlers/expenses')
const registerMonthlySummaryHandler = require('./handlers/monthly-summary')

module.exports = class ExpenseService extends cds.ApplicationService {
  init() {
    registerExpenseHandlers(this)
    registerMonthlySummaryHandler(this)
    return super.init()
  }
}
