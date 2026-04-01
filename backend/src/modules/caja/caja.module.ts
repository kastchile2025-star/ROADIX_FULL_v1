import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pago } from '../../database/entities/pago.entity.js';
import { OrdenTrabajo } from '../../database/entities/orden-trabajo.entity.js';
import { CajaService } from './caja.service.js';
import { CajaController } from './caja.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Pago, OrdenTrabajo])],
  controllers: [CajaController],
  providers: [CajaService],
  exports: [CajaService],
})
export class CajaModule {}
