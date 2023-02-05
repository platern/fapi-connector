import axios, {AxiosInstance} from "axios";
import {
  Issuer,
  Client,
  custom,
  TypeOfGenericClient, BaseClient, ClientMetadata, errors, TokenSet,
} from "@dextersjab/openid-client";
import {Agent} from "https";
import {createPrivateKey, KeyObject} from "crypto";
import {decodeJwt, JWTPayload} from "jose";
import {Config} from "../../util/config/config";
import {v4 as uuidv4} from "uuid";
import clientData, {ClientRecord} from "../../data/clientData";
import {cert} from "../../util/certUtils";
import {NextFunction} from "express";
import * as tls from "tls";
import {pki} from "node-forge";
import OPError = errors.OPError;
import {
  badRequestError, configError,
  dataError, notFoundError,
  openIDProviderError,
  unknownError,
} from "../error";
import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
  PrismaClientRustPanicError,
  PrismaClientUnknownRequestError, PrismaClientValidationError,
} from "@prisma/client/runtime";

interface DcrClient extends TypeOfGenericClient<Client> {
  register: typeof BaseClient.register;
  deleteRegistration: typeof BaseClient.deleteRegistration;
}

const hoursInSeconds = (hours: number) => {
  return hours * 60 * 60;
};

const getSupportedAlgo =
  (supportedAlgos: string[], algorithm: string): string | undefined => {
    const algorithms = [
      "ES256",
      "PS256",
      "RS256",
    ];
    if (supportedAlgos.includes(algorithm)) {
      return algorithm;
    }
    let i = 0;
    while (i < algorithms.length) {
      if (supportedAlgos.includes(algorithms[i])) {
        return algorithms[i];
      }
      ++i;
    }
    return undefined;
  };

const supportedTokenAuthMethods = [
  "private_key_jwt",
  "tls_client_auth",
];

function providerErrMsg(err: errors.OPError): string {
  const resp = err.response?.body;
  if (!resp) return "";
  return resp instanceof Buffer ? resp.toString() : JSON.stringify(resp);
}

export interface RegistrationResult {
  openIDConfigUrl: string,
  metadata: ClientMetadata,
  isUpdate: boolean,
}

function subjectDN(transportCert: string) {
  const cert = pki.certificateFromPem(transportCert);
  const C = cert.subject.getField("C").value;
  const O = cert.subject.getField("O").value;
  const objectIdentifier = cert.subject.attributes.find(a => a.type === "2.5.4.97")?.value;
  const CN = cert.subject.getField("CN").value;
  return `CN=${CN},O=${O},2.5.4.97=${objectIdentifier},C=${C}`;
}

export class RegistrationService {
  config: Config;
  obSigningKey: KeyObject | undefined;
  ssaDecoded: JWTPayload;
  transportCert: tls.Certificate;
  axiosClient: AxiosInstance;
  httpsAgentOpts: any;
  ssa: string;

  constructor(config: Config) {
    this.config = config;
    this.obSigningKey = config.obSigningKeyString ? createPrivateKey({
      key: config.obSigningKeyString,
      passphrase: config.obSigningPass,
    }) : undefined;
    this.ssa = this.config.softwareStatementAssertion;
    this.ssaDecoded = decodeJwt(this.config.softwareStatementAssertion);
    this.transportCert = cert(config.obTransportCert);
    this.httpsAgentOpts = {
      cert: this.config.obTransportCert,
      key: this.config.obTransportKey,
      requestCert: true,
      ca: `${this.config.obIssuingCA}\n${this.config.obRootCA}`,
      passphrase: this.config.obTransportPass,
      rejectUnauthorized: this.config.rejectUnauthorized,
    };
    this.axiosClient = axios.create({
      httpsAgent: new Agent(this.httpsAgentOpts),
    });
  }

