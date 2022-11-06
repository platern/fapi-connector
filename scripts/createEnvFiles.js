#!/usr/bin/env node

const fs = require('fs');

const templateFile = 'template.env';
const envFiles = [
  '.env',
  '.env.test',
];

(async function main() {
  envFiles.forEach(envFile => {
    fs.copyFile(templateFile, envFile, (err) => {
      if (err) throw err;
      console.log(`copied ${templateFile} -> ${envFile}`);
    })
  })
}()).catch(err => {
  console.error(err);
});