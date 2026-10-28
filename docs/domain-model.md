# Domain model

Read by `/new-slice` at the start of every feature. Keep it short and current. The CDS model in `db/schema/` is the source of truth for entities and fields; this file explains the *why*: which business areas exist, what the words mean and how the areas relate.

## Purpose of the application
<!-- 2-3 sentences: who uses it and what business problem it solves. -->

## Bounded contexts
One row per context. Each context becomes one file `db/schema/<context>.cds`.

| Context | Responsibility | Main entities | CDS file |
|---|---|---|---|
| _example: orders_ | _Capture and track customer orders_ | _Orders, OrderItems_ | _`db/schema/orders.cds`_ |

## Shared concepts
Types, aspects and code lists used by more than one context. They live in `db/schema/common.cds`.

| Concept | Meaning | Kind (type / aspect / code list) |
|---|---|---|
| | | |

## Relationships between contexts
Only associations cross context boundaries. List each one and its direction.

| From | To | Kind (association / composition) | Meaning |
|---|---|---|---|
| | | | |

## Roles and who may do what
One row per role. Details are in `xs-security.json` and the `@requires` / `@restrict` annotations.

| Role | Who | Can read | Can change |
|---|---|---|---|
| | | | |

## Glossary
Business terms in one agreed wording. Keep the German term here as well, matching `docs/i18n.md`.

| Term (en) | Term (de) | Definition |
|---|---|---|
| | | |

## Open questions
Anything unclear that blocks modeling. Resolved items are recorded as ADRs in `docs/adr/`.

-
