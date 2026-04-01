import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFlowBillingRetryFields1710500000000 implements MigrationInterface {
  name = 'AddFlowBillingRetryFields1710500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "suscripcion"
      ADD COLUMN IF NOT EXISTS "referencia_pago_externa" TEXT,
      ADD COLUMN IF NOT EXISTS "billing_retry_count" INT NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "billing_last_retry_at" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "billing_next_retry_at" TIMESTAMP
    `);

    await queryRunner.query(`
      ALTER TABLE "historial_pago_suscripcion"
      ADD COLUMN IF NOT EXISTS "referencia_externa" TEXT,
      ADD COLUMN IF NOT EXISTS "codigo_respuesta" VARCHAR(50),
      ADD COLUMN IF NOT EXISTS "detalle_respuesta" TEXT
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_suscripcion_retry_next"
      ON "suscripcion"("billing_next_retry_at")
      WHERE "billing_next_retry_at" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_suscripcion_retry_next"`);

    await queryRunner.query(`
      ALTER TABLE "historial_pago_suscripcion"
      DROP COLUMN IF EXISTS "detalle_respuesta",
      DROP COLUMN IF EXISTS "codigo_respuesta",
      DROP COLUMN IF EXISTS "referencia_externa"
    `);

    await queryRunner.query(`
      ALTER TABLE "suscripcion"
      DROP COLUMN IF EXISTS "billing_next_retry_at",
      DROP COLUMN IF EXISTS "billing_last_retry_at",
      DROP COLUMN IF EXISTS "billing_retry_count",
      DROP COLUMN IF EXISTS "referencia_pago_externa"
    `);
  }
}
