import * as fs from "fs";

export interface ClientsConfig {
  clientName: string,
  clientLogoUri: string,
  clientTokenSigningAlgo: string,
  clientTokenAuthMethod: string,
  clientGrantTypes: string[],
  clientScopes: string[],
}

export interface PlaternWebConfig {
  trusts: string[],
}

export const configVars: ClientsConfig & PlaternWebConfig = {
  ...JSON.parse(fs.readFileSync("config/clients.json", "utf-8")) as ClientsConfig,
  ...JSON.parse(fs.readFileSync("config/platernweb.json", "utf-8")) as PlaternWebConfig,
};