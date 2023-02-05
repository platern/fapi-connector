interface RegistrationRequest {
  openIDConfigUrl: string,
  externalAud: string,
  overrides?: ClientOverrides
}

interface ClientOverrides {
  scopes?: string[],
  grantTypes?: string[],
  authMethod?: string,
  redirectUris?: string[],
  applicationJose: boolean,
}