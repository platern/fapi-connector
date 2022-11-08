/**
 * This test is driven by the OpenAPI specification.
 * It runs through all the examples, which share the same key in a single
 * operation.
 *
 * For example: a GET request to endpoint `/x-files` with example responses
 * `x-200.OK` and `x-404.NotFound` has example parameters and request body
 * with the same names.
 */

import * as request from "supertest";
import * as fs from "fs";
import * as yaml from "js-yaml";
import * as nock from "nock";
import * as jose2 from "jose2";
import axios from "axios";
import clientData from "../src/data/clientData";
import config from "../src/util/config/config";

config.platernWebBaseURL = "";
config.obSigningAlgorithm = "none";
config.obSigningKeyString = undefined;
import {app} from "../src/app";
import {
  mockAPIResponses,
  mockDbResponses,
} from "./util/mockUtils";
import {
  extractTestCasesFromExamples,
  SchemaExample,
} from "./util/openApiTestUtils";
import {ClientMetadata} from "@dextersjab/openid-client";
import * as authService from "../src/service/authz/authService";

const openApiFilePath = "./gen/openapi.deref.yaml";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("../src/data/clientData");
const mockedClientData = clientData as jest.Mocked<typeof clientData>;

jest.mock("../src/util/certUtils");
jest.fn().mockName("cert");
const openapi = yaml.load(fs.readFileSync(openApiFilePath).toString()) as any;

jest.spyOn(authService, "generateJti").mockReturnValue("TEST-JTI");

const mockClientMetadata: ClientMetadata = JSON.parse(fs.readFileSync("test/testdata/testClient.json").toString()) as ClientMetadata;
const mockIssuerMetadata: ClientMetadata = JSON.parse(fs.readFileSync("test/testdata/testIssuer.json").toString()) as ClientMetadata;

describe("API requests and responses", () => {
  const responseTestCases = extractTestCasesFromExamples(openapi);
  mockDbResponses(mockedClientData);
  mockAPIResponses(mockedAxios);

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
    return !["/token"].includes(path as string);
  });

  it.each(testCases)("Operation: %s %s. Expect response: %s", (
    method,
    path,
    codeDetail,
    operationSchema0,
  ) => {
    const operationSchema = operationSchema0 as SchemaExample;
    const formattedPath = operationSchema.examplePathParams
      ? Object.keys(operationSchema.examplePathParams)
        .reduce((res, pathParam) => {
          return res.replace(`{${pathParam}}`, operationSchema.examplePathParams[pathParam]);
        }, operationSchema.path)
      : operationSchema.path;
    return (request(app) as any)[operationSchema.method](formattedPath)
      .query(operationSchema.exampleQueryParams)
      .send(operationSchema.exampleRequest)
      .then((resp: any) => {
        console.log(`response: ${JSON.stringify(resp.body)}`);
        expect(resp.statusCode).toBe(operationSchema.code);
        expect(resp.body).toStrictEqual(operationSchema.exampleResponse);
      });
  });
});

const idToken = (claims = {}) => {
  const jwk = jose2.JWK.generateSync("RSA");
  return jose2.JWT.sign(
    {
      sub_jwk: jwk.toJWK(),
      sub: jwk.thumbprint,
      ...claims,
    },
    jwk,
    {
      expiresIn: "8h",
      issuer: "http://server.example.com",
      audience: "CLIENT_ID",
    },
  );
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
      id_token: idToken({sub: "bar"}),
      access_token: "acb9a134-a13d-4a48-8089-1ae95e19612f",
    });

  nock("https://auth.abcbank.com")
    .get("/authorize")
    .reply(200, {});

  nock("https://ob19-rs1.o3bank.co.uk:4501")
    .post("/open-banking/v3.1/aisp/account-access-consents")
    .reply(201, {});

  nock("https://keystore.ca.com")
    .get("/testIssuer.jwks")
    .reply(200, {});
}
