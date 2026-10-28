// Custom server bootstrap: decides where the public registration endpoint is served.
const cds = require('@sap/cds')
const { registrationAllowed, disableRegistration } = require('./lib/production')

// on loaded: close registration unless local login is used outside production (fail closed),
// see srv/lib/production.js and ADR 0004
if (!registrationAllowed(cds.env)) cds.on('loaded', disableRegistration)

module.exports = cds.server