  register = async (registrationID: string,
                    openIDConfigUrl: string,
                    externalAud: string,
                    overrides: ClientOverrides | undefined,
                    next: NextFunction): Promise<RegistrationResult | undefined> => {
    try {
      let resolvedAuthMethod = overrides?.authMethod
        ? overrides.authMethod
        : this.config.clientTokenAuthMethod;
      if (resolvedAuthMethod === "private_key_jwt" && !this.obSigningKey) {
        next(configError("set env var OB_SIGNING_KEY to use private_key_jwt"));
        return undefined;
      }
      const issuer: Issuer<Client> = await Issuer.discover(openIDConfigUrl as string);
      issuer.FAPI1Client[custom.http_options] = () => ({
        ...this.httpsAgentOpts,
        headers: {"content-type": "application/jose"},
        timeout: 30_000,
      });
      if (!("scopes_supported" in issuer)) {
        next(openIDProviderError(`supported scopes missing from openID config for ${openIDConfigUrl}`));
        return undefined;
      }
      const issuerScopes = issuer.metadata["scopes_supported"] as string[];
      const resolvedScopes = this.config.clientScopes?.filter(scope => issuerScopes.includes(scope));
      if (!("grant_types_supported" in issuer)) {
        next(openIDProviderError(`supported grant types missing from openID config for ${openIDConfigUrl}`));
        return undefined;
      }
      const issuerGrantTypes = issuer.metadata["grant_types_supported"] as string[];
      const resolvedGrantTypes = this.config.clientGrantTypes.filter(grantType => issuerGrantTypes.includes(grantType));
      const issuerAuthMethods = issuer.metadata.token_endpoint_auth_methods_supported;
      if (!issuerAuthMethods) {
        next(openIDProviderError(`no token_endpoint_auth_methods_supported present in OpenID discovery response`));
        return undefined;
      }
      if (!issuerAuthMethods.includes(resolvedAuthMethod)) {
        const fallbackMethods = supportedTokenAuthMethods.reduce((intersectMethods: string[], meth) => {
          if (issuerAuthMethods.includes(meth)) {
            intersectMethods.push(meth);
          }
          return intersectMethods;
        }, []);
        if (fallbackMethods.length === 0) {
          next(openIDProviderError(`no issuer token auth methods are supported by fapi-connector 
          - issuer methods: [${issuerAuthMethods.join(", ")}]
          - supported methods: [${supportedTokenAuthMethods.join(", ")}]`));
          return undefined;
        }
        resolvedAuthMethod = fallbackMethods[0];
      }
      if (!issuer.metadata?.token_endpoint_auth_signing_alg_values_supported) {
        next(openIDProviderError(`missing \`token_endpoint_auth_signing_alg_values_supported\` for ${openIDConfigUrl}`));
        return undefined;
      }
      const supportedTokenAlgos = issuer.metadata.token_endpoint_auth_signing_alg_values_supported;
      const tokenSigningAlgo = getSupportedAlgo(supportedTokenAlgos, this.config.clientTokenSigningAlgo);
      if (!tokenSigningAlgo) {
        next(openIDProviderError(`neither configured nor default token auth signing algorithms are supported by ${openIDConfigUrl}`));
        return undefined;
      }
      const supportedReqObjAlgos = issuer.metadata.request_object_signing_alg_values_supported;
      const reqObjSigningAlgo = supportedReqObjAlgos ? getSupportedAlgo(supportedReqObjAlgos, this.config.clientTokenSigningAlgo) : [];
      if (!reqObjSigningAlgo) {
        next(openIDProviderError(`neither configured nor default request object signing algorithms are supported by ${openIDConfigUrl}`));
        return undefined;
      }
      const authMethodSpecifics = resolvedAuthMethod === "private_key_jwt"
        ? {
          // Required for Private Key JWT
          "token_endpoint_auth_signing_alg": tokenSigningAlgo,
        } : {
          // Required for TLS Client Auth
          "tls_client_auth_subject_dn": subjectDN(this.config.obTransportCert),
        };
      const redirectUris = overrides?.redirectUris
        ? overrides.redirectUris
        : this.config.clientRedirectUris;
      const metadata: object = {
        "redirect_uris": redirectUris,
        "client_name": this.config.clientName,
        "logo_uri": this.config.clientLogoUri,
        "jti": uuidv4(),
        "iat": Math.round(Date.now() / 1000),
        "aud": externalAud ? externalAud : issuer.metadata.token_endpoint,
        "exp": Math.round(Date.now() / 1000 + hoursInSeconds(1)),
        "iss": this.ssaDecoded["software_id"],
        "application_type": "web",
        "grant_types": resolvedGrantTypes,
        "id_token_signed_response_alg": tokenSigningAlgo,
        "request_object_signing_alg": reqObjSigningAlgo,
        "token_endpoint_auth_method": resolvedAuthMethod,

        // this is an anomaly of the Open Banking UK specification
        "scope": resolvedScopes.join(" "),

        "software_statement": this.ssa,
        ...authMethodSpecifics,
      };
      const jwk = {...(this.obSigningKey as KeyObject).export({format: "jwk"})};
      const opts = {jwks: {keys: [jwk]}};
      const registrationResp = await (issuer.FAPI1Client as DcrClient).register(metadata, opts, {
        signingKey: this.obSigningKey as KeyObject,
        keyId: this.config.obSigningKeyId,
        algorithm: this.config.obSigningAlgorithm,
        applicationJose: overrides ? overrides.applicationJose : false,
      });
      if (!registrationResp.metadata) {
        next(dataError("invalid client metadata returned"));
        return undefined;
      }
      const clientExists = await clientData.clientExists(registrationID);
      if (!clientExists) {
        await clientData.createClient(registrationID, openIDConfigUrl as string, registrationResp.metadata);
      } else {
        await clientData.updateClient(registrationID, openIDConfigUrl as string, registrationResp.metadata);
      }
      return {
        openIDConfigUrl: openIDConfigUrl,
        metadata: registrationResp.metadata,
        isUpdate: clientExists,
      };
    } catch (err) {
      console.error(err);
      if (err instanceof OPError) {
        const errorMessage = `failed to register client: ${err.message}`;
        if (err.response?.statusCode === 400) {
          console.log(`failed registration response: ${providerErrMsg(err)}`);
          next(badRequestError(errorMessage));
        } else {
          next(unknownError(errorMessage));
        }
      } else if ([
        PrismaClientKnownRequestError,
        PrismaClientUnknownRequestError,
        PrismaClientRustPanicError,
        PrismaClientInitializationError,
        PrismaClientValidationError,
      ].some(prismaErr => err instanceof prismaErr)) {
        next(dataError("failed to save client metadata to database"));
      } else {
        next(unknownError("failed to register client"));
      }
      return undefined;
    }
  };

