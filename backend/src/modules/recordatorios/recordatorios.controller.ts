import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RecordatoriosService } from './recordatorios.service.js';

@Controller('recordatorios')
@UseGuards(JwtAuthGuard)
export class RecordatoriosController {
  constructor(private recordatoriosService: RecordatoriosService) {}

  @Get()
  getRecordatorios(@Request() req: any) {
    return this.recordatoriosService.getRecordatorios(req.user.taller_id);
  }
}
