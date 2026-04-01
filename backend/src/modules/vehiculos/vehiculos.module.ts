import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiculosController } from './vehiculos.controller.js';
import { VehiculosService } from './vehiculos.service.js';
import { Vehiculo } from '../../database/entities/vehiculo.entity.js';
import { Suscripcion } from '../../database/entities/suscripcion.entity.js';
import { Usuario } from '../../database/entities/usuario.entity.js';
import { OrdenTrabajo } from '../../database/entities/orden-trabajo.entity.js';
import { PlanLimitGuard } from '../../common/guards/plan-limit.guard.js';

@Module({
  imports: [TypeOrmModule.forFeature([Vehiculo, Suscripcion, Usuario, OrdenTrabajo])],
  controllers: [VehiculosController],
  providers: [VehiculosService, PlanLimitGuard],
  exports: [VehiculosService],
})
export class VehiculosModule {}
