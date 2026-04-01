import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdenTrabajo } from '../../database/entities/orden-trabajo.entity.js';
import { Pago } from '../../database/entities/pago.entity.js';
import { OtDetalle } from '../../database/entities/ot-detalle.entity.js';
import { Mecanico } from '../../database/entities/mecanico.entity.js';
import { Repuesto } from '../../database/entities/repuesto.entity.js';
import { Cliente } from '../../database/entities/cliente.entity.js';
import { ReportesService } from './reportes.service.js';
import { ReportesController } from './reportes.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrdenTrabajo, Pago, OtDetalle, Mecanico, Repuesto, Cliente]),
  ],
  controllers: [ReportesController],
  providers: [ReportesService],
})
export class ReportesModule {}
