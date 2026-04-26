import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { randomUUID } from 'crypto';
import * as argon2 from 'argon2';
import AppDataSource from './data-source';
import { Tenant } from '../modules/tenants/entities/tenant.entity';
import { User, UserRole } from '../modules/users/entities/user.entity';
import { Supplier } from '../modules/suppliers/entities/supplier.entity';
import { Location } from '../modules/inventory/entities/location.entity';
import { Material, MaterialKind } from '../modules/materials/entities/material.entity';
import { PurchaseOrder, PurchaseOrderStatus } from '../modules/procurement/entities/purchase-order.entity';
import { PurchaseOrderLine } from '../modules/procurement/entities/purchase-order-line.entity';
import { GoodsReceipt } from '../modules/procurement/entities/goods-receipt.entity';
import { GoodsReceiptLine, QcStatus } from '../modules/procurement/entities/goods-receipt-line.entity';
import { MaterialLot, LotStatus } from '../modules/inventory/entities/material-lot.entity';
import { Recipe, RecipeStatus } from '../modules/production/entities/recipe.entity';
import { RecipeComponent } from '../modules/production/entities/recipe-component.entity';
import { ProductionOrder, ProductionOrderStatus } from '../modules/production/entities/production-order.entity';
import { ProductionConsumption } from '../modules/production/entities/production-consumption.entity';
import { FinishedLot } from '../modules/production/entities/finished-lot.entity';
import { Customer, CondicionIva } from '../modules/sales/entities/customer.entity';
import { SalesOrder, SalesOrderStatus } from '../modules/sales/entities/sales-order.entity';
import { SalesOrderLine } from '../modules/sales/entities/sales-order-line.entity';
import { PointOfSale } from '../modules/fiscal/entities/point-of-sale.entity';
import { Invoice, InvoiceType, InvoiceStatus } from '../modules/fiscal/entities/invoice.entity';
import { InvoiceLine } from '../modules/fiscal/entities/invoice-line.entity';
import { FiscalCounter } from '../modules/fiscal/entities/fiscal-counter.entity';

