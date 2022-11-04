# Financial-grade API Connector

Use this proxy to connect to financial-grade APIs (i.e. Open Banking).

By configuring and calling this service, you can:

- dynamically register clients
- generate customer authorization URL
- exchange access tokens

**Note: This project was built against sandbox banks. While breaking changes
will be kept to a minimum, please expect some breaking changes as this
tool is still in active development.** 

## Getting started

### Prerequisites

You will need to have installed:
- Node to run the server (Dockerisation is also in progress)
- Postgres

### Setup

1. Set up configuration files.
   1. Configure your client options using `config/clients.json`
   2. If you're using Platern Web, configure those options in `config/platernweb.json`

2. Set up your environment variables using `template.env` as a referece.
   For the `AES_KEY` and `AES_IV` variables, securely generate and save a 
   256-bit AES key:

   ```shell 
   openssl enc -aes-256-cbc -k secret -P -md sha1
   ```

3. Run a Postgres database instance.
    Alternatively, feel free to migrate Prisma to another supported database type.

### Running the server locally

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

See the specification at  the root of the project in `openapi.yaml`,
which contains descriptions and examples for all API operations.


## Upcoming enhancements

- Fix tests for `/authorization` operations
- Fix tests for `/token` operations
- Evaluate [express-openapi](https://github.com/kogosoftwarellc/open-api)
