import axios, {AxiosResponse, AxiosError} from "axios";
import {v4 as uuidv4} from "uuid";
import {
  ClientMetadata,
  custom,
  Issuer,
  TokenSet,
} from "@dextersjab/openid-client";
import {OBReadConsent1Data} from "../../httpmodel/modelOBReadConsent1Data";
import {operationMap, Specification} from "../operationMap";
import {Agent} from "https";
import {createPrivateKey, KeyObject} from "crypto";
import {Config} from "../../util/config/config";
import {badRequestError, externalCallError} from "../error";
import {NextFunction} from "express";
import clientData from "../../data/clientData";
import {grantURLFromPlaternWeb} from "../utils";
import {Route} from "../../app";

function getScope(specification: string) {
  let scope = "openid";
  if (specification === Specification.ObieAis) {
    scope += (scope.length > 0 ? " " : "") + "accounts";
  } else if (specification === Specification.ObiePis) {
    scope += (scope.length > 0 ? " " : "") + "payments";
  } else if (specification === Specification.ObieCof) {
    scope += (scope.length > 0 ? " " : "") + "fundsconfirmations";
  }
  return scope;
}

// only exported for mocking =/
export const generateJti = () => uuidv4();

export class AuthService {
  config: Config;
  obSigningKey: KeyObject | undefined;
  httpsAgentOpts: any;
  httpsAgent: Agent;

  constructor(config: Config) {
    this.config = config;
    this.obSigningKey = config.obSigningKeyString ? createPrivateKey({
      key: config.obSigningKeyString,
      passphrase: config.obSigningPass,
    }) : undefined;
    this.httpsAgentOpts = {
      cert: this.config.obTransportCert,
      key: this.config.obTransportKey,
      requestCert: true,
      ca: `${this.config.obIssuingCA}\n${this.config.obRootCA}`,
      passphrase: this.config.obTransportPass,
      rejectUnauthorized: this.config.rejectUnauthorized,
    };
    this.httpsAgent = new Agent(this.httpsAgentOpts);
  }

  authorisation = async (registrationID: string,
                         provider: string,
                         grantUrlParam: string | undefined,
                         permissions: OBReadConsent1Data | undefined,
                         specificationID: string,
                         state: string,
                         nonce: string,
                         next: NextFunction) => {
    try {
      let grantURL = grantUrlParam;
      if (provider) {
        grantURL = await grantURLFromPlaternWeb(provider, specificationID, this.config, next);
        if (!grantURL) {
          next(badRequestError(`error occurred connecting to Platern Web`));
          return undefined;
        }
      }
      if (!Object.prototype.hasOwnProperty.call(operationMap, specificationID)) {
        next(badRequestError(`specification not supported by ${Route.Authz}: ${specificationID}`));
        return undefined;
      }
      const clientRecord = await clientData.getClient(registrationID);
      if (!clientRecord || !clientRecord.metadata) {
        next(badRequestError(`no client was found with registration ID ${registrationID}`));
        return undefined;
      }
      const clientMetadata = clientRecord.metadata as ClientMetadata;

      const issuer = await Issuer.discover(clientRecord.openIDConfigUrl);
      const client = new issuer.FAPI1Client(clientMetadata, this.obSigningKey ? {
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
      const accessToken = tokenSet.access_token;
      const grantResp: AxiosResponse = await axios.post(
        grantURL as string,
        permissions,
        {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
          httpsAgent: this.httpsAgent,
        });
      const consentID = grantResp.data.Data.ConsentId;

      const resolvedState = state ? state : uuidv4();
      const resolvedNonce = nonce ? nonce : uuidv4();
      const resolvedScope = getScope(specificationID);

      const request = await client.requestObject({
        jti: generateJti(),
        scope: resolvedScope,
        state: resolvedState,
        nonce: resolvedNonce,
        max_age: 86400,
        redirect_uri: clientMetadata.redirect_uris?.[0],
        claims:
          {
            "userinfo":
              {
                "openbanking_intent_id": {
                  "value": consentID,
                  "essential": true,
                },
              },
            "id_token":
              {
                "openbanking_intent_id": {
                  "value": consentID,
                  "essential": true,
                },
                "acr": {
                  "essential": true,
                  "values": ["urn:openbanking:psd2:sca",
                    "urn:openbanking:psd2:ca"],
                },
              },
          },
      });
      const authzURL = client.authorizationUrl({
        request: request,
        nonce: resolvedNonce,
        state: resolvedState,
        scope: resolvedScope,
      });
      return {
        url: authzURL,
      };
    } catch (err) {
      if (err instanceof AxiosError) {
        if (err.response?.status && (err.response?.status < 200 || err.response?.status > 299)) {
          next(externalCallError(`failed to complete grant request`));
          return undefined;
        }
        console.error(`Axios error`);
        console.error(JSON.stringify(err.response?.status));
        console.error(JSON.stringify(err.response?.data));
        console.error(err);
        next(externalCallError("error calling external API"));
      } else {
        console.error(err);
        next(externalCallError("error occurred trying to create authorization url"));
      }
      return undefined;
    }
  };
}
