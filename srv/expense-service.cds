using { spendwise as db } from '../db/schema';

service ExpenseService @(path: '/odata/v4/expenses') {

  @restrict: [{ grant: '*', to: 'authenticated-user', where: 'createdBy = $user' }]
  entity Expenses as projection on db.Expenses;

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
