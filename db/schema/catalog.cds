// Catalog context: reference data (expense categories) shared by all users.
// Imported by db/index.cds.
using { cuid } from '@sap/cds/common';

namespace spendwise;

/**
 * An expense category such as groceries or transport.
 * Developer-seeded and shared by all users; user-defined categories come later.
 */
@assert.unique: { code: [code] }
entity Categories : cuid {
  code          : String(30) @mandatory;
  name          : localized String(100) @mandatory;
  subcategories : Composition of many Subcategories on subcategories.category = $self;
}

/** A finer split of a category, for example "fuel" under transport. */
@assert.unique: { codePerCategory: [category, code] }
entity Subcategories : cuid {
  code     : String(30) @mandatory;
  name     : localized String(100) @mandatory;
  category : Association to Categories @mandatory;
}
