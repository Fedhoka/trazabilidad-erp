import * as fs from 'fs';
import * as forge from 'node-forge';
import * as soap from 'soap';

const WSAA_HOMO = 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms?wsdl';
const WSAA_PROD = 'https://wsaa.afip.gov.ar/ws/services/LoginCms?wsdl';
const SERVICE = 'wsfe';

export interface WsaaTicket {
  token: string;
  sign: string;
  expiresAt: Date;
}

export class WsaaService {
  private ticket: WsaaTicket | null = null;

  constructor(
    private readonly certPath: string,
    private readonly keyPath: string,
    private readonly env: 'homologacion' | 'produccion',
  ) {}

  async getTicket(): Promise<WsaaTicket> {
    if (this.ticket && this.ticket.expiresAt > new Date()) {
      return this.ticket;
    }
    this.ticket = await this.fetchTicket();
    return this.ticket;
  }

  private async fetchTicket(): Promise<WsaaTicket> {
    const certPem = fs.readFileSync(this.certPath, 'utf8');
    const keyPem = fs.readFileSync(this.keyPath, 'utf8');
    const cms = this.buildCms(certPem, keyPem);

    const url = this.env === 'produccion' ? WSAA_PROD : WSAA_HOMO;
    const client = await soap.createClientAsync(url);
    const [res] = await (client as any).loginCmsAsync({ in0: cms });
    const xmlResponse: string = res?.loginCmsReturn ?? res;

    return this.parseResponse(xmlResponse);
  }

  private buildCms(certPem: string, keyPem: string): string {
    const cert = forge.pki.certificateFromPem(certPem);
    const privateKey = forge.pki.privateKeyFromPem(keyPem);
    const xml = this.buildLoginTicketRequest();

    const p7 = forge.pkcs7.createSignedData();
    p7.content = forge.util.createBuffer(xml, 'utf8');
    p7.addCertificate(cert);
    p7.addSigner({
      key: privateKey,
      certificate: cert,
      digestAlgorithm: forge.pki.oids.sha256,
      authenticatedAttributes: [
        { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
        { type: forge.pki.oids.messageDigest },
        { type: forge.pki.oids.signingTime, value: new Date().toISOString() },
      ],
    });
    p7.sign();

    const der = forge.asn1.toDer(p7.toAsn1()).getBytes();
    return forge.util.encode64(der);
  }

  private buildLoginTicketRequest(): string {
    const now = new Date();
    const genTime = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
    const expTime = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
    const uniqueId = Math.floor(now.getTime() / 1000);

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<loginTicketRequest version="1.0">',
      '  <header>',
      `    <uniqueId>${uniqueId}</uniqueId>`,
      `    <generationTime>${genTime}</generationTime>`,
      `    <expirationTime>${expTime}</expirationTime>`,
      '  </header>',
      `  <service>${SERVICE}</service>`,
      '</loginTicketRequest>',
    ].join('\n');
  }

  private parseResponse(xml: string): WsaaTicket {
    const tokenMatch = xml.match(/<token>([\s\S]*?)<\/token>/);
    const signMatch = xml.match(/<sign>([\s\S]*?)<\/sign>/);
    const expMatch = xml.match(/<expirationTime>([\s\S]*?)<\/expirationTime>/);

    if (!tokenMatch || !signMatch) {
      throw new Error(`WSAA response missing token/sign. Raw: ${xml.slice(0, 300)}`);
    }

    const expiresAt = expMatch ? new Date(expMatch[1]) : new Date(Date.now() + 11 * 3600 * 1000);
    expiresAt.setMinutes(expiresAt.getMinutes() - 5);

    return {
      token: tokenMatch[1].trim(),
      sign: signMatch[1].trim(),
      expiresAt,
    };
  }
}
