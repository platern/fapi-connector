import {Config} from "../../util/config/config";
import axios from "axios";
import {Agent} from 'https';

export class ResourceService {
  config: Config
  constructor(config: Config) {
    this.config = config;
  }

  exchange = async (method: string,
                    url: string,
                    accessToken: string) => {
    try {
      const res = await axios.request({
        method: method,
        url: url,
        headers: {
          authorization: `Bearer ${accessToken}`
        },
        httpsAgent: new Agent({
          cert: this.config.obTransportCert,
          key: this.config.obTransportKey,
          ca: [
            this.config.obRootCA,
            this.config.obIssuingCA,
          ],
          passphrase: this.config.obTransportPass,
          rejectUnauthorized: this.config.rejectUnauthorized,
        })
      })
      return res?.data
    } catch (e) {
      console.error(e)
    }
  }
}