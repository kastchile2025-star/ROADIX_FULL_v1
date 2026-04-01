import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Presupuesto } from '../../database/entities/presupuesto.entity.js';
import { OrdenTrabajo } from '../../database/entities/orden-trabajo.entity.js';
import { PresupuestosService } from './presupuestos.service.js';
import { PresupuestosController } from './presupuestos.controller.js';
import { PdfModule } from '../pdf/pdf.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Presupuesto, OrdenTrabajo]), PdfModule],
  controllers: [PresupuestosController],
  providers: [PresupuestosService],
  exports: [PresupuestosService],
})
export class PresupuestosModule {}
