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
    await this.dataSource.query(
      `UPDATE "usuario" SET "rol" = 'superadmin' WHERE "email" = 'admin' AND "rol" != 'superadmin'`,
    );
    return { ok: true };
  }
}
