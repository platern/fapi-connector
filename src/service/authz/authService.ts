import {AxiosResponse, AxiosError, AxiosInstance} from "axios";
import {v4 as uuidv4} from "uuid";
import {
  ClientMetadata,
  custom,
  Issuer,
  TokenSet,
} from "@dextersjab/openid-client";
import {OBReadConsent1Data} from "../../httpmodel/oBReadConsent1Data";
import {operationMap, Specification} from "../operationMap";
import axios from "axios";
import {Agent} from "https";
import {createPrivateKey, KeyObject} from "crypto";
import {Config} from "../../util/config/config";
import {badRequestError, externalCallError} from "../error";
import {NextFunction} from "express";
import clientData from "../../data/clientData";

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

export class AuthService {
  config: Config;
  obSigningKey: KeyObject;
  axiosInstance: AxiosInstance;

  constructor(config: Config) {
    this.config = config;
    this.obSigningKey = createPrivateKey({
      key: config.obSigningKeyString,
      passphrase: config.obSigningPass,
    });
    this.axiosInstance = axios.create({
      httpsAgent: new Agent({
        cert: config.obTransportCert,
        key: config.obTransportKey,
        ca: [
          config.obRootCA,
          config.obIssuingCA,
        ],
        passphrase: config.obTransportPass,
        rejectUnauthorized: false,
        // servername: 'o3bank.co.uk',
      }),
    });
  }

  authorisation = async (clientID: string,
                         provider: string,
                         grantUrl: string | undefined,
                         permissions: OBReadConsent1Data | undefined,
                         specificationID: string,
                         state: string,
                         nonce: string,
                         next: NextFunction) => {
    try {

      // let openIDConfigUrl = openIDConfigUrl
      let grantURL = grantUrl;

      if (!Object.prototype.hasOwnProperty.call(operationMap, specificationID)) {
        next(badRequestError(`specification not supported by authz: ${specificationID}`));
        return undefined;
      }
      const clientRecord = await clientData.getClient(clientID);
      if (!clientRecord || !clientRecord.metadata) {
        next(badRequestError(`no client was found with ID ${clientID}`));
        return undefined;
      }
      const clientMetadata = clientRecord.metadata as ClientMetadata;

      // get access token
      const issuer = await Issuer.discover(clientRecord.openIDConfigUrl);
      const client = new issuer.FAPI1Client(clientMetadata, {
        keys: [
          {...this.obSigningKey.export({format: "jwk"})},
        ],
      });
      client[custom.http_options] = () => ({
        cert: this.config.obTransportCert,
        key: this.config.obTransportKey,
        ca: [
          this.config.obRootCA,
          this.config.obIssuingCA,
        ],
        passphrase: this.config.obTransportPass,
        agent: new Agent({
          // rejectUnauthorized: false,
          // servername: 'o3bank.co.uk'
        }),
      });
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
          httpsAgent: new Agent({
            cert: this.config.obTransportCert,
            key: this.config.obTransportKey,
            ca: [
              this.config.obRootCA,
              this.config.obIssuingCA,
            ],
            passphrase: this.config.obTransportPass,
            rejectUnauthorized: false,
            // servername: 'o3bank.co.uk',
          }),
        });
      const consentID = grantResp.data.Data.ConsentId;
      const request = await client.requestObject({
        scope: getScope(specificationID),
        state: state ? state : uuidv4(),
        nonce: nonce ? nonce : uuidv4(),
        max_age: 86400,
        redirect_uri: clientMetadata.redirect_uris?.at(0),
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
        nonce: nonce,
      });
      return {
        url: authzURL,
      };
    } catch (err) {
      if (err instanceof AxiosError) {
        console.error(`Axios error`);
        console.error(JSON.stringify(err.response?.status));
        console.error(JSON.stringify(err.response?.data));
        console.error(err);
        next(externalCallError("error occurred connecting to Platern Web"));
      } else {
        console.error(err);
        next(externalCallError("error occurred trying to create authorization url"));
      }
      return undefined;
    }
  };
}
