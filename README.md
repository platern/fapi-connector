# Financial-grade API Connector

A proxy service calling financial-grade APIs
(i.e. [Open Banking](https://dextersjab.medium.com/an-overview-of-open-banking-be34e0e6800b))
without ever sending your credentials!

Use this service to:

- dynamically register clients
- generate customer authorization URL
- exchange access tokens

**Tests in progress.**

## Getting started

### Prerequisites

To run the server, you'll need:

- Node (v16+)
- Postgres

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

| field                  | possible values                                                                                                   | description                      |
|------------------------|-------------------------------------------------------------------------------------------------------------------|----------------------------------|
| trusts             | `trust:openbanking:obuk`, `trust:openbanking:eidas` | Pass your desired `trust` types. |

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

6. Run a Postgres database instance on your configured `DATABASE_URL` in your
   environment variables.

### Running the server

#### Setup

#### Run

With yarn:

```shell
yarn start
```

With npm:

```shell
npm start
```

### OpenAPI / Swagger

The easiest way to interact with the service is to open the Swagger UI
in your browser, which runs at `http://localhost:5001/docs` using the
default port.

See the specification at the root of the project in `openapi.yaml`,
which contains descriptions and examples for all API operations.

## Upcoming enhancements

See [issues](https://github.com/platern/fapi-connector/issues)
for upcoming changes.