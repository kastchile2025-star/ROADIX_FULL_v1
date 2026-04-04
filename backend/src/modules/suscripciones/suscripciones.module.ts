import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuscripcionesController } from './suscripciones.controller.js';
import { SuscripcionesService } from './suscripciones.service.js';
import { SuscripcionesCronService } from './suscripciones-cron.service.js';
import { Suscripcion } from '../../database/entities/suscripcion.entity.js';
import { Plan } from '../../database/entities/plan.entity.js';
import { HistorialPagoSuscripcion } from '../../database/entities/historial-pago-suscripcion.entity.js';
import { Usuario } from '../../database/entities/usuario.entity.js';
import { Vehiculo } from '../../database/entities/vehiculo.entity.js';
import { OrdenTrabajo } from '../../database/entities/orden-trabajo.entity.js';
import { FlowModule } from '../flow/flow.module.js';
import { EmailModule } from '../email/email.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Suscripcion,
      Plan,
      HistorialPagoSuscripcion,
      Usuario,
      Vehiculo,
      OrdenTrabajo,
    ]),
    forwardRef(() => FlowModule),
    EmailModule,
  ],
  controllers: [SuscripcionesController],
  providers: [SuscripcionesService, SuscripcionesCronService],
  exports: [SuscripcionesService],
})
export class SuscripcionesModule {}
