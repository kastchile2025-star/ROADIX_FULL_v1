import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { EmailService } from './email.service.js';

@Controller('email')
@UseGuards(JwtAuthGuard)
export class EmailController {
  constructor(private emailService: EmailService) {}

  @Get('historial')
  getHistorial(@Request() req: any) {
    return this.emailService.getHistorial(req.user.taller_id);
  }
}
