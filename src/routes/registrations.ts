import {NextFunction, Request, Response, Router as rout} from 'express';
import {RegistrationService} from '../service/registration/registrationService'
import {Config} from "../util/config/config";
import {Validator} from 'express-json-validator-middleware'
import {
  getQueryParamsSchema, getRequestBodySchema,
} from "../util/openapiUtils";
import {Route} from "../app";
import {ClientResponse} from "../httpmodel/modelClientResponse";
import {
  badRequestError,
  notFoundError,
  unknownError,
} from "../service/error";
import {isProviderValid} from "./utils";

const router = rout();

const validate = new Validator({}).validate

export const registrations = (config: Config): rout => {
  const registerService = new RegistrationService(config)
  handleGetAll(registerService, Route.Registrations)
  handleGet(registerService, Route.Registration)
  handlePut(registerService, Route.Registration)
  return router
}

const handleGetAll = (registerService: RegistrationService, path: string) => {
  router.get(path, (req: Request, resp: Response, next: NextFunction) => {
    registerService.getProviderIDs().then(data => {
      if (!data) {
        next(unknownError(`failed to get registrations`))
        return
      }
      const content: RegistrationResponse = {
        self: path,
        kind: 'Collection',
        registrations: data,
      }
      resp.statusCode = 200
      resp.send(content)
    })
  })
}

const handleGet = (registerService: RegistrationService, path: string) => {
  router.get(path, (req: Request, resp: Response, next: NextFunction) => {
    const clientID = req.params?.clientID
    registerService.getClient(clientID).then(data => {
      if (!data) {
        next(notFoundError(`client not found`))
        return
      }
      const content: ClientResponse = {
        self: Route.Registration.replace(':clientID', clientID),
        kind: 'RegisteredClient',
        openIDConfigUrl: data.openIDConfigUrl,
        metadata: data.metadata,
      }
      resp.statusCode = 200
      resp.send(content)
    })
  })
}

const handlePut = (registerService: RegistrationService, path: string) => {
  const openAPIPath = path.replace(':clientID', '{clientID}')
  const bodySchema = getRequestBodySchema('put', openAPIPath)
  const queryParamsSchema = getQueryParamsSchema('put', openAPIPath)
  router.put(path, validate({body: bodySchema, query: queryParamsSchema}), (req: Request, resp: Response, next: NextFunction) => {
    const clientID = req.params?.clientID as string
    const registrationReq = req.body as RegistrationRequest
    if (!isProviderValid(registrationReq.provider, registrationReq.openIDConfigUrl)) {
      next(badRequestError('payload must include either a valid Platern `provider` or OpenID discovery URL (`openIDConfigUrl`)'))
      return
    }
    registerService.updateRegistrations(
      clientID,
      registrationReq.provider,
      registrationReq.openIDConfigUrl,
      registrationReq.externalAud,
      next).then(data => {
      if (!data) {
        next(unknownError(`failed to create or update registrations`))
        return
      }
      const content: ClientResponse = {
        self: Route.Registration.replace(':clientID', clientID),
        kind: 'RegisteredClient',
        openIDConfigUrl: data.openIDConfigUrl,
        metadata: data.metadata,
      }
      resp.statusCode = data.isUpdate ? 200 : 201
      resp.send(content)
    })
  });
}