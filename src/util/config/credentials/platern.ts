import {getEnvVar} from "../util";

export interface PlaternWebCredentials {
  platernApiKeyHeaderKey: string,
  platernApiKeyHeaderValue: string,
  platernWebBaseURL: string,
}

export const platernWebCredentials: PlaternWebCredentials = {
  platernApiKeyHeaderKey: getEnvVar("PLATERN_WEB_HEADER_KEY"),
  platernApiKeyHeaderValue: getEnvVar("PLATERN_WEB_HEADER_VALUE"),
  platernWebBaseURL: getEnvVar("PLATERN_WEB_BASE_URL"),
};