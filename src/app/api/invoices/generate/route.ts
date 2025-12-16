import { NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, tenants, rooms, settings } from '@/db/schema';
import { eq, desc, and, ne, inArray } from 'drizzle-orm';
import { verifyAdmin, unauthorized } from '@/lib/auth';

export async function POST(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) return unauthorized();

  try {
    const body = await request.json();
    const { 
      tenantId, 
      waterCurrent, 
      electricCurrent, 
      penalty = 0,
      prevBalance: manualPrevBalance = 0, // renamed to distinguish from calculated
      credit = 0,
      rentPeriod, // "2024-02"
      utilityPeriod // "2024-01-15 to 2024-02-15"
    } = body;

    // 1. Fetch Tenant and their Room
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
      with: {
        room: true,
      }
    });

    if (!tenant || !tenant.room) {
      return NextResponse.json({ error: 'Tenant or Room not found' }, { status: 404 });
    }

    // 2. Fetch last Invoice to get previous readings (regardless of status, just for readings)
    const lastInvoice = await db.query.invoices.findFirst({
      where: eq(invoices.tenantId, tenantId),
      orderBy: [desc(invoices.date)],
    });

    const waterPrev = lastInvoice ? Number(lastInvoice.waterCurr) : 0; // Default to 0 if no history
    const electricPrev = lastInvoice ? Number(lastInvoice.elecCurr) : 0;

    // 3. Calculate Usage
    const waterUsage = Number(waterCurrent) - waterPrev;
    const electricUsage = Number(electricCurrent) - electricPrev;

    if (waterUsage < 0 || electricUsage < 0) {
        return NextResponse.json({ error: 'Current reading cannot be less than previous reading' }, { status: 400 });
    }

    // --- NEW LOGIC START ---
    // 3.5 Calculate Previous Balance from Old Unpaid Invoices & Revoke Them
    const unpaidStatuses = ['Pending', 'Overdue', 'Partial'];
    const oldUnpaidInvoices = await db.query.invoices.findMany({
        where: and(
            eq(invoices.tenantId, tenantId),
            inArray(invoices.status, unpaidStatuses)
        )
    });

    let calculatedPrevBalance = 0;
    const invoicesToRevoke: string[] = [];

    for (const inv of oldUnpaidInvoices) {
        const remaining = Number(inv.totalAmount) - Number(inv.amountPaid || 0);
        calculatedPrevBalance += remaining;
        invoicesToRevoke.push(inv.id);
    }

    // Revoke old invoices
    if (invoicesToRevoke.length > 0) {
        await db.update(invoices)
            .set({ status: 'Revoked' })
            .where(inArray(invoices.id, invoicesToRevoke));
        console.log(`Revoked ${invoicesToRevoke.length} old invoices for tenant ${tenantId}`);
    }

    // Final Prev Balance logic:
    // We use Math.max to prevent double-counting.
    // If frontend sends the total balance (e.g. 23050) and we calculate 23050 from DB, Math.max keeps it 23050.
    // If frontend sends 0 (empty), we use our calculated 23050 (Rollover).
    // If frontend sends higher (e.g. 25000 due to external adjustment), we take that.
    const finalPrevBalance = Math.max(Number(manualPrevBalance), calculatedPrevBalance);
    // --- NEW LOGIC END ---

    // 4. Fetch Rates & Calculate Costs
    let config = await db.query.settings.findFirst();
    if (!config) {
        // Initialize default settings if missing to avoid crash
        const [newConfig] = await db.insert(settings).values({}).returning();
        config = newConfig;
    }

    const ELECTRIC_RATE = Number(config.electricityRate);
    const WATER_RATE = Number(config.waterRate);

    const electricCost = electricUsage * ELECTRIC_RATE;
    const waterCost = waterUsage * WATER_RATE;
    const rentAmount = Number(tenant.room.rent);
    
    const totalAmount = rentAmount + electricCost + waterCost + Number(penalty) + finalPrevBalance - Number(credit);

    // 5. Create Invoice
    const [newInvoice] = await db.insert(invoices).values({
        invoiceNumber: `INV-${Date.now()}`, // Simple generator
        tenantId,
        unitId: tenant.room.id,
        rentPeriod,
        utilityPeriod,
        waterPrev: waterPrev.toString(),
        waterCurr: waterCurrent.toString(),
        elecPrev: electricPrev.toString(),
        elecCurr: electricCurrent.toString(),
        rentAmount: rentAmount.toString(),
        waterCost: waterCost.toString(),
        elecCost: electricCost.toString(),
        penalty: penalty.toString(),
        prevBalance: finalPrevBalance.toString(),
        credit: credit.toString(),
        totalAmount: totalAmount.toString(),
        status: 'Pending',
        date: new Date(),
    }).returning();

    console.log('Invoice inserted:', newInvoice);

    return NextResponse.json(newInvoice, { status: 201 });

  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}
