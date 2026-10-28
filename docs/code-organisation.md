# Code organisation

Where code goes and how it is split. Read before writing a spec or creating any file. `CLAUDE.md` holds the summary; this file holds the rules.

Claude decides every point here itself and never asks the user these questions. Order of precedence: (1) the structure already in the repo, (2) the rules below, (3) capire via `cds-mcp` `search_docs`. `/new-slice` records each decision in the spec and the plan. Rules marked [convention] are our own choices, not CAP requirements.

## Domain model (`db/`)

- One CDS file per bounded context in `db/schema/<context>.cds`. Shared types, aspects and localized code lists go in `db/schema/common.cds`. `db/index.cds` imports every file with `using from`.
- One project namespace; entities in PascalCase, elements in camelCase. If entities already exist, follow their naming.
- Link across contexts with associations only. No circular `using`.
- A new entity goes into the context file it belongs to; create a new context file only if it fits no existing one.

## Services (`srv/`)

- One service per use case and user group. Services are facades: projections on `db/` entities, shaped for that use case. Never expose a `db/` entity unchanged unless the service is an admin service.
- A new feature goes into an existing service if it serves the same use case and user group; otherwise create a new service.
- Name files `srv/<context>-service.cds`; the service file is `srv/<context>-service.js` with the same base name, so CAP finds it without `@impl`. It stays thin and only registers handlers. `srv/index.cds` imports every service.
- Handlers (`before` / `on` / `after`) live in `srv/handlers/`, one file per entity. Messages use keys only.

## Business logic (`srv/lib/`)

- Handlers call `srv/lib/`; they hold no logic.
- One module per domain concept: `srv/lib/<concept>.js`, pure and unit-testable without CAP. Business logic needed by two modules lives in one of them and is imported by the other.
- Error, authorization and logging helpers go in `srv/common/`.
- Module functions take plain data and return plain data. Use `req` only for `req.error`, `req.reject` and `req.locale`.

## Fiori apps and annotations (`app/`)

- One folder per app: `app/<app>/`. One app per use-case service.
- UI annotations go in `app/<app>/fiori-service.cds`, annotating `srv/<context>-service.cds`. `app/services.cds` imports every `fiori-service.cds`. Service files stay free of UI annotations.
- Code that two or more apps need goes into a UI5 library or component under `app/`. Decide structure with the `ui5-mcp` guidelines.

## External services

- Follow the `cap-add-remote-service` skill. `cds import` places definitions in `srv/external/`; consumption views and remote clients go there too. A service that exposes them follows the Services rules.

## Reuse and boundaries

- Dependencies point one way: `app/` → `srv/` → `db/`. `db/` never refers to `srv/` or `app/`; `srv/lib/` never refers to `app/`.
- Extract a CAP plugin or package only when a second project needs the same code. A handler in a reuse package needs `@impl` with the full module path.

## Size and naming limits [convention]

- Files in kebab-case. Split a CDS file above about 300 lines, a handler file above about 200 lines, and a function above about 50 lines.
- Split along domain or use-case lines, never by technical layer inside one domain.
