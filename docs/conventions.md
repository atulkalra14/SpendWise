# Conventions: errors, logging, IDs and drafts

Read before writing models, handlers or tests. `CLAUDE.md` holds the non-negotiable summary; this file holds the rules and their reasons. Rules come from capire unless marked [convention], which are our own choices.

## Error handling and validation
Basis: capire "Events and Requests", "Declarative Constraints" and i18n.
- **Declarative first.** Validate with annotations on the service entity: `@mandatory`, `@assert.range`, `@assert.format`, `@assert.target`, `@readonly`. Write a handler only for a rule annotations cannot express. `@mandatory` also tells Fiori clients to enforce the field.
- **Stop or collect.** `req.reject(status, 'KEY', 'target', [args])` stops at once; the single-object form `req.reject({ status, message: 'KEY', target, args })` is equivalent. `req.error(...)` takes the same arguments but collects several errors; the framework rejects the request after the current phase (`before`, `on` or `after`) with all of them. Set `target` to the field so Fiori marks it.
- **Keys, not sentences.** The message is always a key from `_i18n/messages*.properties`, and values for the text go in `args`. Keys are `UPPER_SNAKE_CASE` and start with the context (`ORDER_EXCEEDS_STOCK`). The runtime picks the language from `Accept-Language`.
- **Placeholder syntax: verify at setup.** The capire signature types `args` as a string array, while an i18n example passes an object with named placeholders (`{stock}`). Write one message each way against the real runtime, keep the form that works in both `en` and `de`, and record it here. Until then, do not use placeholders in new messages without that test.
- **Status codes** [convention]: `400` invalid input, `404` not found, `409` conflict with the current state of the data. `401` and `403` come from the authorization layer, never from a handler.
- **Warnings and info** use `req.warn` / `req.info` with the same key rules.
- **Unexpected errors.** Do not catch an error just to hide it. A remote or database failure you handle is logged with `cds.log` and then rejected with a key such as `REMOTE_UNAVAILABLE`. Never put a stack trace, SQL, host name or other internal detail in a message.
- Never `throw new Error('text')` from a handler, and never return an error inside a success response.
- Tests assert on status and message key, not on text. The one exception is `test/i18n/`, which asserts the translated text (see "Testing" in `CLAUDE.md`).

## Logging
Basis: capire `cds.log`.
- At the top of each module: `const LOG = cds.log('<context>')`. Never `console.log`. The framework's own loggers (`app`, `sql`, `odata`, `auth`, `remote`, ...) are not reused for our messages.
- Levels are set per profile in `package.json` under `cds.log.levels` [convention]: `[development]` `debug`, `[production]` `info`. `sql: debug` only in development.
- Use levels by meaning: `error` for unexpected failures, `warn` for handled but unusual cases, `info` for business events (an order was released, a job finished), `debug` for diagnostics.
- Log IDs and counts, never content. No personal data, tokens, secrets or request payloads. Include the tenant ID and the entity ID in `info` logs.
- Do not set `cds.log.user` to `true` or `sanitize_values` to `false` without an ADR; both have data-privacy impact.
- Log at the edges (handlers, remote calls, jobs). `srv/lib/` logs only when it makes a decision the caller cannot see.
- Verify at setup whether the runtime's log format carries a request or correlation ID. If not, an ADR decides how to add one.

## Data conventions

### IDs
- Every entity uses `cuid` (a `UUID` key named `ID`), as capire recommends canonical keys. The runtime fills the UUID in.
- Exceptions are code lists, which keep a short, stable business `code` key, and join entities with a composite key. State the reason in a comment on the entity.
- Human-readable numbers (order number, ticket number) are ordinary elements with a unique constraint, never the key. [convention]
- Never write an ID, tenant ID or system ID into code.
- Every business entity also gets `managed`.

### Drafts
- Enable drafts (`@odata.draft.enabled` on the service entity) only for entities that users edit in a Fiori elements form, and only on the root of a composition. Not for code lists, integration services or bulk or API-only services. The spec records the decision per entity. [convention]
- Handlers for draft events use the real event names: `NEW`, `PATCH`, `SAVE` and `DISCARD` on `Entity.drafts`, and `EDIT` on the active entity.
- Business rules that must hold when a draft is activated go in `before('SAVE', Entity.drafts, ...)`. Defaults go in `NEW`. Preconditions for editing go in `EDIT`.
- Authorization on a draft is the same as on the active entity.
- Do not filter on draft-related properties yourself; CAP supports only specific draft scenarios.
- Test the full path: create, patch, activate (including a failing validation), edit an active record, discard.
