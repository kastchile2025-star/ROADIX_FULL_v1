import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdenTrabajo } from '../../database/entities/orden-trabajo.entity.js';
import { OtDetalle } from '../../database/entities/ot-detalle.entity.js';
import { OtFoto } from '../../database/entities/ot-foto.entity.js';
import { ChecklistRecepcion } from '../../database/entities/checklist-recepcion.entity.js';
import { Suscripcion } from '../../database/entities/suscripcion.entity.js';
import { Usuario } from '../../database/entities/usuario.entity.js';
import { Vehiculo } from '../../database/entities/vehiculo.entity.js';
import { ArchivosModule } from '../archivos/archivos.module.js';
import { OrdenesTrabajoService } from './ordenes-trabajo.service.js';
import { OrdenesTrabajoController } from './ordenes-trabajo.controller.js';
import { PlanLimitGuard } from '../../common/guards/plan-limit.guard.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrdenTrabajo,
      OtDetalle,
      OtFoto,
      ChecklistRecepcion,
      Suscripcion,
      Usuario,
      Vehiculo,
    ]),
    ArchivosModule,
  ],
  controllers: [OrdenesTrabajoController],
  providers: [OrdenesTrabajoService, PlanLimitGuard],
  exports: [OrdenesTrabajoService],
})
export class OrdenesTrabajoModule {}
