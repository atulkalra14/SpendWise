# Style guide – code style, linting and theme

Goal: every feature looks and reads the same. Formatting, lint rules and the app theme are decided once, live in one place each, and are not changed inside a feature.

Status markers: **[verified]** = checked against SAP documentation or the MCP servers; **[convention]** = our own choice, not an SAP requirement; **[verify at setup]** = not yet checked, confirm when the project is created.

## 1. One place per setting

| Setting                                           | Single source                                                                | Enforced by                      |
| ------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------- |
| Indentation, line endings, charset, final newline | `.editorconfig` (project root)                                               | Editor, `format:check`           |
| JS/TS/JSON/YAML/Markdown formatting               | `.prettierrc` (project root)                                                 | `npm run format:check`           |
| CAP and Node.js lint rules                        | `eslint.config.mjs` (project root)                                           | `npm run lint`                   |
| Fiori app lint rules                              | `eslint.config.*` in each `app/<app>/`, generated the same way for every app | `npm run lint`, `run_ui5_linter` |
| UI5 version and theme                             | `ui5.yaml` of each app, created from the app baseline in section 5           | Review                           |
| Language of code and comments                     | English                                                                      | Review                           |

Rules:

- No second copy of a setting. If a setting seems to need a different value in one place, that is a change to the standard (section 7), not an override.
- No rule changes, config changes or theme changes in a feature branch. They go in their own `chore:` commit.
- Every new project file type needs a matching rule here or in `.editorconfig` before it is added.

## 2. Formatting [convention]

