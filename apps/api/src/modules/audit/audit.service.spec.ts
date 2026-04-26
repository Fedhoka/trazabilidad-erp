import { AuditService } from './audit.service';
import { AuditAction } from './entities/audit-log.entity';

function makeRepo(overrides: Record<string, jest.Mock> = {}) {
  return {
    create: jest.fn((data) => data),
    save: jest.fn().mockResolvedValue({}),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
    ...overrides,
  };
}

function makeService(repoOverrides: Record<string, jest.Mock> = {}): AuditService {
  return new AuditService(makeRepo(repoOverrides) as any);
}

// ─── log ──────────────────────────────────────────────────────────────────────

describe('AuditService.log', () => {
  it('calls repo.save with the correct entity shape', async () => {
    const saveMock = jest.fn().mockResolvedValue({});
    const svc = makeService({ save: saveMock });

    svc.log({
      tenantId: 'tid',
      userId: 'uid',
      userEmail: 'user@acme.com',
      action: AuditAction.CREATE,
      entity: 'suppliers',
      entityId: 'sup-1',
      metadata: { name: 'ACME' },
      ipAddress: '127.0.0.1',
    });

    // log() is fire-and-forget — await one tick so the internal promise starts
    await new Promise(process.nextTick);

    expect(saveMock).toHaveBeenCalledTimes(1);
    const [record] = saveMock.mock.calls[0];
    expect(record).toMatchObject({
      tenantId: 'tid',
      userId: 'uid',
      action: AuditAction.CREATE,
      entity: 'suppliers',
    });
  });

  it('does NOT throw when repo.save rejects', () => {
    const svc = makeService({ save: jest.fn().mockRejectedValue(new Error('DB down')) });

    // Must not throw — fire-and-forget
    expect(() =>
      svc.log({
        tenantId: 'tid',
        userId: null,
        action: AuditAction.DELETE,
        entity: 'materials',
      }),
    ).not.toThrow();
  });
});

// ─── findByTenant ─────────────────────────────────────────────────────────────

describe('AuditService.findByTenant', () => {
  it('returns paginated data and meta', async () => {
    const fakeRows = [{ id: '1' }, { id: '2' }];
    const svc = makeService({ findAndCount: jest.fn().mockResolvedValue([fakeRows, 2]) });

    const result = await svc.findByTenant('tid', { page: 1, limit: 25 });

    expect(result.data).toHaveLength(2);
    expect(result.meta).toMatchObject({ total: 2, page: 1, limit: 25, totalPages: 1 });
  });
});
