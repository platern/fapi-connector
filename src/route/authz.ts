import {NextFunction, Request, Response, Router as rout} from "express";
import {Config} from "../util/config/config";
import {AuthService} from "../service/authz/authService";
import {badRequestError, unknownError} from "../service/error";
import {Route} from "../app";
import {getQueryParamsSchema} from "../util/openapiUtils";
import {Validator} from "express-json-validator-middleware";

const router = rout();

const validate = new Validator({}).validate;

export const authz = (config: Config): rout => {
  const authService = new AuthService(config);
  const route = Route.Authz;
  const paramsSchema = getQueryParamsSchema("get", route);
  router.get(route, validate({query: paramsSchema}), (req: Request, resp: Response, next: NextFunction) => {
    const registrationID = req.headers?.registration as string;
    if (!registrationID) {
      next(badRequestError("invalid request: missing `registration` header"));
      return;
    }
    const provider = req.query?.provider as string;
    const grantUrl = req.query?.oauth2GrantUrl as string;
    const grantRequestB64 = req.query?.oauth2GrantRequest as string;
    const specification = req.query?.specification as string;
    const permissionsStr = Buffer.from(grantRequestB64, "base64").toString();
    const permissions = JSON.parse(permissionsStr);
    const state = req.query?.oauth2State as string;
    const nonce = req.query?.openIDNonce as string;
    if (grantUrl && !grantRequestB64) {
      next(badRequestError("`oauth2GrantUrl` requires `oauth2GrantRequest` to work"));
      return;
    }
    authService.authorisation(
      registrationID,
      provider,
      grantUrl,
      permissions,
      specification,
      state,
      nonce,
      next).then(data => {
      if (!data) {
        next(unknownError(`failed to create authorization URL`));
        return;
      }
      resp.send(data);
    });
  });

  return router;
};
