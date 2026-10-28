# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

SpendWise: a personal finance web app (income, expenses, budgets, recurring payments, product-level price tracking) built on SAP CAP (Node.js) with a SAPUI5/Fiori frontend. Existing so far: the `Expenses` entity and per-user `ExpenseService` (with a `monthlySummary` function), a Fiori app in `app/spendwise` (landing page and Overview page backed by `ExpenseService`), a `Users` entity and `UserService`, and, on branch `feature/registration`, a public `RegistrationService` (`register` action) with a `#/register` page in the Fiori app. Registration is for local/custom login only; on BTP, IAS owns sign-up. Specs live in `.claude/specs/` and implementation plans in `.claude/plans/`. Anything below marked "planned" is a decision, not existing code.

## Project overview
- SAP Cloud Application Programming Model (CAP), Node.js runtime.
- Local DB: SQLite (in-memory). Cloud DB: SAP HANA Cloud (HDI).
- Tenancy: multitenant SaaS (`@sap/cds-mtxs`, one HDI container per tenant).
- Auth: XSUAA (`xs-security.json`, role templates).
- UI: SAP Fiori elements (annotation-driven)

## Versions and bootstrap
- Capire currently targets Node.js >= 24, `@sap/cds` 10, `@sap/cds-mtxs` 4. Pin the versions in `package.json` and `engines`; check with `cds version`.
- A new project starts with `cds init --nodejs`, then `git init`, then `cds add multitenancy,xsuaa` as needed, then a Jest setup (`cds.test` needs Jest; CAP does not add it) and the style tooling from `docs/style-guide.md` (Prettier, ESLint). `npm test`, `npm run lint`, `npm run format:check` and the git-based review commands only work after this.

## Folder layout
- `db/`   – CDS domain model in `db/schema/`, seed data (`db/data/*.csv`), no logic
- `srv/`  – services (`*.cds`), handlers (`srv/handlers/`), business logic in `srv/lib/`, remote services in `srv/external/`, shared helpers in `srv/common/`
- `app/`  – Fiori apps and UI annotations (`app/<app>/fiori-service.cds`, imported by `app/services.cds`)
- `test/` – `unit/`, `service/`, `auth/`, `tenant/`, `i18n/`, `integration/` tests and `data/` fixtures (see "Testing")
- `docs/` – reference docs (see "Reference docs"), `adr/` (decisions), `specs/` and `plans/` (one file per feature, written by `/new-slice`)
- `_i18n/` – translatable texts: `i18n*.properties` (model/annotation labels), `messages*.properties` (runtime messages)
- `mtx/sidecar/` – multitenancy sidecar (`@sap/cds-mtxs`), used for local multitenancy tests
- `scripts/` – helper scripts (e.g. `check-i18n.js`)
- `.github/` – `pull_request_template.md` and CI workflows
- Root config files, one source each: `.editorconfig`, `.prettierrc`, `eslint.config.mjs`, `package.json`, `xs-security.json` (see "Code style, linting and theme")
- `.claude/` – settings, subagents, hooks, commands (`/new-slice`, `/review`). Do not modify without asking.
- `.mcp.json` – MCP servers: `cds-mcp` (CAP model and docs), `fiori-mcp`, `ui5-mcp`
- `gen/`  – generated output. NEVER edit.

## Reference docs
This file holds the rules that apply to every task. The detail lives in `docs/`. Before starting a task, read the docs that apply to it. Subagents do the same.

| Read | Before |
|---|---|
| `docs/domain-model.md`, `docs/adr/` | every feature |
| `docs/code-organisation.md` | writing a spec or creating any file |
| `docs/conventions.md` | writing models, handlers or tests (errors, logging, IDs, drafts) |
| `docs/code-comments.md` | writing or changing any code |
| `docs/style-guide.md` | any UI, style, lint or theme work |
| `docs/i18n.md` | adding or changing any text |
| `docs/agentic-readiness.md` | adding or changing an action or service |

