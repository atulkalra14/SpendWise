# ADR 0001: Use the Node.js test runner instead of Jest

- **Status:** accepted
- **Date:** 2026-10-28
- **Decided by:** project owner

## Context
`CLAUDE.md` and the bootstrap checklist assumed Jest with `cds.test`. The project already has 27 passing tests that run with `node --test` and `cds.test`, on Node 24 and `@sap/cds` 10. The rules need a coverage threshold (80% of lines for `srv/lib/`, `srv/handlers/` and `srv/common/`), and CAP does not add a test runner.

## Options considered
1. **Jest**: matches the original docs and offers richer mocking and a watch mode. It adds a dependency and a config file, and all 27 tests would need migrating.
2. **`node --test`**: built into Node 24, no dependency, and the existing tests already use it. It has fewer mocking helpers and no Jest-style watch UI, but `cds.test` does not need them.

## Decision
Keep `node --test` with `cds.test`. The coverage threshold is enforced with the `--test-coverage-lines` flag in the `test` script.

## Consequences
Easier: no extra dependency, and tests run the same way locally and in CI. Harder: no Jest matchers or module mocking, so tests assert on status, payload and database state, as `docs/conventions.md` already asks.
Changes: `CLAUDE.md`, `docs/development-plan.md` and `.claude/agents/test-writer.md` no longer mention Jest. The `test` script gets the coverage flags in the tooling step.

## Verification
`npm test` passes 27 of 27 tests today. The coverage flag and include globs are checked against Node 24 when the `test` script is changed.
