# Domain model

Read by `/new-slice` at the start of every feature. Keep it short and current. The CDS model in `db/schema/` is the source of truth for entities and fields; this file explains the _why_: which business areas exist, what the words mean and how the areas relate.

## Purpose of the application

SpendWise is a personal finance web app for private individuals. People record their expenses today, and later income, budgets, recurring payments and product-level price tracking, so they can see where their money goes. Every user sees only their own data. _Draft written from the current code; the owner confirms or corrects this text._

## Bounded contexts

One row per context. Each context becomes one file `db/schema/<context>.cds`.

| Context  | Responsibility                                               | Main entities             | CDS file                 |
| -------- | ------------------------------------------------------------ | ------------------------- | ------------------------ |
| users    | Who signs in and their profile (language, default currency)  | Users                     | `db/schema/users.cds`    |
| catalog  | Reference data shared by all users, seeded by the developers | Categories, Subcategories | `db/schema/catalog.cds`  |
| expenses | What a user spent, with an optional category and subcategory | Expenses                  | `db/schema/expenses.cds` |

All contexts use the namespace `spendwise`, and `db/index.cds` imports them.

## Shared concepts

Types, aspects and code lists used by more than one context. A `db/schema/common.cds` is created when a second context needs the same custom type; today `Locale` is only used by `users`.

| Concept    | Meaning                                              | Kind                             |
| ---------- | ---------------------------------------------------- | -------------------------------- |
| `cuid`     | UUID key named `ID`                                  | aspect from `@sap/cds/common`    |
| `managed`  | `createdAt`, `createdBy`, `modifiedAt`, `modifiedBy` | aspect from `@sap/cds/common`    |
| `Currency` | Currency code, `EUR` by default                      | code list from `@sap/cds/common` |
| `Locale`   | Supported UI languages, `en` and `de`                | type in `db/schema/users.cds`    |

## Relationships between contexts

Only associations cross context boundaries. List each one and its direction.

| From                     | To            | Kind        | Meaning                                                       |
| ------------------------ | ------------- | ----------- | ------------------------------------------------------------- |
| Expenses.category        | Categories    | association | The category of an expense, optional                          |
| Expenses.subcategory     | Subcategories | association | The subcategory, must belong to the chosen category           |
| Expenses.user            | Users         | association | The owner, set by the service from the signed-in user         |
| Categories.subcategories | Subcategories | composition | Subcategories live and die with their category (same context) |

## Roles and who may do what

Roles are defined by the CDS model and mirrored in `xs-security.json` (see ADR 0004). Details are in the `@requires` / `@restrict` annotations of `srv/`.

| Role   | Who                                                               | Can read                                 | Can change                                                                                                  |
| ------ | ----------------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `User` | Every signed-in SpendWise user (role collection "SpendWise User") | Own expenses and own profile; categories | Own expenses and own profile (through drafts); own password                                                 |
| `any`  | Anyone, including anonymous; development only                     | Nothing                                  | Calls `register` only, to create an account. The service is served only with local login outside production |

## Glossary

Business terms in one agreed wording. The German terms match `docs/i18n.md`.

| Term (en)       | Term (de)       | Definition                                                         |
| --------------- | --------------- | ------------------------------------------------------------------ |
| Expense         | Ausgabe         | One payment by a user, with date, amount, currency and description |
| Category        | Kategorie       | A group of expenses such as groceries or transport                 |
| Subcategory     | Unterkategorie  | A finer split of a category, for example fuel under transport      |
| Profile         | Profil          | The user's own details: display name, email, language, currency    |
| Monthly summary | Monatsübersicht | Total, number and largest expense of one calendar month            |

## Open questions

Anything unclear that blocks modeling. Resolved items are recorded as ADRs in `docs/adr/`.

- Roles: which roles will XSUAA define (for example user and administrator) once `xs-security.json` exists?
- Income, budgets and recurring payments: which context do they belong to, and do they share `Categories`?
