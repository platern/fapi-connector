import {getEnvVar, getOptionalEnvVar, hasEnvVar} from "../envUtils";

export interface ObukCredentials {
  obSigningKeyString: string | undefined,
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
  obSigningKeyString: getEnvVar("OB_SIGNING_KEY"),
  obSigningKeyId: getEnvVar("OB_SIGNING_KEY_ID"),
  obSigningAlgorithm: getEnvVar("OB_SIGNING_ALGORITHM", "none"),
  obSigningPass: getOptionalEnvVar("OB_SIGNING_PASS"),
  obRootCA: getEnvVar("OB_ROOT_CA"),
  obIssuingCA: getEnvVar("OB_ISSUING_CA"),
  obTransportCert: getEnvVar("OB_TRANSPORT_CERT"),
  obTransportKey: getEnvVar("OB_TRANSPORT_KEY"),
  obTransportPass: getEnvVar("OB_TRANSPORT_PASS"),
  rejectUnauthorized: hasEnvVar("OB_REJECT_UNAUTHORIZED")
    ? getEnvVar("OB_REJECT_UNAUTHORIZED").toLowerCase() !== "false"
    : true,
  softwareStatementAssertion: getEnvVar("OB_SSA_JWT"),
};