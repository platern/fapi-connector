"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTestCasesFromExamples = void 0;
const codeFromDetail = (codeDetail) => {
    /**
     * The API schema uses extensions with formats x-{status code}.{details}
     * (e.g. x-400.MissingID)
     */
    return codeDetail.startsWith("x-") ? codeDetail.slice(2, codeDetail.indexOf(".")) : codeDetail;
};
const getQueryParamsExample = (parameters, codeDetail) => {
    return extractExampleParams(parameters, codeDetail, "query");
};
const getPathParamsExample = (parameters, codeDetail) => {
    return extractExampleParams(parameters, codeDetail, "path");
};
const extractExampleParams = (parameters, codeDetail, parameterType) => {
    return parameters
        ? parameters
            .filter(param => param.in === parameterType)
            .reduce((res, paramObj) => {
            if (!paramObj.examples || Object.keys(paramObj.examples).length === 0)
                return res;
            res[paramObj.name] = paramObj.examples[codeDetail].value;
            return res;
        }, {})
        : undefined;
};
const extractTestCasesFromExamples = (openapi) => {
    const operationObjs = extractOperationObjects(openapi);
    return operationObjs
        .flatMap(opObj => {
        var _a;
        const requests = opObj.obj.requestBody;
        const responses = (_a = opObj.obj.responses) !== null && _a !== void 0 ? _a : [];
        return Object.keys(responses).map(codeDetail => {
            const code = codeFromDetail(codeDetail);
            console.log(`Extracting test case: ${opObj.method.toUpperCase()} ${opObj.path} ${codeDetail}`);
            const res = {
                path: opObj.path,
                method: opObj.method,
                code: Number.parseInt(code),
                exampleQueryParams: getQueryParamsExample(opObj.obj.parameters, codeDetail),
                examplePathParams: getPathParamsExample(opObj.obj.parameters, codeDetail),
                exampleRequest: requests === null || requests === void 0 ? void 0 : requests.content["application/json"].examples[codeDetail].value,
                // currently, every response expects to contain an example with a matching `codeDetail`
                exampleResponse: responses[codeDetail].content["application/json"].examples[codeDetail].value,
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
exports.extractTestCasesFromExamples = extractTestCasesFromExamples;
const extractOperationObjects = (openapi) => {
    const pathObjs = Object.keys(openapi.paths).flatMap((path) => {
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
//# sourceMappingURL=openApiTestUtils.js.map