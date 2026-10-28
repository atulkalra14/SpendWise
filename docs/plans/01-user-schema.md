# Plan: User Schema (spec `docs/specs/01-user-schema.md`, branch `feature/user-schema`)

Final location once plan mode ends: `docs/plans/01-user-schema.md` (copy of this file).

## Context

Per-user isolation today relies only on `createdBy` (filled by `managed` from `req.user.id`). There is no user record for profile data or preferences, and later steps (categories, budgets, income) need something to reference. This step adds a `Users` entity keyed by the authenticated user id, a `UserService` for the caller's own profile (auto-created on first access), and a salted scrypt `passwordHash` with a `setPassword` action. Login/registration are out of scope. No code is written until this plan is approved.

Findings from the repo: CAP `@sap/cds` 10.2.1, Node 24, `@cap-js/sqlite`; `db/schema.cds` has only `Expenses : cuid, managed` (namespace `spendwise`); `ExpenseService` uses `@restrict ... where: 'createdBy = $user'` and CommonJS `cds.ApplicationService` handlers; seed CSV `db/data/spendwise-Expenses.csv` uses alice/bob; no `.cdsrc.json`, no `test/` dir, no test script, no jest. Mocked auth already provides alice/bob out of the box, so no auth config is needed.

## Steps (each is proposed and confirmed before files are touched, per CLAUDE.md)

### 1. Domain model — `db/schema.cds`

- Add `entity Users : managed` with `key ID : String(255)` (= `req.user.id`, not a UUID), `displayName : String(100)`, `email : String(255)` with `@assert.format` (simple email regex), `locale : Locale default 'en'` where `type Locale : String(5) enum { en; de }` (gives automatic 400 on bad values), `defaultCurrency : Currency default 'EUR'`, `passwordHash : String(255)`.
- `Expenses` is left unchanged (no association yet; `createdBy` already equals `Users.ID`).
- CAP concept to explain: `managed` aspect, enums as validation, why a string key is used.

### 2. Password helper — `srv/lib/password.js` (new)

- `hashPassword(plain)`: 16-byte random salt, `crypto.scrypt` (async, promisified, keylen 64), returns `scrypt$<saltB64>$<hashB64>`.
- `verifyPassword(plain, stored)`: parse, re-derive, compare with `crypto.timingSafeEqual`; returns false on malformed input rather than throwing.
- No new dependency. Never logs or returns the password.

### 3. Service — `srv/user-service.cds` (new)

- `service UserService @(path: '/odata/v4/users', requires: 'authenticated-user')`.
- `entity Me as projection on db.Users excluding { passwordHash }` with `@restrict: [{ grant: ['READ','UPDATE'], where: 'ID = $user' }]`; no CREATE/DELETE exposed. Expose as `@odata.singleton` if CAP 10 supports it for a restricted projection; otherwise fall back to the entity set (collection of one) — verify in step 6 and note the outcome. `ID`, `createdAt/By`, `modifiedAt/By` are `@readonly`; only `displayName`, `email`, `locale`, `defaultCurrency` are editable.
- `action setPassword(newPassword : String) returns Boolean` (no hash ever returned).
- `Users` is not exposed as a listing, so there is no path to other users' rows.

### 4. Handlers — `srv/user-service.js` (new, same style as `srv/expense-service.js`)

- `ensureUser(req)`: using `cds.db` (bypasses the service restriction), `SELECT` by `req.user.id`; if missing, `INSERT` with `ID = req.user.id`, `displayName = req.user.id`, defaults for locale/currency. Never uses a client-supplied ID. Called in `before` handlers for READ/UPDATE of `Me` and inside `setPassword`.
- `before UPDATE Me`: reject `defaultCurrency != 'EUR'` (single currency for now, 400); reject/ignore any `ID` in the payload.
- `on setPassword`: validate length 12–128 (upper bound limits scrypt cost abuse), `hashPassword`, `UPDATE spendwise.Users SET passwordHash = ? WHERE ID = req.user.id` via `cds.db` (column is not in the projection), return `true`. Error messages never include the password.

### 5. Seed data — `db/data/spendwise-Users.csv` (new)

- Rows for `alice` and `bob`: `ID,displayName,email,locale,defaultCurrency_code,passwordHash`. Hashes generated once with a throwaway node command using `srv/lib/password.js` (from the scratchpad dir, throwaway dev passwords stated in the file's commit message only, not real ones).

### 6. Tests — `test/user-service.test.js` and `test/password.test.js` (new) + `package.json` `"test"` script

- Use built-in `cds.test` with Node's `node --test` runner (no new devDependency); script: `"test": "node --test test/"`. Needs your go-ahead as it edits `package.json`.
- Cases: unauthenticated 401; alice GET creates then returns stable profile; bob gets only bob's; PATCH displayName/locale OK; locale `fr` → 400; `defaultCurrency` `USD` → 400; client `ID` ignored; `$metadata` has no `passwordHash`; `setPassword` stores `scrypt$…` in the DB (checked via `cds.db`), short password → 400, same password for two users gives different hashes; `verifyPassword` true/false/malformed; alice cannot reach bob's row; `ExpenseService.monthlySummary` still works for alice.

### 7. Verification (end-to-end)

- `npx cds compile db srv` — no model errors.
- `cds deploy --to sqlite` — `spendwise_Users` table exists; CSV loads.
- `npm test` — all tests pass.
- `cds watch`, then manual curl as alice/bob (`-u alice:`) against `/odata/v4/users/Me` and `/odata/v4/expenses/Expenses` to confirm isolation and that Expenses is unchanged.
- Walk the spec's Definition of done checklist item by item and report results honestly.

## Risks / decisions to flag

- Passwords conflict with the CLAUDE.md plan (IAS holds credentials on BTP); documented in the spec as local-only.
- Singleton support for a restricted projection is unverified; fallback is defined.
- Hash format has no parameter field; if scrypt cost ever changes, a versioned format will be needed (acceptable now).

## Out of scope

Login/registration/sessions, Expenses→Users association, Fiori/React UI, user-defined categories.
