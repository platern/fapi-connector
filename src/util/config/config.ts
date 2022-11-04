import {ObukCredentials, obukCredentials} from "./credentials/obuk";
import {
  PlaternWebCredentials,
  platernWebCredentials,
} from "./credentials/platern";
import {dataCredentials, DataCredentials} from "./credentials/data";
import {configVars, ClientsConfig, PlaternWebConfig} from "./clientsConfig";

export type Config =
  ObukCredentials
  & PlaternWebCredentials
  & DataCredentials
  & ClientsConfig
  & PlaternWebConfig
const config: Config = {...obukCredentials, ...platernWebCredentials, ...dataCredentials, ...configVars}

export default config