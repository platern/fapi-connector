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
  mockExternalApiCalls,
} from "./util/mockUtils";
import {
  extractTestCasesFromExamples,
  SchemaExample,
} from "./util/openApiTestUtils";
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


describe("API requests and responses", () => {
  const testCases = extractTestCasesFromExamples(openapi);
  mockDbResponses(mockedClientData);
  mockAPIResponses(mockedAxios);

  beforeAll(async () => {
    Date.now = jest.fn(() => new Date(Date.UTC(2022, 9, 19)).valueOf());
    mockExternalApiCalls();
  });

  console.log("******************");
  console.log("RUNNING TEST CASES");
  console.log("******************");

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
    const req = (request(app) as any)[operationSchema.method](formattedPath);
    let reqWithHeaders = req
    if(operationSchema.exampleHeaders) {
      reqWithHeaders = Object.keys(operationSchema.exampleHeaders).reduce((newReq: any, key: string) => {
        return newReq.set(key, operationSchema.exampleHeaders[key]);
      }, req);
    }
    return reqWithHeaders
      .query(operationSchema.exampleQueryParams)
      .send(operationSchema.exampleRequest)
      .then((resp: any) => {
        console.log(`response: ${JSON.stringify(resp.body)}`);
        expect(resp.statusCode).toBe(operationSchema.code);
        if(operationSchema.code != 204) { // supertest changes it to
          expect(resp.body).toStrictEqual(operationSchema.exampleResponse);
        }
      });
  });
});

