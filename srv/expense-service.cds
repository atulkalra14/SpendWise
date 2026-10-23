using { spendwise as db } from '../db/schema';

service ExpenseService @(path: '/odata/v4/expenses') {

  @restrict: [{ grant: '*', to: 'authenticated-user', where: 'createdBy = $user' }]
  entity Expenses as projection on db.Expenses;
}
