import {PrismaClient} from "@prisma/client";
import {ClientMetadata} from "@dextersjab/openid-client";
import {AES, enc} from "crypto-js";
import {dataCredentials} from "../util/config/credentials/data";

const prisma = new PrismaClient();

export interface ClientRecord {
  registrationID: string;
  openIDConfigUrl: string;
  metadata: ClientMetadata;
}

class ClientData {

  createClient = async (registrationID: string,
                        openIDConfigUrl: string,
                        clientMetadata: ClientMetadata): Promise<boolean> => {
    const encrypted = AES.encrypt(JSON.stringify(clientMetadata),
      dataCredentials.aesKey,
      {iv: enc.Hex.parse(dataCredentials.aesIv)},
    );
    await prisma.clientRegistration.create({
      data: {
        registrationID: registrationID,
        openIDConfigUrl: openIDConfigUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: Buffer.from(encrypted.toString()),
      },
    });
    return true;
  };

  updateClient = async (registrationID: string,
                        openIDConfigUrl: string,
                        clientMetadata: ClientMetadata): Promise<boolean> => {
    const encrypted = AES.encrypt(JSON.stringify(clientMetadata),
      dataCredentials.aesKey,
      {iv: enc.Hex.parse(dataCredentials.aesIv)},
    );
    await prisma.clientRegistration.update({
      where: {
        registrationID: registrationID,
      },
      data: {
        openIDConfigUrl: openIDConfigUrl,
        metadata: Buffer.from(encrypted.toString()),
      },
    });
    return true;

  };

  getRegistrationIDs = async (): Promise<string[]> => {
    const clientRegistrationArr = await prisma.clientRegistration.findMany({
      select: {
        registrationID: true,
      },
    });
    return clientRegistrationArr.map(d => d.registrationID);
  };

  clientExists = async (registrationID: string): Promise<boolean> => {
    const count = await prisma.clientRegistration.count({
      where: {
        registrationID: registrationID,
      },
      select: {
        metadata: true,
      },
    });
    return count.metadata > 0;
  };

  getClient = async (registrationID: string): Promise<ClientRecord | undefined> => {
    const clientRegistration = await prisma.clientRegistration.findFirst({
      where: {
        registrationID: registrationID,
      },
      select: {
        metadata: true,
        openIDConfigUrl: true,
      },
    });
    if (!clientRegistration) return undefined;
    return {
      registrationID: registrationID,
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