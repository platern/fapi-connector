#!/usr/bin/env node

"use strict";

const SwaggerParser = require("@apidevtools/swagger-parser");
const fs = require("fs");
const yaml = require("js-yaml");

function onFatalError(error) {
  process.exitCode = 2;

  const { version } = require("package.json");
  const message = error.message;

  console.error(`
Oops! Something went wrong! :(

ESLint: ${version}

${message}`);
}

(async function main() {
    const schema = await SwaggerParser.dereference("openapi.yaml");
    fs.writeFileSync(
      "gen/openapi.deref.yaml",
      yaml.dump(schema)
    );
}()).catch(onFatalError);