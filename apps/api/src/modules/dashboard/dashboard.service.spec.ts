import { DataSource } from 'typeorm';
import { DashboardService } from './dashboard.service';

/**
 * Pure unit tests — DataSource is mocked, no DB connection required.
 * The SQL itself is not exercised; we only verify that the service shapes
 * the response and computes derived fields (margin, totals, marginPercent)
 * correctly given a representative result set.
 */

function makeService(rows: unknown[]) {
  const ds = {
    query: jest.fn().mockResolvedValue(rows),
  } as unknown as DataSource;
  return { service: new DashboardService(ds), query: ds.query as jest.Mock };
}

describe('DashboardService.getStats', () => {
  const TENANT = '00000000-0000-0000-0000-000000000001';

  it('passes the requested months count to the SQL parameter', async () => {
    const { service, query } = makeService([]);
    await service.getStats(TENANT, 6);

    const params = query.mock.calls[0][1];
    expect(params).toEqual([TENANT, 6]);
  });

  it('defaults to 12 months when none specified', async () => {
    const { service, query } = makeService([]);
    await service.getStats(TENANT);

    expect(query.mock.calls[0][1][1]).toBe(12);
  });

  it('shapes raw rows into MonthlyStatPoints with computed margin', async () => {
    const { service } = makeService([
      {
        month: '2026-01',
        revenue: '1000.00',
        invoice_count: '3',
        costs: '600.00',
        units_produced: '50.0000',
        purchases: '200.00',
      },
      {
        month: '2026-02',
        revenue: '1500.00',
        invoice_count: '4',
        costs: '900.00',
        units_produced: '75.0000',
        purchases: '0',
      },
    ]);

    const stats = await service.getStats(TENANT, 2);

    expect(stats.months).toHaveLength(2);
    expect(stats.months[0]).toEqual({
      month: '2026-01',
      revenue: 1000,
      invoiceCount: 3,
      costs: 600,
      unitsProduced: 50,
      purchases: 200,
      margin: 400,
    });
    expect(stats.months[1]!.margin).toBe(600);
  });

  it('aggregates totals across all months in the window', async () => {
    const { service } = makeService([
      {
        month: '2026-01',
        revenue: '1000',
        invoice_count: '3',
        costs: '600',
        units_produced: '50',
        purchases: '200',
      },
      {
        month: '2026-02',
        revenue: '1500',
        invoice_count: '4',
        costs: '900',
        units_produced: '75',
        purchases: '300',
      },
    ]);

    const stats = await service.getStats(TENANT, 2);

    expect(stats.totals).toEqual({
      revenue: 2500,
      costs: 1500,
      margin: 1000,
      invoiceCount: 7,
      unitsProduced: 125,
      purchases: 500,
    });
  });

  it('computes marginPercent correctly', async () => {
    const { service } = makeService([
      {
        month: '2026-01',
        revenue: '1000',
        invoice_count: '1',
        costs: '750',
        units_produced: '0',
        purchases: '0',
      },
    ]);

    const stats = await service.getStats(TENANT, 1);
    // (1000 - 750) / 1000 * 100 = 25
    expect(stats.marginPercent).toBeCloseTo(25);
  });

  it('returns marginPercent = 0 when revenue is zero (avoids div-by-zero)', async () => {
    const { service } = makeService([
      {
        month: '2026-01',
        revenue: '0',
        invoice_count: '0',
        costs: '500',
        units_produced: '0',
        purchases: '0',
      },
    ]);

    const stats = await service.getStats(TENANT, 1);
    expect(stats.marginPercent).toBe(0);
    // Negative margin still surfaces in totals
    expect(stats.totals.margin).toBe(-500);
  });

  it('returns an empty months array and zero totals for a tenant with no data', async () => {
    // The SQL would still return 12 rows of zeros via generate_series, but for
    // the unit test we simulate an empty result to verify defensive defaults.
    const { service } = makeService([]);
    const stats = await service.getStats(TENANT, 12);

    expect(stats.months).toEqual([]);
    expect(stats.totals).toEqual({
      revenue: 0,
      costs: 0,
      margin: 0,
      invoiceCount: 0,
      unitsProduced: 0,
      purchases: 0,
    });
    expect(stats.marginPercent).toBe(0);
  });
});
