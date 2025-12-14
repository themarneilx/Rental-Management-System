import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { tenants, invoices } from '@/db/schema';
import { eq, desc, ne, and, sql } from 'drizzle-orm';

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || 'default_secret');

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);
    const userId = payload.sub as string;

    // 1. Fetch Tenant Details (Unit, Building, Lease)
    const tenantData = await db.query.tenants.findFirst({
      where: eq(tenants.id, userId),
      with: {
        room: {
          with: {
            building: true
          }
        }
      }
    });

    if (!tenantData) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // 2. Fetch Recent Invoices
    const recentInvoices = await db.query.invoices.findMany({
      where: eq(invoices.tenantId, userId),
      orderBy: [desc(invoices.date)],
      limit: 5
    });

    // 3. Calculate Total Due (Sum of all invoices that are NOT 'Paid')
    // We use a raw SQL query or Drizzle's aggregation helper if available, 
    // but a simple findMany on unpaid invoices is also safe if volume is low.
    // Let's use aggregation for efficiency.
    const unpaidInvoices = await db.select({
        totalAmount: invoices.totalAmount
    }).from(invoices).where(
        and(
            eq(invoices.tenantId, userId),
            ne(invoices.status, 'Paid')
        )
    );

    const totalDue = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

    return NextResponse.json({
      name: tenantData.name,
      email: tenantData.email,
      phone: tenantData.phone,
      unitName: tenantData.room?.name || 'N/A',
      buildingName: tenantData.room?.building?.name || 'N/A',
      leaseEnd: tenantData.leaseEnd,
      totalDue: totalDue,
      recentInvoices: recentInvoices.map(inv => ({
        id: inv.invoiceNumber, // using invoiceNumber as display ID
        period: `${inv.rentPeriod}`, // format as needed
        total: Number(inv.totalAmount),
        status: inv.status,
        rent: Number(inv.rentAmount),
        water: Number(inv.waterCost),
        elec: Number(inv.elecCost),
        date: inv.date
      }))
    });

  } catch (error) {
    console.error('Dashboard data fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
