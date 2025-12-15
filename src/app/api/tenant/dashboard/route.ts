import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { tenants, invoices, paymentProofs } from '@/db/schema';
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

    // 3. Fetch Payment Proofs
    const payments = await db.query.paymentProofs.findMany({
        where: eq(paymentProofs.tenantId, userId),
        orderBy: [desc(paymentProofs.submittedAt)],
    });

    // 4. Combine into Billing History
    const history = [
        ...recentInvoices.map(inv => ({
            id: inv.id,
            displayId: inv.invoiceNumber,
            type: 'INVOICE',
            date: new Date(inv.date),
            amount: Number(inv.totalAmount),
            status: inv.status,
            description: `Rent & Utilities (${inv.rentPeriod})`,
            details: {
                rent: Number(inv.rentAmount),
                water: Number(inv.waterCost),
                elec: Number(inv.elecCost),
                amountPaid: Number(inv.amountPaid || 0)
            }
        })),
        ...payments.map(pay => ({
            id: pay.id,
            displayId: 'PAYMENT', // Or a generated ID if available
            type: 'PAYMENT',
            date: new Date(pay.submittedAt),
            amount: Number(pay.amount),
            status: pay.status, // 'Pending', 'Verified', 'Rejected'
            description: pay.message || 'Payment Submission',
            details: null
        }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime());


    // 5. Calculate Total Due (Sum of all invoices that are NOT 'Paid')
    const unpaidInvoices = await db.select({
        totalAmount: invoices.totalAmount,
        amountPaid: invoices.amountPaid
    }).from(invoices).where(
        and(
            eq(invoices.tenantId, userId),
            ne(invoices.status, 'Paid')
        )
    );

    const totalDue = unpaidInvoices.reduce((sum, inv) => {
        const due = Number(inv.totalAmount) - Number(inv.amountPaid || 0);
        // We sum the net balance. If due is negative (overpaid), it reduces the total due.
        return sum + due;
    }, 0);

    return NextResponse.json({
      name: tenantData.name,
      email: tenantData.email,
      phone: tenantData.phone,
      unitName: tenantData.room?.name || 'N/A',
      buildingName: tenantData.room?.building?.name || 'N/A',
      leaseEnd: tenantData.leaseEnd,
      avatarUrl: tenantData.avatarUrl,
      contractUrl: tenantData.contractUrl,
      totalDue: totalDue,
      recentInvoices: recentInvoices.map(inv => ({
        id: inv.invoiceNumber, // using invoiceNumber as display ID
        period: `${inv.rentPeriod}`, // format as needed
        total: Number(inv.totalAmount),
        amountPaid: Number(inv.amountPaid || 0), // Include amountPaid
        status: inv.status,
        rent: Number(inv.rentAmount),
        water: Number(inv.waterCost),
        elec: Number(inv.elecCost),
        date: inv.date
      })),
      billingHistory: history.map(h => ({
          ...h,
          date: h.date.toISOString()
      }))
    });

  } catch (error) {
    console.error('Dashboard data fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
