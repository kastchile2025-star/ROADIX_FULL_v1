import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehiculo } from '../../database/entities/vehiculo.entity.js';
import { Recordatorio } from '../../database/entities/recordatorio.entity.js';
import { EmailModule } from '../email/email.module.js';
import { RecordatoriosService } from './recordatorios.service.js';
import { RecordatoriosController } from './recordatorios.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vehiculo, Recordatorio]),
    EmailModule,
  ],
  controllers: [RecordatoriosController],
  providers: [RecordatoriosService],
})
export class RecordatoriosModule {}
