import {NextFunction, Request, Response, Router as rout} from "express";
import {Route} from "../app";
import {baseUrl} from "../util/urlUtils";

export const router = rout();

/* GET root. */
router.get("/", (req: Request, resp: Response, _: NextFunction): void => {
  const res = {
    self: `${baseUrl}`,
    kind: "Root",
    authorizationLink: `${baseUrl}${Route.Authorization}`,
    registrationsLink: `${baseUrl}${Route.Registrations}`,
    tokenLink: `${baseUrl}${Route.Token}`,
  };
  resp.send(res);
});
