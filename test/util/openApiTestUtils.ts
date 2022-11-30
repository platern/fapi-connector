type WithExample = {
  example: any
  [key: string]: any
}

export type SchemaExample = {
  /**
   * Contains example values to hydrate test cases
   */
  path: string
  code: number
  method: string
  exampleHeaders: any
  examplePathParams: any
  exampleQueryParams: any
  exampleResponse: any
  exampleRequest: any
}

const codeFromDetail = (codeDetail: string) => {
  /**
   * The API schema uses extensions with formats x-{status code}.{details}
   * (e.g. x-400.MissingID)
   */
  return codeDetail.startsWith("x-") ? codeDetail.slice(2, codeDetail.indexOf(".")) : codeDetail;
};

const getParamExample = (parameters: any[],
                         codeDetail: string,
                         paramType: string): WithExample => {
  return extractExampleParams(parameters, codeDetail, paramType);
};

const extractExampleParams = (parameters: any[],
                              codeDetail: string,
                              parameterType: string): WithExample => {
  return parameters
    ? parameters
      .filter(param => param.in === parameterType)
      .reduce((res: any, paramObj: any) => {
        if (!paramObj.examples || Object.keys(paramObj.examples).length === 0) return res;
        res[paramObj.name] = paramObj.examples[codeDetail].value;
        return res;
      }, {})
    : undefined;
};

export const extractTestCasesFromExamples =
  (openapi: any): Array<Array<string | SchemaExample>> => {
    const operationObjs = extractOperationObjects(openapi);
    return operationObjs
      .flatMap(opObj => {
        const requests = opObj.obj.requestBody;
        const responses = opObj.obj.responses ?? [];
        return Object.keys(responses).map(codeDetail => {
          const code = codeFromDetail(codeDetail);
          console.log(`Extracting test case: ${opObj.method.toUpperCase()} ${opObj.path} ${codeDetail}`);
          const res: SchemaExample = {
            path: opObj.path,
            method: opObj.method,
            code: Number.parseInt(code),
            exampleHeaders: getParamExample(opObj.obj.parameters, codeDetail, "header"),
            exampleQueryParams: getParamExample(opObj.obj.parameters, codeDetail, "query"),
            examplePathParams: getParamExample(opObj.obj.parameters, codeDetail, "path"),
            exampleRequest: requests?.content["application/json"].examples[codeDetail].value,
            exampleResponse: responses[codeDetail].content?.["application/json"].examples[codeDetail].value,
          };
          return [
            opObj.method.toUpperCase(),
            opObj.path,
            codeDetail,
            res,
          ];
        });
      });
  };

const extractOperationObjects = (openapi: any) => {
  const pathObjs = Object.keys(openapi.paths).flatMap((path: string) => {
    return {
      path: path,
      obj: openapi.paths[path],
    };
  });
  return pathObjs.flatMap(pathObj => {
    return Object.keys(pathObj.obj).map(op => {
      const operationObj = pathObj.obj[op];
      return {
        path: pathObj.path,
        method: op,
        obj: operationObj,
      };
    });
  });
};