import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Factura } from '../../database/entities/factura.entity.js';
import { OrdenTrabajo } from '../../database/entities/orden-trabajo.entity.js';
import { FacturacionService } from './facturacion.service.js';
import { FacturacionController } from './facturacion.controller.js';
import { PdfModule } from '../pdf/pdf.module.js';
import { EmailModule } from '../email/email.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Factura, OrdenTrabajo]), PdfModule, EmailModule],
  controllers: [FacturacionController],
  providers: [FacturacionService],
  exports: [FacturacionService],
})
export class FacturacionModule {}
