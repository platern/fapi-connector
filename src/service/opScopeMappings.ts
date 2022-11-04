export enum Specification {
  ObieAis = "obieAis",
  ObiePis = "obiePis",
  ObieCof = "obieCof",
}

type OperationMapping = {
  [key: string]: Operation
}

type Operation = {
  method: string
  path: string
}

export const opScopeMappings: OperationMapping = {
  [Specification.ObieAis]: {
    method: 'POST',
    path: '/account-access-consents',
  },
}
