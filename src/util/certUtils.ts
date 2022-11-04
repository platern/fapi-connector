import * as tls from "tls";
import * as net from "net";

export const cert = (pem: string): tls.Certificate => {
  const secureContext = tls.createSecureContext({
    cert: pem,
  })
  const socket = new tls.TLSSocket(new net.Socket(), {secureContext})
  const cert = socket.getCertificate()
  socket.destroy()
  return (cert as tls.Certificate)
}