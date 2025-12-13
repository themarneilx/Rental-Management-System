import { NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || 'default_secret');

export async function GET(request: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);

    if (payload.role !== 'tenant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const tenantInvoices = await db.query.invoices.findMany({
      where: eq(invoices.tenantId, payload.sub as string),
      orderBy: [desc(invoices.date)],
    });

    // Map to TenantInvoice structure for consistency with frontend mock
    const mappedInvoices = tenantInvoices.map(inv => ({
        id: inv.invoiceNumber, // Or inv.id depending on what frontend expects as unique ID
        period: inv.rentPeriod, // Using rentPeriod for simplicity
        rent: Number(inv.rentAmount),
        water: Number(inv.waterCost),
        elec: Number(inv.elecCost),
        total: Number(inv.totalAmount),
        status: inv.status,
        date: inv.date,
    }));

    return NextResponse.json(mappedInvoices);
  } catch (error) {
    console.error('Error fetching tenant invoices:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
