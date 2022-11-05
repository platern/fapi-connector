import {NextFunction, Request, Response, Router as rout} from "express";
import {ResourceService} from "../service/token/resourceService";
import {Config} from "../util/config/config";
import {Route} from "../app";

const router = rout();

export const resource = (config: Config): rout => {
  const resourceService = new ResourceService(config);
  router.get(Route.Resource, function (req: Request, resp: Response, next: NextFunction) {
    const method = req.query?.method as string;
    const url = req.query?.url as string;
    const accessToken = req.query?.accessToken as string;
    resourceService.exchange(
      method,
      url,
      accessToken).then(res => {
      resp.send(res);
    });
  });

  return router;
};
