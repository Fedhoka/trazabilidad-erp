import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import { envValidationSchema } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { MaterialsModule } from './modules/materials/materials.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ProcurementModule } from './modules/procurement/procurement.module';
import { ProductionModule } from './modules/production/production.module';
import { SalesModule } from './modules/sales/sales.module';
import { FiscalModule } from './modules/fiscal/fiscal.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { RedisModule } from './modules/redis/redis.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { HealthModule } from './modules/health/health.module';
import { EmailModule } from './modules/email/email.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuditInterceptor } from './modules/audit/audit.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { TenantGuard } from './common/guards/tenant.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false, // report ALL missing vars at once, not just the first
        allowUnknown: true, // tolerate extra vars (e.g. PATH, HOME, etc.)
      },
    }),

    // ── Structured logging ───────────────────────────────────────────────────
    // JSON in production (queryable by CloudWatch / Datadog / Loki).
    // Pretty-printed in dev. Health-check requests are silenced to avoid noise.
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const isDev = cfg.get<string>('NODE_ENV') !== 'production';
        return {
          pinoHttp: {
            level: isDev ? 'debug' : 'info',
            transport: isDev
              ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
              : undefined,
            // Honour or generate a request-ID for end-to-end log correlation.
            genReqId: (req) =>
              (req.headers['x-request-id'] as string | undefined) ?? randomUUID(),
            // Never log auth tokens.
            redact: ['req.headers.authorization'],
            // Silence high-frequency health probes.
            autoLogging: {
              ignore: (req) => !!req.url?.includes('/health'),
            },
          },
        };
      },
    }),

    ScheduleModule.forRoot(),

    // Rate limiting — default: 120 requests per 60 s per IP.
    // Override per-route with @Throttle({ default: { limit, ttl } }).
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => [
        {
          name: 'default',
          ttl: cfg.get<number>('THROTTLE_TTL_MS') ?? 60_000,
          limit: cfg.get<number>('THROTTLE_LIMIT') ?? 120,
        },
      ],
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host: cfg.get('DB_HOST'),
        port: cfg.get<number>('DB_PORT'),
        username: cfg.get('DB_USER'),
        password: cfg.get('DB_PASSWORD'),
        database: cfg.get('DB_NAME'),
        synchronize: false, // always use migrations — never enable in production
        logging: cfg.get('DB_LOGGING') === 'true',
        autoLoadEntities: true,
      }),
    }),

    AuthModule,
    UsersModule,
    TenantsModule,
    SuppliersModule,
    MaterialsModule,
    InventoryModule,
    ProcurementModule,
    ProductionModule,
    SalesModule,
    FiscalModule,
    DashboardModule,
    ReportsModule,
    RedisModule,
    SchedulerModule,
    HealthModule,
    EmailModule,
    AuditModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: TenantGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
