/**
 * Loaded via jest-e2e.json "setupFiles" — runs before each test file
 * in the E2E suite.  Sets process.env from .env.test so that NestJS
 * ConfigService / Joi validation see test-specific values (separate DB,
 * high throttle limit, etc.).
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.test') });
