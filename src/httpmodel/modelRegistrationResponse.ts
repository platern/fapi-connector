import {ClientMetadata} from "@dextersjab/openid-client";

export interface RegistrationResponse extends BaseResponse {
  openIDConfigUrl: string;
  metadata: ClientMetadata;
}