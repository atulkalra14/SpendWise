# Code comments

Read before writing or changing code. `CLAUDE.md` holds the summary; this file holds the rules.

The goal: a developer who is new to this project can read any file top to bottom and understand what each section does and why, without asking anyone. Comments are in English. Explain intent and reasons, not what the syntax already says.

## Every file

- Starts with a short header comment (1–3 lines): what the file is for and where it fits (for example, "Handlers for `OrderService`; business rules live in `srv/lib/orders.js`").
- Is divided into sections with one-line comments, for example `// --- Validation ---`, so a reader can scan it.

## CDS (`db/`, `srv/`, `app/`)

- Every entity, service, action and function has a doc comment (`/** … */`) saying what it represents or does, and for whom.
- Comment elements only when the meaning is not obvious from the name: units, allowed values, business meaning, why a constraint exists.
- Authorization annotations (`@requires`, `@restrict`) get a one-line comment naming the rule in business terms, for example `// Only approvers may release an order`.
- Annotation files in `app/` are grouped under section comments (list page, object page, value helps, actions).

## JavaScript / TypeScript (`srv/`)

- Every function in `srv/lib/` and `srv/common/` has a JSDoc block: purpose, `@param` (with the meaning, not only the type), `@returns`, and the message keys it can raise through `req.error` / `req.reject`.
- Every handler registration has a one-line comment stating the phase, the event and the rule, for example `// before CREATE: reject an order without items (ORDER_NO_ITEMS)`.
- Steps inside a longer function get a short comment each, so the function reads like an outline.
- Always comment: business rules, workarounds and why they are needed, tenant or user context handling, anything that touches authorization, and references to the spec, ADR or capire page that justify a decision.

## Tests

- Every `describe` and `it` name reads as a plain sentence.
- Tests for auth, tenant isolation and drafts get a Given / When / Then comment when the setup is not obvious.

## Do not

- Do not restate the code (`// increment i`), leave commented-out code, or write change-log comments (the history is in git).
- Do not write `TODO` without a reason and an owner.
- Do not put secrets, tokens or personal data in comments or examples.
- Do not leave a comment stale: when code changes, its comment changes in the same commit.
