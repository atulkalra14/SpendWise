// Custom server bootstrap: applies the rules that only hold in production.
const cds = require('@sap/cds')
const { disableRegistration } = require('./lib/production')

// on loaded (production only): close the public registration endpoint, see srv/lib/production.js
if (cds.env.profiles.includes('production')) cds.on('loaded', disableRegistration)

module.exports = cds.server
