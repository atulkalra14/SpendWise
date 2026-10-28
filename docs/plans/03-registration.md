# Plan: Registration (spec `docs/specs/03-registration.md`, branch `feature/registration`)

## Context

Registration is the first step that creates a `Users` row for someone who is not signed in. Today rows come from `ensureUser` (authenticated callers only) and `setPassword` needs an existing user. This step adds a public `RegistrationService` with a `register` action and a Fiori `#/register` page. It creates the account only; sign-in is step 04. No code is written until each step below is confirmed (CLAUDE.md working style).

Findings from the repo:

- `Users : managed` with `ID` (String 255), `displayName`, `email`, `locale`, `defaultCurrency`, `passwordHash`; `UserService.Me` is `@odata.draft.enabled`.
- `srv/lib/password.js` has `hashPassword`; `MIN/MAX_PASSWORD_LENGTH` (12/128) are private constants in `srv/user-service.js`.
- Tests are `node --test` and start a real server with a throw-away SQLite file (`test/user-service.test.js` pattern: `call(user, method, url, body)` helper, `CDS_PLUGIN_UI5_ACTIVE=false`). Reuse that approach.
- Landing controller: `onGetStarted` and `onSignIn` are placeholders that navigate to `overview`. `manifest.json` has one default OData model (`mainService`, `/odata/v4/expenses/`), routes `landing/overview/profile/terms/privacy`, and a `terms` page already exists. i18n only has `i18n.properties`. There is no `srv/_i18n`.

## Decisions taken (confirm in step 0)

1. **ID = normalized email** (trim, lower-case), so it can equal `req.user.id` after the custom login step.
2. **No email verification**, no sign-in in this step.
3. **Draft enablement:** `register` is an unbound action on an entity-less service and cannot be draft-enabled. No new draft entity (an anonymous draft store has no owner). The existing draft-enabled `Me` is untouched. If you prefer a draft-enabled `Registrations` projection, steps 3 and 5 grow (anonymous draft handling and cleanup), so decide before step 1.
4. **Messages:** add `srv/_i18n/messages.properties` (and `messages_de.properties`) so errors are message keys resolved by CAP per `Accept-Language`, not strings in code.
5. **Feature switch:** registration is on locally. A `cds.requires.registration` style flag is NOT introduced; instead the service is disabled for BTP by not deploying the local-login profile. Setting name and mechanism are decided in step 3 if you want a switch (default: none, document in README/CLAUDE.md that IAS replaces it).

## Steps

### 0. Confirm decisions above (no files touched)

### 1. Domain model — `db/schema.cds`

- `Users`: add `termsAcceptedAt : Timestamp` (nullable, so seed rows and `ensureUser` rows stay valid).
- Add `@assert.unique: { email: [email] }`. Check that SQLite treats multiple `NULL` emails as distinct (ensureUser rows have no email); if the compiled constraint would clash, drop the annotation and rely on the key.
- CAP concepts to explain: `@assert.unique`, why the key doubles as the uniqueness guard.
- Verify: `npx cds compile db`, `cds deploy --to sqlite`.

### 2. Shared validation — `srv/lib/validation.js` (new)

- Export `PASSWORD_MIN = 12`, `PASSWORD_MAX = 128`, `normalizeEmail(s)`, and `EMAIL_PATTERN` (same regex as `@assert.format` in `schema.cds`).
- Change `srv/user-service.js` to import the two password constants (no behaviour change; existing tests prove it).

### 3. Service definition — `srv/registration-service.cds` (new)

```
service RegistrationService @(path: '/odata/v4/registration') @(requires: 'any') {
  type Registered { ID : String; displayName : String; }
  action register(displayName : String, email : String, password : String,
                  acceptTerms : Boolean, locale : String) returns Registered;
}
```

- No entities, so nothing can be read; no availability lookup (prevents account enumeration).
- `locale` optional, accepted only if `en`/`de`, otherwise ignored.
- Not draft-enabled (decision 3).

### 4. Handler — `srv/registration-service.js` (new, CommonJS, `cds.ApplicationService`)

Error handling follows the sap-cap-capire guidance: `req.error(code, message, target)` to collect field errors so the framework rejects with all of them at once; `req.reject` for single unrecoverable errors; no `try/catch` that swallows; no internals in messages.

`before('register')` — validation, collecting all errors (nothing thrown until all checked):

- `displayName`: string, trimmed length 1–100 → `req.error(400, 'DISPLAYNAME_INVALID', 'displayName')`
- `email`: string, normalized length ≤ 255 and matches `EMAIL_PATTERN` → `EMAIL_INVALID`, target `email`
- `password`: string, length 12–128 (not trimmed) → `PASSWORD_LENGTH` with args `[12, 128]`, target `password`
- `acceptTerms === true` → `TERMS_REQUIRED`, target `acceptTerms`
- Ignore everything else in `req.data`. Never log `req.data`.

`on('register')`:

1. `ID = normalizeEmail(email)`; `passwordHash = await hashPassword(password)`.
2. `INSERT.into(Users).entries({ ID, email: ID, displayName: trimmed, locale, passwordHash, termsAcceptedAt: new Date().toISOString(), createdBy: ID, modifiedBy: ID })` through `cds.db` in the request transaction (no separate transaction, so a failure leaves no partial row).
3. No pre-`SELECT` for duplicates. The primary key is the guard, which also covers races. Catch only the unique-constraint error (`err.code` for SQLite `SQLITE_CONSTRAINT_PRIMARYKEY` / `SQLITE_CONSTRAINT` and HANA 301, verified in step 4 testing) and `req.reject(409, 'REGISTRATION_FAILED')`. Anything else is rethrown.
4. Return `{ ID, displayName }`.

