using { spendwise as db } from '../db';

service ExpenseService @(path: '/odata/v4/expenses') {

  @restrict: [{ grant: '*', to: 'authenticated-user', where: 'createdBy = $user' }]
  @odata.draft.enabled
  entity Expenses as projection on db.Expenses;

  // user is set by the handler from the authenticated user, never taken from the client.
  annotate Expenses with {
    user      @readonly;
    createdBy @readonly;
  };

  // Developer-seeded reference data, shared by all users and read-only for now.
  @odata.draft.enabled @readonly @requires: 'authenticated-user'
  entity Categories as projection on db.Categories;

  @readonly @requires: 'authenticated-user'
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
  @requires: 'authenticated-user'
  function monthlySummary(month : String(7)) returns MonthlySummary;
}
