# ADR 0004: XSUAA authentication with one role, and no public registration in production

- **Status:** accepted
- **Date:** 2026-10-28
- **Decided by:** project owner

## Context

`CLAUDE.md` names XSUAA as the authentication, but there was no `xs-security.json`. All services used the pseudo-role `authenticated-user`, which creates no XSUAA scope, so `cds compile --to xsuaa` produced an empty descriptor. `RegistrationService` is public (`requires: 'any'`) because it creates a local account with a password; on BTP the identity provider owns sign-up, and a public endpoint would let anyone who can reach the app create user rows. Multitenancy is not part of this decision; it is a deployment feature that is added later.

## Options considered

1. **Keep `authenticated-user`**: no new role, but there is nothing to assign in XSUAA and any valid token would be accepted.
2. **One role, `User`**: every signed-in SpendWise user. Gives XSUAA a scope and a role template to assign through a role collection. Row-level rules (`createdBy = $user`, `ID = $user`) stay as they are.
3. **`User` and `Admin` now**: prepares for administration, but there is no admin feature, so the role would grant nothing.

For registration in production: **(a)** leave it public, **(b)** guard the handler, or **(c)** mark the service `@protocol: 'none'` in production with `cds.on('loaded')`. Option (c) removes the endpoint instead of answering on it.

## Decision

- Option 2. The CDS role is `User`; services use `@requires: 'User'` and `@restrict … to: 'User'`.
- `xs-security.json` has `xsappname: spendwise`, `tenant-mode: dedicated`, scope `$XSAPPNAME.User`, role template `User` and role collection "SpendWise User". Scope names are not changed after release. Multitenancy later changes the tenant mode, not the scope names.
- Both services carry `@(requires: 'User')` on the service declaration, so the metadata document and auto-exposed code lists (such as `Currencies`) are protected too, and an entity added later is protected by default.
- `RegistrationService` is served only with local login outside production (fail closed): `srv/server.js` sets `@protocol: 'none'` on it unless the profile is not `production` and the auth kind is `mocked` or `basic` (`srv/lib/production.js`). CAP adds the `development` profile to any profile that is not `production` (so `hybrid` or a mistyped name count as development), so the decision is based on the auth kind, not on the profile name alone.
- Local development: `.cdsrc.json` gives the mocked users alice, bob, carol, dave and erin the role `User`; fred has no role and is the negative test case.
- A test keeps `xs-security.json` in step with the roles found by `cds compile srv --to xsuaa`.

## Consequences

Easier: access is granted by assigning one role collection, and a user without it gets 403.
Harder: every new role must be added to the CDS model and `xs-security.json` together (the test fails otherwise), and registration has no production path until the identity provider is wired up.
Changes: `@sap/xssec` and `@sap/cds-dk` are dependencies (see ADR 0002 for `@eslint/js`), `package.json` and `.cdsrc.json` are updated, and the service annotations use `User`.
Not part of this decision: an approuter, `mta.yaml`, redirect URIs, and the UI login. The sign-in button still opens the home page.

Follow-ups for the deployment and multitenancy work (from the security review of this change):

- Make `xsappname` unique per space or org in `mta.yaml`, so dev and production in one subaccount do not clash.
- With multitenancy, use `cds add multitenancy` to merge the `shared` tenant mode and the callback scopes, keep the scope name `User`, and update `test/auth/xs-security.test.js`, which pins `dedicated`. Check that `cds.on('loaded')` does not reopen registration for tenant models.
- Add `oauth2-configuration.redirect-uris` with the approuter.
- The `#/register` page and its landing link still exist in the app and fail in production. Hide them when registration is off.
- A draft lock reveals the user ID of the lock holder (CAP behaviour, reachable only with an unguessable UUID). With XSUAA the ID is usually an email address, so include it in the privacy review.

## Verification

`test/auth/roles.test.js` checks the metadata documents, the auto-exposed code list and every endpoint for anonymous (401), a user without the role (403) and a user with it (success). It also checks that a user without the role cannot change, delete or start a draft of anything, and that a second user cannot touch another user's draft or expense. `test/auth/registration-closed.test.js` starts real servers: in the production profile and with a non-local auth kind registration returns 404 while the other services keep running and stay protected, and in development with local login it is served. These used mocked and dummy auth, because there is no XSUAA binding here; it has not been run against a real XSUAA instance, so the first deployment needs a check with a real token.
