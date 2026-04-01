import { IsEmail, IsEnum, IsString, MinLength, IsOptional } from 'class-validator';
import { UserRole } from '../../../common/enums.js';

export class InviteUserDto {
  @IsString()
  nombre: string;

  @IsEmail()
  email: string;

  @IsEnum(UserRole)
  rol: UserRole;

  @IsOptional()
  @IsString()
  telefono?: string;
}
