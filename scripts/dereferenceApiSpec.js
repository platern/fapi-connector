#!/usr/bin/env node

"use strict";

const SwaggerParser = require("@apidevtools/swagger-parser");
const fs = require("fs");
const yaml = require("js-yaml");

(async function main() {
  const schema = await SwaggerParser.dereference("openapi.yaml");
  fs.writeFileSync(
    "gen/openapi.deref.yaml",
    yaml.dump(schema)
  );
}()).catch(err => {
  console.error(err);
});