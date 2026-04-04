import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateStarterPlanPrice1712000000000 implements MigrationInterface {
  name = 'UpdateStarterPlanPrice1712000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "plan"
      SET "precio_mensual" = 25990,
          "precio_anual" = 280692
      WHERE "nombre" = 'starter'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "plan"
      SET "precio_mensual" = 500,
          "precio_anual" = 5400
      WHERE "nombre" = 'starter'
    `);
  }
}
