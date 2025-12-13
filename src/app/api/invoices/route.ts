import { NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, tenants, rooms } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { verifyAdmin, unauthorized } from '@/lib/auth';

export async function GET(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) return unauthorized();

  try {
    const allInvoices = await db.query.invoices.findMany({
      orderBy: [desc(invoices.date)],
      with: {
        tenant: true,
        room: {
            with: {
                building: true
            }
        }
      }
    });

    return NextResponse.json(allInvoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}
