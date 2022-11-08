import axios, {AxiosInstance} from "axios";
import {
  Issuer,
  Client,
  custom,
  TypeOfGenericClient, BaseClient, ClientMetadata,
} from "@dextersjab/openid-client";
import {
  dataError,
  openIDProviderError,
} from "../error";
import {Agent} from "https";
import {createPrivateKey, KeyObject} from "crypto";
import {decodeJwt, JWTPayload} from "jose";
import {Config} from "../../util/config/config";
import {v4 as uuidv4} from "uuid";
import clientData, {ClientRecord} from "../../data/clientData";
import {cert} from "../../util/certUtils";
import {NextFunction} from "express";
import {providerRegFromPlaternWeb, resolveProviderID} from "../utils";
import * as tls from "tls";

interface MyClient extends TypeOfGenericClient<Client> {
  register: typeof BaseClient.register;
}

const hoursInMillis = (hours: number) => {
  return hours * 60 * 60 * 1000;
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

export interface RegistrationResult {
  openIDConfigUrl: string,
  metadata: ClientMetadata,
  isUpdate: boolean,
}

export class RegistrationService {
  config: Config;
  obSigningKey: KeyObject | undefined;
  ssaDecoded: JWTPayload;
  transportCert: tls.Certificate;
  axiosClient: AxiosInstance;
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
    this.axiosClient = axios.create({
      httpsAgent: new Agent({
        cert: this.config.obTransportCert,
        key: this.config.obTransportKey,
        ca: [
          this.config.obRootCA,
          this.config.obIssuingCA,
        ],
        passphrase: this.config.obTransportPass,
        rejectUnauthorized: this.config.rejectUnauthorized,
      }),
    });
  }

  register = async (registrationID: string,
                    providerID: string | undefined,
                    openIDConfigUrl0: string | undefined,
                    externalAud0: string | undefined,
                    overrides: ClientOverrides | undefined,
                    next: NextFunction): Promise<RegistrationResult | undefined> => {
    const resolvedProviderID = resolveProviderID(providerID, openIDConfigUrl0);
    let openIDConfigUrl: string;
    let externalAud: string;
    if (providerID) {
      const providerDetails = await providerRegFromPlaternWeb(providerID, this.config, next);
      if (!providerDetails) return undefined;
      openIDConfigUrl = providerDetails.openIDConfigUrl;
      externalAud = providerDetails.provider.extras.externalAud;
    } else {
      openIDConfigUrl = openIDConfigUrl0 as string;
      externalAud = externalAud0 as string;
    }
    const issuer: Issuer<Client> = await Issuer.discover(openIDConfigUrl as string);
    issuer.FAPI1Client[custom.http_options] = () => ({
      cert: this.config.obTransportCert,
      key: this.config.obTransportKey,
      ca: [
        this.config.obRootCA,
        this.config.obIssuingCA,
      ],
      passphrase: this.config.obTransportPass,
      headers: {"content-type": "application/jose"},
    });
    if (!("scopes_supported" in issuer)) {
      next(openIDProviderError(`supported scopes missing from openID config for ${resolvedProviderID}`));
      return undefined;
    }
    const issuerScopes = issuer.metadata["scopes_supported"] as string[];
    const resolvedScopes = this.config.clientScopes?.filter(scope => issuerScopes.includes(scope));
    if (!("grant_types_supported" in issuer)) {
      next(openIDProviderError(`supported grant types missing from openID config for ${resolvedProviderID}`));
      return undefined;
    }
    const issuerGrantTypes = issuer.metadata["grant_types_supported"] as string[];
    const resolvedGrantTypes = this.config.clientGrantTypes.filter(grantType => issuerGrantTypes.includes(grantType));
    const issuerAuthMethods = issuer.metadata.token_endpoint_auth_methods_supported;
    if (!issuerAuthMethods) {
      next(openIDProviderError(`no token_endpoint_auth_methods_supported present in OpenID discovery response`));
      return undefined;
    }
    if (!issuerAuthMethods.includes(this.config.clientTokenAuthMethod)) {
      next(openIDProviderError(`token auth by ${this.config.clientTokenAuthMethod} is not one of the supported methods: [${issuerAuthMethods.join(", ")}]`));
      return undefined;
    }
    if (!issuer.metadata?.token_endpoint_auth_signing_alg_values_supported) {
      next(openIDProviderError(`missing \`token_endpoint_auth_signing_alg_values_supported\` for ${resolvedProviderID}`));
      return undefined;
    }
    const supportedTokenAlgos = issuer.metadata.token_endpoint_auth_signing_alg_values_supported;
    const tokenSigningAlgo = getSupportedAlgo(supportedTokenAlgos, this.config.clientTokenSigningAlgo);
    if (!tokenSigningAlgo) {
      next(openIDProviderError(`neither configured nor default token auth signing algorithms are supported by ${resolvedProviderID}`));
      return undefined;
    }
    const supportedReqObjAlgos = issuer.metadata.request_object_signing_alg_values_supported;
    const reqObjSigningAlgo = supportedReqObjAlgos ? getSupportedAlgo(supportedReqObjAlgos, this.config.clientTokenSigningAlgo) : [];
    if (!reqObjSigningAlgo) {
      next(openIDProviderError(`neither configured nor default request object signing algorithms are supported by ${resolvedProviderID}`));
      return undefined;
    }
    const authMethodDetails = this.config.clientTokenAuthMethod === "private_key_jwt"
      ? {
        // Required for Private Key JWT
        "token_endpoint_auth_method": "private_key_jwt", //'tls_client_auth',
        "token_endpoint_auth_signing_alg": tokenSigningAlgo,
      } : {
        // Required for TLS Client Auth
        "tls_client_auth_subject_dn": this.transportCert.CN,
      };
    const redirectUris = overrides?.redirectUris
      ? overrides.redirectUris
      : this.config.clientRedirectUris
    const metadata: object = {
      "redirect_uris": redirectUris,
      "client_name": this.config.clientName,
      "logo_uri": this.config.clientLogoUri,
      "jti": uuidv4(),
      "iat": Math.round(Date.now() / 1000),
      "aud": externalAud ? externalAud : issuer.metadata.token_endpoint,
      "exp": Math.round(Date.now() / 1000 + hoursInMillis(1)),
      "iss": this.ssaDecoded["software_id"],
      "application_type": "web",
      "grant_types": resolvedGrantTypes,
      "id_token_signed_response_alg": tokenSigningAlgo,
      "request_object_signing_alg": reqObjSigningAlgo,

      // this is an anomaly of the Open Banking UK specification
      "scope": resolvedScopes.join(" "),

      "software_statement": this.ssa,
      ...authMethodDetails,
    };
    try {
      let registrationResp;
      if (this.obSigningKey) {
        const jwk = {...this.obSigningKey.export({format: "jwk"})};
        const jwsOpts = {jwks: {keys: [jwk]}};
        registrationResp = await (issuer.FAPI1Client as MyClient).register(metadata, jwsOpts, {
          signingKey: this.obSigningKey,
          keyId: this.config.obSigningKeyId,
          algorithm: this.config.obSigningAlgorithm,
        });
      } else {
        registrationResp = await (issuer.FAPI1Client as MyClient).register(metadata, undefined, undefined);
      }
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
      next(dataError("failed to save client metadata to database"));
      return undefined;
    }
  };

  getRegistrationIDs = async (): Promise<string[]> => {
    return await clientData.getRegistrationIDs();
  };

  getClient = async (providerID: string): Promise<ClientRecord | undefined> => {
    return await clientData.getClient(providerID);
  };

}
