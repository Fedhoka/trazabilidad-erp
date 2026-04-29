import { DataSource } from 'typeorm';
import { DashboardService } from './dashboard.service';
import type { FixedCostsService } from '../fixed-costs/fixed-costs.service';

/**
 * Pure unit tests — DataSource is mocked, no DB connection required.
 * The SQL itself is not exercised; we only verify that the service shapes
 * the response and computes derived fields (margin, totals, marginPercent)
 * correctly given a representative result set.
 */

function makeFixedCostsStub(monthlyTotal = 0): FixedCostsService {
  return {
    sumActiveMonthly: jest.fn().mockResolvedValue(monthlyTotal),
  } as unknown as FixedCostsService;
}

function makeService(rows: unknown[]) {
  const ds = {
    query: jest.fn().mockResolvedValue(rows),
  } as unknown as DataSource;
  return {
    service: new DashboardService(ds, makeFixedCostsStub()),
    query: ds.query as jest.Mock,
  };
}

/** Helper for getInventoryAnalytics which makes 4 parallel queries. */
function makeInventoryService(
  stockByKind: unknown[],
  lowStock: unknown[],
  expiringByDay: unknown[],
  buckets: unknown[],
) {
  const queue = [stockByKind, lowStock, expiringByDay, buckets];
  const ds = {
    query: jest.fn().mockImplementation(() => Promise.resolve(queue.shift() ?? [])),
  } as unknown as DataSource;
  return {
    service: new DashboardService(ds, makeFixedCostsStub()),
    query: ds.query as jest.Mock,
  };
}

