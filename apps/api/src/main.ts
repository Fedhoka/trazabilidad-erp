import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
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
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000'],
  });

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

  await app.listen(process.env.API_PORT ?? 4000);
}
bootstrap();
