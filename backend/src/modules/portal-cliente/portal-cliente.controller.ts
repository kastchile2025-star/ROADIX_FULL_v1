import { Controller, Get, Param, Patch, Body } from '@nestjs/common';
import { PortalClienteService } from './portal-cliente.service.js';

@Controller('portal')
export class PortalClienteController {
  constructor(private portalService: PortalClienteService) {}

  @Get(':token')
  getOrdenTrabajo(@Param('token') token: string) {
    return this.portalService.getOtByToken(token);
  }

  @Get(':token/fotos')
  getFotos(@Param('token') token: string) {
    return this.portalService.getFotos(token);
  }

  @Get(':token/presupuesto')
  getPresupuesto(@Param('token') token: string) {
    return this.portalService.getPresupuesto(token);
  }

  @Patch(':token/presupuesto/aprobar')
  aprobarPresupuesto(
    @Param('token') token: string,
    @Body() body: { firma_base64?: string },
  ) {
    return this.portalService.aprobarPresupuesto(token, body.firma_base64);
  }

  @Get(':token/factura')
  getFactura(@Param('token') token: string) {
    return this.portalService.getFactura(token);
  }
}
