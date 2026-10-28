# ADR 0003: Custom CSS for the SpendWise app

- **Status:** accepted
- **Date:** 2026-10-28
- **Decided by:** project owner

## Context

`CLAUDE.md` and `docs/style-guide.md` say: no custom CSS, inline styles, `!important` or hex colours, and layout comes from Fiori elements annotations. `docs/style-guide.md` section 5 allows one exception: custom CSS needs an ADR and lives in one shared stylesheet.

`app/spendwise` is not a Fiori elements app. It is a freestyle SAPUI5 app with its own landing page, sidebar shell and card layout, built from a Figma design. It had 4 stylesheets with 1,439 lines, 115 `sw-` classes, 44 hex colours (15 of them outside the token file), one `!important`, and it loaded the Inter font from `fonts.googleapis.com`. That font import sends every visitor's IP address to Google, which is a data-protection problem for the German-speaking users this app targets.

## Options considered

1. **Rebuild the UI with Fiori elements and standard controls**: follows the rules without an exception, but takes weeks, loses the landing page and shell design, and needs a Fiori elements floorplan that fits none of these screens.
2. **Approve custom CSS under strict limits (this ADR)**: keeps the design, uses the exception route that the style guide already defines, and removes the parts that are not needed.
3. **Map every colour to a Horizon theme variable**: keeps the app consistent with the theme, but Horizon has no navy brand colour, so the sidebar and primary actions would change visibly. It cannot be checked without viewing the UI, so it is not part of this decision.

## Decision

Option 2. The app may use custom CSS under these limits:

- **One stylesheet:** `app/spendwise/webapp/css/spendwise.css`, with sections in cascade order: tokens, components, layout, pages. No other stylesheet and no `<style>` or inline `style=` in views.
- **Colours:** hex values are written only in the token section (`:root`). The rest of the file uses the tokens or Horizon variables. A new colour is a new token.
- **Fonts:** no external fonts and no third-party requests. The font is the theme font, `var(--sapFontFamily)`.
- **Theme:** the theme stays `sap_horizon`; the stylesheet does not replace it.
- **One `!important` is accepted for now:** `.sw-tabs.sapMSegB .sapMSegBBtnInner` in the components section, a workaround for a more specific Horizon rule on focus and touch states. It must be removed when it can be checked visually against Horizon.
- **Out of scope:** replacing the brand palette with Horizon variables (option 3). That needs a visual review and its own change.

## Consequences

Easier: the design is kept, the rule has a documented exception, and every part of the stylesheet has one place. The Google Fonts request is gone, so no visitor data goes to a third party.
Harder: the typography changes from Inter to the Horizon font, and the app keeps a brand palette that is separate from the theme. Any new app still follows the no-custom-CSS rule unless it has its own ADR.
Changes: the 4 CSS files become `css/spendwise.css`, `manifest.json` lists the single file, and `CLAUDE.md` and `docs/style-guide.md` point to this ADR.

## Verification

`run_ui5_linter` and the manifest validation pass. The stylesheet has no hex value outside the token section and no external URL. The new font and the merged cascade were not checked in a browser, so the app needs a visual check in English and German before release.
