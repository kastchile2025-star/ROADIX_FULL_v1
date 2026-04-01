import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
} from '@nestjs/common';
import { TalleresService } from './talleres.service.js';
import { UpdateTallerDto } from './dto/update-taller.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '../../common/enums.js';

@Controller('talleres')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TalleresController {
  constructor(private readonly talleresService: TalleresService) {}

  @Get('mi-taller')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN)
  findMine(@CurrentUser('taller_id') tallerId: number) {
    return this.talleresService.findOne(tallerId);
  }

  @Put('mi-taller')
  @Roles(UserRole.ADMIN_TALLER, UserRole.SUPERADMIN)
  update(
    @CurrentUser('taller_id') tallerId: number,
    @Body() dto: UpdateTallerDto,
  ) {
    return this.talleresService.update(tallerId, dto);
  }
}
