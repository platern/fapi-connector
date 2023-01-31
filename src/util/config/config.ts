import {ObukCredentials, obukCredentials} from "./credentials/obuk";
import {dataCredentials, DataCredentials} from "./credentials/data";
import {configVars, ClientsConfig} from "./clientsConfig";

export type Config =
  ObukCredentials
  & DataCredentials
  & ClientsConfig
const config: Config = {...obukCredentials, ...dataCredentials, ...configVars};

export default config;