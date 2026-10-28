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
- In production, `srv/server.js` sets `@protocol: 'none'` on `RegistrationService` (`srv/lib/production.js`). It stays public in development.
- Local development: `.cdsrc.json` gives the mocked users alice, bob, carol, dave and erin the role `User`; fred has no role and is the negative test case.
- A test keeps `xs-security.json` in step with the roles found by `cds compile srv --to xsuaa`.

## Consequences

Easier: access is granted by assigning one role collection, and a user without it gets 403.
Harder: every new role must be added to the CDS model and `xs-security.json` together (the test fails otherwise), and registration has no production path until the identity provider is wired up.
Changes: `@sap/xssec` and `@sap/cds-dk` are dependencies (see ADR 0002 for `@eslint/js`), `package.json` and `.cdsrc.json` are updated, and the service annotations use `User`.
Not part of this decision: an approuter, `mta.yaml`, redirect URIs, and the UI login. The sign-in button still opens the home page.

## Verification

`test/auth/roles.test.js` checks every endpoint for anonymous (401), a user without the role (403) and a user with it (success). A server started with `CDS_ENV=production` returns 404 for registration while `ExpenseService` and `UserService` keep running. It has not been run against a real XSUAA instance, so the first deployment needs a check with a real token.
