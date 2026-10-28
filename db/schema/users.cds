// Users context: the people who sign in to SpendWise. Imported by db/index.cds.
using { managed, Currency } from '@sap/cds/common';

namespace spendwise;

/** Languages the app supports; a new language is added here and in docs/i18n.md. */
type Locale : String(5) enum { en; de; }

/**
 * A SpendWise user and their profile.
 * The key is the authenticated user id (req.user.id), the same value `managed` writes to
 * createdBy, so it is a string and not a cuid: it must equal the id the login provides.
 */
entity Users : managed {
  key ID          : String(255);
  displayName     : String(100);
  email           : String(255) @assert.format: '^[^@\s]+@[^@\s]+\.[^@\s]+$';
  locale          : Locale default 'en';
  defaultCurrency : Currency default 'EUR';
  passwordHash    : String(255);   // salted scrypt hash, never exposed by a service
  termsAcceptedAt : Timestamp;
}
