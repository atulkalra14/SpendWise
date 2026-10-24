const cds = require('@sap/cds')

// Creates the profile row the first time a signed-in user touches a service. It goes through
// cds.db so no service restriction applies, and the key always comes from the authenticated
// user, never from the request payload.
module.exports = async function ensureUser(req) {
  const { Users } = cds.entities('spendwise')
  const id = req.user.id
  const existing = await cds.db.run(SELECT.one.from(Users).columns('ID').where({ ID: id }))
  if (!existing) await cds.db.run(INSERT.into(Users).entries({ ID: id, displayName: id }))
}
