# Spec: User Schema

## Overview
Introduce a `Users` entity in the CAP domain model so SpendWise has a first-class record of each person using the app. Today, per-user isolation relies only on the `createdBy` string that `managed` fills from `req.user.id`; there is no place to keep profile data or preferences (display name, email, UI language, default currency). This step adds that entity, a service to read and maintain the signed-in user's own profile, and automatic profile creation on first request. It is the foundation for later steps (categories, budgets, income, user-defined categories) that need to reference a user. Per the request to store passwords, the entity also holds a salted password hash (never the plain password) so a local sign-in can be built on it later. Note this departs from the CLAUDE.md plan (mocked auth locally, IAS on BTP, where IAS holds the credentials); the hash column is only used by local/custom login and must not be relied on for BTP deployment.

## Depends on
No previous spec. Builds on the existing `Expenses` entity (`db/schema.cds`) and `ExpenseService` (`srv/expense-service.cds`, `srv/expense-service.js`), whose `createdBy = $user` pattern is reused.

## Routes
CAP exposes OData V4 endpoints from the service definition (no hand-written routes):
- `GET /odata/v4/users/Me` — returns the signed-in user's profile, creating it on first access — logged-in
- `PATCH /odata/v4/users/Me` — update `displayName`, `locale`, `defaultCurrency` of own profile — logged-in
- `POST /odata/v4/users/setPassword` — action taking `newPassword`; sets the caller's own hash only (minimum 12 characters), returns no hash — logged-in
- `GET /odata/v4/users/Users` — not exposed; no listing of other users

Implemented as a singleton-style function or restricted entity `Me` in a new `UserService` at `@path: '/odata/v4/users'`. Final shape (function vs. restricted entity) is decided during planning; either must satisfy the rules below.

## Database changes
New entity in `db/schema.cds` (namespace `spendwise`), based on `managed`:

- `Users`
  - `ID : String(255)` (key) — the authenticated user id (`req.user.id`), NOT a generated UUID, so it matches `createdBy` on other entities
  - `displayName : String(100)`
  - `email : String(255)`
  - `locale : String(5) default 'en'` — supports `en`, `de` (validated with `@assert.range`/enum or `@assert.format`)
  - `defaultCurrency : Currency default 'EUR'` — single currency for now, column present for later multi-currency
  - `passwordHash : String(255)` — scrypt hash in the form `scrypt$<salt>$<hash>` (random per-user salt). Never the plain password. Not exposed by any service projection (excluded from `UserService`), so it cannot be read or written over OData
  - `managed` aspect fields (`createdAt`, `createdBy`, `modifiedAt`, `modifiedBy`)

No change to `Expenses` in this step (no foreign key yet; `createdBy` already equals `Users.ID`). Linking via association is a later decision.

Seed: `db/data/spendwise-Users.csv` with the mocked local users (alice, bob as configured in the mock auth) for development only. Seed rows carry pre-computed hashes of throwaway dev passwords, never real ones.

## Templates
No templates. (Fiori/UI5 frontend in `app/spendwise` is unchanged; the planned React app is out of scope.)

## Files to change
- `db/schema.cds` — add `Users` entity
- `srv/expense-service.cds` — none expected; only touch if shared types are extracted
- `package.json` — only if mocked users need configuring (prefer `.cdsrc.json`)

## Files to create
- `srv/user-service.cds` — `UserService` exposing own-profile access with `@restrict` on `ID = $user`
- `srv/user-service.js` — handler: create-on-first-access, input validation, ignore client-supplied `ID`
- `srv/lib/password.js` — `hashPassword(plain)` and `verifyPassword(plain, stored)` using Node's built-in `crypto.scrypt` and `timingSafeEqual`- `db/data/spendwise-Users.csv` — dev seed
- `test/user-service.test.js` — tests with `cds.test` (adds the project's first test)

## New dependencies
No new dependencies for hashing (Node's built-in `crypto`; no bcrypt/werkzeug needed). If tests need it, `@cap-js/cds-test` / `jest` as devDependencies, to be agreed first.

## Rules for implementation
- Use CDS and the CAP Node.js runtime only; no raw SQL string building and no ORMs. Use CQL (`SELECT`, `INSERT`, `UPDATE`) with bound parameters.
- Per-user isolation is mandatory: `@restrict` with `where: 'ID = $user'` on the entity AND the handler must filter on `req.user.id`. A user must never read or modify another user's row.
- Never accept `ID` from the client; always derive it from `req.user.id`.
- Passwords are stored only as salted scrypt hashes with a per-user random salt; the plain password is never persisted, logged, returned, or included in error messages. Compare with `timingSafeEqual`.
- `passwordHash` must not appear in any service projection, `$metadata`, response, or log.
- Login/registration endpoints and session or token issuing are out of scope for this step; only the schema, hashing helper and `setPassword` action are in scope. Authentication for requests still uses mocked auth locally and IAS on BTP.
- Validate inputs server-side (`locale` in allowed set, `defaultCurrency` currently only `EUR`, length limits, email format).
- Follow existing code style (CommonJS handlers in `srv/*.js`, `cds.ApplicationService`, two-space indent, comments only for non-obvious reasons).
- Keep the model ready for multi-currency and a future mobile client (no UI-specific fields).
- Do not create or modify project files beyond this spec without the user's go-ahead (per CLAUDE.md working style); explain the CAP concepts involved as each step is proposed.
- Use the `sap-cap-capire` skill for CDS/auth guidance.

## Definition of done
- [ ] `cds watch` starts without model errors and `cds deploy --to sqlite` creates a `spendwise_Users` table
- [ ] Authenticated as alice, `GET /odata/v4/users/Me` returns alice's profile (created automatically on first call, then stable on repeat calls)
- [ ] Authenticated as bob, the same call returns bob's own profile, never alice's
- [ ] `PATCH` of `displayName`, `locale` works for the own profile; `locale` outside `en`/`de` is rejected with 400
- [ ] A client-supplied `ID` in PATCH/POST is ignored or rejected
- [ ] Unauthenticated request returns 401
- [ ] Alice cannot read, update or delete bob's profile by any exposed path (verified by test)
- [ ] `createdBy` on new `Expenses` rows still matches `Users.ID` for the same user
- [ ] Existing `ExpenseService` behavior (including `monthlySummary`) is unchanged
- [ ] `$metadata` and every `UserService` response contain no `passwordHash` field
- [ ] `setPassword` as alice stores a `scrypt$...` hash in `spendwise_Users` (checked in SQLite), never the plain text; two users with the same password get different hashes
- [ ] `setPassword` with fewer than 12 characters is rejected with 400
- [ ] `verifyPassword` returns true for the right password and false for a wrong one (unit test)
- [ ] Tests for the above pass