  getRegistrationIDs = async (): Promise<string[]> => {
    return await clientData.getRegistrationIDs();
  };

  getClient = async (registrationID: string): Promise<ClientRecord | undefined> => {
    return await clientData.getClient(registrationID);
  };

  /**
   *
   * @param registrationID
   * @param next
   * @return flags whether deletion succeeded or failed
   */
  deleteRegistration = async (registrationID: string,
                              next: NextFunction): Promise<boolean> => {
    try {
      const clientRecord = await clientData.getClient(registrationID);
      if (!clientRecord) {
        next(notFoundError(`registration not found: ${registrationID}`));
        return false;
      }

      // client credentials boilerplate
      const issuer: Issuer<Client> = await Issuer.discover(<string>clientRecord?.openIDConfigUrl);
      issuer.FAPI1Client[custom.http_options] = () => ({
        ...this.httpsAgentOpts,
        rejectUnauthorized: this.config.rejectUnauthorized,
        headers: {"content-type": "application/jose"},
      });
      const client = new issuer.FAPI1Client(clientRecord.metadata, this.obSigningKey ? {
        keys: [
          {...this.obSigningKey.export({format: "jwk"})},
        ],
      } : undefined);
      client[custom.http_options] = () => (this.httpsAgentOpts);

      // authenticate client
      const tokenSet: TokenSet = await client.grant({
        grant_type: "client_credentials",
        scope: "openid accounts",
      });
      const clientAccessToken = tokenSet.access_token;
      await (issuer.FAPI1Client as DcrClient)
        .deleteRegistration(
          clientRecord?.metadata.client_id,
          {initialAccessToken: clientAccessToken},
          undefined);
      await clientData.deactivateClient(registrationID);
      return true;
    } catch (err) {
      console.error(err);
      if (err instanceof OPError) {
        const errorMessage = `failed to delete registered client`;
        if (err.response?.statusCode === 400) {
          console.log(`failed de-registration response: ${providerErrMsg(err)}`);
          next(badRequestError(errorMessage));
        } else {
          next(unknownError(errorMessage));
        }
      } else {
        next(dataError("failed to deactivate client metadata in database"));
      }
      return false;
    }
  };

}
