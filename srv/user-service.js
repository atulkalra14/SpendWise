// UserService implementation: only registers handlers. The rules are in srv/handlers/ and srv/lib/.
const cds = require('@sap/cds')
const registerMeHandlers = require('./handlers/me')
const registerSetPasswordHandler = require('./handlers/set-password')

module.exports = class UserService extends cds.ApplicationService {
  init() {
    registerMeHandlers(this)
    registerSetPasswordHandler(this)
    return super.init()
  }
}
