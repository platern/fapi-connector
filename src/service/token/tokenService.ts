import {AxiosError} from "axios";
import {
  ClientMetadata,
  custom,
  Issuer,
  TokenSet,
} from "@dextersjab/openid-client";
import {Agent} from "https";
import {createPrivateKey, KeyObject} from "crypto";
import {Config} from "../../util/config/config";
import {badRequestError, externalCallError} from "../error";
import {NextFunction} from "express";
import clientData from "../../data/clientData";

export class TokenService {
  config: Config;
  obSealKey: KeyObject;

  constructor(config: Config) {
    this.config = config;
    this.obSealKey = createPrivateKey({
      key: this.config.obSigningKeyString,
      passphrase: this.config.obSigningPass,
    });
  }

  exchange = async (clientID: string,
                    code: string,
                    state: string,
                    nonce: string,
                    next: NextFunction) => {
    try {
      const clientRecord = await clientData.getClient(clientID);
      if (!clientRecord || !clientRecord.metadata) {
        next(badRequestError(`no client was found with ID ${clientID}`));
        return undefined;
      }
      const clientMetadata = clientRecord.metadata as ClientMetadata;
      const issuer = await Issuer.discover(clientRecord.openIDConfigUrl);
      const jwk = {...this.obSealKey.export({format: "jwk"})};
      const client = new issuer.FAPI1Client(clientMetadata, {
        keys: [
          jwk,
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
          rejectUnauthorized: this.config.rejectUnauthorized,
        }),
      });
      const tokenSet: TokenSet = await client.callback(
        clientMetadata.redirect_uris?.at(0), {
          code: code,
          state: state,
        }, {
          state: state,
          nonce: nonce,
        },
      );
      return {
        oauth2TokenSet: tokenSet,
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
        next(externalCallError("error occured while trying to fetch token"));
      }
      return undefined;
    }
  };
}