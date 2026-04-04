import { Controller, Get, Post, HttpCode } from '@nestjs/common';
import { AppService } from './app.service.js';
import { DataSource } from 'typeorm';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('promote-admin')
  @HttpCode(200)
  async promoteAdmin() {
    const result = await this.dataSource.query(
      `UPDATE "usuario" SET "rol" = 'superadmin' WHERE "email" IN ('admin', 'admin@roadix.cl') AND "rol" != 'superadmin'`,
    );
    return { ok: true, affected: result[1] };
  }
}
