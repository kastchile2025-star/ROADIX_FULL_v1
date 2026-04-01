import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TalleresController } from './talleres.controller.js';
import { TalleresService } from './talleres.service.js';
import { Taller } from '../../database/entities/taller.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Taller])],
  controllers: [TalleresController],
  providers: [TalleresService],
  exports: [TalleresService],
})
export class TalleresModule {}
