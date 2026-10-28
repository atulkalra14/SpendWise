# Spec: Registration

## Overview

Let a new person create a SpendWise account from the Fiori app: they enter a display name, email and password, accept the terms, and a `Users` row is created with a salted scrypt hash. Until now `Users` rows only appear when an already-authenticated user touches a service (`ensureUser`), and passwords can only be set by an existing user through `setPassword`. Registration is the first step that creates an account for someone who is not yet signed in, so it is the entry point of the local/custom login flow and the foundation for the next step (login and logout). This step only creates the account; it does not sign anyone in.

Note (departure from CLAUDE.md, as in spec 01): on BTP, IAS owns sign-up and credentials. Registration here is for local/custom login only and must be switchable off for BTP deployment.

Open decisions to confirm during review (defaults are used in this spec):

1. **User ID for registered users** is the normalized email (trimmed, lower-cased), because `Users.ID` must equal `req.user.id` and `createdBy`. The custom login step must therefore authenticate as that same value.
2. **Email verification** is out of scope (account is active immediately). Revisit before any production use.
3. **Draft enablement** (CLAUDE.md now says to draft-enable all services and schema). `register` is an unbound action on an entity-less service, which cannot be draft-enabled, and `Users` is already draft-enabled through `UserService.Me`. Default here: no new draft entity, because a draft would need a public, anonymous draft store (draft rows are keyed to the creating user, and there is none yet). Alternative to decide in planning: a draft-enabled `Registrations` projection with `register` as a bound action. Note this makes anonymous draft handling and cleanup part of the scope.
4. **Authenticating registered users** is out of scope. With mocked auth only alice and bob can call services, so a registered user cannot sign in until step 04.

## Depends on

- Step 01 (`01-user-schema`): `Users` entity keyed by user id, `srv/lib/password.js` (`hashPassword`), `ensureUser`.
- Step 02 is not required.
- The existing Fiori app shell in `app/spendwise` (routing, Landing, Terms and Privacy pages).

## Routes

CAP derives OData V4 endpoints; the UI routes are UI5 router entries.

- `POST /odata/v4/registration/register` — unbound action with `displayName`, `email`, `password`, `acceptTerms`; creates the user, returns `{ ID, displayName }` only (never the hash) — public (`@requires: 'any'`)
- `GET /odata/v4/registration/isEmailAvailable(email='...')` — NOT provided. Availability is checked only inside `register`, so the endpoint cannot be used to enumerate accounts.
- UI route `#/register` — registration page (Fiori app) — public
- Existing `UserService` and `ExpenseService` stay `authenticated-user`.

## Database changes

Verify against `db/schema.cds` (`Users : managed` with `ID`, `displayName`, `email`, `locale`, `defaultCurrency`, `passwordHash`):

- `Users.email` — add `@mandatory`-style validation only in the registration handler. Do not change existing seed users.
- Email uniqueness: `ID` is already the unique key and equals the normalized email for registered users, so no new constraint is needed. Add `@assert.unique: { email: [email] }` on `Users` to protect the column for users created through other paths.
- `Users.termsAcceptedAt : Timestamp` — new, nullable (seed users and `ensureUser` rows stay valid). Set at registration.
- No other changes. Seed data in `db/data/spendwise-Users.csv` is unchanged (the new column is nullable; no column needs adding to the CSV).

## Templates

UI5 views and controllers (SAP Fiori tools / UI5 conventions per CLAUDE.md):

- **Create:**
  - `app/spendwise/webapp/view/templates/Register.view.xml`
  - `app/spendwise/webapp/controller/templates/Register.controller.js`
- **Modify:**
  - `app/spendwise/webapp/manifest.json` — add `register` route/target and a second OData model/data source `registrationService` at `/odata/v4/registration/` (the default model stays `mainService`)
  - `app/spendwise/webapp/view/templates/Landing.view.xml` — add a "Create account" link/button to `#/register`
  - `app/spendwise/webapp/i18n/i18n.properties` (and any other locale files present) — labels, hints and error texts

## Files to change

- `db/schema.cds` — `termsAcceptedAt`, `@assert.unique` on email
- `app/spendwise/webapp/manifest.json`
- `app/spendwise/webapp/view/templates/Landing.view.xml`
- `app/spendwise/webapp/i18n/i18n.properties`
- `package.json` — only if a registration on/off setting is added via `cds.requires`/env (prefer `.cdsrc.json` or an env var, decided in planning)

## Files to create

- `srv/registration-service.cds` — `RegistrationService` at `/odata/v4/registration`, `@requires: 'any'`, one action `register`
- `srv/registration-service.js` — handler (validation, normalization, insert, error mapping)
- `srv/lib/validation.js` — only if email/password checks would otherwise be duplicated between `user-service.js` and the new handler (move `MIN/MAX_PASSWORD_LENGTH` there and reuse them; do not copy)
- `app/spendwise/webapp/view/templates/Register.view.xml`
- `app/spendwise/webapp/controller/templates/Register.controller.js`
- `test/registration-service.test.js`

