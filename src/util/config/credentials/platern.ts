import {getOptionalEnvVar} from "../util";

export interface PlaternWebCredentials {
  platernApiKeyHeaderKey: string | undefined,
  platernApiKeyHeaderValue: string | undefined,
  platernWebBaseURL: string | undefined,
}

export const platernWebCredentials: PlaternWebCredentials = {
  platernApiKeyHeaderKey: getOptionalEnvVar("PLATERN_WEB_HEADER_KEY"),
  platernApiKeyHeaderValue: getOptionalEnvVar("PLATERN_WEB_HEADER_VALUE"),
  platernWebBaseURL: getOptionalEnvVar("PLATERN_WEB_BASE_URL"),
};