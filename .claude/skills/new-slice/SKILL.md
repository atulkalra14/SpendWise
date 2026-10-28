---
description: Build one small feature spec file and feature branch, end to end (model, tests, handler, UI, i18n) with review gates
argument-hint: "Step number and feature name e.g. 01 registration"
---

You are a Techno Functional solution architect spinning and building up a new feature for
this SAP CAP (Node.js, multitenant, XSUAA) project. Always follow the rules in CLAUDE.md.

Feature: $ARGUMENTS

If the feature above is empty or larger than one slice (more than about one entity, one service change and one UI change), stop and ask the user to narrow it. Do not guess.

Follow these steps in order. Do not skip a gate.

## 1. Understand
- Read `CLAUDE.md` (its "Workflow for each feature" list defines these steps), `docs/domain-model.md`, the reference docs it lists (`docs/code-organisation.md`, `docs/conventions.md`, `docs/code-comments.md`, `docs/style-guide.md`, `docs/i18n.md`) and the CDS, handler and test files this feature touches.
- Check `docs/adr/` for decisions that apply.
- If anything is unclear, ask at most three questions, then continue.

## 2. Check the working directory is clean
Run `git status` and check for uncommitted, unstaged, or
untracked files. If any exist, stop immediately and tell
the user to commit or stash changes before proceeding.
DO NOT CONTINUE until the working directory is clean.

## 3. Parse the arguments
From $ARGUMENTS extract:

1. `step_number` — zero-padded to 2 digits: 2 → 02, 11 → 11

2. `feature_title` — human readable title in Title Case
   - Example: "Registration" or "Login and Logout"

3. `feature_slug` — git and file safe slug
   - Lowercase, kebab-case
   - Only a-z, 0-9 and -
   - Maximum 40 characters
   - Example: registration, login-logout

4. `branch_name` — format: `feature/<feature_slug>`
   - Example: `feature/registration`

If you cannot infer these from $ARGUMENTS, ask the user
to clarify before proceeding.

## 4. Check the branch name is not taken
Run `git branch` to list existing branches.
If `branch_name` is already taken, append a number:
`feature/registration-01`, `feature/registration-02` etc.

## 5. Switch to main and pull latest
Run:
```
git checkout main
git pull origin main
```
## 6. Create and switch to the feature branch
Run:
```
git checkout -b <branch_name>
```
## 7. Research the codebase
Read the folders before writing the spec:
- `app` — existing apps and annotations
- `db` — existing domain model
- `srv` — existing services and handlers
- All files in `docs/specs/` — avoid duplicating existing specs
- `docs/code-organisation.md`, plus `search_model` from `cds-mcp` for existing entities and services. Use them to decide the modularization points in the spec yourself (see "Code organisation" in step 8). Do not ask the user these questions.

If a spec in `docs/specs/` already has the same step number or feature slug, warn the user and stop.

## 8. Write the spec
Generate a spec document with this exact structure:
---
# Spec: <feature_title>

## Overview
One paragraph describing what this feature does and why
it exists at this stage of the CAP application roadmap.

## Depends on
Which previous steps this feature requires to be complete.

## Service and API
Every new or changed service, entity, action or function:
- `Service.Entity` or action — description — required role (`@requires` / `@restrict`)

- **Drafts:** for each entity, enabled or not, and why (rules in `docs/conventions.md`)
- **Agent readiness:** for each new action, its business-intent name, whether it is risky (needs a confirm step) and whether it is safe to repeat (rules in `docs/agentic-readiness.md`)

If none: state "No service changes".

## Database changes
Any new tables, columns, or constraints needed.
Always verify against `db/schema/` before writing this.
If none: state "No database changes".

## UI
- **Create:** new Fiori apps or annotation files with their path
- **Modify:** existing apps or annotation files and what changes

If none: state "No UI changes".

## Code organisation
Answer every point yourself from `docs/code-organisation.md` and the existing repo structure. One line each, with the reason. Never turn a point into a question for the user.
- **Domain model:** which `db/schema/<context>.cds` file gets each new or changed entity; new context file or existing one; namespace.
- **Services:** existing service or new one, and the file names `srv/<context>-service.cds` and `.js`, and the handler file in `srv/handlers/`.
- **Business logic:** which `srv/lib/` modules are created or changed; anything that goes in `srv/common/`.
- **Fiori apps and annotations:** which `app/<app>/` folder and `fiori-service.cds`; whether `app/services.cds` changes; shared UI5 code.
- **External services:** whether a remote service is involved and which `srv/external/` file.
- **Reuse and boundaries:** confirm no dependency runs against `app/` → `srv/` → `db/`; state if anything should be extracted (normally: no).
- **Size and naming:** any existing file that would pass the size limits after this change, and the planned split.

## Files to change
Every file that will be modified.

## Files to create
Every new file that will be created.

## New dependencies
Any new npm or cds packages. If none: state "No new dependencies".

