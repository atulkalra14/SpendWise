# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

SpendWise: a personal finance web app (income, expenses, budgets, recurring payments, product-level price tracking) built on SAP CAP (Node.js) with a SAPUI5/Fiori frontend. Existing so far: the `Expenses` entity and per-user `ExpenseService` (with a `monthlySummary` function), a Fiori app in `app/spendwise` (landing page and Overview page backed by `ExpenseService`), a `Users` entity and `UserService`, and, on branch `feature/registration`, a public `RegistrationService` (`register` action) with a `#/register` page in the Fiori app. Registration is for local/custom login only; on BTP, IAS owns sign-up. Specs live in `.claude/specs/` and implementation plans in `.claude/plans/`. Anything below marked "planned" is a decision, not existing code.

## Commands

- `npm install` — install dependencies (`@sap/cds`, `@cap-js/sqlite` and `cds-plugin-ui5` as dev dependencies)
- `cds watch` — run the app with live reload (also available as the VS Code task "cds watch")
- `npm run watch-spendwise` — `cds watch` that opens the Fiori app (`spendwise/index.html`)
- `cds deploy --to sqlite` — deploy the model to a local SQLite database
- No build or test scripts are defined yet in `package.json` (a `test` script using `node --test` is planned in the user-schema plan). The Fiori app has its own ESLint config in `app/spendwise`.

## Architecture (CAP layout)

- `db/` — CDS domain model (`schema.cds`) and seed data (`db/data/*.csv`)
- `srv/` — CDS service definitions and Node.js handlers; services expose OData V4 (`ExpenseService` at `/odata/v4/expenses`, `UserService` at `/odata/v4/users`); shared helpers in `srv/lib/`
- `app/` — UI frontends, managed as npm workspaces (`app/*`). `app/spendwise` is a SAPUI5/Fiori app (generated with the SAP Fiori generator, served through `cds-plugin-ui5`, data source `/odata/v4/expenses/`). The earlier React + TypeScript plan (`app/spendwise-web/`) was never started and is superseded by the Fiori app unless the user decides otherwise.

Planned stack and decisions (see also the project memory):
- Local development uses SQLite and mocked auth. HANA Cloud and IAS are for deployment on BTP Cloud Foundry.
- Users are keyed by the authenticated user id (`req.user.id`), the same value `managed` writes to `createdBy`. `Users.passwordHash` (salted scrypt, never exposed over OData) exists only for local/custom login; on BTP, IAS holds credentials.
- Single currency (EUR) for now, but design so multi-currency can be added later.
- Categories and subcategories are seeded by the developer first. User-defined ones come later.
- Savings model: income minus expenses is computed. A separate "transfer to savings" transaction type covers deliberate set-asides.
- Backend APIs must serve both the web app and a future mobile client.
- Money math must be deterministic and accurate. Data is strictly isolated per user. Never persist AI-extracted transactions without user confirmation.

## Skills

`sap-cap-capire` (installed from `secondsky/sap-skills` into `.agents/skills/`, symlinked into `.claude/skills/`) holds CAP/CDS guidance. `skills-lock.json` also lists `sap-fiori-tools`, which is not currently installed.

## Working style

Whereever possible use SAP FIORI tools and annotations to develop everything on frontend
Draft enable all the services or schema you are creating
