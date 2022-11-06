# Financial-grade API Connector

A proxy service for dealing directly with financial-grade APIs
(i.e. [Open Banking](https://dextersjab.medium.com/an-overview-of-open-banking-be34e0e6800b)) without ever sending your credentials!

Use this service to:

- dynamically register clients
- generate customer authorization URL
- exchange access tokens

**Note: This project was built against sandbox banks. While breaking changes
will be kept to a minimum, please expect some breaking changes as this
tool is still in active development.**

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

   This will generate `.env` files for you to populate in **step 5**.

2. Update `config/clients.json`:

| field                  | possible values                                                                                                | description                                                                           | 
|------------------------|----------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------|
| clientName             | string                                                                                                         | Often used by API providers to display your application or company name.              |
| clientTokenAuthMethod  | `private_key_jwt`, `tls_client_auth`                                                                           | The method by which your client will authenticate with API providers.                 |
| clientGrantTypes       | - `authorization_code`<br/>- `client_credentials`<br/>- `refresh_token`<br/>-`urn:openid:params:grant-type:ciba` | The types of authentication and authorization requests that your API client will use. |
| clientScopes           | [specification-specific]                                                                                       | The OAuth2 scopes of data/service your application will request access to.            |
| clientTokenSigningAlgo | `RS256`, `PS256`, `ES256`                                                                                      | The algorithm used to sign JWS payloads (applies only to `private_key_jwt` clients).  |

3. If you're using this service with Platern Web, configure the options
   in `config/platernweb.json`:

| field                  | possible values                                                                                                   | description                                                                           |
|------------------------|-------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------|
| trusts             | `trust:openbanking:obuk`, `trust:openbanking:eidas` | Pass the trust mechanisms used to filter `providers`.                                |

4. For the `AES_KEY` and `AES_IV` variables, securely generate and save a
   256-bit AES key:

   ```shell 
   openssl enc -aes-256-cbc -k secret -P -md sha1
   ```

   This should output something like below:
   ```shell
   salt=EF573074402AB636
   key=446E54B045F5C2A0D83508FE55C825084AB5E43800E1800D7F33ED3FD4EF317E
   iv =58B8678CC7D32EED503E1430D2A6071D
   ```

5. Set up your environment variables using `.env` and `.env.test` are the root
   of this project. Use the comments in these files for guidance.

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

- Fix tests for `/authorization` operations
- Fix tests for `/token` operations
- Evaluate [express-openapi](https://github.com/kogosoftwarellc/open-api)
