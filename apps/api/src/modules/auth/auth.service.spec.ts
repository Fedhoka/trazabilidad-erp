import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { TenantsService } from '../tenants/tenants.service';
import { RedisService } from '../redis/redis.service';
import { EmailService } from '../email/email.service';
import { UserRole } from '../users/entities/user.entity';

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeUser(overrides = {}) {
  return {
    id: 'user-uuid',
    email: 'owner@acme.com',
    passwordHash: 'PLACEHOLDER', // replaced per-test with real argon2 hash
    role: UserRole.OWNER,
    tenantId: 'tenant-uuid',
    isActive: true,
    ...overrides,
  };
}

function makeService(overrides: {
  usersService?: Partial<UsersService>;
  tenantsService?: Partial<TenantsService>;
  jwtService?: Partial<JwtService>;
  configService?: Partial<ConfigService>;
  redis?: Partial<RedisService>;
  email?: Partial<EmailService>;
} = {}): AuthService {
  const users: Partial<UsersService> = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    forceResetPassword: jest.fn(),
    ...overrides.usersService,
  };

  const tenants: Partial<TenantsService> = {
    findBySlug: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ id: 'tenant-uuid', name: 'Acme' }),
    ...overrides.tenantsService,
  };

  const jwt: Partial<JwtService> = {
    sign: jest.fn().mockReturnValue('signed-token'),
    verify: jest.fn(),
    decode: jest.fn(),
    ...overrides.jwtService,
  };

  const config: Partial<ConfigService> = {
    get: jest.fn().mockReturnValue('secret'),
    ...overrides.configService,
  };

  const redis: Partial<RedisService> = {
    set: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(undefined),
    exists: jest.fn().mockResolvedValue(0),
    ...overrides.redis,
  };

  const email: Partial<EmailService> = {
    sendWelcome: jest.fn().mockResolvedValue(undefined),
    sendPasswordReset: jest.fn().mockResolvedValue(undefined),
    ...overrides.email,
  };

  return new AuthService(
    users as UsersService,
    tenants as TenantsService,
    jwt as JwtService,
    config as ConfigService,
    redis as RedisService,
    email as EmailService,
  );
}

// ─── login ────────────────────────────────────────────────────────────────────

describe('AuthService.login', () => {
  it('returns tokens when credentials are valid', async () => {
    const hash = await argon2.hash('correct-pass');
    const user = makeUser({ passwordHash: hash });
    const svc = makeService({ usersService: { findByEmail: jest.fn().mockResolvedValue(user) } });

    const result = await svc.login({ email: user.email, password: 'correct-pass' });

    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
  });

  it('throws UnauthorizedException when user not found', async () => {
    const svc = makeService({ usersService: { findByEmail: jest.fn().mockResolvedValue(null) } });
    await expect(svc.login({ email: 'x@x.com', password: 'pass' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException when password is wrong', async () => {
    const hash = await argon2.hash('correct-pass');
    const user = makeUser({ passwordHash: hash });
    const svc = makeService({ usersService: { findByEmail: jest.fn().mockResolvedValue(user) } });

    await expect(
      svc.login({ email: user.email, password: 'wrong-pass' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws UnauthorizedException when account is inactive', async () => {
    const hash = await argon2.hash('pass');
    const user = makeUser({ passwordHash: hash, isActive: false });
    const svc = makeService({ usersService: { findByEmail: jest.fn().mockResolvedValue(user) } });

    await expect(svc.login({ email: user.email, password: 'pass' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});

// ─── forgotPassword ───────────────────────────────────────────────────────────

describe('AuthService.forgotPassword', () => {
  it('returns undefined and does NOT throw when email is not registered', async () => {
    const svc = makeService({ usersService: { findByEmail: jest.fn().mockResolvedValue(null) } });
    await expect(svc.forgotPassword('unknown@x.com')).resolves.toBeUndefined();
  });

  it('stores a hashed token in Redis and sends an email when user exists', async () => {
    const user = makeUser();
    const redisSpy = jest.fn().mockResolvedValue(undefined);
    const emailSpy = jest.fn().mockResolvedValue(undefined);
    const svc = makeService({
      usersService: { findByEmail: jest.fn().mockResolvedValue(user) },
      redis: { set: redisSpy },
      email: { sendPasswordReset: emailSpy },
    });

    await svc.forgotPassword(user.email);

    // Redis must be called with the hashed key, not the raw token
    expect(redisSpy).toHaveBeenCalledTimes(1);
    const [key, value, ttl] = redisSpy.mock.calls[0];
    expect(key).toMatch(/^pwd:reset:[0-9a-f]{64}$/); // sha256 hex = 64 chars
    expect(value).toBe(user.id);
    expect(ttl).toBe(3600);

    // Email is sent fire-and-forget; the mock must be called
    // (await next tick so the void promise resolves)
    await Promise.resolve();
    expect(emailSpy).toHaveBeenCalledWith(user.email, expect.any(String));
  });
});

// ─── resetPassword ────────────────────────────────────────────────────────────

describe('AuthService.resetPassword', () => {
  it('throws BadRequestException when token does not exist in Redis', async () => {
    const svc = makeService({ redis: { get: jest.fn().mockResolvedValue(null) } });
    await expect(svc.resetPassword('invalid-token', 'newPass123')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('calls forceResetPassword and deletes the token on success', async () => {
    const forceReset = jest.fn().mockResolvedValue(undefined);
    const del = jest.fn().mockResolvedValue(undefined);
    const svc = makeService({
      usersService: { forceResetPassword: forceReset },
      redis: {
        get: jest.fn().mockResolvedValue('user-uuid'),
        del,
      },
    });

    await svc.resetPassword('valid-raw-token', 'newPass123');

    expect(forceReset).toHaveBeenCalledWith('user-uuid', 'newPass123');
    expect(del).toHaveBeenCalledTimes(1);
    // Token must be deleted using the *hashed* key, not the raw token
    expect(del.mock.calls[0][0]).toMatch(/^pwd:reset:[0-9a-f]{64}$/);
  });
});
