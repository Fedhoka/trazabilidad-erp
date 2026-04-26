import { NotFoundException } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';

function makeRepo(overrides: Record<string, jest.Mock> = {}) {
  return {
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
    findOne: jest.fn(),
    create: jest.fn((data) => data),
    save: jest.fn(async (entity) => ({ id: 'sup-uuid', ...entity })),
    ...overrides,
  };
}

function makeService(repoOverrides: Record<string, jest.Mock> = {}): SuppliersService {
  return new SuppliersService(makeRepo(repoOverrides) as any);
}

// ─── findAll ──────────────────────────────────────────────────────────────────

describe('SuppliersService.findAll', () => {
  it('returns paginated result', async () => {
    const rows = [{ id: '1', name: 'ACME' }];
    const svc = makeService({ findAndCount: jest.fn().mockResolvedValue([rows, 1]) });

    const result = await svc.findAll('tid', { page: 1, limit: 25 });

    expect(result.data).toHaveLength(1);
    expect(result.meta).toMatchObject({ total: 1, page: 1, limit: 25, totalPages: 1 });
  });
});

// ─── findOne ──────────────────────────────────────────────────────────────────

describe('SuppliersService.findOne', () => {
  it('returns the supplier when found', async () => {
    const supplier = { id: 'sup-1', name: 'ACME', tenantId: 'tid' };
    const svc = makeService({ findOne: jest.fn().mockResolvedValue(supplier) });

    const result = await svc.findOne('sup-1', 'tid');
    expect(result).toEqual(supplier);
  });

  it('throws NotFoundException when supplier does not exist', async () => {
    const svc = makeService({ findOne: jest.fn().mockResolvedValue(null) });
    await expect(svc.findOne('ghost', 'tid')).rejects.toBeInstanceOf(NotFoundException);
  });
});

// ─── create ───────────────────────────────────────────────────────────────────

describe('SuppliersService.create', () => {
  it('saves and returns the new supplier with tenantId attached', async () => {
    const svc = makeService();
    const result = await svc.create({ name: 'New Supplier' }, 'tid');

    expect(result).toMatchObject({ name: 'New Supplier', tenantId: 'tid' });
    expect(result).toHaveProperty('id');
  });
});

// ─── update ───────────────────────────────────────────────────────────────────

describe('SuppliersService.update', () => {
  it('merges the dto into the existing entity and saves', async () => {
    const existing = { id: 'sup-1', name: 'Old Name', tenantId: 'tid' };
    const saveMock = jest.fn().mockResolvedValue({ ...existing, name: 'New Name' });
    const svc = makeService({
      findOne: jest.fn().mockResolvedValue(existing),
      save: saveMock,
    });

    const result = await svc.update('sup-1', { name: 'New Name' }, 'tid');

    expect(saveMock).toHaveBeenCalledWith({ ...existing, name: 'New Name' });
    expect(result.name).toBe('New Name');
  });

  it('throws NotFoundException when supplier does not exist', async () => {
    const svc = makeService({ findOne: jest.fn().mockResolvedValue(null) });
    await expect(svc.update('ghost', { name: 'X' }, 'tid')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
