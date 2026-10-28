# Plan: Update Expenses Schema (spec `docs/specs/02-update-expenses-schema.md`, branch `feature/update-expenses-schema`)

Final location once plan mode ends: `docs/plans/02-update-expenses-schema.md` (copy of this file, the first action after approval). No code is written until this plan is approved. Each step is still proposed and explained before files are touched (CLAUDE.md working style).

## Context
`Expenses` has only `date`, `amount`, `currency`, `description`, which cannot support budgets, dashboards or analytics. This step adds developer-seeded `Categories`/`Subcategories` (English and German), links expenses to them, adds `notes` and a `user` link to `Users`, and exposes the reference data read-only through `ExpenseService`. `monthlySummary`, per-user isolation (`createdBy = $user`) and integer-cents money math stay untouched.

Findings: `db/schema.cds` has `Users` (key `ID = req.user.id`) and `Expenses : cuid, managed`. `srv/expense-service.cds` restricts `Expenses` with `createdBy = $user`. `srv/user-service.js` already has an `ensureUser` helper (creates the `Users` row on first access) and uses `req.reject(400, ...)` for validation. Seed CSVs use alice/bob. Error-handling guidance from the `sap-cap-capire` skill (`references/event-handlers-nodejs.md`, `event-handlers-patterns.md`): `req.error()` collects several validation errors and the framework rejects at the end of the phase, `req.reject()` throws immediately, errors carry an HTTP status, a message and a `target` field, and 500s must not leak `error.message`.

## Steps

### 1. Domain model: `db/schema.cds`
- `Categories : cuid` with `code : String(30)` (annotate `@assert.unique`, with `@mandatory`), `name : localized String(100)` (`@mandatory`), `subcategories : Composition of many Subcategories on subcategories.category = $self`.
- `Subcategories : cuid` with `code`, `name : localized`, `category : Association to Categories` marked `@mandatory`. Uniqueness: `code` unique per category.
- `Expenses`: add `category : Association to Categories`, `subcategory : Association to Subcategories`, `notes : String(500)`, `user : Association to Users`. All nullable.
- Do not touch `amount`, `currency` or `date`. No `type` field (deferred).
- CAP concepts to explain: associations vs compositions, generated foreign keys (`category_ID`), `localized` and generated `_texts` tables, `@mandatory` and `@assert.unique` as declarative validation.
- Risk to check: with CAP's default integrity setting, a `user_ID` pointing to a missing `Users` row fails the foreign-key check. Step 3 handles this.

### 2. Seed data: `db/data/`
- `spendwise-Categories.csv` + `spendwise-Categories.texts.csv` (`locale,ID,name` rows for `de`): about 8 starter categories (Groceries, Housing, Transport, Dining, Health, Leisure, Shopping, Other).
- `spendwise-Subcategories.csv` + `.texts.csv`: 2-3 per main category (e.g. Groceries: Supermarket, Market; Transport: Public transport, Fuel).
- Use fixed, readable UUIDs so `Expenses.csv` and tests can reference them.
- Update `spendwise-Expenses.csv` with `category_ID`, `subcategory_ID`, `user_ID` (alice/bob) for the existing three rows. Totals must stay the same.

### 3. Shared helper: `srv/lib/ensure-user.js` (new, small refactor)
- Move the `ensureUser` logic out of `srv/user-service.js` so both services create the `Users` row on first use. Behaviour stays the same, and `UserService` is updated to import it. The helper takes the request and uses `cds.db`, so the service restriction does not apply. The key always comes from `req.user.id`.
- Reason: otherwise an expense created before the user ever called `UserService` would fail the `user` foreign-key check.

### 4. Service: `srv/expense-service.cds`
- Add `@readonly` projections `Categories` and `Subcategories` with `@requires: 'authenticated-user'` (expose `subcategories` so `$expand` works). Generated text and `localized` handling returns the German name when `Accept-Language: de`.
- `Expenses` projection stays the same (new fields flow through). Mark `user` and `createdBy` as `@readonly` so clients cannot set them. Keep the `createdBy = $user` restriction.
- `monthlySummary` unchanged.

