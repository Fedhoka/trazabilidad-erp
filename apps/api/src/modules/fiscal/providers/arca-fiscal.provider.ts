import { BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import * as soap from 'soap';
import { InvoiceType } from '../entities/invoice.entity';
import { WsaaService } from './wsaa.service';
import type { FiscalAuthRequest, FiscalAuthResult, IFiscalProvider } from '../types/fiscal.types';

const WSFE_HOMO = 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx?WSDL';
const WSFE_PROD = 'https://servicios1.afip.gov.ar/wsfev1/service.asmx?WSDL';

// AFIP AlicIva.Id values per tax rate
const IVA_RATE_TO_ID: Record<number, number> = {
  0: 3,
  10.5: 4,
  21: 5,
  27: 6,
};

const CBTE_TIPO: Record<InvoiceType, number> = {
  [InvoiceType.A]: 1,
  [InvoiceType.B]: 6,
  [InvoiceType.C]: 11,
};

export interface ArcaConfig {
  certPath: string;
  keyPath: string;
  cuit: string;
  env: 'homologacion' | 'produccion';
}

export class ArcaFiscalProvider implements IFiscalProvider {
  private readonly logger = new Logger(ArcaFiscalProvider.name);
  private readonly wsaa: WsaaService;
  private readonly wsfeUrl: string;
  private readonly cuit: string;

  constructor(cfg: ArcaConfig) {
    this.wsaa = new WsaaService(cfg.certPath, cfg.keyPath, cfg.env);
    this.wsfeUrl = cfg.env === 'produccion' ? WSFE_PROD : WSFE_HOMO;
    this.cuit = cfg.cuit.replace(/-/g, '');
  }

  async authorize(request: FiscalAuthRequest): Promise<FiscalAuthResult> {
    const ticket = await this.wsaa.getTicket();

    const auth = { Token: ticket.token, Sign: ticket.sign, Cuit: this.cuit };

    const alicIva = request.ivaBreakdown
      .filter((b) => b.netAmount > 0)
      .map((b) => ({
        Id: IVA_RATE_TO_ID[b.rate] ?? 5,
        BaseImp: +b.netAmount.toFixed(2),
        Importe: +b.ivaAmount.toFixed(2),
      }));

    const docTipo = request.customerCuit ? 80 : 99; // 80=CUIT, 99=sin identificar
    const docNro = request.customerCuit ? request.customerCuit.replace(/-/g, '') : '0';
    const cbteFch = request.issueDate.replace(/-/g, '');

    const feDetReq = {
      Concepto: 1,
      DocTipo: docTipo,
      DocNro: docNro,
      CbteDesde: request.invoiceNumber,
      CbteHasta: request.invoiceNumber,
      CbteFch: cbteFch,
      ImpTotal: +request.totalAmount.toFixed(2),
      ImpTotConc: 0,
      ImpNeto: +request.netAmount.toFixed(2),
      ImpOpEx: 0,
      ImpIVA: +request.ivaAmount.toFixed(2),
      ImpTrib: 0,
      MonId: 'PES',
      MonCotiz: 1,
      ...(alicIva.length > 0 ? { Iva: { AlicIva: alicIva } } : {}),
    };

    const feCAEReq = {
      FeCabReq: {
        CantReg: 1,
        PtoVta: request.pointOfSaleNumber,
        CbteTipo: CBTE_TIPO[request.invoiceType],
      },
      FeDetReq: { FECAEDetRequest: [feDetReq] },
    };

    const afipRequest = { Auth: auth, FeCAEReq: feCAEReq };
    this.logger.debug('FECAESolicitar →', JSON.stringify(afipRequest));

    let rawResult: any;
    try {
      const client = await soap.createClientAsync(this.wsfeUrl);
      [rawResult] = await (client as any).FECAESolicitarAsync(afipRequest);
    } catch (err: any) {
      throw new InternalServerErrorException(`WSFEv1 SOAP error: ${err?.message ?? String(err)}`);
    }

    const afipResponse = rawResult?.FECAESolicitarResult ?? rawResult;
    this.logger.debug('FECAESolicitar ←', JSON.stringify(afipResponse));

    const det = afipResponse?.FeDetResp?.FECAEDetResponse?.[0];
    if (!det || det.Resultado !== 'A') {
      const obs = det?.Observaciones?.Obs ?? afipResponse?.Errors?.Err ?? [];
      throw new BadRequestException(`AFIP rechazó el comprobante: ${JSON.stringify(obs)}`);
    }

    const cae = String(det.CAE);
    const rawExp: string = String(det.CAEFchVto); // YYYYMMDD
    const caeExpiresOn = new Date(
      `${rawExp.slice(0, 4)}-${rawExp.slice(4, 6)}-${rawExp.slice(6, 8)}`,
    );

    return { cae, caeExpiresOn, afipRequest, afipResponse };
  }
}
