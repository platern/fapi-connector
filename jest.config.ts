/** @type {import("ts-jest").JestConfigWithTsJest} */
import type {Config} from "jest";

const config: Config = {
  moduleDirectories: [
    "<rootDir>",
    "node_modules",
  ],
  preset: "ts-jest",
  roots: [
    "<rootDir>/test",
  ],
  testEnvironment: "node",
};

export default config;