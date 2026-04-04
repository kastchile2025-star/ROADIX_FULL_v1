import { MigrationInterface, QueryRunner } from 'typeorm';

export class PromoteAdminSuperadmin1711000000000 implements MigrationInterface {
  name = 'PromoteAdminSuperadmin1711000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "usuario" SET "rol" = 'superadmin' WHERE "email" IN ('admin', 'admin@roadix.cl')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "usuario" SET "rol" = 'admin_taller' WHERE "email" = 'admin'`,
    );
  }
}
