import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FlowController } from './flow.controller.js';
import { FlowService } from './flow.service.js';
import { SuscripcionesModule } from '../suscripciones/suscripciones.module.js';

@Module({
  imports: [ConfigModule, forwardRef(() => SuscripcionesModule)],
  controllers: [FlowController],
  providers: [FlowService],
  exports: [FlowService],
})
export class FlowModule {}