### 5. Handler: `srv/expense-service.js`
Add `before(['CREATE', 'UPDATE'], 'Expenses', ...)` in the existing `init()`, following the file's style:
1. Derive `user_ID` from `req.user.id` after calling `ensureUser`. Drop any client-supplied `user_ID`/`createdBy`/`ID`.
2. Category/subcategory consistency: for a PATCH that changes only one of the two, read the stored row (filtered by `createdBy`) and validate the merged result.
   - Unknown `category_ID` / `subcategory_ID`: `req.error(400, 'CATEGORY_NOT_FOUND', ...)` with `target: 'category_ID'`.
   - Subcategory not under the category: `req.error(400, 'SUBCATEGORY_CATEGORY_MISMATCH', ...)` with `target: 'subcategory_ID'`.
   - A subcategory with no category: `req.error(400, 'SUBCATEGORY_REQUIRES_CATEGORY', ...)` with `target: 'category_ID'`. Decided: reject, never auto-fill.
3. Use `req.error` so several problems are reported together, and `req.reject` only for conditions where continuing makes no sense.
4. Length check for `notes` comes from the `String(500)` type (framework 400). No extra handler code.

### 6. Error handling (per `sap-cap-capire` skill)
| Case | Mechanism | Status |
|---|---|---|
| Missing `date` / `amount`, `notes` too long, bad type | Declarative (`not null`, types) | 400, framework |
| Unknown category / subcategory | `req.error` + code + `target` | 400 |
| Subcategory belongs to another category | `req.error` + code + `target` | 400 |
| Client-supplied `user_ID` / `createdBy` | Ignored (overwritten) | n/a |
| Write on `Categories` / `Subcategories` | `@readonly` | 405 |
| Unauthenticated | `@requires` | 401 |
| Another user's expense (read/update/delete) | `@restrict` where clause | 404 (verify actual code) |
| Unexpected DB or runtime failure | Let the framework return a generic 500; no `error.message` in the response; details to `cds.log` | 500 |
- Keep messages free of other users' data, internal IDs and SQL text.
- Messages that users may see are added to `_i18n/messages` if the project has one. If not, English strings with stable error codes only, with i18n later (note for a follow-up).

### 7. Tests: `test/expense-service.test.js`
- Reuse whatever test setup step 01 settled on (`cds.test` with `node --test`; check `package.json` and `test/` on this branch first). Add the dev dependency only if the user agrees.
- Cases follow the spec's definition of done: categories read (en/de), 401, readonly writes, create with category, mismatch 400, unknown ID 400, client `user_ID` ignored, optional category, isolation (bob vs alice, including `$expand`), `monthlySummary` totals unchanged.

## Critical files
- Modify: `db/schema.cds`, `srv/expense-service.cds`, `srv/expense-service.js`, `srv/user-service.js` (import shared helper), `db/data/spendwise-Expenses.csv`
- Create: four seed CSVs, `srv/lib/ensure-user.js`, `test/expense-service.test.js`
- Reuse: `ensureUser` logic from `srv/user-service.js`, handler style from `srv/expense-service.js`

## Verification
1. `cds watch` starts with no model errors. `cds deploy --to sqlite` creates the `Categories`, `Subcategories` and `_texts` tables.
2. With curl/REST client as alice and bob (mock auth): run each Definition-of-done request from the spec and compare status codes with the table in step 6.
3. `GET .../monthlySummary(month='2026-10')` for alice and bob returns the same totals as before.
4. Open `npm run watch-spendwise` and confirm the Overview page still loads with the same totals.
5. Run the test suite. All cases pass.

## Decisions
- Subcategory without a category is rejected with 400 (no auto-fill). Decided 2026-10-24.
- The `user` association on `Expenses` is kept alongside `createdBy`. Decided 2026-10-24.

## Implementation notes (deviations found while building)
- `ensureUser(req)` uses `cds.db.run(...)` and not the global `SELECT`/`INSERT`: with the `cds-plugin-ui5` setup the global CQL builders can be bound to a different `@sap/cds` copy and fail with "no primary database is connected". Handler queries on served entities use `this.run(...)`.
- Another user's expense returns 403 (not 404) for PATCH/DELETE.
- Tests use Node's built-in test runner (`node --test`) against a spawned server and a temp SQLite file, because `cds.test` needs the extra package `@cap-js/cds-test`. `npm test` runs them (12 tests passing).