async function seed() {
  await AppDataSource.initialize();
  const m = AppDataSource.manager;

  // ── Guard: skip if already seeded ──────────────────────────────────────
  const existing = await m.findOne(Tenant, { where: { slug: 'la-empanada-gourmet' } });
  if (existing) {
    console.log('✓ Seed data already present — skipping.');
    await AppDataSource.destroy();
    return;
  }

  console.log('Seeding demo data…');

  // ── Tenant + User ───────────────────────────────────────────────────────
  const tenantId = randomUUID();
  await m.save(Tenant, { id: tenantId, name: 'La Empanada Gourmet', slug: 'la-empanada-gourmet', isActive: true });

  const passwordHash = await argon2.hash('Demo1234!');
  await m.save(User, {
    id: randomUUID(), tenantId,
    email: 'admin@empanada.com', passwordHash,
    role: UserRole.OWNER, isActive: true,
  });

  // ── Suppliers ───────────────────────────────────────────────────────────
  const [sup1, sup2] = await m.save(Supplier, [
    { id: randomUUID(), tenantId, name: 'Carnes del Sur S.A.', cuit: '30-12345678-9', isActive: true },
    { id: randomUUID(), tenantId, name: 'Distribuidora Láctea S.R.L.', cuit: '30-98765432-1', isActive: true },
  ]);

  // ── Location ────────────────────────────────────────────────────────────
  const [loc] = await m.save(Location, [
    { id: randomUUID(), tenantId, name: 'Cámara Frigorífica', code: 'CAM-01', isActive: true },
  ]);

  // ── Materials ───────────────────────────────────────────────────────────
  const [matMasa, matCarne, matJam, matQso, matBdj, matEmpCarne, matEmpJyq] = await m.save(Material, [
    { id: randomUUID(), tenantId, name: 'Masa para empanada', code: 'MAT-001', kind: MaterialKind.RAW, baseUom: 'kg', shelfLifeDays: 45, avgCost: 0, isActive: true },
    { id: randomUUID(), tenantId, name: 'Carne vacuna molida', code: 'MAT-002', kind: MaterialKind.RAW, baseUom: 'kg', shelfLifeDays: 10, avgCost: 0, isActive: true },
    { id: randomUUID(), tenantId, name: 'Jamón cocido', code: 'MAT-003', kind: MaterialKind.RAW, baseUom: 'kg', shelfLifeDays: 15, avgCost: 0, isActive: true },
    { id: randomUUID(), tenantId, name: 'Queso mozzarella', code: 'MAT-004', kind: MaterialKind.RAW, baseUom: 'kg', shelfLifeDays: 20, avgCost: 0, isActive: true },
    { id: randomUUID(), tenantId, name: 'Bandeja PS x12', code: 'MAT-005', kind: MaterialKind.PACKAGING, baseUom: 'unid', shelfLifeDays: null, avgCost: 0, isActive: true },
    { id: randomUUID(), tenantId, name: 'Empanada de carne congelada', code: 'EMP-001', kind: MaterialKind.FINISHED, baseUom: 'unid', shelfLifeDays: 180, avgCost: 0, isActive: true },
    { id: randomUUID(), tenantId, name: 'Empanada jamón-queso congelada', code: 'EMP-002', kind: MaterialKind.FINISHED, baseUom: 'unid', shelfLifeDays: 180, avgCost: 0, isActive: true },
  ]);

  // ── Purchase Order 1 (Carnes del Sur — masa + carne) ────────────────────
  const po1 = await m.save(PurchaseOrder, {
    id: randomUUID(), tenantId, number: 1, supplierId: sup1.id,
    status: PurchaseOrderStatus.RECEIVED, notes: 'Compra mensual insumos cárnicos',
  });
  const [pol1a, pol1b] = await m.save(PurchaseOrderLine, [
    { id: randomUUID(), tenantId, purchaseOrderId: po1.id, materialId: matMasa.id, quantity: 50, unitPrice: 320, receivedQty: 50 },
    { id: randomUUID(), tenantId, purchaseOrderId: po1.id, materialId: matCarne.id, quantity: 30, unitPrice: 1850, receivedQty: 30 },
  ]);

  // ── Purchase Order 2 (Distribuidora Láctea — jamón + queso + bandeja) ───
  const po2 = await m.save(PurchaseOrder, {
    id: randomUUID(), tenantId, number: 2, supplierId: sup2.id,
    status: PurchaseOrderStatus.RECEIVED, notes: null,
  });
  const [pol2a, pol2b, pol2c] = await m.save(PurchaseOrderLine, [
    { id: randomUUID(), tenantId, purchaseOrderId: po2.id, materialId: matJam.id, quantity: 20, unitPrice: 2200, receivedQty: 20 },
    { id: randomUUID(), tenantId, purchaseOrderId: po2.id, materialId: matQso.id, quantity: 15, unitPrice: 1600, receivedQty: 15 },
    { id: randomUUID(), tenantId, purchaseOrderId: po2.id, materialId: matBdj.id, quantity: 200, unitPrice: 85, receivedQty: 200 },
  ]);

  // ── Goods Receipt 1 ─────────────────────────────────────────────────────
  const gr1 = await m.save(GoodsReceipt, {
    id: randomUUID(), tenantId, purchaseOrderId: po1.id,
    receivedAt: new Date(), notes: null,
  });

  const lot1Masa = await m.save(MaterialLot, {
    id: randomUUID(), tenantId, lotCode: 'LOT-MASA-001', materialId: matMasa.id,
    supplierId: sup1.id, quantity: 50, unitCost: 320,
    status: LotStatus.AVAILABLE, locationId: loc.id,
    expiresOn: new Date(Date.now() + 40 * 864e5), receivedAt: new Date(),
    goodsReceiptLineId: null,
  });
  const lot1Carne = await m.save(MaterialLot, {
    id: randomUUID(), tenantId, lotCode: 'LOT-CARNE-001', materialId: matCarne.id,
    supplierId: sup1.id, quantity: 30, unitCost: 1850,
    status: LotStatus.AVAILABLE, locationId: loc.id,
    expiresOn: new Date(Date.now() + 8 * 864e5), receivedAt: new Date(),
    goodsReceiptLineId: null,
  });

  const [grl1a, grl1b] = await m.save(GoodsReceiptLine, [
    { id: randomUUID(), tenantId, goodsReceiptId: gr1.id, purchaseOrderLineId: pol1a.id, materialId: matMasa.id, quantity: 50, unitCost: 320, lotCode: 'LOT-MASA-001', expiresOn: lot1Masa.expiresOn, qcStatus: QcStatus.PASS, qcNotes: null, materialLotId: lot1Masa.id },
    { id: randomUUID(), tenantId, goodsReceiptId: gr1.id, purchaseOrderLineId: pol1b.id, materialId: matCarne.id, quantity: 30, unitCost: 1850, lotCode: 'LOT-CARNE-001', expiresOn: lot1Carne.expiresOn, qcStatus: QcStatus.PASS, qcNotes: null, materialLotId: lot1Carne.id },
  ]);

  // ── Goods Receipt 2 ─────────────────────────────────────────────────────
  const gr2 = await m.save(GoodsReceipt, {
    id: randomUUID(), tenantId, purchaseOrderId: po2.id,
    receivedAt: new Date(), notes: null,
  });

  const lot2Jam = await m.save(MaterialLot, { id: randomUUID(), tenantId, lotCode: 'LOT-JAM-001', materialId: matJam.id, supplierId: sup2.id, quantity: 20, unitCost: 2200, status: LotStatus.AVAILABLE, locationId: loc.id, expiresOn: new Date(Date.now() + 12 * 864e5), receivedAt: new Date(), goodsReceiptLineId: null });
  const lot2Qso = await m.save(MaterialLot, { id: randomUUID(), tenantId, lotCode: 'LOT-QSO-001', materialId: matQso.id, supplierId: sup2.id, quantity: 15, unitCost: 1600, status: LotStatus.AVAILABLE, locationId: loc.id, expiresOn: new Date(Date.now() + 18 * 864e5), receivedAt: new Date(), goodsReceiptLineId: null });
  const lot2Bdj = await m.save(MaterialLot, { id: randomUUID(), tenantId, lotCode: 'LOT-BDJ-001', materialId: matBdj.id, supplierId: sup2.id, quantity: 200, unitCost: 85, status: LotStatus.AVAILABLE, locationId: loc.id, expiresOn: null, receivedAt: new Date(), goodsReceiptLineId: null });

  await m.save(GoodsReceiptLine, [
    { id: randomUUID(), tenantId, goodsReceiptId: gr2.id, purchaseOrderLineId: pol2a.id, materialId: matJam.id, quantity: 20, unitCost: 2200, lotCode: 'LOT-JAM-001', expiresOn: lot2Jam.expiresOn, qcStatus: QcStatus.PASS, qcNotes: null, materialLotId: lot2Jam.id },
    { id: randomUUID(), tenantId, goodsReceiptId: gr2.id, purchaseOrderLineId: pol2b.id, materialId: matQso.id, quantity: 15, unitCost: 1600, lotCode: 'LOT-QSO-001', expiresOn: lot2Qso.expiresOn, qcStatus: QcStatus.PASS, qcNotes: null, materialLotId: lot2Qso.id },
    { id: randomUUID(), tenantId, goodsReceiptId: gr2.id, purchaseOrderLineId: pol2c.id, materialId: matBdj.id, quantity: 200, unitCost: 85, lotCode: 'LOT-BDJ-001', expiresOn: null, qcStatus: QcStatus.PASS, qcNotes: null, materialLotId: lot2Bdj.id },
  ]);

  // Update avg_cost for raw materials
  await m.update(Material, matMasa.id, { avgCost: 320 });
  await m.update(Material, matCarne.id, { avgCost: 1850 });
  await m.update(Material, matJam.id, { avgCost: 2200 });
  await m.update(Material, matQso.id, { avgCost: 1600 });
  await m.update(Material, matBdj.id, { avgCost: 85 });

  // ── Recipes ─────────────────────────────────────────────────────────────
  const rec1 = await m.save(Recipe, {
    id: randomUUID(), tenantId, name: 'Empanada de carne', outputMaterialId: matEmpCarne.id,
    outputQty: 100, batchSizeUom: 'unid', status: RecipeStatus.ACTIVE, version: 1, notes: null,
  });
  await m.save(RecipeComponent, [
    { id: randomUUID(), tenantId, recipeId: rec1.id, materialId: matMasa.id, qtyPerBatch: 4.5, lossPct: 2 },
    { id: randomUUID(), tenantId, recipeId: rec1.id, materialId: matCarne.id, qtyPerBatch: 7.0, lossPct: 5 },
    { id: randomUUID(), tenantId, recipeId: rec1.id, materialId: matBdj.id, qtyPerBatch: 8.33, lossPct: 0 },
  ]);

  const rec2 = await m.save(Recipe, {
    id: randomUUID(), tenantId, name: 'Empanada jamón-queso', outputMaterialId: matEmpJyq.id,
    outputQty: 96, batchSizeUom: 'unid', status: RecipeStatus.ACTIVE, version: 1, notes: null,
  });
  await m.save(RecipeComponent, [
    { id: randomUUID(), tenantId, recipeId: rec2.id, materialId: matMasa.id, qtyPerBatch: 4.32, lossPct: 2 },
    { id: randomUUID(), tenantId, recipeId: rec2.id, materialId: matJam.id, qtyPerBatch: 5.0, lossPct: 3 },
    { id: randomUUID(), tenantId, recipeId: rec2.id, materialId: matQso.id, qtyPerBatch: 3.36, lossPct: 2 },
    { id: randomUUID(), tenantId, recipeId: rec2.id, materialId: matBdj.id, qtyPerBatch: 8, lossPct: 0 },
  ]);

  // ── Production Order 1 (Empanada de carne, COMPLETED) ───────────────────
  const prodNow = new Date();
  const theorCost1 = 4.5 * 320 + 7.0 * 1850 + 8.33 * 85; // ~15,120
  const actualCost1 = 4.5 * 320 + 7.0 * 1850 + 8.33 * 85;
  const op1 = await m.save(ProductionOrder, {
    id: randomUUID(), tenantId, number: 1, recipeId: rec1.id,
    outputMaterialId: matEmpCarne.id, plannedQty: 100, actualQty: 98,
    status: ProductionOrderStatus.COMPLETED,
    theoreticalCost: parseFloat(theorCost1.toFixed(4)),
    actualCost: parseFloat(actualCost1.toFixed(4)),
    startedAt: prodNow, completedAt: prodNow, notes: null,
  });

  const cons1a = await m.save(ProductionConsumption, { id: randomUUID(), tenantId, productionOrderId: op1.id, materialLotId: lot1Masa.id, materialId: matMasa.id, quantity: 4.5, unitCost: 320, consumedAt: prodNow });
  const cons1b = await m.save(ProductionConsumption, { id: randomUUID(), tenantId, productionOrderId: op1.id, materialLotId: lot1Carne.id, materialId: matCarne.id, quantity: 7.0, unitCost: 1850, consumedAt: prodNow });
  const cons1c = await m.save(ProductionConsumption, { id: randomUUID(), tenantId, productionOrderId: op1.id, materialLotId: lot2Bdj.id, materialId: matBdj.id, quantity: 8.33, unitCost: 85, consumedAt: prodNow });

  await m.update(MaterialLot, lot1Masa.id, { quantity: 50 - 4.5 });
  await m.update(MaterialLot, lot1Carne.id, { quantity: 30 - 7.0 });
  await m.update(MaterialLot, lot2Bdj.id, { quantity: 200 - 8.33 });

  const unitCost1 = parseFloat((actualCost1 / 98).toFixed(4));
  const finLot1 = await m.save(FinishedLot, {
    id: randomUUID(), tenantId, lotCode: 'LOT-EMP-CARNE-001', materialId: matEmpCarne.id,
    productionOrderId: op1.id, quantity: 98, unitCost: unitCost1,
    status: LotStatus.AVAILABLE, locationId: loc.id,
    expiresOn: new Date(Date.now() + 160 * 864e5),
  });
  await m.update(Material, matEmpCarne.id, { avgCost: unitCost1 });

  // ── Production Order 2 (Empanada jamón-queso, COMPLETED) ────────────────
  const theorCost2 = 4.32 * 320 + 5.0 * 2200 + 3.36 * 1600 + 8 * 85;
  const op2 = await m.save(ProductionOrder, {
    id: randomUUID(), tenantId, number: 2, recipeId: rec2.id,
    outputMaterialId: matEmpJyq.id, plannedQty: 96, actualQty: 95,
    status: ProductionOrderStatus.COMPLETED,
    theoreticalCost: parseFloat(theorCost2.toFixed(4)),
    actualCost: parseFloat(theorCost2.toFixed(4)),
    startedAt: prodNow, completedAt: prodNow, notes: null,
  });

  await m.save(ProductionConsumption, [
    { id: randomUUID(), tenantId, productionOrderId: op2.id, materialLotId: lot1Masa.id, materialId: matMasa.id, quantity: 4.32, unitCost: 320, consumedAt: prodNow },
    { id: randomUUID(), tenantId, productionOrderId: op2.id, materialLotId: lot2Jam.id, materialId: matJam.id, quantity: 5.0, unitCost: 2200, consumedAt: prodNow },
    { id: randomUUID(), tenantId, productionOrderId: op2.id, materialLotId: lot2Qso.id, materialId: matQso.id, quantity: 3.36, unitCost: 1600, consumedAt: prodNow },
    { id: randomUUID(), tenantId, productionOrderId: op2.id, materialLotId: lot2Bdj.id, materialId: matBdj.id, quantity: 8, unitCost: 85, consumedAt: prodNow },
  ]);

  const unitCost2 = parseFloat((theorCost2 / 95).toFixed(4));
  const finLot2 = await m.save(FinishedLot, {
    id: randomUUID(), tenantId, lotCode: 'LOT-EMP-JYQ-001', materialId: matEmpJyq.id,
    productionOrderId: op2.id, quantity: 95, unitCost: unitCost2,
    status: LotStatus.AVAILABLE, locationId: loc.id,
    expiresOn: new Date(Date.now() + 160 * 864e5),
  });
  await m.update(Material, matEmpJyq.id, { avgCost: unitCost2 });

  // ── Customer + Point of Sale ─────────────────────────────────────────────
  const customer = await m.save(Customer, {
    id: randomUUID(), tenantId, name: 'Distribuidora Norte S.A.',
    cuit: '30-11111111-1', condicionIva: CondicionIva.RI,
    address: 'Av. Colón 1234, Mar del Plata', isActive: true,
  });

  const pos = await m.save(PointOfSale, {
    id: randomUUID(), tenantId, number: 1, name: 'Casa Central', isActive: true,
  });

  // ── Sales Order (INVOICED) ───────────────────────────────────────────────
  const so = await m.save(SalesOrder, {
    id: randomUUID(), tenantId, number: 1, customerId: customer.id,
    status: SalesOrderStatus.INVOICED, notes: 'Primer pedido de prueba',
  });
  await m.save(SalesOrderLine, {
    id: randomUUID(), tenantId, salesOrderId: so.id,
    materialId: matEmpCarne.id, quantity: 48, unitPrice: 1200,
  });

  // ── Invoice (Type A, mock CAE) ───────────────────────────────────────────
  const netAmount = 48 * 1200;         // 57,600
  const ivaAmount = netAmount * 0.21;  // 12,096
  const totalAmount = netAmount + ivaAmount;
  const cae = String(Date.now()).padStart(14, '0').slice(-14);
  const caeExpires = new Date(Date.now() + 10 * 864e5);

  const invoice = await m.save(Invoice, {
    id: randomUUID(), tenantId, pointOfSaleId: pos.id,
    customerId: customer.id, salesOrderId: so.id,
    invoiceType: InvoiceType.A, invoiceNumber: 1,
    netAmount, ivaAmount, totalAmount,
    status: InvoiceStatus.AUTHORIZED, cae, caeExpiresOn: caeExpires,
    afipRequest: { provider: 'MOCK', invoiceType: 'A', invoiceNumber: 1 },
    afipResponse: { Resultado: 'A', CAE: cae, CAEFchVto: caeExpires.toISOString().slice(0, 10), provider: 'MOCK' },
    issuedAt: new Date(),
  });

  await m.save(InvoiceLine, {
    id: randomUUID(), tenantId, invoiceId: invoice.id,
    description: 'Empanada de carne congelada x48', quantity: 48, unitPrice: 1200,
    ivaRate: 21, netAmount, ivaAmount,
  });

  // Fiscal counter
  await m.save(FiscalCounter, {
    id: randomUUID(), tenantId, pointOfSaleId: pos.id,
    invoiceType: InvoiceType.A, lastNumber: 1,
  });

  console.log('');
  console.log('✅ Demo seed complete!');
  console.log('');
  console.log('  Tenant : La Empanada Gourmet');
  console.log('  Email  : admin@empanada.com');
  console.log('  Pass   : Demo1234!');
  console.log('');
  console.log(`  Finished lot IDs for traceability:`);
  console.log(`    EMP-CARNE → ${finLot1.id}`);
  console.log(`    EMP-JYQ   → ${finLot2.id}`);
  console.log('');

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
