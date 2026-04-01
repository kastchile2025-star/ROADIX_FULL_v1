import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosController } from './usuarios.controller.js';
import { UsuariosService } from './usuarios.service.js';
import { Usuario } from '../../database/entities/usuario.entity.js';
import { Suscripcion } from '../../database/entities/suscripcion.entity.js';
import { Vehiculo } from '../../database/entities/vehiculo.entity.js';
import { OrdenTrabajo } from '../../database/entities/orden-trabajo.entity.js';
import { PlanLimitGuard } from '../../common/guards/plan-limit.guard.js';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Suscripcion, Vehiculo, OrdenTrabajo])],
  controllers: [UsuariosController],
  providers: [UsuariosService, PlanLimitGuard],
  exports: [UsuariosService],
})
export class UsuariosModule {}
