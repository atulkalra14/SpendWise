<!-- Title: conventional commit message, for example "feat: add order approval". -->

## Summary
<!-- What changes and why, in 2-4 sentences. -->

## Spec and plan
- Spec: `docs/specs/<step_number>-<feature_slug>.md`
- Plan: `docs/plans/<step_number>-<feature_slug>.md`
- ADRs: <!-- links, or "none" -->

## Checks (paste real results)
- [ ] `cds compile` clean
- [ ] `npm run lint` clean
- [ ] `npm run format:check` clean
- [ ] `npm run i18n:check` clean
- [ ] `npm test` passes, including auth, tenant and i18n tests
- [ ] `run_ui5_linter` clean (UI changes only)

## Model, schema and authorization
- Schema change is additive: <!-- yes / no; if no, link the migration plan -->
- New or changed `@requires` / `@restrict`: <!-- list, or "none" -->
- Draft behavior: <!-- entities with drafts, or "none" -->

## German texts need native review
<!-- List every German text drafted in this change (key and text), or "none". -->

## UI changes
<!-- Screenshots in English and German for each changed screen, or "none". -->

## Risks and open points
<!-- Anything a reviewer should look at closely. -->

## Definition of done
- [ ] Every item in "Definition of done" in `CLAUDE.md` holds
- [ ] `reviewer` subagent output attached, no Blocking finding (and `security-reviewer` where it applies)
- [ ] No lint, format, theme or UI5-version config changed in this pull request
