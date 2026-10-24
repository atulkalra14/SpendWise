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

// Developer-seeded reference data shared by all users. User-defined categories come later.
@assert.unique: { code: [code] }
entity Categories : cuid {
  code          : String(30) @mandatory;
  name          : localized String(100) @mandatory;
  subcategories : Composition of many Subcategories on subcategories.category = $self;
}

@assert.unique: { codePerCategory: [category, code] }
entity Subcategories : cuid {
  code     : String(30) @mandatory;
  name     : localized String(100) @mandatory;
  category : Association to Categories @mandatory;
}

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
