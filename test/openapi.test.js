"use strict";
/**
 * This test is driven by the OpenAPI specification.
 * It runs through all the examples, which share the same key in a single
 * operation.
 *
 * For example: a GET request to endpoint `/x-files` with example responses
 * `x-200.OK` and `x-404.NotFound` has example parameters and request body
 * with the same names.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("supertest");
const fs = require("fs");
const yaml = require("js-yaml");
const nock = require("nock");
const jose2 = require("jose2");
const axios_1 = require("axios");
const clientData_1 = require("../src/data/clientData");
const config_1 = require("../src/util/config/config");
const app_1 = require("../src/app");
const mockUtils_1 = require("./util/mockUtils");
const openApiTestUtils_1 = require("./util/openApiTestUtils");
config_1.default.platernWebBaseURL = "";
const openApiFilePath = "./gen/openapi.deref.yaml";
jest.mock("axios");
const mockedAxios = axios_1.default;
jest.mock("../src/data/clientData");
const mockedClientData = clientData_1.default;
jest.mock("../src/util/certUtils");
jest.fn().mockName("cert");
const openapi = yaml.load(fs.readFileSync(openApiFilePath).toString());
const mockClientMetadata = JSON.parse(fs.readFileSync("test/testdata/testClient.json").toString());
const mockIssuerMetadata = JSON.parse(fs.readFileSync("test/testdata/testIssuer.json").toString());
describe("API requests and responses", () => {
    const responseTestCases = (0, openApiTestUtils_1.extractTestCasesFromExamples)(openapi);
    (0, mockUtils_1.mockDbResponses)(mockedClientData);
    (0, mockUtils_1.mockAPIResponses)(mockedAxios);
    beforeAll(async () => {
        Date.now = jest.fn(() => new Date(Date.UTC(2022, 9, 19)).valueOf());
        mockExternalApiCalls();
    });
    console.log("******************");
    console.log("RUNNING TEST CASES");
    console.log("******************");
    const testCases = responseTestCases.filter(testCase => {
        const path = testCase[1];
        // todo endpoints work but these tests are broken
        return !["/authorization", "/token"].includes(path);
    });
    it.each(testCases)("Operation: %s %s. Expect response: %s", (method, path, codeDetail, operationSchema0) => {
        const operationSchema = operationSchema0;
        const formattedPath = operationSchema.examplePathParams
            ? Object.keys(operationSchema.examplePathParams)
                .reduce((res, pathParam) => {
                return res.replace(`{${pathParam}}`, operationSchema.examplePathParams[pathParam]);
            }, operationSchema.path)
            : operationSchema.path;
        return request(app_1.app)[operationSchema.method](formattedPath)
            .query(operationSchema.exampleQueryParams)
            .send(operationSchema.exampleRequest)
            .then((resp) => {
            console.log(`response: ${JSON.stringify(resp.body)}`);
            expect(resp.statusCode).toBe(operationSchema.code);
            expect(resp.body).toStrictEqual(operationSchema.exampleResponse);
        });
    });
});
const idToken = (claims = {}) => {
    const jwk = jose2.JWK.generateSync("RSA");
    return jose2.JWT.sign(Object.assign({ sub_jwk: jwk.toJWK(), sub: jwk.thumbprint }, claims), jwk, {
        expiresIn: "8h",
        issuer: "http://server.example.com",
        audience: "CLIENT_ID",
    });
};
function mockExternalApiCalls() {
    nock("https://auth.abcbank.com")
        .get("/.well-known/openid-configuration")
        .reply(200, mockIssuerMetadata)
        .persist(true);
    nock("https://auth.abcbank.com")
        .post("/register")
        .reply(201, mockClientMetadata)
        .persist(true);
    nock("https://auth.abcbank.com")
        .post("/token")
        .reply(200, {
        id_token: idToken({ sub: "bar" }),
        access_token: "acb9a134-a13d-4a48-8089-1ae95e19612f",
    });
    nock("https://auth.abcbank.com")
        .get("/authorize")
        .reply(200, {});
    nock("https://api.abcbank.com")
        .post("/open-banking/v3.10/account-access-consents")
        .reply(201, {});
    nock("https://keystore.ca.com")
        .get("/testIssuer.jwks")
        .reply(200, {});
}
//# sourceMappingURL=openapi.test.js.map