- Indent with 2 spaces, no tabs. LF line endings. UTF-8. One final newline. No trailing whitespace (Markdown excepted).
- Prettier for `*.js`, `*.ts`, `*.json`, `*.yaml`, `*.md`: single quotes, no semicolons (as in CAP's templates and our existing code, see ADR 0002), print width 100, trailing commas `es5`. Exception: `app/**/*.js` uses double quotes, semicolons and no trailing commas, because the generated Fiori ESLint config enforces them (see ADR 0002).
- `*.cds`, `*.xml` (UI5 views) and `*.properties`: follow `.editorconfig`; the CDS editor's formatter may be used for `.cds` **[verify at setup]**.
- Scripts in `package.json`: `format` (writes) and `format:check` (fails on differences). Only `format:check` runs in checks and CI.
- Editor: `.vscode/settings.json` formats the Prettier file types on save and applies ESLint fixes; `.vscode/extensions.json` recommends the extensions (SAP CDS language support, ESLint, Prettier, EditorConfig). `.cds`, `.xml` and `.properties` files are not auto-formatted on save. [convention]

### Files that are protected from accidental change

The settings that must stay constant are guarded by `.claude/settings.json` (Claude must ask before editing them) and by `.claude/hooks/block-sensitive-delete.sh` (Claude cannot delete, move or overwrite them from the shell): `.editorconfig`, `.prettierrc*`, `eslint.config.*` (root and per app), each app's `ui5.yaml`, and this guide. Changing them follows section 7. Adding a new guarded file means updating both places.

## 3. Linting

Linting has three parts. All three run through `npm run lint`, which must exit cleanly.

**CAP and Node.js code (`db/`, `srv/`, `test/`)**

- ESLint flat config with the CDS plugin (`@sap/eslint-plugin-cds`), set up with `cds add lint` **[verify at setup]** (`cds add --help` lists the facets; confirm before relying on it).
- Rules are the plugin's recommended set plus the project's `no-unused-vars`, `eqeqeq` and `prefer-const` **[convention]**.

**Fiori apps (`app/<app>/`)**

- `npx --yes @sap-ux/create@latest add eslint-config` adds an ESLint flat config with the `@sap-ux/eslint-plugin-fiori-tools` plugin. Use the default config name `recommended` in every app. **[verified]**
- Run it once per app, at creation. Never hand-edit the generated rule set.

**UI5 code**

- After every change to UI5 code, run `run_ui5_linter` from `ui5-mcp` and fix findings. It detects deprecated APIs and accessibility issues. Apply `fix` only after the user confirms. **[verified]**

Suppressions:

- A lint rule may be disabled only on the line concerned, with a reason: `// eslint-disable-next-line <rule> -- <reason>`.
- No file-wide or config-wide disables. A rule that keeps getting suppressed is a change to the standard (section 7).

## 4. Fiori and UI5 code rules [verified]

From the `ui5-mcp` `get_guidelines` tool; call it once before any UI5 task.

- Create UI5 apps inside `app/` of the CAP project, and install `cds-plugin-ui5` in the project root.
- Run the project from its root with `cds watch`. Never run `ui5 serve` or `npm start` inside an app. Never configure `ui5-middleware-simpleproxy` for the local CAP service.
- Declare all dependencies explicitly (`sap.ui.define`, `import`, `core:require`). Never use global UI5 objects.
- Initialize components with `sap/ui/core/ComponentSupport`. No inline `<script>` in HTML.
- Use data binding and built-in data types with format options before custom formatters.
- Forms use `sap.ui.layout.form.Form` with `ColumnLayout`, never `SimpleForm` unless requested. Default 2 columns (M), 3 (L), 4 (XL).
- Every change to a `*.properties` file is made in all locales (`en` and `de`).
- Apps are Fiori elements and annotation-driven by default. Custom UI5 code needs a reason recorded in the spec.

## 5. App baseline and theme

Every app starts from the same baseline, so the look is identical.

**Theme**

- The theme for all apps is **SAP Horizon (`sap_horizon`)**. The Horizon theme is available from SAPUI5 1.93.3 / 1.96.0 onward, and Fiori elements apps render with it without extra changes. **[verified]**
- In local preview the theme is set in the app's `ui5.yaml` through the preview middleware option `flp.theme: sap_horizon`. **[verified]** The line is the same in every app.
- Apps never set a theme in code, in `manifest.json` or through URL parameters. How the theme is chosen in a hosted environment is outside this guide.
- No custom theme and no branding colors unless an ADR approves one theme for all apps. Per-app themes are not allowed.

**Styling**

- No custom CSS, inline styles, `!important` or colors written as hex values in views. Layout and formatting come from Fiori elements and annotations.
- If custom CSS is unavoidable (a custom control, for example), an ADR approves it and it goes in one shared stylesheet, not in each app. Test custom controls under Horizon. **[verified]**
- Every app declares both content densities, `compact` and `cozy`, in `sap.ui5.contentDensities` of `manifest.json`. **[verified]**

**Versions**

- One SAPUI5 version in every app's `ui5.yaml` (`framework.version`), at least 1.96.0. Upgrading it is a change to the standard and happens in all apps together. **[convention]**
- New apps are created with the `fiori-mcp` generator and the same floorplan options, with the version above. The chosen options are recorded in the app's spec.

## 6. Naming [convention]

- Files and folders: kebab-case (`order-service.cds`).
- CDS: entities PascalCase, elements camelCase, service names PascalCase ending in `Service`.
- JavaScript: functions and variables camelCase, classes PascalCase, constants UPPER_SNAKE_CASE.
- i18n keys: stable, descriptive, `UPPER_SNAKE_CASE` for runtime messages and `PascalCase` for labels. See `docs/i18n.md`.

## 7. Changing the standard

Changing anything in this guide, `.editorconfig`, the Prettier config, an ESLint config, the theme or the UI5 version:

1. Write an ADR in `docs/adr/` (copy `0000-template.md`) that says what changes and why.
2. After the ADR is accepted, change the single source and apply the change to every app and file in one `chore:` commit.
3. Update this guide.

## 8. To verify when the project is created

- `cds add lint` and the CDS ESLint plugin: **verified 2026-10-28.** The facet is `lint`; it generates `eslint.config.mjs` from `@sap/cds/eslint.config.mjs` and `@sap/eslint-plugin-cds`, and adds `eslint.validate` to `.vscode/settings.json`. It ignores `--dry` and writes files, and it picks `eslint ^10`, which conflicts with the Fiori plugin (`^9`), see ADR 0002.
- Prettier together with ESLint: **verified 2026-10-28.** The CAP config has no style rules, so there is no clash and `eslint-config-prettier` is not needed. The generated Fiori config does enforce style rules (`quotes`, `semi`, `comma-dangle`), so `.prettierrc` has an override for `app/**/*.js` that matches them. Re-check when the Fiori plugin or the app baseline changes.
- Whether the CDS editor's formatter can run in checks, or stays an editor-only aid.
- `npx @sap-ux/create add eslint-config` inside a CAP project: the generated config location and the `lint` script.
