import { FlowService } from './flow.service';

describe('FlowService', () => {
  it('conciles webhook using subscriptions service as source of truth', async () => {
    const flowProvider = {
      createPayment: jest.fn(),
      getPaymentStatus: jest.fn().mockResolvedValue({ response: { status: 2, commerceOrder: 'sub-1' } }),
    };

    const suscripcionesService = {
      prepararPagoFlow: jest.fn(),
      registrarPagoFlowCreado: jest.fn(),
      conciliarPagoFlowDesdeWebhook: jest.fn().mockResolvedValue({ matched: true, estado: 'paid' }),
    };

    const service = new FlowService(flowProvider as never, suscripcionesService as never);
    const result = await service.handleWebhook('tok_test');

    expect(flowProvider.getPaymentStatus).toHaveBeenCalledWith('tok_test');
    expect(suscripcionesService.conciliarPagoFlowDesdeWebhook).toHaveBeenCalled();
    expect(result.ok).toBe(true);
    expect(result.sourceOfTruth).toBe('webhook');
  });
});