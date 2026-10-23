using { cuid, managed, Currency } from '@sap/cds/common';

namespace spendwise;

entity Expenses : cuid, managed {
  date        : Date not null;
  amount      : Decimal(15,2) not null;
  currency    : Currency default 'EUR';
  description : String(255);
}
