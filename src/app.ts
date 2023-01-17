import {config as dotenvConfig} from "dotenv";

dotenvConfig({
  path: `.env.${(process.env.NODE_ENV as string) === "test" ? "test" : ""}`,
});

import * as swaggerUi from "swagger-ui-express";
import * as createError from "http-errors";
import * as express from "express";
import * as logger from "morgan";
import * as yaml from "js-yaml";
import * as path from "path";
import * as cors from "cors";
import * as fs from "fs";
import {badRequestError, HttpException, unknownError} from "./service/error";
import {ValidationError} from "express-json-validator-middleware";
import {NextFunction, Request, Response} from "express";
import {registrations} from "./route/registrations";
import {router as indexRouter} from "./route";
import {tokenRequest} from "./route/token";
import config from "./util/config/config";
import {authz} from "./route/authz";
import {openapi} from "./route/openapi";

export const app = express();

export enum Route {
  Root = "/",
  Registrations = "/registrations",
  Registration = "/registrations/:registrationID",
  Authorization = "/authorization",
  Token = "/token",
  Resource = "/resource",
  OpenApiJson = "/openapi.json",
}

const openAPIDocument =
  yaml.load(fs.readFileSync("./openapi.yaml").toString()) as any;

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());

// Swagger UI
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openAPIDocument));

// feature endpoints
app.use(
  Route.Root,
  indexRouter,
  registrations(config),
  authz(config),
  tokenRequest(config),

  // OpenAPI spec
  openapi()
);

// catch 404 and forward to error handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(createError(404));
});

// error handler
app.use((err: Error,
         req: Request,
         res: Response,
         next: NextFunction) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  console.error(err);
  if (err instanceof ValidationError) {
    const errObj = err.validationErrors?.body?.[0]
      ?? err.validationErrors?.params?.[0]
      ?? err.validationErrors?.query?.[0];
    const message: string = errObj?.message as string;

    // Handle the error
    res.status(400).send(badRequestError(message).response());
    next();
  } else if (err instanceof HttpException) {
    // Handle the error
    res.status(err.status).send(err.response());
    next();
  } else {
    // Handle the error
    res.status(500)
      .send(unknownError("unknown error occurred; check logs").response());
    next(err);
  }
});

export {};