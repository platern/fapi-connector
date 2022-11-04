declare global {
    namespace NodeJS {
      interface ProcessEnv {
        NODE_ENV: 'development' | 'production'
        OBUK_TRANSPORT_CERT: string
        OBUK_TRANSPORT_KEY: string
        OBUK_SIGNING_CERT: string
        OBUK_SIGNING_KEY: string
        OBUK_ROOT_CA: string
        OBUK_ISSUING_CA: string
        OBUK_SSA_JWT: string
        HOST?: string;
        PORT?: string;
        PWD: string;
      }
    }
  }
  
  export {}
  