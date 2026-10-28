// Expenses context: what a user spent. Imported by db/index.cds.
using { cuid, managed, Currency } from '@sap/cds/common';
using { spendwise.Users } from './users';
using { spendwise.Categories, spendwise.Subcategories } from './catalog';

namespace spendwise;

/** One expense of one user. Amounts are exact decimals; the app never adds them as floats. */
entity Expenses : cuid, managed {
  date        : Date not null;
  amount      : Decimal(15,2) not null;
  currency    : Currency default 'EUR';
  description : String(255);
  notes       : String(500);
  category    : Association to Categories;
  subcategory : Association to Subcategories;
  user        : Association to Users;
}
