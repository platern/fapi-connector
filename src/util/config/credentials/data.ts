import {getEnvVar} from "../util";

export interface DataCredentials {
  aesKey: string,
  aesIv: string,
}

export const dataCredentials: DataCredentials = {
  aesKey: getEnvVar("AES_KEY"),
  aesIv: getEnvVar("AES_IV"),
};