import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Presupuesto } from '../../database/entities/presupuesto.entity.js';
import { Factura } from '../../database/entities/factura.entity.js';
import { Taller } from '../../database/entities/taller.entity.js';
import { PdfService } from './pdf.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Presupuesto, Factura, Taller])],
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfModule {}