Error mapping and logging:

- 400 validation, 409 duplicate (generic text, same message whether ID or email clashed), 500 unexpected. A `this.on('error')` is not needed; unexpected errors are logged with `cds.log('registration').error(err.code)` (code only, never message, payload or hash) and rethrown so CAP returns a generic 500 in production.
- `srv/_i18n/messages.properties` and `messages_de.properties` hold the keys above. Fallback: if message resolution does not work for action errors in CAP 10, use plain English strings and note it.
- Verify the `managed` aspect does not overwrite `createdBy` for an anonymous caller (anonymous user id is `anonymous`); if it does, set it in a `before('CREATE')`-equivalent by inserting through `cds.db` with explicit values and confirm in test.

### 5. Fiori UI — `app/spendwise/webapp`

- `view/templates/Register.view.xml` + `controller/templates/Register.controller.js`: freestyle form with `sap.ui.layout.form.SimpleForm` (display name, email, password, confirm password, `CheckBox` for terms with links to the existing `terms` and `privacy` routes), a `MessageStrip` for page-level errors, Submit and Cancel buttons. Controls reuse `sw-` CSS classes and `css/tokens.css` variables; no hex values. Keep the same page structure as Landing (shell layout fragments).
- Client checks mirror the server (required fields, password match, length) for fast feedback, but the server stays the authority. Confirm-password exists only in the UI.
- Submission: the registration model is the `registrationService` OData V4 model (step below). Call the unbound action with `oModel.bindContext("/register(...)")`, `setParameter(...)`, `execute()`. Disable Submit (`busy` JSONModel flag) while running to block double submits.
- Error handling in the controller:
  - 400 with `target`: read the OData error `details` array, set `valueState`/`valueStateText` on the matching input (map `target` → control id); unmatched messages go to the `MessageStrip`.
  - 409: show the generic message in the `MessageStrip`, keep the form values (except password fields cleared).
  - Network or 5xx: generic i18n message in the `MessageStrip`.
  - Success: `MessageToast` and `navTo("landing")`; password fields are cleared in every path.
- `manifest.json`: add data source `registrationService` (`/odata/v4/registration/`, OData 4.01) and a named model `registration` (`operationMode: Server`, `autoExpandSelect: false`); add route `register` (`pattern: "register"`) and target `templates.Register`. The default model stays `mainService`. Because the action is anonymous, the UI5 app works before sign-in.
- `Landing.view.xml`/controller: `onGetStarted` navigates to `register` (was `overview`); `onSignIn` stays a placeholder until step 04. Add i18n keys.
- `i18n/i18n.properties`: labels, hints, validation and error texts, `registerTitle`, `createAccount`, etc.
- UI layer: per CLAUDE.md prefer Fiori tools/annotations. There is no entity to annotate for Fiori elements, so a freestyle view is used, as the Landing page already does. If the `sap-fiori-tools` skill is installed later, revisit.

### 6. Tests — `test/registration-service.test.js` (new)

Same harness as `user-service.test.js` (spawn server, throw-away DB, port random). Call as anonymous (no Authorization header). Cases:

- Valid registration returns 200 and `{ ID: lower-case email }`; `spendwise_Users` row has `scrypt$` hash, `termsAcceptedAt` set, `createdBy = ID`.
- Response and `$metadata` contain no `passwordHash`; `GET /odata/v4/registration/` lists only the `register` action.
- Duplicate with different case → 409 generic message; row count unchanged.
- Two parallel registrations of the same email → exactly one 200 and one 409, no 500.
- Invalid payloads → 400 with one detail per bad field and correct `target` (empty name, bad email, short and over-long password, `acceptTerms` false/missing, non-string types).
- Client-supplied `ID`, `passwordHash`, `createdBy`, `locale: 'xx'` are not stored.
- Same password for two users gives different hashes.
- Plain password never appears in the DB, any response, or captured server stdout.
- `UserService`/`ExpenseService` still 401 anonymously; registered user can call neither yet (documented, not tested as success).
- German `Accept-Language` returns the German message (if message bundles work, step 4).
- `npm test` (existing tests included) passes.

### 7. Verification

- `npx cds compile db srv`, `cds deploy --to sqlite`, `npm test`.
- `cds watch` plus manual: curl anonymous `register` (valid, duplicate, invalid); open `#/register` at desktop, tablet, phone widths; check field errors, double-submit disabled, success routing, i18n texts, and the browser network tab for no password in URLs (POST body only).
- Walk the spec's Definition of done item by item and report results honestly, including anything not verifiable locally (HANA error code, deployment-level rate limiting).

## Risks and notes

- Public endpoint: abuse protection (rate limiting, CAPTCHA) is not in CAP core. It must be provided at deployment level (BTP approuter/API gateway) before any real use. Recorded as a TODO in the final report. The 128-character cap bounds scrypt cost per request but does not stop floods.
- Duplicate detection error codes differ per database; the SQLite path is tested, the HANA code (301) is untested locally.
- Account enumeration timing: a duplicate fails faster than a success (hash is computed before insert, so timing is similar; verify, and if not, hash first as planned).
- A registered user cannot call any service until step 04 introduces custom authentication whose user id equals the normalized email.
- This departs from the CLAUDE.md BTP plan (IAS owns credentials); local/custom login only.

## Out of scope

Login/logout, sessions or tokens, email verification, password reset, rate limiting, user-defined categories, draft-enabled registration entity.
