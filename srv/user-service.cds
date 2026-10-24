using { spendwise as db } from '../db/schema';

service UserService @(path: '/odata/v4/users') @(requires: 'authenticated-user') {

  // The signed-in user's own profile. passwordHash is never exposed; ID and the managed
  // fields are read-only, so only the profile fields below can be changed by the client.
  @restrict: [{ grant: ['READ', 'UPDATE'], where: 'ID = $user' }]
  @odata.draft.enabled
  entity Me as projection on db.Users excluding { passwordHash };

  annotate Me with {
    ID        @readonly;
    createdAt @readonly;
    createdBy @readonly;
    modifiedAt @readonly;
    modifiedBy @readonly;
  };

  // Sets the caller's own password. Only a salted hash is stored; nothing is returned but success.
  action setPassword(newPassword : String) returns Boolean;
}
