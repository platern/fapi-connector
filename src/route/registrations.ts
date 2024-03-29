import {RegistrationService} from "../service/registration/registrationService";
import {RegistrationsResponse} from "../httpmodel/modelRegistrationsResponse";
import {RegistrationResponse} from "../httpmodel/modelRegistrationResponse";
import {NextFunction, Request, Response, Router as rout} from "express";
import {Validator} from "express-json-validator-middleware";
import {Config} from "../util/config/config";
import {Route} from "../app";
import {badRequestError, notFoundError, unknownError} from "../service/error";
import {getQueryParamsSchema, getRequestBodySchema} from "../util/openapiUtils";
import {StatusCodes} from "http-status-codes";
import {baseUrl} from "../util/urlUtils";

const router = rout();

const validate = new Validator({}).validate;

export const registrations = (config: Config): rout => {
  const registerService = new RegistrationService(config);
  handleGetAll(registerService, Route.Registrations);
  handleGet(registerService, Route.Registration);
  handlePut(registerService, Route.Registration);
  handleDelete(registerService, Route.Registration);
  return router;
};

const handleGetAll = (registerService: RegistrationService, path: string) => {
  router.get(path, (req: Request, resp: Response, next: NextFunction) => {
    registerService.getRegistrationIDs().then(data => {
      if (!data) {
        next(unknownError(`failed to get registrations`));
        return;
      }
      const content: RegistrationsResponse = {
        self: `${baseUrl}${path}`,
        kind: "Collection",
        registrations: data,
      };
      resp.statusCode = StatusCodes.OK;
      resp.send(content);
    });
  });
};

const handleGet = (registerService: RegistrationService, path: string) => {
  router.get(path, (req: Request, resp: Response, next: NextFunction) => {
    const registrationID = req.params?.registrationID;
    registerService.getClient(registrationID).then(data => {
      if (!data) {
        next(notFoundError(`client not found`));
        return;
      }
      const content: RegistrationResponse = {
        self: Route.Registration.replace(":registrationID", registrationID),
        kind: "RegisteredClient",
        openIDConfigUrl: data.openIDConfigUrl,
        metadata: data.metadata,
      };
      resp.statusCode = StatusCodes.OK;
      resp.send(content);
    });
  });
};

const handlePut = (registerService: RegistrationService, path: string) => {
  const openAPIPath = path.replace(":registrationID", "{registrationID}");
  const bodySchema = getRequestBodySchema("put", openAPIPath);
  const queryParamsSchema = getQueryParamsSchema("put", openAPIPath);
  router.put(path, validate({
    body: bodySchema,
    query: queryParamsSchema,
  }), (req: Request, resp: Response, next: NextFunction) => {
    const registrationID = req.params?.registrationID as string;
    const registrationReq = req.body as RegistrationRequest;
    if (!registrationReq.openIDConfigUrl) {
      next(badRequestError("payload must include a valid OpenID discovery URL (`openIDConfigUrl`)"));
      return;
    }
    registerService.register(
      registrationID,
      registrationReq.openIDConfigUrl,
      registrationReq.externalAud,
      registrationReq.overrides,
      next).then(data => {
      if (!data) {
        next(unknownError(`failed to create or update registrations`));
        return;
      }
      const content: RegistrationResponse = {
        self: Route.Registration.replace(":registrationID", registrationID),
        kind: "RegisteredClient",
        openIDConfigUrl: data.openIDConfigUrl,
        metadata: data.metadata,
      };
      resp.statusCode = data.isUpdate ? StatusCodes.OK : StatusCodes.CREATED;
      resp.send(content);
    });
  });
};

const handleDelete = (registerService: RegistrationService, path: string) => {
  router.delete(path, (req: Request, resp: Response, next: NextFunction) => {
    const registrationID = req.params?.registrationID;
    registerService.deleteRegistration(registrationID, next).then(success => {
      if(success) {
        resp.statusCode = StatusCodes.NO_CONTENT;
        resp.end(undefined);
      }
    });
  });
}