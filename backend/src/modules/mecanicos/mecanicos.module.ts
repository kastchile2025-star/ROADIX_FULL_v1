import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MecanicosController } from './mecanicos.controller.js';
import { MecanicosService } from './mecanicos.service.js';
import { Mecanico } from '../../database/entities/mecanico.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Mecanico])],
  controllers: [MecanicosController],
  providers: [MecanicosService],
  exports: [MecanicosService],
})
export class MecanicosModule {}
