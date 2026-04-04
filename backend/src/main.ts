import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { DataSource } from 'typeorm';
import { ensureDemoData } from './database/seeds/ensure-demo-data.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const allowedOrigins = (
    process.env.CORS_ORIGINS ??
    process.env.APP_URL ??
    'http://localhost:5173'
  )
    .split(',')
    .map((o) => o.trim());

  // Always allow the main domain variants
  for (const domain of ['https://roadix.cl', 'https://www.roadix.cl']) {
    if (!allowedOrigins.includes(domain)) allowedOrigins.push(domain);
  }

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  if (process.env.NODE_ENV === 'production' || process.env.DEMO_SEED === 'true') {
    try {
      const dataSource = app.get(DataSource);
      await ensureDemoData(dataSource);
      // Ensure admin user is superadmin
      await dataSource.query(
        `UPDATE "usuario" SET "rol" = 'superadmin' WHERE "email" IN ('admin', 'admin@roadix.cl') AND "rol" != 'superadmin'`,
      );
    } catch (error) {
      console.error('[SEED] Skipped:', (error as Error).message);
    }
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
