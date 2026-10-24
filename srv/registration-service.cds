// Public on purpose: the caller has no account yet. The service has no entities, so nothing can be
// read through it, and it offers no "is this email taken" lookup, to prevent account enumeration.
service RegistrationService @(path: '/odata/v4/registration') @(requires: 'any') {

  type Registered {
    ID          : String;
    displayName : String;
  }

  action register(displayName : String, email : String, password : String,
                  acceptTerms : Boolean, locale : String) returns Registered;
}
