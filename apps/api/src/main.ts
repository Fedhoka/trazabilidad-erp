import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import helmet from 'helmet';
import { AppModule } from './app.module';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Run any pending TypeORM migrations before accepting traffic.
  // This is idempotent — already-applied migrations are skipped.
  const ds = app.get(DataSource);
  const pending = await ds.showMigrations();
  if (pending) {
    logger.log('Running pending database migrations…');
    await ds.runMigrations();
    logger.log('Migrations complete.');
  }

  const isProduction = process.env.NODE_ENV === 'production';

  // ── Security headers ────────────────────────────────────────────────────────
  // Disable CSP in dev so Swagger UI (inline scripts) works.
  // In production CSP is active and Swagger is not mounted.
  app.use(
    helmet({
      contentSecurityPolicy: isProduction ? undefined : false,
    }),
  );

  // ── CORS ────────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  // ── Validation ──────────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // strip unknown properties
      forbidNonWhitelisted: true, // throw on unknown properties instead of silently stripping
      transform: true,           // auto-cast query params / body to DTO types
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Swagger (dev / staging only) ────────────────────────────────────────────
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('Trazabilidad ERP API')
      .setDescription('API para gestión de producción, trazabilidad y facturación AFIP')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(process.env.API_PORT ?? 4000);
  logger.log(`Application running on port ${process.env.API_PORT ?? 4000}`);
}
bootstrap();
