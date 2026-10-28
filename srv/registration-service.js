// RegistrationService implementation: only registers handlers. The rules are in srv/handlers/ and
// srv/lib/.
const cds = require('@sap/cds')
const registerRegisterHandlers = require('./handlers/register')

module.exports = class RegistrationService extends cds.ApplicationService {
  init() {
    registerRegisterHandlers(this)
    return super.init()
  }
}
