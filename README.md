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

Similarly, it uses the MIT licence, allowing the most open usage possible,
whether for:

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

To run the server, you'll need:

- Node (v16+)

### Setup (local)

1. Run a clean install.

   With yarn:
   ```shell
   yarn ci
   ```

   With npm:
   ```shell
   npm ci
   ```

   This will generate `.env` files for you (which you'll populate in **step 5**).

2. Update `config/clients.json`:

| field                  | possible values                                                                                                | description                                                                           | 
|------------------------|----------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------|
| clientName             | string                                                                                                         | Often used by API providers to display your application or company name.              |
| clientTokenAuthMethod  | `private_key_jwt`, `tls_client_auth`                                                                           | The method by which your client will authenticate with API providers.                 |
| clientGrantTypes       | - `authorization_code`<br/>- `client_credentials`<br/>- `refresh_token`<br/>-`urn:openid:params:grant-type:ciba` | The types of authentication and authorization requests that your API client will use. |
| clientScopes           | [specification-specific]                                                                                       | The OAuth2 scopes of data/service your application will request access to.            |
| clientTokenSigningAlgo | `RS256`, `PS256`, `ES256`                                                                                      | The algorithm used to sign JWS payloads (applies only to `private_key_jwt` clients).  |

3. [Conditional] If you're using this service with Platern Web, configure the
   options in `config/platernweb.json`:

| field                  | possible values                                                                                                   | description                                      |
|------------------------|-------------------------------------------------------------------------------------------------------------------|--------------------------------------------------|
| trusts             | `trust:openbanking:obuk`, `trust:openbanking:eidas` | The `trust` types that your application can use. |

4. [Recommended] To encrypt your client registrations, securely generate a
   256-bit AES key on the command line:

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

5. Set up the rest of your environment variables.
   Use the comments in these files for guidance.

### Running the server

#### Setup

#### Run locally

With yarn:

```shell
yarn start
```

With npm:

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

### Postman / Swagger UI

Once the service is up and running, you have two UI options.

- import the [Postman collection](/FAPI Connector.postman_collection.json)
  and environment file:
    - `FAPI Connector.postman_collection.json`
    - `FAPI Connector - Ozone Sandbox.postman_environment.json`

- open the [Swagger UI](http://localhost:5001/docs) in your browser.

### Registrations 

You can find all your client registrations stored locally in a SQLite file at
`prisma/clients.db`.

## Upcoming enhancements

- More tests.
- More documentation.
- See [issues](https://github.com/platern/fapi-connector/issues)
  for upcoming changes.