import {NextFunction, Request, Response, Router as rout} from 'express';
import {Route} from "../app";

export const router = rout();

const host = process.env.HOST
const port = process.env.PORT
const baseUrl = `${host}:${port}`

/* GET root. */
router.get('/', (req: Request, resp: Response, _: NextFunction): void => {
  const res = {
    self: `${baseUrl}`,
    kind: 'Root',
    authzLink: `${baseUrl}/${Route.Authz}`,
    registrationsLink: `${baseUrl}/${Route.Registrations}`,
    tokenLink: `${baseUrl}/${Route.Token}`,
  }
  resp.send(res)
})
