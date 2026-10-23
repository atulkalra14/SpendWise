# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

SpendWise: a personal finance web app (income, expenses, budgets, recurring payments, product-level price tracking) built on SAP CAP (Node.js). The repo is freshly scaffolded with `cds init`: `app/`, `db/` and `srv/` are still empty, so there is no domain model or service code yet. Anything below marked "planned" is a decision, not existing code.

## Commands

- `npm install` — install dependencies (`@sap/cds`, `@cap-js/sqlite` as a dev dependency)
- `cds watch` — run the app with live reload (also available as the VS Code task "cds watch")
- `cds deploy --to sqlite` — deploy the model to a local SQLite database
- No build, lint or test scripts are defined yet in `package.json`.

## Architecture (CAP layout)

- `db/` — CDS domain model and seed data (CSV)
- `srv/` — CDS service definitions and Node.js handlers; services expose OData V4
- `app/` — UI frontends. Planned: React + TypeScript in `app/spendwise-web/`, managed as an npm workspace in this monorepo.

Planned stack and decisions (see also the project memory):
- Local development uses SQLite and mocked auth. HANA Cloud and IAS are for deployment on BTP Cloud Foundry.
- Single currency (EUR) for now, but design so multi-currency can be added later.
- Categories and subcategories are seeded by the developer first. User-defined ones come later.
- Savings model: income minus expenses is computed. A separate "transfer to savings" transaction type covers deliberate set-asides.
- Backend APIs must serve both the web app and a future mobile client.
- Money math must be deterministic and accurate. Data is strictly isolated per user. Never persist AI-extracted transactions without user confirmation.

## Skills

`sap-cap-capire` (installed from `secondsky/sap-skills` into `.agents/skills/`, symlinked into `.claude/skills/`) holds CAP/CDS guidance. `skills-lock.json` also lists `sap-fiori-tools`, which is not currently installed.

## Working style

The user is learning Claude Code and SAP CAP/BTP through this project. Propose each step and explain the CAP concepts involved. Do not create or modify project files without an explicit go-ahead.