## Code organisation
Claude decides where code goes and never asks the user. Order of precedence: the structure already in the repo, then `docs/code-organisation.md`, then capire via `cds-mcp`. `/new-slice` records each decision in the spec and the plan.
- One CDS file per bounded context in `db/schema/<context>.cds`; `db/index.cds` imports them.
- One service per use case and user group, as a facade over `db/` (`srv/<context>-service.cds` and `.js`). Handlers in `srv/handlers/`, logic in `srv/lib/`, helpers in `srv/common/`, remote services in `srv/external/`.
- UI annotations only in `app/<app>/fiori-service.cds`, imported by `app/services.cds`.
- Dependencies point one way: `app/` → `srv/` → `db/`.

## Code comments
Goal: a developer new to the project can read any file and understand each section and why it exists. Comments are English and explain why, not what.
- Every file has a header comment and section comments. CDS entities, services, actions and functions have doc comments. Every function in `srv/lib/` and `srv/common/` has JSDoc. Every handler has a one-line comment with phase, event and rule.
- No commented-out code, no `TODO` without a reason and owner, no secrets. Change the comment with the code.
- Full rules: `docs/code-comments.md`.

## Code style, linting and theme
These are constant across all features. Details, values and the reasons are in `docs/style-guide.md`; this section holds the rules.
- One source per setting: `.editorconfig`, the Prettier config, the ESLint configs, and each app's `ui5.yaml` for the SAPUI5 version and theme. No second copy and no per-feature override.
- Never change a style, lint, theme or UI5-version setting inside a feature. It needs an ADR and its own `chore:` commit that updates every app (see `docs/style-guide.md`, "Changing the standard").
- `npm run lint` and `npm run format:check` must pass. Disable a lint rule only on one line, with a reason.
- Run `run_ui5_linter` from `ui5-mcp` after every change to UI5 code.
- Theme: SAP Horizon (`sap_horizon`) for every app. No custom CSS, inline styles, `!important` or hex colors; layout comes from Fiori elements annotations.
- Every new app is created with the `fiori-mcp` generator from the app baseline in `docs/style-guide.md`, never by copying another app.