/** Helper for getSalesAnalytics which makes 4 parallel queries. */
function makeSalesService(
  topCustomers: unknown[],
  topProducts: unknown[],
  byCondicion: unknown[],
  ticket: unknown[],
) {
  const queue = [topCustomers, topProducts, byCondicion, ticket];
  const ds = {
    query: jest.fn().mockImplementation(() => Promise.resolve(queue.shift() ?? [])),
  } as unknown as DataSource;
  return {
    service: new DashboardService(ds, makeFixedCostsStub()),
    query: ds.query as jest.Mock,
  };
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

  it('returns empty inventory analytics for a tenant with no stock', async () => {
    const { service } = makeInventoryService([], [], [], []);
    const a = await service.getInventoryAnalytics('tenant-1');
    expect(a.stockByKind).toEqual([]);
    expect(a.lowStock).toEqual([]);
    expect(a.expiringByDay).toEqual([]);
    expect(a.expiringBuckets).toEqual({
      within7: 0,
      within14: 0,
      within30: 0,
      value7: 0,
      value14: 0,
      value30: 0,
    });
  });

  it('shapes inventory analytics rows into typed objects', async () => {
    const { service } = makeInventoryService(
      [
        { kind: 'RAW', value: '15000.00', lots: '8', units: '420.0000' },
        { kind: 'FINISHED', value: '4500.00', lots: '3', units: '60.0000' },
      ],
      [
        {
          id: 'm1',
          code: 'HAR-0000',
          name: 'Harina 0000',
          kind: 'RAW',
          base_uom: 'kg',
          available: '12.5',
        },
      ],
      [
        { date: '2026-05-02', count: '2', value: '500.00' },
        { date: '2026-05-09', count: '5', value: '1200.00' },
      ],
      [
        {
          within_7: 2,
          within_14: 5,
          within_30: 0,
          value_7: '500.00',
          value_14: '1200.00',
          value_30: '0',
        },
      ],
    );

    const a = await service.getInventoryAnalytics('tenant-1');

    expect(a.stockByKind).toEqual([
      { kind: 'RAW', value: 15000, lots: 8, units: 420 },
      { kind: 'FINISHED', value: 4500, lots: 3, units: 60 },
    ]);
    expect(a.lowStock[0]).toEqual({
      id: 'm1',
      code: 'HAR-0000',
      name: 'Harina 0000',
      kind: 'RAW',
      baseUom: 'kg',
      available: 12.5,
    });
    expect(a.expiringByDay).toHaveLength(2);
    expect(a.expiringByDay[1]).toEqual({
      date: '2026-05-09',
      count: 5,
      value: 1200,
    });
    expect(a.expiringBuckets.within7).toBe(2);
    expect(a.expiringBuckets.value14).toBe(1200);
  });

  it('shapes sales analytics rows correctly', async () => {
    const { service } = makeSalesService(
      [
        {
          id: 'c1',
          name: 'Cliente A',
          condicion_iva: 'RI',
          revenue: '12000.50',
          invoice_count: '8',
        },
        {
          id: 'c2',
          name: 'Cliente B',
          condicion_iva: 'CF',
          revenue: '5400.00',
          invoice_count: '3',
        },
      ],
      [
        { id: 'm1', code: 'EMP-001', name: 'Empanada carne', units: '120', revenue: '14400.00' },
        { id: 'm2', code: 'EMP-002', name: 'Empanada pollo', units: '80', revenue: '9600.00' },
      ],
      [
        { condicion_iva: 'RI', customers: '5', revenue: '12000.50', invoice_count: '8' },
        { condicion_iva: 'CF', customers: '20', revenue: '5400.00', invoice_count: '3' },
        { condicion_iva: 'MONO', customers: '2', revenue: '0', invoice_count: '0' },
      ],
      [
        { total_revenue: '17400.50', invoice_count: '11', avg_ticket: '1581.86' },
      ],
    );

    const a = await service.getSalesAnalytics('tenant-1');

    expect(a.topCustomers).toHaveLength(2);
    expect(a.topCustomers[0]).toEqual({
      id: 'c1',
      name: 'Cliente A',
      condicionIva: 'RI',
      revenue: 12000.5,
      invoiceCount: 8,
    });
    expect(a.topProducts[0]!.code).toBe('EMP-001');
    expect(a.topProducts[0]!.units).toBe(120);
    expect(a.byCondicionIva).toHaveLength(3);
    expect(a.byCondicionIva[2]).toEqual({
      condicionIva: 'MONO',
      customers: 2,
      revenue: 0,
      invoiceCount: 0,
    });
    expect(a.ticket).toEqual({
      totalRevenue: 17400.5,
      invoiceCount: 11,
      average: 1581.86,
    });
  });

  it('returns zero ticket when there are no authorized invoices', async () => {
    const { service } = makeSalesService([], [], [], []);
    const a = await service.getSalesAnalytics('tenant-1');
    expect(a.ticket).toEqual({
      totalRevenue: 0,
      invoiceCount: 0,
      average: 0,
    });
    expect(a.topCustomers).toEqual([]);
    expect(a.topProducts).toEqual([]);
    expect(a.byCondicionIva).toEqual([]);
  });

  describe('break-even', () => {
    /** Build a service whose getStats returns a controlled DashboardStats. */
    function makeBreakEvenService(
      monthlyFixedCosts: number,
      totals: {
        revenue: number;
        costs: number;
        unitsProduced: number;
      },
    ) {
      // Stats query expects rows that the service will reduce into totals.
      // Easiest: hand the service rows that sum exactly to the desired totals.
      const ds = {
        query: jest.fn().mockResolvedValue([
          {
            month: '2026-04',
            revenue: String(totals.revenue),
            invoice_count: '1',
            costs: String(totals.costs),
            units_produced: String(totals.unitsProduced),
            purchases: '0',
          },
        ]),
      } as unknown as DataSource;
      const fc = makeFixedCostsStub(monthlyFixedCosts);
      return new DashboardService(ds, fc);
    }

    it('computes break-even metrics from stats + fixed costs', async () => {
      // 12 months window with totals: revenue 120k, costs 72k, 1200 units.
      // marginPercent = (120 - 72) / 120 = 40%
      // avgUnitPrice = 120000 / 1200 = 100
      // avgUnitCost  = 72000 / 1200  = 60
      // contribution = 40
      // monthly fixed = 5000
      // breakEvenRevenue = 5000 / 0.4 = 12500
      // breakEvenUnits   = 5000 / 40   = 125
      // currentMonthlyRevenue = 120000 / 12 = 10000
      // coverage = 10000 / 12500 = 0.8
      const service = makeBreakEvenService(5000, {
        revenue: 120000,
        costs: 72000,
        unitsProduced: 1200,
      });

      const r = await service.getBreakEven('tenant-1', 12);

      expect(r.monthlyFixedCosts).toBe(5000);
      expect(r.windowMonths).toBe(12);
      expect(r.avgMarginPercent).toBeCloseTo(40);
      expect(r.avgUnitPrice).toBeCloseTo(100);
      expect(r.avgUnitCost).toBeCloseTo(60);
      expect(r.contributionPerUnit).toBeCloseTo(40);
      expect(r.breakEvenRevenue).toBeCloseTo(12500);
      expect(r.breakEvenUnits).toBeCloseTo(125);
      expect(r.currentMonthlyRevenue).toBeCloseTo(10000);
      expect(r.coverage).toBeCloseTo(0.8);
    });

    it('surfaces null computed fields when revenue is zero', async () => {
      const service = makeBreakEvenService(5000, {
        revenue: 0,
        costs: 0,
        unitsProduced: 0,
      });
      const r = await service.getBreakEven('tenant-1', 12);

      expect(r.avgMarginPercent).toBeNull();
      expect(r.avgUnitPrice).toBeNull();
      expect(r.avgUnitCost).toBeNull();
      expect(r.contributionPerUnit).toBeNull();
      expect(r.breakEvenRevenue).toBeNull();
      expect(r.breakEvenUnits).toBeNull();
      expect(r.coverage).toBeNull();
    });

    it('returns null break-even when margin is non-positive', async () => {
      // Selling at a loss: revenue=100, costs=120 → margin -20%.
      const service = makeBreakEvenService(5000, {
        revenue: 100,
        costs: 120,
        unitsProduced: 10,
      });
      const r = await service.getBreakEven('tenant-1', 1);

      expect(r.avgMarginPercent).toBeCloseTo(-20);
      // Margin <= 0 → cannot break even. Both null.
      expect(r.breakEvenRevenue).toBeNull();
      expect(r.breakEvenUnits).toBeNull();
    });
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
