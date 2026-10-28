# ADR 0002: Code style tooling (Prettier, ESLint, coverage threshold)

- **Status:** accepted
- **Date:** 2026-10-28
- **Decided by:** project owner

## Context

`docs/style-guide.md` required Prettier with semicolons, ESLint with the CDS plugin and an 80% coverage threshold, but none of it was set up. All existing code in `srv/`, `test/` and `scripts/` is written without semicolons, as CAP's own templates are. `cds add lint` generated `eslint ^10`, while the Fiori app's `@sap-ux/eslint-plugin-fiori-tools` requires `eslint ^9`.

## Options considered

1. **Prettier with semicolons (the guide as written)**: no deviation from the guide, but every existing JS file is rewritten and the code no longer matches CAP's templates.
2. **Prettier without semicolons**: matches the existing code and CAP's templates, so only a few files change. It needs the guide's `[convention]` line updated.
3. **ESLint 10 at the root**: what `cds add lint` generates, but two ESLint majors in one workspace conflict with the Fiori plugin.
4. **ESLint 9 at the root**: one version for the whole workspace. `@sap/eslint-plugin-cds` 4 supports `^9 || ^10`.

## Decision

- Prettier options: single quotes, no semicolons, print width 100, trailing commas `es5` (`.prettierrc`). An override for `app/**/*.js` uses double quotes, semicolons and no trailing commas, because the generated Fiori ESLint config enforces those and must not be hand-edited. `app/**/eslint.config.mjs`, `app/**/ui5.yaml` and `.claude/settings.json` are in `.prettierignore` because they are guarded files.
- ESLint 9 everywhere, with `@sap/eslint-plugin-cds`, plus `no-unused-vars`, `eqeqeq` and `prefer-const` as errors (`eslint.config.mjs`). `no-console` is off only for `scripts/`, which are terminal tools.
- Coverage: `node --test` with `--test-coverage-lines=80` over `srv/**/*.js`, see ADR 0001.
- Two dev dependencies added later so a clean checkout works: `@eslint/js` 9, because `@sap/cds` accepts versions 9 and 10 and npm otherwise picks 10, which needs ESLint 10; and `@sap/cds-dk`, because `cds compile` (CI step, compile hook) needs the CLI and it was only installed globally on one machine.

## Consequences

Easier: one version of each tool, small reformatting diff, CI runs the same scripts as local checks.
Harder: the guide's semicolon rule is replaced, and ESLint stays on 9 until the Fiori plugin supports 10.
Changes: `package.json` (scripts, devDependencies, `engines`), `app/spendwise/package.json` (`lint` script), `.prettierrc`, `.prettierignore`, `eslint.config.mjs`, `.github/workflows/ci.yml`, `docs/style-guide.md`. A one-time `style:` commit applies Prettier to the existing files.

## Verification

`npm run lint` exits 0 for the CAP code and the app. `npm test` passes 27 of 27 with 88.7% line coverage, and a run with `--test-coverage-lines=99` exits 1, so the threshold is enforced. `cds add lint` ignores `--dry` and writes files, so it was not used for the final setup.
