import { IsEmail, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateFlowPaymentDto {
  @IsNumber()
  @Min(1)
  amount!: number;

  @IsString()
  subject!: string;

  @IsString()
  externalId!: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  returnUrl?: string;

  @IsString()
  @IsOptional()
  confirmUrl?: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}
