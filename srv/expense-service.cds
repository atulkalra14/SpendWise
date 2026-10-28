using { spendwise as db } from '../db';

/**
 * Expenses of the signed-in user, the shared categories, and the monthly summary.
 * Every endpoint needs the role `User` (a signed-in SpendWise user, see docs/domain-model.md).
 */
service ExpenseService @(path: '/odata/v4/expenses') {

  // A user may do everything with their own expenses and nothing with anyone else's.
  @restrict: [{ grant: '*', to: 'User', where: 'createdBy = $user' }]
  @odata.draft.enabled
  entity Expenses as projection on db.Expenses;

  // user is set by the handler from the authenticated user, never taken from the client.
  annotate Expenses with {
    user      @readonly;
    createdBy @readonly;
  };

  // Developer-seeded reference data, shared by all users and read-only for now.
  // Any user with the role may read them (read-only).
  @odata.draft.enabled @readonly @requires: 'User'
  entity Categories as projection on db.Categories;

  @readonly @requires: 'User'
  entity Subcategories as projection on db.Subcategories;

  type MonthlySummary {
    month              : String(7);
    currency           : String(3);
    total              : Decimal(15,2);
    count              : Integer;
    largestAmount      : Decimal(15,2);
    largestDescription : String(255);
  }

  // Totals for one calendar month (YYYY-MM) of the signed-in user's expenses.
  // Any user with the role may ask; the handler only ever counts the caller's own expenses.
  @requires: 'User'
  function monthlySummary(month : String(7)) returns MonthlySummary;
}
