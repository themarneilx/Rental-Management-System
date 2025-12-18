import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { tenants, invoices, paymentProofs } from '@/db/schema';
import { eq, desc, ne, and, sql } from 'drizzle-orm';

import { JWT_SECRET as SECRET } from '@/lib/auth';

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
            description: `Rent & Utilities`,
            details: {
                rentPeriod: inv.rentPeriod,
                utilityPeriod: inv.utilityPeriod,
                rent: Number(inv.rentAmount),
                water: Number(inv.waterCost),
                elec: Number(inv.elecCost),
                penalty: Number(inv.penalty || 0),
                prevBalance: Number(inv.prevBalance || 0),
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


    // 5. Calculate Total Due (Sum of all invoices that are NOT 'Paid' AND NOT 'Revoked')
    const unpaidInvoices = await db.select({
        totalAmount: invoices.totalAmount,
        amountPaid: invoices.amountPaid
    }).from(invoices).where(
        and(
            eq(invoices.tenantId, userId),
            ne(invoices.status, 'Paid'),
            ne(invoices.status, 'Revoked')
        )
    );

    const totalDue = unpaidInvoices.reduce((sum, inv) => {
        const due = Number(inv.totalAmount) - Number(inv.amountPaid || 0);
        // We sum the net balance. If due is negative (overpaid), it reduces the total due.
        return sum + due;
    }, 0);

    // Check for pending payments
    const pendingPayment = await db.query.paymentProofs.findFirst({
        where: and(
            eq(paymentProofs.tenantId, userId),
            eq(paymentProofs.status, 'Pending')
        )
    });
    const hasPendingPayment = !!pendingPayment;

    // Combine for Recent Activity Preview (Top 4)
    const recentActivity = [
        ...recentInvoices.map(inv => ({
            id: inv.invoiceNumber,
            type: 'INVOICE',
            date: inv.date,
            amount: Number(inv.totalAmount),
            status: inv.status,
            details: {
                rentPeriod: inv.rentPeriod,
                utilityPeriod: inv.utilityPeriod
            }
        })),
        ...payments.map(pay => ({
            id: pay.id,
            type: 'PAYMENT',
            date: pay.submittedAt,
            amount: Number(pay.amount),
            status: pay.status,
            details: {
                message: pay.message
            }
        }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 4);

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
      hasPendingPayment: hasPendingPayment,
      recentActivity: recentActivity, // Renamed from recentInvoices
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
