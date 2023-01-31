import * as fs from "fs";
import {ClientMetadata} from "@dextersjab/openid-client";
import axios from "axios";
import clientData, {ClientRecord} from "../../src/data/clientData";
import * as nock from "nock";

const mockResponsesFilePath = "test/testdata/mockResponses.json";
const mockResponses = JSON.parse(fs.readFileSync(mockResponsesFilePath).toString());
const registrationIDs = ["XXX", "YYY"];

export const mockDbResponses = (mockedClientData: jest.Mocked<typeof clientData>) => {
  mockedClientData.createClient = jest.fn((_, __, ___) => {
    return Promise.resolve(true);
  });

  mockedClientData.updateClient = jest.fn((_, __, ___) => {
    return Promise.resolve(true);
  });
  const mockClientMetadata: ClientMetadata = JSON.parse(fs.readFileSync("test/testdata/mockClient.json").toString()) as ClientMetadata;
  const mockClientRecord: ClientRecord = {
    registrationID: "",
    openIDConfigUrl: "https://auth.abcbank.com/.well-known/openid-configuration",
    metadata: mockClientMetadata,
  };
  mockedClientData.getClient = jest.fn((registrationID) => {
    return Promise.resolve(registrationIDs.includes(registrationID) ? mockClientRecord : undefined);
  });
  mockedClientData.clientExists = jest.fn((registrationID) => {
    return Promise.resolve(registrationID === "XXX");
  });
  mockedClientData.getRegistrationIDs = jest.fn(() => {
    return Promise.resolve(["XXX", "YYY"]);
  });
};

export const mockAPIResponses = (mockedAxios: jest.Mocked<typeof axios>) => {
  mockedAxios.get = jest.fn((url, c) => {
    const mockResponse = mockResponses[url]['GET'];
    return Promise.resolve(mockResponse ? mockResponse : {status: 404});
  });
  mockedAxios.create = jest.fn((config) => mockedAxios);
  mockedAxios.post = jest.fn((url, c) => {
    const mockResponse = mockResponses[url]['POST'];
    return Promise.resolve(mockResponse ? mockResponse : {status: 404});
  });
};

export const mockExternalApiCalls = () => {
  const mockClientMetadata: ClientMetadata = JSON.parse(fs.readFileSync("test/testdata/mockClient.json").toString()) as ClientMetadata;
  const mockIssuerMetadata: ClientMetadata = JSON.parse(fs.readFileSync("test/testdata/mockIssuer.json").toString()) as ClientMetadata;

  const idTokenHeader = Buffer.from(JSON.stringify({
    "kid": "2hOxb7BSh3OFFzz8ag4Bf8DZkHP8jy8M43jDQWV0mFA",
    "alg": "none",
  })).toString("base64");

  const idTokenPayload = Buffer.from(JSON.stringify({
    "nonce": "96d3dd10-2dc7-4b93-835d-89ddd8665b06",
    "sub": "jane doe",
    "aud": "CLIENT_ID",
    "iss": "http://server.example.com",
    "iat": 1667891066,
    "exp": 1667919866,
  })).toString("base64");

  const idToken = `${idTokenHeader}.${idTokenPayload}.`;

  nock("https://auth.abcbank.com")
    .get("/.well-known/openid-configuration")
    .reply(200, mockIssuerMetadata)
    .persist(true);

  nock("https://auth.abcbank.com")
    .post("/register")
    .reply(201, mockClientMetadata)
    .persist(true);

  nock("https://auth.abcbank.com")
    .delete(`/register/${mockClientMetadata.client_id}`)
    .reply(204)
    .persist(true);

  nock("https://auth.abcbank.com")
    .post("/token")
    .reply(200, {
      id_token: idToken,
      access_token: "acb9a134-a13d-4a48-8089-1ae95e19612f",
    })
    .persist(true);

  nock("https://auth.abcbank.com")
    .get("/authorize")
    .reply(200, {});

  nock("https://api.abcbank.com")
    .post("/open-banking/v3.1/aisp/account-access-consents")
    .reply(201, {});

  nock("https://keystore.ca.com")
    .get("/testIssuer.jwks")
    .reply(200, {});
}
