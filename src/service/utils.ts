import axios from "axios";
import {badRequestError} from "./error";
import {NextFunction} from "express";
import {Config} from "../util/config/config";

export const resolveProviderID = (
  providerID: string | undefined,
  openIDConfigUrl: string | undefined,
) => {
  if (!providerID && !openIDConfigUrl) throw new Error("one of `providerID` and `openIDConfigUrl` must to be valid");
  if (providerID && openIDConfigUrl) throw new Error("only one of `providerID` and `openIDConfigUrl` must be valid");
  return (providerID ? providerID : openIDConfigUrl) as string;
};

export interface ProviderDetails {
  externalAud: string;
  openIDConfigUrl: string;
}

/**
 * Get registration components using Platern Web.
 * @param providerID ID from the Provider API.
 * @param config The fapi-connector Config.
 * @param next This happens during a request session, so pass errors on to middleware.
 */
export const providerRegFromPlaternWeb = async (providerID: string,
                                                config: Config,
                                                next: NextFunction): Promise<ProviderDetails | undefined> => {
  const rootResp = await axios.get(`${config.platernWebBaseURL}/`, {
    headers: {
      [config.platernApiKeyHeaderKey]: config.platernApiKeyHeaderValue,
    },
  });
  const root = rootResp.data;
  const providerLink = `${root.providersLink}/${providerID}`;
  const providerResp = await axios.get(providerLink, {
    headers: {
      [config.platernApiKeyHeaderKey]: config.platernApiKeyHeaderValue,
    },
  });
  if (providerResp.status < 200 || providerResp.status > 299) {
    next(badRequestError(`provider doesn't exist: ${providerID}`));
    return undefined;
  }
  const provider = providerResp.data;
  if (!provider.accesses) {
    next(badRequestError(`Provider doesn't support registration: ${providerID}`));
    return undefined;
  }
  const openIDConfigUrl = provider.accesses.find((access: any) => {
    return config.trusts?.some(trust => access.trusts.includes(trust));
  })?.openIDConfigUrl;
  if (!openIDConfigUrl) {
    next(badRequestError(`trust types not supported by provider: [${config.trusts?.join(", ")}]`));
    return undefined;
  }
  const externalAud = provider.extras.externalAud;
  return {
    openIDConfigUrl: openIDConfigUrl,
    externalAud: externalAud,
  };
};