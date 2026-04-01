import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdenTrabajo } from '../../database/entities/orden-trabajo.entity.js';
import { Presupuesto } from '../../database/entities/presupuesto.entity.js';
import { OtFoto } from '../../database/entities/ot-foto.entity.js';
import { Factura } from '../../database/entities/factura.entity.js';
import { ArchivosModule } from '../archivos/archivos.module.js';
import { PortalClienteService } from './portal-cliente.service.js';
import { PortalClienteController } from './portal-cliente.controller.js';
import { PortalGateway } from './portal-cliente.gateway.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrdenTrabajo, Presupuesto, OtFoto, Factura]),
    ArchivosModule,
  ],
  controllers: [PortalClienteController],
  providers: [PortalClienteService, PortalGateway],
  exports: [PortalGateway],
})
export class PortalClienteModule {}
