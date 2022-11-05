import {ConfigException} from "../../service/error";

export const getEnvVar = (key: string, defaultValue?: string): string => {
  if (!(key in process.env)) {
    if (!defaultValue) throw new ConfigException(`missing environment variable [${key}]`);
    return defaultValue;
  }
  const res = process.env[key];
  if (!res) throw new ConfigException(`empty value for environment variable [${key}]`);
  return res.toString().replace(/\\n/gm, "\n");
};

export const hasEnvVar = (key: string): boolean => key in process.env;