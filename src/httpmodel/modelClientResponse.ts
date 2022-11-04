import {ClientMetadata} from "@dextersjab/openid-client";

export interface ClientResponse extends BaseResponse {
  openIDConfigUrl: string
  metadata: ClientMetadata
}