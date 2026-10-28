# Spec: Update Expenses Schema

## Overview

Extend the `Expenses` entity so each expense can be classified. Today an expense has only `date`, `amount`, `currency` and `description`, which is not enough for budgets, analytics or the dashboard breakdowns planned for the MVP. This step adds developer-seeded `Categories` and `Subcategories` (CLAUDE.md: user-defined ones come later), links each expense to them, and adds an optional `notes` field and a link to the owning `Users` record. It also exposes the new data through `ExpenseService`. It is the data foundation for budgets (per category), the calendar/analytics views and, later, product-level price tracking.

The step does not specify which fields to add, so the scope below is inferred from CLAUDE.md and the project vision. Confirm or trim it during review.

## Depends on

- Step 01 (`01-user-schema`): `Users` keyed by `req.user.id`, which equals `createdBy` on `Expenses`.
- Existing `Expenses` entity and `ExpenseService` (including `monthlySummary`).

## Routes

No hand-written routes. CAP derives OData V4 endpoints from the service definition:

- `GET /odata/v4/expenses/Categories` — list seeded categories (with `$expand=subcategories`) — logged-in, read-only
- `GET /odata/v4/expenses/Subcategories` — list seeded subcategories — logged-in, read-only
- `GET|POST|PATCH|DELETE /odata/v4/expenses/Expenses` — existing, now accepts and returns `category_ID`, `subcategory_ID`, `notes` — logged-in, own rows only
- `monthlySummary` — unchanged signature and behaviour

## Database changes

Changes in `db/schema.cds` (namespace `spendwise`). Verified against the current file: `Expenses : cuid, managed` with `date`, `amount`, `currency`, `description`.

- New `Categories : cuid` — `code : String(30)` (unique, stable key for seed data and clients), `name : localized String(100)` (English and German via `localized`), `subcategories : Composition of many Subcategories on subcategories.category = $self`
- New `Subcategories : cuid` — `code : String(30)` (unique), `name : localized String(100)`, `category : Association to Categories not null`
- `Expenses` gains:
  - `category : Association to Categories` (optional at first so existing rows stay valid)
  - `subcategory : Association to Subcategories`
  - `notes : String(500)`
  - `user : Association to Users` — set from `req.user.id` by the service, never from client input. `createdBy` stays in place and remains the isolation filter.
- Consistency rule: if `subcategory` is set, it must belong to the chosen `category` (enforced in the handler, since CDS has no cross-field constraint for this).
- No `type` field (income / expense / transfer to savings) in this step. That modelling decision is deferred to its own step, and `Expenses` stays expenses only.
- `amount` stays `Decimal(15,2)`; `currency` stays as is (EUR only for now).

Seed data (developer-owned, reference data, not per-user):

- `db/data/spendwise-Categories.csv`, `db/data/spendwise-Categories.texts.csv` (German names)
- `db/data/spendwise-Subcategories.csv`, `db/data/spendwise-Subcategories.texts.csv`
- Update `db/data/spendwise-Expenses.csv` with `category_ID`, `subcategory_ID`, `user_ID` for the existing alice and bob rows

Existing local SQLite data is re-created from seed by `cds deploy --to sqlite`. No data migration is needed locally. For HANA later, new columns are nullable so a deploy does not break existing rows.

## Templates

No templates in the Flask sense. The Fiori app in `app/spendwise` is the frontend.

- **Create:** none
- **Modify:** none required. The Overview page keeps working because `monthlySummary` is unchanged. Showing categories in the UI is a later step.

## Files to change

- `db/schema.cds` — add `Categories`, `Subcategories`; extend `Expenses`
- `srv/expense-service.cds` — expose `Categories` and `Subcategories` as `@readonly` projections for any authenticated user; expose the new `Expenses` fields
- `srv/expense-service.js` — before CREATE/UPDATE on `Expenses`: set `user_ID` from `req.user.id`, ignore any client-supplied value, validate that the subcategory belongs to the category
- `db/data/spendwise-Expenses.csv` — add category, subcategory and user columns

## Files to create

- `db/data/spendwise-Categories.csv`
- `db/data/spendwise-Categories.texts.csv`
- `db/data/spendwise-Subcategories.csv`
- `db/data/spendwise-Subcategories.texts.csv`
- `test/expense-service.test.js` — tests for the rules below (reuse whichever test setup step 01 introduces)

## New dependencies

No new dependencies.

## Rules for implementation

- Use CDS and the CAP Node.js runtime only. No raw SQL string building and no ORMs. Use CQL with bound parameters.
- Per-user isolation stays mandatory: the `createdBy = $user` restriction on `Expenses` is unchanged, and the handler never trusts a client-supplied `user_ID`, `createdBy`, or `ID`.
- `Categories` and `Subcategories` are shared reference data and read-only through the service (`@readonly`). Users cannot create, change or delete them in this step.
- Money math stays deterministic: do not change `amount` precision, and `monthlySummary` must keep summing integer cents.
- All new user-facing text (category names) goes through `localized` so English and German both work. Select the language with the `Accept-Language` header.
- New `Expenses` columns are nullable so existing data and clients keep working. Do not tighten them in this step.
- Keep the model multi-currency-ready and free of UI-specific fields, so a future mobile client can use it.
- Follow existing code style (CommonJS handlers, `cds.ApplicationService`, two-space indent, comments only for non-obvious reasons).
- Do not create or modify project files beyond this spec without the user's go-ahead. Explain the CAP concepts involved (compositions, `localized`, `.texts.csv`, `@readonly`) as each step is proposed.
- Use the `sap-cap-capire` skill for CDS guidance.

## Definition of done

- [ ] `cds watch` starts with no model errors and `cds deploy --to sqlite` creates `spendwise_Categories`, `spendwise_Subcategories` and their `_texts` tables
- [ ] `GET /odata/v4/expenses/Categories?$expand=subcategories` returns the seeded categories with their subcategories for an authenticated user
- [ ] The same request with `Accept-Language: de` returns German names
- [ ] An unauthenticated request to `Categories` returns 401
- [ ] `POST`, `PATCH` or `DELETE` on `Categories` or `Subcategories` is rejected (405 or 403)
- [ ] As alice, `POST /Expenses` with a valid `category_ID` and `subcategory_ID` succeeds and returns `user_ID = alice`
- [ ] A `POST` with a `subcategory_ID` that belongs to a different category returns 400
- [ ] A `POST` with a client-supplied `user_ID` of another user is ignored or rejected, and the stored `user_ID` equals the caller
- [ ] A `POST` with no category still succeeds (fields are optional)
- [ ] Bob cannot read, update or delete alice's expenses, and `$expand=category` does not leak other users' data
- [ ] `GET /odata/v4/expenses/monthlySummary(month='2026-10')` returns the same totals as before this change for alice and bob
- [ ] The Fiori Overview page still loads and shows the same totals
- [ ] Tests for the above pass
