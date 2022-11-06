import {getEnvVar, hasEnvVar} from "../util";

export interface ObukCredentials {
  obSigningKeyString: string,
  obSigningKeyId: string,
  obSigningAlgorithm: string,
  obSigningPass: string | undefined,
  obRootCA: string,
  obIssuingCA: string,
  obTransportCert: string,
  obTransportKey: string,
  obTransportPass: string,
  rejectUnauthorized: boolean,
  softwareStatementAssertion: string,
}

export const obukCredentials: ObukCredentials = {
  obSigningKeyString: getEnvVar("OBUK_SIGNING_KEY"),
  obSigningKeyId: getEnvVar("OBUK_SIGNING_KEY_ID"),
  obSigningAlgorithm: getEnvVar("OBUK_SIGNING_ALGORITHM"),
  obSigningPass: getEnvVar("OBUK_SIGNING_PASS"),
  obRootCA: getEnvVar("OBUK_ROOT_CA"),
  obIssuingCA: getEnvVar("OBUK_ISSUING_CA"),
  obTransportCert: getEnvVar("OBUK_TRANSPORT_CERT"),
  obTransportKey: getEnvVar("OBUK_TRANSPORT_KEY"),
  obTransportPass: getEnvVar("OBUK_TRANSPORT_PASS"),
  rejectUnauthorized: hasEnvVar("OBUK_REJECT_UNAUTHORIZED")
    ? getEnvVar("OBUK_REJECT_UNAUTHORIZED").toLowerCase() !== "false"
    : true,
  softwareStatementAssertion: getEnvVar("OBUK_SSA_JWT"),
};