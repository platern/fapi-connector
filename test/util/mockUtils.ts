import * as fs from "fs";
import {ClientMetadata} from "@dextersjab/openid-client"
import axios from "axios";
import clientData, {ClientRecord} from "../../src/data/clientData";

const mockResponsesFilePath = "test/testdata/mockResponses.json"
const mockResponses = JSON.parse(fs.readFileSync(mockResponsesFilePath).toString())
const providerIDs = ['XXX', 'YYY']

export const mockDbResponses = (mockedClientData: jest.Mocked<typeof clientData>) => {
  mockedClientData.createClient = jest.fn((_, __, ___) => {
    return Promise.resolve(true)
  })

  mockedClientData.createClient = jest.fn((_, __, ___) => {
    return Promise.resolve(true)
  })
  const mockClientMetadata: ClientMetadata = JSON.parse(fs.readFileSync('test/testdata/testClient.json').toString()) as ClientMetadata
  const mockClientRecord: ClientRecord = {
    clientID: "",
    openIDConfigUrl: "https://auth.abcbank.com/.well-known/openid-configuration",
    metadata: mockClientMetadata,
  }
  mockedClientData.getClient = jest.fn((clientID) => {
    return Promise.resolve(providerIDs.includes(clientID) ? mockClientRecord : undefined)
  })
  mockedClientData.clientExists = jest.fn((provider) => {
    return Promise.resolve(provider === 'XXX')
  })
  mockedClientData.getClientIDs = jest.fn(() => {
    return Promise.resolve(['XXX', 'YYY'])
  })
}

export const mockAPIResponses = (mockedAxios: jest.Mocked<typeof axios>) => {
  mockedAxios.get = jest.fn((url, c) => {
    const mockResponse = mockResponses[url]
    return Promise.resolve(mockResponse ? mockResponse : {status: 404})
  })
  mockedAxios.create = jest.fn((config) => mockedAxios)
  mockedAxios.post = jest.fn((url, c) => {
    const mockResponse = mockResponses[url]
    return Promise.resolve(mockResponse ? mockResponse : {status: 404})
  })
}