## New dependencies

No new dependencies (hashing uses Node's built-in `crypto` via `srv/lib/password.js`).

## Rules for implementation

General

- CDS and the CAP Node.js runtime only; no raw SQL string building, no ORMs. Use CQL (`SELECT`, `INSERT`) with bound values.
- Parameterised queries only.
- Passwords are hashed with the existing `hashPassword` (salted scrypt). The plain password is never persisted, logged, returned or put in an error message. Do not use bcrypt or any new hashing library.
- Follow existing style: CommonJS handlers in `srv/*.js`, `cds.ApplicationService`, two-space indent, comments only for non-obvious reasons.
- Frontend: use SAP Fiori tools and annotations wherever possible (CLAUDE.md). Registration is a form, so a freestyle UI5 view using `sap.m`/`sap.ui.layout` form controls is acceptable. Use theme parameters/existing CSS variables from `css/tokens.css`; never hardcode hex values. Reuse the app shell layout fragments.
- Single currency (EUR) and `locale` default as in `Users`; registration sets neither beyond the schema defaults, except that `locale` may be taken from the UI language if it is `en` or `de`.

Security

- `register` is the only public endpoint. The service has no entities and exposes no reads, so nothing about other users can be queried.
- Derive `ID` server-side from the normalized email. Never accept `ID`, `passwordHash`, `locale`, `defaultCurrency` or managed fields from the client.
- Insert through `cds.db` so the `@restrict` of `UserService` does not apply, and set `createdBy` explicitly to the new ID (the caller is anonymous).
- Duplicate email: respond with a generic message and do not reveal whether the email exists beyond what is unavoidable (409 `Registration failed. Use a different email or sign in.`). Rely on the unique key as the final guard against races: catch the unique-constraint error and map it to the same 409, not a 500.
- Basic abuse protection: rate limiting is not available in CAP core; document it as a required deployment-level control (BTP/approuter) and add a TODO note in the plan. Keep password length cap (128) to bound scrypt cost.

Error handling (per the `sap-cap-capire` skill guidance)

- Validate in `before('register')` or at the top of the `on` handler and use `req.error(400, ...)` to collect all field errors, with a `target` naming the field (`displayName`, `email`, `password`, `acceptTerms`) so the UI can mark the right input; the request fails with all messages in one response. Use `req.reject` only for single unrecoverable errors (409, 500-class).
- Use message keys with i18n (`_i18n/messages.properties`), not hard-coded strings, where the project already has or adds a messages bundle; fall back to plain text otherwise and note it in the plan.
- Status codes: 400 validation, 409 duplicate, 500 unexpected. Never leak stack traces, SQL or hashes; unexpected errors are logged with `cds.log('registration')` without the payload.
- Validation rules: `displayName` 1 to 100 characters after trim; `email` valid format (same pattern as `Users.email`), max 255, normalized to lower case; `password` 12 to 128 characters (same limits as `setPassword`); `acceptTerms` must be `true`.
- The insert and any follow-up must be atomic. On failure no partial user row remains (use the request transaction; do not run the insert on a separate transaction).
- The UI shows the server messages next to the fields (bound message model via `sap.ui.core.message`), handles network failure with a message strip, and disables the submit button while the request runs to prevent double submits.

## Definition of done

- [ ] `cds watch` starts without model errors and `cds deploy --to sqlite` creates the `termsAcceptedAt` column
- [ ] `POST /odata/v4/registration/register` without any credentials and with valid data returns 200/201 and a row appears in `spendwise_Users` with `ID` equal to the lower-cased email, a `scrypt$...` hash, `termsAcceptedAt` set
- [ ] The response and `$metadata` of `RegistrationService` contain no `passwordHash`
- [ ] Registering `Alice@Example.com` after `alice@example.com` exists returns 409 with the generic message, and no second row is created
- [ ] Two simultaneous registrations of the same email result in exactly one row and one 409 (no 500)
- [ ] Invalid input returns 400 with one message per bad field and a `target` per field: empty name, malformed email, password under 12 or over 128 characters, `acceptTerms` false or missing
- [ ] Client-supplied `ID`, `passwordHash`, `locale: 'xx'` or `createdBy` in the payload is ignored or rejected and never stored
- [ ] Two users registered with the same password get different hashes
- [ ] The plain password does not appear in the database, the server log or any response (checked with a test and a log grep)
- [ ] `UserService` and `ExpenseService` still return 401 for unauthenticated requests; `GET /odata/v4/registration/` exposes only the `register` action
- [ ] In the Fiori app, `#/register` opens the form from the Landing page link; submitting valid data shows a success message and routes back to Landing; invalid data shows messages next to the right fields; submitting is disabled while the request is in flight
- [ ] The form works at phone, tablet and desktop widths and shows labels and messages from i18n
- [ ] Existing tests still pass and `test/registration-service.test.js` covers the cases above; `npm test` passes
