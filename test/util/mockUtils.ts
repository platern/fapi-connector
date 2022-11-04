import * as fs from "fs";
// import config from "../../util/config/config";
import {ClientMetadata, TokenSet} from "@dextersjab/openid-client"
import axios from "axios";
import clientData, {ClientRecord} from "../../src/data/clientData";

const mockResponsesFilePath = "test/testdata/mockResponses.json"
const mockResponses = JSON.parse(fs.readFileSync(mockResponsesFilePath).toString())

// const regIDs = ['EXAMPLE_SOFTWARE_ID', 'EXAMPLE_SOFTWARE_ID_2']
const providerIDs = ['XXX', 'YYY']

export const mockDbResponses = (mockedClientData: jest.Mocked<typeof clientData>) => {
  mockedClientData.createClient.mockImplementation((_, __) => {
    return Promise.resolve(true)
  })
  // mockedClientData.getProviderIDs.mockImplementation(() => {
  //   return Promise.resolve(regIDs)
  // })
  const mockClientMetadata: ClientMetadata = JSON.parse(fs.readFileSync('test/testdata/testClient.json').toString()) as ClientMetadata
  const mockClientRecord: ClientRecord = {
    clientID: "",
    openIDConfigUrl: "https://auth.abcbank.com/.well-known/openid-configuration",
    metadata: mockClientMetadata,
  }
  mockedClientData.getClient.mockImplementation((clientID) => {
    return Promise.resolve(providerIDs.includes(clientID) ? mockClientRecord : undefined)
  })
  mockedClientData.clientExists.mockImplementation((provider) => {
    return Promise.resolve(provider === 'XXX')
  })
  mockedClientData.getClientIDs.mockImplementation(() => {
    return Promise.resolve(['XXX', 'YYY'])
  })
}

export const mockAPIResponses = (mockedAxios: jest.Mocked<typeof axios>) => {
  mockedAxios.get.mockImplementation((url, c) => {
    const mockResponse = mockResponses[url]
    return Promise.resolve(mockResponse ? mockResponse : {status: 404})
  })
  mockedAxios.create.mockImplementation((config) => mockedAxios)
  mockedAxios.post.mockImplementation((url, c) => {
    const mockResponse = mockResponses[url]
    return Promise.resolve(mockResponse ? mockResponse : {status: 404})
  })
}

// export const mockBaseClient = {
//   BaseClient: jest.fn().mockImplementation(() => {
//     return {
//       grant: () => mockOIDTokenSet
//     }
//   })
// }

export const mockOIDTokenSet: TokenSet = {
  access_token: "ACCESS_TOKEN",
  expires_in: 200,
  expired: () => false,
  claims: () => ({
    aud: 'test',
    exp: 9999999999,
    iat: 0,
    iss: 'test',
    sub: 'test',
  }),
}