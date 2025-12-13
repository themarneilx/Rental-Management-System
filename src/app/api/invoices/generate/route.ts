import { NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, tenants, rooms } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
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

    // 2. Fetch last Invoice to get previous readings
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

    // 4. Calculate Costs
    const ELECTRIC_RATE = 21.00;
    const WATER_RATE = 70.00;

    const electricCost = electricUsage * ELECTRIC_RATE;
    const waterCost = waterUsage * WATER_RATE;
    const rentAmount = Number(tenant.room.rent);
    
    // Calculate Previous Balance (Sum of unpaid invoices? Or just carry over from last invoice?)
    // Simple logic: if last invoice is not 'Paid', add its total to prevBalance? 
    // Drizzle schema has `prevBalance` field.
    // For now, let's assume 0 or query unpaid invoices.
    let prevBalance = 0;
    // TODO: query unpaid invoices sum

    const totalAmount = rentAmount + electricCost + waterCost + Number(penalty) + prevBalance;

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
        prevBalance: prevBalance.toString(),
        credit: "0",
        totalAmount: totalAmount.toString(),
        status: 'Pending',
    }).returning();

    return NextResponse.json(newInvoice, { status: 201 });

  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}
