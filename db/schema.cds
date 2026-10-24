using { cuid, managed, Currency } from '@sap/cds/common';

namespace spendwise;

type Locale : String(5) enum { en; de; }

// Keyed by the authenticated user id (req.user.id), the same value managed writes to createdBy.
entity Users : managed {
  key ID          : String(255);
  displayName     : String(100);
  email           : String(255) @assert.format: '^[^@\s]+@[^@\s]+\.[^@\s]+$';
  locale          : Locale default 'en';
  defaultCurrency : Currency default 'EUR';
  passwordHash    : String(255);
}

entity Expenses : cuid, managed {
  date        : Date not null;
  amount      : Decimal(15,2) not null;
  currency    : Currency default 'EUR';
  description : String(255);
}
