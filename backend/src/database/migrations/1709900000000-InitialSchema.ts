import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1709900000000 implements MigrationInterface {
  name = 'InitialSchema1709900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enums
    await queryRunner.query(`
      CREATE TYPE "user_role" AS ENUM (
        'superadmin', 'admin_taller', 'recepcionista', 'mecanico', 'bodeguero', 'cajero', 'viewer'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "ot_estado" AS ENUM (
        'recepcion', 'diagnostico', 'presupuesto', 'esperando_aprobacion',
        'esperando_repuestos', 'en_reparacion', 'control_calidad',
        'listo', 'entregado', 'facturado', 'cancelado'
      )
    `);
    await queryRunner.query(`CREATE TYPE "prioridad" AS ENUM ('baja', 'media', 'alta', 'urgente')`);
    await queryRunner.query(`
      CREATE TYPE "tipo_vehiculo" AS ENUM (
        'automovil', 'camioneta', 'suv', 'van', 'camion', 'moto', 'bus', 'maquinaria', 'otro'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "combustible" AS ENUM ('bencina', 'diesel', 'electrico', 'hibrido', 'gas')
    `);
    await queryRunner.query(`
      CREATE TYPE "metodo_pago" AS ENUM (
        'efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'cheque', 'credito'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "suscripcion_estado" AS ENUM ('activa', 'trial', 'vencida', 'cancelada', 'suspendida')
    `);
    await queryRunner.query(`CREATE TYPE "suscripcion_periodo" AS ENUM ('mensual', 'anual')`);
    await queryRunner.query(`
      CREATE TYPE "pago_suscripcion_estado" AS ENUM ('exitoso', 'fallido', 'pendiente', 'reembolsado')
    `);
    await queryRunner.query(`
      CREATE TYPE "presupuesto_estado" AS ENUM ('borrador', 'enviado', 'aprobado', 'rechazado')
    `);
    await queryRunner.query(`CREATE TYPE "tipo_movimiento_stock" AS ENUM ('entrada', 'salida', 'ajuste')`);
    await queryRunner.query(`CREATE TYPE "tipo_dte" AS ENUM ('boleta', 'factura', 'nota_credito')`);
    await queryRunner.query(`CREATE TYPE "tipo_foto_ot" AS ENUM ('ingreso', 'proceso', 'entrega', 'dano')`);
    await queryRunner.query(`CREATE TYPE "estado_checklist" AS ENUM ('ok', 'danio_prev', 'danio_nuevo')`);
    await queryRunner.query(`
      CREATE TYPE "zona_vehiculo" AS ENUM ('frente', 'trasera', 'lat_izq', 'lat_der', 'techo', 'interior')
    `);
    await queryRunner.query(`
      CREATE TYPE "tipo_recordatorio" AS ENUM ('rev_tecnica', 'permiso_circ', 'soap', 'mantencion', 'seguimiento')
    `);
    await queryRunner.query(`CREATE TYPE "canal_recordatorio" AS ENUM ('email', 'wsp', 'ambos')`);
    await queryRunner.query(`CREATE TYPE "estado_recordatorio" AS ENUM ('pendiente', 'enviado', 'fallido')`);
    await queryRunner.query(`
      CREATE TYPE "tipo_email" AS ENUM (
        'presupuesto', 'ot_finalizada', 'recordatorio', 'rev_tecnica', 'bienvenida',
        'marketing', 'reset_password', 'invitacion', 'trial_expiring',
        'suscripcion_activa', 'pago_fallido', 'cuenta_suspendida'
      )
    `);
    await queryRunner.query(`CREATE TYPE "estado_email" AS ENUM ('enviado', 'entregado', 'fallido', 'abierto')`);
    await queryRunner.query(`CREATE TYPE "tipo_ot_detalle" AS ENUM ('mano_obra', 'repuesto')`);
    await queryRunner.query(`CREATE TYPE "tipo_cliente" AS ENUM ('persona', 'empresa')`);

    // Tables
    await queryRunner.query(`
      CREATE TABLE "plan" (
        "id" SERIAL PRIMARY KEY,
        "nombre" VARCHAR(50) UNIQUE NOT NULL,
        "precio_mensual" DECIMAL(10,0) DEFAULT 0,
        "precio_anual" DECIMAL(10,0) DEFAULT 0,
        "max_usuarios" INT NOT NULL,
        "max_ots_mes" INT NOT NULL,
        "max_vehiculos" INT NOT NULL,
        "max_storage_mb" INT NOT NULL,
        "tiene_facturacion" BOOLEAN DEFAULT false,
        "tiene_whatsapp" BOOLEAN DEFAULT false,
        "tiene_portal" BOOLEAN DEFAULT false,
        "tiene_reportes" BOOLEAN DEFAULT false,
        "tiene_api" BOOLEAN DEFAULT false,
        "activo" BOOLEAN DEFAULT true,
        "created_at" TIMESTAMP DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "taller" (
        "id" SERIAL PRIMARY KEY,
        "nombre" VARCHAR(200) NOT NULL,
        "rut" VARCHAR(20),
        "direccion" VARCHAR(500),
        "telefono" VARCHAR(20),
        "logo_url" TEXT,
        "config_json" JSONB,
        "created_at" TIMESTAMP DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "suscripcion" (
        "id" SERIAL PRIMARY KEY,
        "taller_id" INT NOT NULL REFERENCES "taller"("id"),
        "plan_id" INT NOT NULL REFERENCES "plan"("id"),
        "periodo" "suscripcion_periodo" DEFAULT 'mensual',
        "estado" "suscripcion_estado" DEFAULT 'trial',
        "fecha_inicio" TIMESTAMP NOT NULL,
        "fecha_fin" TIMESTAMP,
        "trial_hasta" TIMESTAMP,
        "proximo_cobro" TIMESTAMP,
        "metodo_pago" VARCHAR(50),
        "referencia_pago" TEXT,
        "monto_pagado" DECIMAL(10,0) DEFAULT 0,
        "descuento_pct" DECIMAL(5,2) DEFAULT 0,
        "auto_renovar" BOOLEAN DEFAULT true,
        "cancelado_at" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT now(),
        "updated_at" TIMESTAMP DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "historial_pago_suscripcion" (
        "id" SERIAL PRIMARY KEY,
        "suscripcion_id" INT NOT NULL REFERENCES "suscripcion"("id"),
        "monto" DECIMAL(10,0) NOT NULL,
        "metodo_pago" VARCHAR(50),
        "referencia" TEXT,
        "estado" "pago_suscripcion_estado" DEFAULT 'pendiente',
        "fecha_pago" TIMESTAMP,
        "periodo_desde" TIMESTAMP,
        "periodo_hasta" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "usuario" (
        "id" SERIAL PRIMARY KEY,
        "taller_id" INT NOT NULL REFERENCES "taller"("id"),
        "nombre" VARCHAR(200) NOT NULL,
        "email" VARCHAR(200) UNIQUE NOT NULL,
        "password" VARCHAR(255) NOT NULL,
        "rol" "user_role" DEFAULT 'viewer',
        "telefono" VARCHAR(20),
        "avatar_url" TEXT,
        "activo" BOOLEAN DEFAULT true,
        "refresh_token" TEXT,
        "created_at" TIMESTAMP DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "cliente" (
        "id" SERIAL PRIMARY KEY,
        "taller_id" INT NOT NULL REFERENCES "taller"("id"),
        "nombre" VARCHAR(200) NOT NULL,
        "rut" VARCHAR(20),
        "email" VARCHAR(200),
        "telefono" VARCHAR(20),
        "direccion" VARCHAR(500),
        "tipo" "tipo_cliente" DEFAULT 'persona',
        "created_at" TIMESTAMP DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "proveedor" (
        "id" SERIAL PRIMARY KEY,
        "taller_id" INT NOT NULL REFERENCES "taller"("id"),
        "razon_social" VARCHAR(200) NOT NULL,
        "rut" VARCHAR(20),
        "contacto" VARCHAR(200),
        "email" VARCHAR(200),
        "telefono" VARCHAR(20),
        "created_at" TIMESTAMP DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "mecanico" (
        "id" SERIAL PRIMARY KEY,
        "usuario_id" INT REFERENCES "usuario"("id"),
        "taller_id" INT NOT NULL REFERENCES "taller"("id"),
        "especialidad" VARCHAR(200),
        "tarifa_hora" DECIMAL(10,0) DEFAULT 0,
        "activo" BOOLEAN DEFAULT true,
        "created_at" TIMESTAMP DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "vehiculo" (
        "id" SERIAL PRIMARY KEY,
        "cliente_id" INT NOT NULL REFERENCES "cliente"("id"),
        "taller_id" INT NOT NULL REFERENCES "taller"("id"),
        "patente" VARCHAR(10) NOT NULL,
        "marca" VARCHAR(50),
        "modelo" VARCHAR(50),
        "anio" INT,
        "color" VARCHAR(30),
        "vin" VARCHAR(20),
        "tipo_vehiculo" "tipo_vehiculo" DEFAULT 'automovil',
        "km_actual" INT DEFAULT 0,
        "combustible" "combustible",
        "rev_tecnica" DATE,
        "permiso_circ" DATE,
        "soap_vence" DATE,
        "foto_url" TEXT,
        "notas" TEXT,
        "created_at" TIMESTAMP DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "repuesto" (
        "id" SERIAL PRIMARY KEY,
        "taller_id" INT NOT NULL REFERENCES "taller"("id"),
        "proveedor_id" INT REFERENCES "proveedor"("id"),
        "codigo" VARCHAR(50),
        "nombre" VARCHAR(200) NOT NULL,
        "descripcion" TEXT,
        "categoria" VARCHAR(100),
        "precio_compra" DECIMAL(10,0) DEFAULT 0,
        "precio_venta" DECIMAL(10,0) DEFAULT 0,
        "stock_actual" INT DEFAULT 0,
        "stock_minimo" INT DEFAULT 0,
        "ubicacion_bodega" VARCHAR(100),
        "created_at" TIMESTAMP DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "orden_trabajo" (
        "id" SERIAL PRIMARY KEY,
        "taller_id" INT NOT NULL REFERENCES "taller"("id"),
        "vehiculo_id" INT NOT NULL REFERENCES "vehiculo"("id"),
        "cliente_id" INT NOT NULL REFERENCES "cliente"("id"),
        "mecanico_id" INT REFERENCES "mecanico"("id"),
        "numero_ot" VARCHAR(50) UNIQUE NOT NULL,
        "estado" "ot_estado" DEFAULT 'recepcion',
        "tipo_servicio" VARCHAR(200),
        "km_ingreso" INT,
        "combustible_ing" VARCHAR(20),
        "diagnostico" TEXT,
        "observaciones" TEXT,
        "fecha_ingreso" TIMESTAMP DEFAULT now(),
        "fecha_prometida" TIMESTAMP,
        "fecha_entrega" TIMESTAMP,
        "prioridad" "prioridad" DEFAULT 'media',
        "token_portal" UUID,
        "subtotal" DECIMAL(10,0) DEFAULT 0,
        "descuento" DECIMAL(10,0) DEFAULT 0,
        "iva" DECIMAL(10,0) DEFAULT 0,
        "total" DECIMAL(10,0) DEFAULT 0,
        "firma_cliente_url" TEXT,
        "created_at" TIMESTAMP DEFAULT now(),
        "updated_at" TIMESTAMP DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "ot_detalle" (
        "id" SERIAL PRIMARY KEY,
        "ot_id" INT NOT NULL REFERENCES "orden_trabajo"("id"),
        "tipo" "tipo_ot_detalle" NOT NULL,
        "repuesto_id" INT REFERENCES "repuesto"("id"),
        "descripcion" VARCHAR(500) NOT NULL,
        "cantidad" INT DEFAULT 1,
        "precio_unit" DECIMAL(10,0) DEFAULT 0,
        "descuento" DECIMAL(5,2) DEFAULT 0,
        "subtotal" DECIMAL(10,0) DEFAULT 0
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "ot_foto" (
        "id" SERIAL PRIMARY KEY,
        "ot_id" INT NOT NULL REFERENCES "orden_trabajo"("id"),
        "url" TEXT NOT NULL,
        "tipo" "tipo_foto_ot" NOT NULL,
        "descripcion" TEXT,
        "created_at" TIMESTAMP DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "movimiento_stock" (
        "id" SERIAL PRIMARY KEY,
        "repuesto_id" INT NOT NULL REFERENCES "repuesto"("id"),
        "ot_detalle_id" INT REFERENCES "ot_detalle"("id"),
        "tipo" "tipo_movimiento_stock" NOT NULL,
        "cantidad" INT NOT NULL,
        "motivo" TEXT,
        "usuario_id" INT REFERENCES "usuario"("id"),
        "created_at" TIMESTAMP DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "presupuesto" (
        "id" SERIAL PRIMARY KEY,
        "ot_id" INT NOT NULL REFERENCES "orden_trabajo"("id"),
        "taller_id" INT NOT NULL REFERENCES "taller"("id"),
        "numero" VARCHAR(50) NOT NULL,
        "estado" "presupuesto_estado" DEFAULT 'borrador',
        "items_json" JSONB,
        "subtotal" DECIMAL(10,0) DEFAULT 0,
        "iva" DECIMAL(10,0) DEFAULT 0,
        "total" DECIMAL(10,0) DEFAULT 0,
        "pdf_url" TEXT,
        "enviado_email" BOOLEAN DEFAULT false,
        "enviado_wsp" BOOLEAN DEFAULT false,
        "aprobado_at" TIMESTAMP,
        "firma_url" TEXT,
        "created_at" TIMESTAMP DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "pago" (
        "id" SERIAL PRIMARY KEY,
        "ot_id" INT NOT NULL REFERENCES "orden_trabajo"("id"),
        "taller_id" INT NOT NULL REFERENCES "taller"("id"),
        "monto" DECIMAL(10,0) NOT NULL,
        "metodo_pago" "metodo_pago" NOT NULL,
        "referencia" TEXT,
        "fecha_pago" TIMESTAMP DEFAULT now(),
        "created_at" TIMESTAMP DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "factura" (
        "id" SERIAL PRIMARY KEY,
        "ot_id" INT NOT NULL REFERENCES "orden_trabajo"("id"),
        "taller_id" INT NOT NULL REFERENCES "taller"("id"),
        "numero_dte" VARCHAR(50),
        "tipo_dte" "tipo_dte" NOT NULL,
        "rut_receptor" VARCHAR(20),
        "xml_dte" TEXT,
        "pdf_url" TEXT,
        "estado_sii" VARCHAR(50),
        "monto_neto" DECIMAL(10,0) DEFAULT 0,
        "iva" DECIMAL(10,0) DEFAULT 0,
        "monto_total" DECIMAL(10,0) DEFAULT 0,
        "created_at" TIMESTAMP DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "recordatorio" (
        "id" SERIAL PRIMARY KEY,
        "taller_id" INT NOT NULL REFERENCES "taller"("id"),
        "cliente_id" INT REFERENCES "cliente"("id"),
        "vehiculo_id" INT REFERENCES "vehiculo"("id"),
        "tipo" "tipo_recordatorio" NOT NULL,
        "mensaje" TEXT,
        "fecha_envio" TIMESTAMP NOT NULL,
        "canal" "canal_recordatorio" DEFAULT 'email',
        "estado" "estado_recordatorio" DEFAULT 'pendiente',
        "enviado_at" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "checklist_recepcion" (
        "id" SERIAL PRIMARY KEY,
        "ot_id" INT NOT NULL REFERENCES "orden_trabajo"("id"),
        "zona_vehiculo" "zona_vehiculo" NOT NULL,
        "estado" "estado_checklist" DEFAULT 'ok',
        "foto_url" TEXT,
        "notas" TEXT,
        "created_at" TIMESTAMP DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "historial_email" (
        "id" SERIAL PRIMARY KEY,
        "taller_id" INT NOT NULL REFERENCES "taller"("id"),
        "destinatario" VARCHAR(200) NOT NULL,
        "asunto" VARCHAR(500) NOT NULL,
        "tipo" "tipo_email" NOT NULL,
        "template_usado" VARCHAR(100),
        "variables_json" JSONB,
        "estado" "estado_email" DEFAULT 'enviado',
        "sendgrid_id" TEXT,
        "abierto_at" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "auditoria_log" (
        "id" SERIAL PRIMARY KEY,
        "taller_id" INT NOT NULL REFERENCES "taller"("id"),
        "usuario_id" INT REFERENCES "usuario"("id"),
        "accion" VARCHAR(100) NOT NULL,
        "entidad" VARCHAR(100) NOT NULL,
        "entidad_id" INT,
        "datos_antes" JSONB,
        "datos_despues" JSONB,
        "ip" VARCHAR(50),
        "created_at" TIMESTAMP DEFAULT now()
      )
    `);

    // Indexes
    await queryRunner.query(`CREATE INDEX "idx_vehiculo_patente" ON "vehiculo"("patente")`);
    await queryRunner.query(`CREATE INDEX "idx_vehiculo_cliente" ON "vehiculo"("cliente_id")`);
    await queryRunner.query(`CREATE INDEX "idx_ot_estado" ON "orden_trabajo"("estado")`);
    await queryRunner.query(`CREATE INDEX "idx_ot_taller_fecha" ON "orden_trabajo"("taller_id", "fecha_ingreso")`);
    await queryRunner.query(`CREATE INDEX "idx_ot_mecanico" ON "orden_trabajo"("mecanico_id")`);
    await queryRunner.query(`CREATE INDEX "idx_ot_vehiculo" ON "orden_trabajo"("vehiculo_id")`);
    await queryRunner.query(`CREATE INDEX "idx_recordatorio_fecha" ON "recordatorio"("fecha_envio")`);
    await queryRunner.query(`CREATE INDEX "idx_repuesto_codigo" ON "repuesto"("codigo")`);
    await queryRunner.query(`CREATE INDEX "idx_repuesto_stock" ON "repuesto"("stock_actual") WHERE "stock_actual" <= "stock_minimo"`);
    await queryRunner.query(`CREATE INDEX "idx_cliente_rut" ON "cliente"("rut")`);
    await queryRunner.query(`CREATE INDEX "idx_email_hist_tipo" ON "historial_email"("tipo", "created_at")`);
    await queryRunner.query(`CREATE INDEX "idx_suscripcion_taller" ON "suscripcion"("taller_id")`);
    await queryRunner.query(`CREATE INDEX "idx_suscripcion_estado" ON "suscripcion"("estado")`);
    await queryRunner.query(`CREATE INDEX "idx_suscripcion_proximo_cobro" ON "suscripcion"("proximo_cobro") WHERE "estado" = 'activa'`);
    await queryRunner.query(`CREATE INDEX "idx_historial_pago_susc" ON "historial_pago_suscripcion"("suscripcion_id", "fecha_pago")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "auditoria_log" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "historial_email" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "checklist_recepcion" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "recordatorio" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "factura" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "pago" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "presupuesto" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "movimiento_stock" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ot_foto" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ot_detalle" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "orden_trabajo" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "repuesto" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "vehiculo" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "mecanico" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "proveedor" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cliente" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "usuario" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "historial_pago_suscripcion" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "suscripcion" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "taller" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "plan" CASCADE`);

    // Drop enums
    const enums = [
      'user_role', 'ot_estado', 'prioridad', 'tipo_vehiculo', 'combustible',
      'metodo_pago', 'suscripcion_estado', 'suscripcion_periodo', 'pago_suscripcion_estado',
      'presupuesto_estado', 'tipo_movimiento_stock', 'tipo_dte', 'tipo_foto_ot',
      'estado_checklist', 'zona_vehiculo', 'tipo_recordatorio', 'canal_recordatorio',
      'estado_recordatorio', 'tipo_email', 'estado_email', 'tipo_ot_detalle', 'tipo_cliente',
    ];
    for (const e of enums) {
      await queryRunner.query(`DROP TYPE IF EXISTS "${e}"`);
    }
  }
}
