# Financial-grade API Connector

## Overview

**Alpha testing. The service works but it's in active development,
so please expect changes!**

A proxy service for calling financial-grade authorization APIs
(i.e.
for [open banking](https://dextersjab.medium.com/an-overview-of-open-banking-be34e0e6800b))
without ever sending your credentials to a gateway!

Optionally, it can be used in conjunction
with [Platern Web](https://platern.com) to
power apps through automatic discovery of compatible
data-sharing API providers (i.e. for open banking).

It relies on a fork of the
excellent [Node OpenID Client](https://github.com/panva/node-openid-client).

Similarly, it uses the MIT licence, allowing open usage whether for:

- making modifications
- commercial purposes
- private usage
- distributing

### Purpose

Use this service to:

- dynamically register with FAPI providers
- generate customer authorization URLs
- exchange access tokens

## Getting started

### Prerequisites

To run the server, you'll need to run Node (v16+). It must be a 64-bit version
because Prisma doesn't currently support the 32-bit version. Their team is 
currently looking at the
[issue](https://github.com/prisma/prisma/issues/11781).

### Setup (local)

1. Run a clean install.

   With yarn:
   ```shell
   yarn install
   yarn run hard-init
   ```

   With npm:
   ```shell
   npm install
   npm run hard-init
   ```

   This will also generate `.env` files for you (which you'll populate in **step 5**).

2. Update `config/clients.json`:

| field                  | possible values                                                                                                  | description                                                                                            | 
|------------------------|------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| clientName             | string                                                                                                           | Often used by API providers to display your application or company name.                               |
| clientTokenAuthMethod  | `private_key_jwt`, `tls_client_auth`                                                                             | The preferred method by which your client will authenticate with API providers.                        |
| clientGrantTypes       | - `authorization_code`<br/>- `client_credentials`<br/>- `refresh_token`<br/>-`urn:openid:params:grant-type:ciba` | The types of authentication and authorization requests that your API client will use.                  |
| clientScopes           | [specification-specific]                                                                                         | The OAuth2 scopes of data/service your application will request access to.                             |
| clientRedirectUris     | [client-specific]                                                                                                | The URL users will return to after completing the authorization journey in the provider's app/website. |
| clientTokenSigningAlgo | `RS256`, `PS256`, `ES256`                                                                                        | The algorithm used to sign JWS payloads (applies only to `private_key_jwt` clients).                   |

3. Client registrations are encrypted using a 256-bit AES key. Use the following
   command to securely generate yours:

   ```shell 
   openssl enc -aes-256-cbc -k secret -P -md sha1
   ```

   This should output something like below:
   ```shell
   salt=EF573074402AB636
   key=446E54B045F5C2A0D83508FE55C825084AB5E43800E1800D7F33ED3FD4EF317E
   iv =58B8678CC7D32EED503E1430D2A6071D
   ```
   Use the generated `key` and `iv` values to set the `AES_KEY` and `AES_IV`
   environment variables in `.env` and `.env.test` at the root of the project.

4. Set up the rest of your environment variables.
   Use the comments in these files for guidance.

### Running the server

#### Run locally

Run the server using either yarn,

```shell
yarn start
```

or npm.

```shell
npm start
```

#### Run in production

```shell
yarn serve
```

With npm:

```shell
npm serve
```

## Postman / Swagger UI

Once the service is up and running, you have two UI-based options.

- import the [Postman collection](/FAPI Connector.postman_collection.json)
  and environment file:
    - `FAPI Connector.postman_collection.json`
    - `FAPI Connector - Ozone Sandbox.postman_environment.json`

- open the [Swagger UI](http://localhost:5001/docs) in your browser. 
  Use the examples labelled with `(w/ OpenID Discovery URL)` to test the API with a single provider. 

## Registration data

You can find all your client registrations stored locally in a SQLite file at
`prisma/clients.db`.

## Troubleshooting

| Error | Resolution |
| --- | --- |
| `TypeError [ERR_INVALID_OPT_VALUE]: The value "jwk" is invalid for option "format"` | Node version must be ≥16 |
| `self signed certificate in certificate chain` | If a sandbox API presents self-signed certificates, <br/>you MAY choose to not verify by setting the environment variables<br/> `OB_REJECT_UNAUTHORIZED=false` and `NODE_TLS_REJECT_UNAUTHORIZED=0` |

## Upcoming enhancements

- More tests.
- More documentation.
- Anything in that arrives in
  [issues](https://github.com/platern/fapi-connector/issues)