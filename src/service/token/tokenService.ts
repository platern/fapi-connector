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
  obSigningKey: KeyObject | undefined;

  constructor(config: Config) {
    this.config = config;
    this.obSigningKey = this.config.obSigningKeyString ? createPrivateKey({
      key: this.config.obSigningKeyString,
      passphrase: this.config.obSigningPass,
    }) : undefined;
  }

  exchange = async (registrationID: string,
                    code: string,
                    state: string,
                    nonce: string,
                    next: NextFunction) => {
    try {
      const clientRecord = await clientData.getClient(registrationID);
      if (!clientRecord || !clientRecord.metadata) {
        next(badRequestError(`no client was found with ID ${registrationID}`));
        return undefined;
      }
      const clientMetadata = clientRecord.metadata as ClientMetadata;
      const issuer = await Issuer.discover(clientRecord.openIDConfigUrl);
      const client = new issuer.FAPI1Client(clientMetadata, this.obSigningKey ? {
        keys: [
          {...this.obSigningKey.export({format: "jwk"})},
        ],
      } : undefined);
      client[custom.http_options] = () => ({
        cert: this.config.obTransportCert,
        key: this.config.obTransportKey,
        requestCert: true,
        ca: `${this.config.obIssuingCA}\n${this.config.obRootCA}`,
        passphrase: this.config.obTransportPass,
        agent: new Agent({
          rejectUnauthorized: this.config.rejectUnauthorized,
        }),
      });
      const tokenSet: TokenSet = await client.callback(
        clientMetadata.redirect_uris?.[0], {
          code: code,
          state: state,
          nonce: nonce,
        }, {
          state: state,
          nonce: nonce,
        },
      );
      return {
        oauth2TokenSet: tokenSet,
      };
    } catch (err) {
      console.error(err);
      next(externalCallError("error occurred while trying to fetch token"));
      return undefined;
    }
  };
}