## Rules for implementation
Specific constraints Claude must follow. Always include:
- Node.js for backend files; handlers thin, logic in `srv/lib/`
- CQN / `cds.ql` only; no hand-written SQL or string-built queries
- Every new service and entity has `@requires` or `@restrict`
- No hard-coded user-facing text; keys in `_i18n/` in English and German
- Frontend through Fiori elements annotations rather than free-style UI5 code
- Follow `docs/style-guide.md`: no custom CSS or theme settings, no change to lint, format or theme config, new apps from the app baseline
- Verify CAP, Fiori and UI5 APIs with the MCP servers in `.mcp.json` (`cds-mcp`, `fiori-mcp`, `ui5-mcp`) as described in `Tooling` in `CLAUDE.md`; never write them from memory
- Errors, logging, IDs and drafts follow `docs/conventions.md`

## Definition of done
A specific testable checklist. Each item must be
something that can be verified by compile, tests or running the app.
---

## 9. Save the spec
Save to: `docs/specs/<step_number>-<feature_slug>.md`. Create the `docs/specs/` folder if it does not exist.

## 10. Report the spec to the user (GATE 1: wait for spec approval)
Print a short summary in this exact format:
```
Branch:    <branch_name>
Spec file: docs/specs/<step_number>-<feature_slug>.md
Title:     <feature_title>
```

Then tell the user:
"Review the spec at `docs/specs/<step_number>-<feature_slug>.md`. Do not print the full spec in chat unless explicitly asked. I will not write any code or plan until you approve the spec."

Stop here. Continue with the plan only after the user approves the spec. Error handling in the plan follows `docs/conventions.md` and the `cap-developer` skill.

## 11. Plan (GATE 2: wait for approval)
Write a detailed implementation plan for the Spec designed above and wait for the user to approve it before changing any file:
- Code organisation, draft and agent-readiness decisions, copied from the spec (not asked as questions).
- Entities, fields, associations or compositions affected, and whether the change is additive. Flag any destructive schema change (drop, rename, type narrowing) as a migration risk for all tenants.
- Service, actions and handlers affected.
- Roles and `@requires` / `@restrict` rules, including row-level rules.
- UI annotations and which Fiori app is affected.
- New i18n keys (English and German).
- Tests to write: unit, service, auth matrix, tenant isolation, i18n.
- Files you expect to touch.

After the user approves the plan, save it as the new file `docs/plans/<step_number>-<feature_slug>.md`. Create the `docs/plans/` folder if it does not exist.


## 12. Model (GATE 3: wait for review)
- Change the CDS model first. Run the compile check from CLAUDE.md.
- Show the model diff and wait for the user's review before writing handlers.

## 13. Tests first
- Use the `test-writer` subagent to write failing tests: happy path, validation failure, authorization denied for every other role, instance-based rules, tenant isolation, drafts if enabled, and `en` plus `de` responses.
- Run the tests and confirm they fail for the right reason.

## 14. Implement
- Implement the smallest change that makes the tests pass. Keep handlers thin and put logic in `srv/lib/`. Place every file where the "Code organisation" section of the spec says.
- Comment every file you create or change as described in `docs/code-comments.md`: file header, section comments, doc comments in CDS, JSDoc in `srv/lib/` and `srv/common/`, one-line comments on handlers. Update any comment your change makes stale.
- Follow `docs/conventions.md`: annotations before handlers, message keys, `cds.log`, `cuid` and `managed`, drafts only where the spec says. New actions also follow `docs/agentic-readiness.md`.
- Add UI annotations in `app/`, not in `srv/`. Follow `docs/style-guide.md`: no custom CSS, inline styles or theme settings, and never edit a lint, format or theme config. If the feature seems to need that, stop and report it instead.
- Add every new text key in `_i18n/` (or the app's `webapp/i18n/`) in English and German. Mark German texts you drafted as "needs native review".
- Do not touch `gen/`, secrets or `xs-security.json` unless the plan said so. If you must, stop and ask.

## 15. Verify
Run, in this order, and fix failures: compile, lint, `npm run format:check`, `npm run i18n:check`, tests. If the feature changed UI5 code, also run `run_ui5_linter` from `ui5-mcp`. Report the results with real output, not assumptions. If something cannot run in this environment, say so plainly.

## 16. Review (GATE 4)
- Run the `reviewer` subagent on the diff.
- Also run the `security-reviewer` subagent if the change touches authorization, handlers that access the database or remote services directly, tenant logic, `xs-security.json`, error and logging code, or an agent-facing service.
- Fix every blocking finding, re-run step 15, then summarize what remains (should-fix items and nits) for the user.

## 17. Commit
- If the user explicitly approves committing, use a conventional message (`feat:`, `fix:`, `test:`, `docs:`, `chore:`). Otherwise stop after verification and report the suggested commit message.
- Do not commit, push, or open a pull request unless the user explicitly approves the action.
- If the user approves a pull request, fill `.github/pull_request_template.md` with the real results and the German texts that need native review.

## 18. Report
End with at most 8 lines: what changed, files touched, test and check results, German texts needing native review, open risks, and the suggested next slice.

## Rules
- Never ask the user where code, services, annotations or modules go. Decide with `docs/code-organisation.md`; if it is silent, follow the existing repo structure, then capire via `cds-mcp`. Record the decision in the spec.
- Never bypass authorization to make a test pass. Never weaken or delete an existing test.
- Do not invent CDS annotations or APIs. If unsure, check https://cap.cloud.sap/docs and say what you verified.
- If a hook blocks a command, do not look for a way around it. Explain what you needed and ask the user.
