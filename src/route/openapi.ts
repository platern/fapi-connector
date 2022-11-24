import {NextFunction, Request, Response, Router as rout} from "express";
import {Route} from "../app";
import * as yaml from "js-yaml";
import * as fs from "fs";

const router = rout();

export const openapi = (): rout => {
  router.get(Route.OpenApiJson, function (req: Request, resp: Response, next: NextFunction) {
    const spec = yaml.load(fs.readFileSync("gen/openapi.deref.yaml").toString())
    resp.send(spec)
  });
  return router;
};
