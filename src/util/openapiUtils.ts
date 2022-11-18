import * as yaml from "js-yaml";
import * as fs from "fs";

enum ParamType {
  Path = "path",
  Query = "query",
}

const operationObject = (method: string,
                         path: string) => {
  const openapi = yaml.load(fs.readFileSync("gen/openapi.deref.yaml").toString()) as any;
  if (!Object.prototype.hasOwnProperty.call(openapi.paths, path)) return undefined;
  const pathObj = openapi.paths[path];
  if (!Object.prototype.hasOwnProperty.call(pathObj, method)) return undefined;
  return pathObj[method];
};

const findRequestBodySchema = (method: string,
                               path: string): object | undefined => {
  const opObj = operationObject(method, path);
  return opObj.requestBody?.content?.["application/json"]?.schema;
};

const reduceParamsSchema = (method: string,
                            path: string,
                            paramType: ParamType): object | undefined => {
  const opObj = operationObject(method, path);
  return opObj.parameters
    ?.filter((paramObj: any) => paramObj.in === paramType)
    .reduce((o: any, paramObj: any) => {
      o.properties[paramObj.name] = paramObj.schema;
      if (paramObj.required) o.required.push(paramObj.name);
      return o;
    }, {
      type: "object",
      required: [],
      properties: {},
    });
};

export const getRequestBodySchema = (method: string, path: string) => findRequestBodySchema(method, path);
export const getQueryParamsSchema = (method: string, path: string) => reduceParamsSchema(method, path, ParamType.Query);