## Tooling
Use the tools in this order when sources disagree: (1) our rules, in this file and the `docs/` it lists, (2) the MCP servers, (3) the skills, (4) general knowledge, which is never enough for CDS, Fiori or UI5 APIs.
- **This file and `docs/`** hold our decisions only. Do not copy SAP documentation into them; point to the tool instead.
- **MCP servers**, pinned in `.mcp.json`, answer facts: `cds-mcp` (`search_model` for this project's model, `search_docs` for capire), `fiori-mcp` (generate and change Fiori apps, Fiori docs), `ui5-mcp` (UI5 guidelines, API reference, linter, manifest validation).
- **Skills** in `.claude/skills/` give procedures: `cap-developer` (CAP idioms), `cap-add-remote-service` (consume an external service), `cap-upgrade` (CDS upgrade).
- **Subagents** are our own review roles: `reviewer`, `security-reviewer`, `test-writer`.
- Do not install a plugin that bundles servers or skills we already have. A new MCP server, skill or plugin needs an ADR that says what it adds and what it would duplicate.
- Version bumps of the MCP servers are deliberate: read the release notes, change the pin in `.mcp.json`, and check the tools still exist.

## Commands
- Install: `npm ci`
- Run locally: `npx cds watch`
- Compile check: `npx cds compile srv --to json > /dev/null`
- Test: `npm test` (Jest + `cds.test`)
- Lint: `npm run lint` (CAP code, JS/TS and every Fiori app; see `docs/style-guide.md`)
- Format check: `npm run format:check` (fix with `npm run format`)
- i18n check: `npm run i18n:check` (runs `node scripts/check-i18n.js --languages=en,de`; add new languages to that list). Errors: missing file or key, empty value, placeholder mismatch. Warnings: unused or extra keys.
- Local multitenancy test (sidecar), in separate terminals: `npx cds watch mtx/sidecar` (port 4005), then `npx cds watch` (see capire "Multitenancy" > "Test-Drive Locally")
- Add tenant locally: `npx cds subscribe <tenant> --to http://localhost:4005` (sidecar port; remove with `cds unsubscribe <tenant> --from http://localhost:4005`)

## Definition of done
1. `cds compile` passes with no warnings introduced.
2. Tests pass, including auth tests for every role (positive and negative).
3. Lint and `npm run format:check` are clean, with no new lint suppressions without a reason.
4. Every new service/entity has an authorization annotation (`@requires` / `@restrict`).
5. No secrets, credentials or service keys in code or commits.
6. No hard-coded user-facing text; new keys exist in English and German and `npm run i18n:check` passes.
7. New and changed code is commented as described in `docs/code-comments.md`.
8. Style and theme follow "Code style, linting and theme": no custom CSS or theme settings, and no change to a config file.

## Rules
- CDS model is the source of truth. Propose model changes first, wait for review, then implement handlers.
- Never invent CDS annotations, functions or `cds` APIs. If unsure, query the `cds-mcp` server first (`search_model` for this project's own entities and services, `search_docs` for CAP documentation), then https://cap.cloud.sap/docs, and say what you verified.
- Fiori and UI5 work: use the `fiori-mcp` and `ui5-mcp` tools instead of writing `manifest.json` or annotation boilerplate from memory. Review generated output like any other change.
- Use CQN / `cds.ql` (`SELECT.from`, `INSERT.into`, `UPDATE`) – no hand-written SQL, no string concatenation in queries.
- Use `cds.connect.to`, `req.error`, `req.reject`, `req.warn` – do not throw raw errors from handlers. Details in `docs/conventions.md`.
- Do not bypass authorization. Avoid running with `cds.context` overrides, `cds.tx` as privileged user, or direct DB access unless explicitly requested, and flag it clearly if so.
- Use aspects `cuid`, `managed`; use `localized` for translatable texts; keep i18n in `_i18n/`.
- Use compositions for child lifecycle ownership, associations for references.
- Handlers: `before` = validate/enrich, `on` = replace core logic, `after` = post-process. Keep handlers thin; move logic to `srv/lib/`.
- Async/external calls: use outbox for events and remote calls that must not be lost.
- Config per profile in `package.json` `cds` section (`[development]`, `[production]`); secrets only via environment variables or service bindings.
- Keep changes small: one feature slice per task (entity, service, handler, test, annotation).

## Errors, logging, IDs and drafts
Full rules, with the capire basis and our conventions, are in `docs/conventions.md`. Read it before writing models, handlers or tests.
- Validate with annotations first (`@mandatory`, `@assert.*`, `@readonly`). A handler only for rules annotations cannot express.
- Report errors with `req.reject` / `req.error` and a message key from `_i18n/messages*.properties`. Never `throw new Error`, never a literal sentence, never internal detail (stack trace, SQL, host name) in a message. `401` and `403` come from authorization, not from handlers.
- Log with `const LOG = cds.log('<context>')`, never `console.log`. Log IDs, not content; never personal data, tokens or payloads.
- Entities use `cuid` (exceptions, such as code lists, are in `docs/conventions.md`); business entities also `managed`. Never write an ID into code.
- Drafts only where the spec says so. Rules that must hold on activation go in `before('SAVE', Entity.drafts)`. Test the full draft path.
- Message placeholder syntax and log correlation IDs are verified at project setup (see `docs/conventions.md`).

## Agent readiness
We design for AI agents (SAP Joule) now and build agentic features later. Nothing agentic is installed today. Rules and the adoption path are in `docs/agentic-readiness.md`.
- Name actions after business intent and describe them in English doc comments; an agent picks tools by name and description.
- Authorization is never relaxed for agents; risky actions need a human confirm step; actions are safe to repeat.
- Never put `@mcp` on a service that re-exposes SAP application APIs (SAP API Policy).
- Adding the first agent feature (`@cap-js/mcp`, Joule) needs an ADR first.

## Testing
- Use `cds.test(...)` with the project root; use mocked users (`alice`, `bob`, ...) defined in `[development]` config.
- Layout under `test/`: `unit/` (logic from `srv/lib/`, no CAP), `service/` (OData requests), `auth/` (role matrix), `tenant/` (isolation), `i18n/`, `integration/` (remote mocks, outbox), `data/` (fixtures).
- Required per service: happy path, validation failure, authorization denied, authorization instance filter.
- Every business rule in a handler has a service test that asserts the status and the message key. Only the tests in `test/i18n/` assert translated text, in `en` and `de`.
- Fixtures live in `test/data/`, never in `db/data/`. Each test is independent and resets its data.
- A bug fix starts with a test that fails for that bug.
- Coverage target [convention]: 80% of lines for `srv/lib/`, `srv/handlers/` and `srv/common/`, set as a Jest threshold in the Jest config. A change that lowers it must say why.
- Run critical flows against HANA before release; SQLite hides dialect and locking differences.

## Pull requests
- One pull request per slice, from `feature/<feature_slug>`. The title is a conventional commit message. Squash merge, so the title becomes the commit. [convention]
- The description follows `.github/pull_request_template.md`: summary, links to the spec and plan, results of every check, schema and authorization changes, German texts that need native review, screenshots for UI changes, risks and ADR links.
- A pull request is ready when every item in "Definition of done" holds, the `reviewer` output has no Blocking finding, and one human has approved it.

## Security
- Every service must have `@requires` or `@restrict`; no open `@public` without explicit approval.
- Do not log personal data or tokens.
- Do not read or edit `.env`, `default-env.json`, `*.key`, or `default-services.json`.

## Multitenancy (XSUAA)
- Use `@sap/cds-mtxs` (sidecar architecture); add via `cds add multitenancy`. Never hand-roll tenant handling.
- Each tenant has its own HDI container. Always use `cds.context.tenant`/`req.tenant`; never store tenant data in module-level variables or shared caches without tenant key.
- `xs-security.json` holds scopes and role templates. Do not change scope names after release without a migration plan.
- Schema changes roll out to all tenants on upgrade: additive changes preferred, no destructive changes (drop column/entity, type narrowing) without an explicit migration plan.
- Seed/CSV data: reference data goes in `db/data/`; tenant-specific data must not. CAP also loads `test/data/` CSVs in the development profile (`cds.requires.db.data`), so keep only data there that may be seeded into dev databases.
- Jobs, outbox, and background processes must run per tenant (use `cds.context` / `cds.spawn` with a tenant).
- Remote destinations: use per-tenant (subaccount) destinations; no hard-coded URLs.
- Test with at least two tenants, including a cross-tenant isolation test (tenant A must never read tenant B data).

## Internationalization (i18n)
Languages, tone, glossary, the translation process and how to add a language are in `docs/i18n.md`.
- Supported languages: `en` (default and fallback) and `de`. Design so that a new language needs only new files, no code change.
- Never hard-code user-facing text in handlers, CDS, annotations or UI code. Use keys: `{i18n>Key}` in CDS and annotations, message keys in `req.reject`.
- Texts live in `_i18n/i18n*.properties` (labels), `_i18n/messages*.properties` (runtime messages) and `app/<app>/webapp/i18n/` (UI5). Translatable business data uses `localized` elements, with seed translations in `db/data/<Entity>_texts.csv`.
- Every new key gets the English and the German text in the same change, and `npm run i18n:check` must pass. Claude may draft German texts but lists them in the PR under "German texts need native review". Texts for languages added later are never machine-translated silently.
- The locale comes from the request (`req.locale`). Never hard-code date, number or currency formats.
- Tenant-specific text overrides need an ADR before implementation.

## Workflow for each feature
This list is the single definition of the workflow. `/new-slice <feature>` runs it step by step, and `/review` runs the checks before a pull request. If another file describes the workflow differently, this list wins.

Steps marked **GATE** stop until the user approves. Nothing after a gate starts before that.
1. Understand the feature; read `docs/domain-model.md`, `docs/adr/` and the reference docs that apply (see "Reference docs").
2. Check that the working tree is clean, then create `feature/<feature_slug>` from an up-to-date `main`.
3. Write the spec and save it as `docs/specs/<step_number>-<feature_slug>.md`.
4. **GATE 1: the user approves the spec.**
5. Write the detailed plan (scope, files touched, risks) and, once approved, save it as `docs/plans/<step_number>-<feature_slug>.md`.
6. **GATE 2: the user approves the plan.**
7. Update the CDS model.
8. **GATE 3: the user reviews the model change.**
9. Write failing tests first.
10. Implement.
11. Run compile, lint, `format:check`, i18n check and tests.
12. **GATE 4: review** by the `reviewer` subagent (and `security-reviewer` where it applies), then the user.
13. Commit with a clear message, only when the user approves.

## Git
- Branch per feature: `feature/<feature_slug>`.
- Conventional commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`).
- Do not commit `gen/`, `node_modules/`, `.env`.

