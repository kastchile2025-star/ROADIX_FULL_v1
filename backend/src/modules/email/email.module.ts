import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { HistorialEmail } from '../../database/entities/historial-email.entity.js';
import { EmailService } from './email.service.js';
import { EmailProcessor } from './email.processor.js';
import { EmailController } from './email.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([HistorialEmail]),
    BullModule.registerQueue({ name: 'email-queue' }),
  ],
  controllers: [EmailController],
  providers: [EmailService, EmailProcessor],
  exports: [EmailService],
})
export class EmailModule {}
