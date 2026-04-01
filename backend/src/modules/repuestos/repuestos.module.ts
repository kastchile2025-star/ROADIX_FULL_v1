import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repuesto } from '../../database/entities/repuesto.entity.js';
import { RepuestosService } from './repuestos.service.js';
import { RepuestosController } from './repuestos.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Repuesto])],
  controllers: [RepuestosController],
  providers: [RepuestosService],
  exports: [RepuestosService],
})
export class RepuestosModule {}
