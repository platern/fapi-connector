import {PrismaClient} from "@prisma/client";
import {ClientMetadata} from "@dextersjab/openid-client";
import {AES, enc} from "crypto-js";
import {dataCredentials} from "../util/config/credentials/data";

const prisma = new PrismaClient();

export interface ClientRecord {
  clientID: string;
  openIDConfigUrl: string;
  metadata: ClientMetadata;
}

class ClientData {

  createClient = async (clientID: string,
                        openIDConfigUrl: string,
                        clientMetadata: ClientMetadata): Promise<boolean> => {
    const encrypted = AES.encrypt(JSON.stringify(clientMetadata),
      dataCredentials.aesKey,
      {iv: enc.Hex.parse(dataCredentials.aesIv)},
    );
    await prisma.clientRegistration.create({
      data: {
        clientID: clientID,
        openIDConfigUrl: openIDConfigUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: Buffer.from(encrypted.toString()),
      },
    });
    return true;
  };

  updateClient = async (clientID: string,
                        openIDConfigUrl: string,
                        clientMetadata: ClientMetadata): Promise<boolean> => {
    const encrypted = AES.encrypt(JSON.stringify(clientMetadata),
      dataCredentials.aesKey,
      {iv: enc.Hex.parse(dataCredentials.aesIv)},
    );
    await prisma.clientRegistration.update({
      where: {
        clientID: clientID,
      },
      data: {
        openIDConfigUrl: openIDConfigUrl,
        metadata: Buffer.from(encrypted.toString()),
      },
    });
    return true;

  };

  getClientIDs = async (): Promise<string[]> => {
    const clientRegistrationArr = await prisma.clientRegistration.findMany({
      select: {
        clientID: true,
      },
    });
    return clientRegistrationArr.map(d => d.clientID);
  };

  clientExists = async (clientID: string): Promise<boolean> => {
    const count = await prisma.clientRegistration.count({
      where: {
        clientID: clientID,
      },
      select: {
        metadata: true,
      },
    });
    return count.metadata > 0;
  };

  getClient = async (clientID: string): Promise<ClientRecord | undefined> => {
    const clientRegistration = await prisma.clientRegistration.findFirst({
      where: {
        clientID: clientID,
      },
      select: {
        metadata: true,
        openIDConfigUrl: true,
      },
    });
    if (!clientRegistration) return undefined;
    return {
      clientID: clientID,
      openIDConfigUrl: clientRegistration.openIDConfigUrl,
      metadata: decryptMetadata(clientRegistration) as ClientMetadata,
    };
  };
}

const decryptMetadata =
  (clientRegistration: any): ClientMetadata | undefined => {
    if (!clientRegistration.metadata) return undefined;
    const decrypted = AES.decrypt(
      clientRegistration.metadata.toString(),
      dataCredentials.aesKey,
      {iv: enc.Hex.parse(dataCredentials.aesIv)},
    );
    return JSON.parse(decrypted.toString(enc.Utf8)) as ClientMetadata;
  };

const clientData = new ClientData();

export default clientData;