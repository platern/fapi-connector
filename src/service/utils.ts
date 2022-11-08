import axios, {AxiosError} from "axios";
import {badRequestError, externalCallError} from "./error";
import {NextFunction} from "express";
import {Config} from "../util/config/config";
import {operationMap} from "./operationMap";

export const resolveProviderID = (
  providerID: string | undefined,
  openIDConfigUrl: string | undefined,
) => {
  if (!providerID && !openIDConfigUrl) throw new Error("one of `providerID` and `openIDConfigUrl` must to be valid");
  if (providerID && openIDConfigUrl) throw new Error("only one of `providerID` and `openIDConfigUrl` must be valid");
  return (providerID ? providerID : openIDConfigUrl) as string;
};

export interface ProviderDetails {
  provider: any;
  openIDConfigUrl: string;
}

const fetchProviderDetails = async (providerID: string,
                                    config: Config,
                                    next: NextFunction): Promise<ProviderDetails | undefined> => {
  try {
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
    return {
      provider: provider,
      openIDConfigUrl: openIDConfigUrl,
    };
  } catch (e) {
    next(externalCallError("error occurred connecting to Platern Web"));
    return undefined;
  }
};

/**
 * Get grant URL using Platern Web.
 * @param providerID ID from the Provider API.
 * @param specificationID The `specification` ID.
 * @param config The fapi-connector Config.
 * @param next This happens during a request session, so pass errors on to middleware.
 */
export const grantURLFromPlaternWeb = async (providerID: string,
                                             specificationID: string,
                                             config: Config,
                                             next: NextFunction): Promise<string | undefined> => {
  try {
    const providerDetails = await fetchProviderDetails(
      providerID,
      config,
      next,
    );
    if (!providerDetails) {
      next(externalCallError("error occurred connecting to Platern Web"));
      return undefined;
    }
    const providerBaseURL = providerDetails.provider.apis.find((api: any) => {
      return api.specification === specificationID;
    })?.baseURL;
    return `${providerBaseURL}${operationMap[specificationID].path}`;
  } catch (err) {
    if (err instanceof AxiosError) {
      console.error(`Axios error`);
      console.error(JSON.stringify(err.response?.status));
      console.error(JSON.stringify(err.response?.data));
      console.error(err);
      next(externalCallError("error occurred connecting to Platern Web"));
    }
    return undefined;
  }
};

/**
 * Get registration components using Platern Web.
 * @param providerID ID from the Provider API.
 * @param config The fapi-connector Config.
 * @param next This happens during a request session, so pass errors on to middleware.
 */
export const providerRegFromPlaternWeb = async (providerID: string,
                                                config: Config,
                                                next: NextFunction): Promise<ProviderDetails | undefined> => {
  try {
    const providerDetails = await fetchProviderDetails(
      providerID,
      config,
      next,
    );
    if (!providerDetails) {
      next(externalCallError("error occurred connecting to Platern Web"));
      return undefined;
    }
    return {
      openIDConfigUrl: providerDetails.openIDConfigUrl,
      provider: providerDetails.provider,
    };
  } catch (err) {
    if (err instanceof AxiosError) {
      console.error(`Axios error`);
      console.error(JSON.stringify(err.response?.status));
      console.error(JSON.stringify(err.response?.data));
      console.error(err);
      next(externalCallError("error occurred connecting to Platern Web"));
    }
    return undefined;
  }
};