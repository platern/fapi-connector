import * as fs from "fs";

export interface ClientsConfig {
  clientName: string,
  clientLogoUri: string,
  clientTokenSigningAlgo: string,
  clientTokenAuthMethod: string,
  clientGrantTypes: string[],
  clientScopes: string[],
  clientRedirectUris: string[],
}


export const configVars: ClientsConfig = {
  ...JSON.parse(fs.readFileSync("config/clients.json", "utf-8")),
};