import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { UsersService } from './users.service';
import { UserRole } from './entities/user.entity';

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeRepo(overrides: Record<string, jest.Mock> = {}) {
  return {
    findOne: jest.fn(),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
    create: jest.fn((data) => data),
    save: jest.fn(async (entity) => ({ id: 'new-uuid', ...entity })),
    ...overrides,
  };
}

function makeService(repoOverrides: Record<string, jest.Mock> = {}): UsersService {
  const repo = makeRepo(repoOverrides) as any;
  return new UsersService(repo);
}

// ─── invite ───────────────────────────────────────────────────────────────────

describe('UsersService.invite', () => {
  it('creates and returns the user (without passwordHash) on success', async () => {
    const svc = makeService({ findOne: jest.fn().mockResolvedValue(null) });
    const result = await svc.invite(
      { email: 'new@acme.com', password: 'secret123', role: UserRole.OPERATOR },
      'tenant-uuid',
    );
    expect(result).toHaveProperty('id');
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('throws ConflictException when email is already in use', async () => {
    const svc = makeService({
      findOne: jest.fn().mockResolvedValue({ id: 'existing' }),
    });
    await expect(
      svc.invite({ email: 'dup@acme.com', password: 'secret123', role: UserRole.OPERATOR }, 't'),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

// ─── changePassword ───────────────────────────────────────────────────────────

describe('UsersService.changePassword', () => {
  it('saves a new hash when current password is correct', async () => {
    const hash = await argon2.hash('current-pass');
    const user = { id: 'u1', passwordHash: hash };
    const saveMock = jest.fn().mockResolvedValue(user);
    const svc = makeService({
      findOne: jest.fn().mockResolvedValue(user),
      save: saveMock,
    });

    await svc.changePassword('u1', 'current-pass', 'new-pass-123');

    expect(saveMock).toHaveBeenCalledTimes(1);
    const saved = saveMock.mock.calls[0][0];
    // The stored hash must not equal the old one
    expect(saved.passwordHash).not.toBe(hash);
  });

  it('throws BadRequestException when current password is wrong', async () => {
    const hash = await argon2.hash('correct-pass');
    const svc = makeService({
      findOne: jest.fn().mockResolvedValue({ id: 'u1', passwordHash: hash }),
    });

    await expect(
      svc.changePassword('u1', 'wrong-pass', 'new-pass-123'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws NotFoundException when user does not exist', async () => {
    const svc = makeService({ findOne: jest.fn().mockResolvedValue(null) });
    await expect(
      svc.changePassword('ghost', 'any', 'any'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

// ─── updateRole ───────────────────────────────────────────────────────────────

describe('UsersService.updateRole', () => {
  it('throws NotFoundException when user not in tenant', async () => {
    const svc = makeService({ findOne: jest.fn().mockResolvedValue(null) });
    await expect(
      svc.updateRole('ghost', UserRole.PROCUREMENT, 'tenant'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('persists the new role', async () => {
    const user = { id: 'u1', role: UserRole.OPERATOR, tenantId: 'tid', passwordHash: 'x' };
    const saveMock = jest.fn().mockResolvedValue({ ...user, role: UserRole.PROCUREMENT });
    const svc = makeService({
      findOne: jest.fn().mockResolvedValue(user),
      save: saveMock,
    });

    const result = await svc.updateRole('u1', UserRole.PROCUREMENT, 'tid');

    expect(saveMock).toHaveBeenCalledWith({ ...user, role: UserRole.PROCUREMENT });
    expect(result).not.toHaveProperty('passwordHash');
  });
});
