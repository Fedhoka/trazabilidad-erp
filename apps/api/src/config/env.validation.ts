import * as Joi from 'joi';

/**
 * Joi schema for all environment variables.
 * The app throws a descriptive error at startup if any rule is violated.
 * Variables with .default() are optional at runtime; variables without are required.
 */
export const envValidationSchema = Joi.object({
  // ── Runtime ────────────────────────────────────────────────────────────────
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // ── Database ───────────────────────────────────────────────────────────────
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().integer().min(1).max(65535).default(5432),
  DB_USER: Joi.string().default('trazabilidad'),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().default('trazabilidad'),
  DB_LOGGING: Joi.boolean().default(false),

  // ── API server ─────────────────────────────────────────────────────────────
  API_PORT: Joi.number().integer().min(1).max(65535).default(4000),
  CORS_ORIGINS: Joi.string().default('http://localhost:3000'),

  // ── Rate limiting ──────────────────────────────────────────────────────────
  THROTTLE_TTL_MS: Joi.number().integer().min(1000).default(60_000),
  THROTTLE_LIMIT: Joi.number().integer().min(1).default(120),

  // ── JWT ────────────────────────────────────────────────────────────────────
  JWT_SECRET: Joi.string().min(32).required().messages({
    'string.min': 'JWT_SECRET must be at least 32 characters (security requirement)',
    'any.required': 'JWT_SECRET is required',
  }),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required().messages({
    'string.min': 'JWT_REFRESH_SECRET must be at least 32 characters (security requirement)',
    'any.required': 'JWT_REFRESH_SECRET is required',
  }),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // ── AFIP / ARCA ────────────────────────────────────────────────────────────
  AFIP_ENV: Joi.string()
    .valid('mock', 'homologacion', 'produccion')
    .default('mock'),
  // Required only when AFIP_ENV is not 'mock'
  AFIP_CERT_PATH: Joi.when('AFIP_ENV', {
    is: Joi.valid('homologacion', 'produccion'),
    then: Joi.string().required().messages({
      'any.required': 'AFIP_CERT_PATH is required when AFIP_ENV is homologacion or produccion',
    }),
    otherwise: Joi.string().optional(),
  }),
  AFIP_KEY_PATH: Joi.when('AFIP_ENV', {
    is: Joi.valid('homologacion', 'produccion'),
    then: Joi.string().required().messages({
      'any.required': 'AFIP_KEY_PATH is required when AFIP_ENV is homologacion or produccion',
    }),
    otherwise: Joi.string().optional(),
  }),
  AFIP_CUIT: Joi.when('AFIP_ENV', {
    is: Joi.valid('homologacion', 'produccion'),
    then: Joi.string().required().messages({
      'any.required': 'AFIP_CUIT is required when AFIP_ENV is homologacion or produccion',
    }),
    otherwise: Joi.string().optional(),
  }),

  // ── Redis ──────────────────────────────────────────────────────────────────
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().integer().min(1).max(65535).default(6379),

  // ── PDF / Company ──────────────────────────────────────────────────────────
  COMPANY_ADDRESS: Joi.string().optional(),

  // ── Email / SMTP ───────────────────────────────────────────────────────────
  // All optional — if SMTP_HOST is absent, emails are logged to console (dev).
  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().integer().default(587),
  SMTP_SECURE: Joi.boolean().default(false),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASS: Joi.string().optional(),
  EMAIL_FROM: Joi.string().optional(),
  APP_URL: Joi.string().uri().default('http://localhost:3000'),
});
