import cds from '@sap/cds/eslint.config.mjs'
import cdsPlugin from '@sap/eslint-plugin-cds'

// CAP and Node.js code only. Fiori apps keep their own generated config in app/<app>/, and
// .agents and .claude/skills hold third-party skill files that are not project code.
export default [
  { ignores: ['app/**', 'gen/**', 'node_modules/**', '.agents/**', '.claude/skills/**'] },
  ...cds.recommended,
  cdsPlugin.configs.recommended,
  { rules: { 'no-unused-vars': 'error', eqeqeq: 'error', 'prefer-const': 'error' } },
  // Command line scripts report to the terminal on purpose.
  { files: ['scripts/**'], rules: { 'no-console': 'off' } },
]
