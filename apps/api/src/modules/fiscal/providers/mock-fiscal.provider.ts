import { BadRequestException } from '@nestjs/common';
import { FiscalAuthRequest, FiscalAuthResult, IFiscalProvider } from '../types/fiscal.types';

export class MockFiscalProvider implements IFiscalProvider {
  async authorize(request: FiscalAuthRequest): Promise<FiscalAuthResult> {
    const computedNet = request.ivaBreakdown.reduce((s, b) => s + b.netAmount, 0);
    const computedIva = request.ivaBreakdown.reduce((s, b) => s + b.ivaAmount, 0);
    const computedTotal = computedNet + computedIva;

    if (Math.abs(computedTotal - request.totalAmount) > 0.05) {
      throw new BadRequestException(
        `Invoice total mismatch: computed ${computedTotal.toFixed(2)}, received ${request.totalAmount.toFixed(2)}`,
      );
    }

    const cae = String(Date.now()).padStart(14, '0').slice(-14);
    const caeExpiresOn = new Date();
    caeExpiresOn.setDate(caeExpiresOn.getDate() + 10);

    const afipRequest: object = {
      ...request,
      timestamp: new Date().toISOString(),
      provider: 'MOCK',
    };

    const afipResponse: object = {
      Resultado: 'A',
      CAE: cae,
      CAEFchVto: caeExpiresOn.toISOString().slice(0, 10),
      Obs: [],
      provider: 'MOCK',
    };

    return { cae, caeExpiresOn, afipRequest, afipResponse };
  }
}
