import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovimientoStock } from '../../database/entities/movimiento-stock.entity.js';
import { Repuesto } from '../../database/entities/repuesto.entity.js';
import { InventarioService } from './inventario.service.js';
import { InventarioController } from './inventario.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([MovimientoStock, Repuesto])],
  controllers: [InventarioController],
  providers: [InventarioService],
  exports: [InventarioService],
})
export class InventarioModule {}
