"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockAPIResponses = exports.mockDbResponses = void 0;
const fs = require("fs");
const mockResponsesFilePath = "test/testdata/mockResponses.json";
const mockResponses = JSON.parse(fs.readFileSync(mockResponsesFilePath).toString());
const providerIDs = ['XXX', 'YYY'];
const mockDbResponses = (mockedClientData) => {
    mockedClientData.createClient = jest.fn((_, __, ___) => {
        return Promise.resolve(true);
    });
    mockedClientData.createClient = jest.fn((_, __, ___) => {
        return Promise.resolve(true);
    });
    const mockClientMetadata = JSON.parse(fs.readFileSync('test/testdata/testClient.json').toString());
    const mockClientRecord = {
        registrationID: "",
        openIDConfigUrl: "https://auth.abcbank.com/.well-known/openid-configuration",
        metadata: mockClientMetadata,
    };
    mockedClientData.getClient = jest.fn((registrationID) => {
        return Promise.resolve(providerIDs.includes(registrationID) ? mockClientRecord : undefined);
    });
    mockedClientData.clientExists = jest.fn((provider) => {
        return Promise.resolve(provider === 'XXX');
    });
    mockedClientData.getRegistrationIDs = jest.fn(() => {
        return Promise.resolve(['XXX', 'YYY']);
    });
};
exports.mockDbResponses = mockDbResponses;
const mockAPIResponses = (mockedAxios) => {
    mockedAxios.get = jest.fn((url, c) => {
        const mockResponse = mockResponses[url];
        return Promise.resolve(mockResponse ? mockResponse : { status: 404 });
    });
    mockedAxios.create = jest.fn((config) => mockedAxios);
    mockedAxios.post = jest.fn((url, c) => {
        const mockResponse = mockResponses[url];
        return Promise.resolve(mockResponse ? mockResponse : { status: 404 });
    });
};
exports.mockAPIResponses = mockAPIResponses;
//# sourceMappingURL=mockUtils.js.map