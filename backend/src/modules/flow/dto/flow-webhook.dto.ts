import { IsOptional, IsString } from 'class-validator';

export class FlowWebhookDto {
  @IsString()
  @IsOptional()
  token?: string;
}
