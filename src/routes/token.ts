import {NextFunction, Request, Response, Router as rout} from "express";
import {TokenService} from "../service/token/tokenService"
import {Config} from "../util/config/config";
import {getRequestBodySchema} from "../util/openapiUtils";
import {Validator} from "express-json-validator-middleware";
import {Route} from "../app";
import {unknownError} from "../service/error";

const router = rout();
const validate = new Validator({}).validate

export const tokenRequest = (config: Config): rout => {
  const tokenService = new TokenService(config)
  const bodySchema = getRequestBodySchema('post', Route.Token)
  router.post(Route.Token, validate({body: bodySchema}), function (req: Request, resp: Response, next: NextFunction) {
    const clientID = req.query?.client as string
    const code = req.body?.oauth2Code as string
    const state = req.body?.oauth2State as string
    const nonce = req.body?.openIDNonce as string
    tokenService.exchange(
      clientID,
      code,
      state,
      nonce,
      next).then(data => {
      if (!data) {
        next(unknownError(`failed to get an access token`))
        return
      }
      resp.send(data)
    })
  });

  return router
}
