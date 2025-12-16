import { NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, paymentProofs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAdmin, unauthorized } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return unauthorized();

  try {
    const { id } = await params;
    const body = await request.json();
    const { amount } = body; // amount is the NEW payment amount to ADD

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let invoice;
    if (isUuid) {
        invoice = await db.query.invoices.findFirst({ where: eq(invoices.id, id) });
    } else {
        invoice = await db.query.invoices.findFirst({ where: eq(invoices.invoiceNumber, id) });
    }

    if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const currentPaid = Number(invoice.amountPaid || 0);
    const newPaidAmount = currentPaid + Number(amount);
    const total = Number(invoice.totalAmount);

    let newStatus = invoice.status;
    if (newPaidAmount >= total) {
        newStatus = 'Paid';
    } else {
        newStatus = 'Partial';
    }

    await db.update(invoices)
        .set({ 
            amountPaid: newPaidAmount.toString(),
            status: newStatus
        })
        .where(eq(invoices.id, invoice.id));

    // Auto-verify pending payment proofs for this tenant
    await db.update(paymentProofs)
        .set({ status: 'Verified' })
        .where(and(
            eq(paymentProofs.tenantId, invoice.tenantId),
            eq(paymentProofs.status, 'Pending')
        ));

    return NextResponse.json({ 
        success: true, 
        amountPaid: newPaidAmount, 
        status: newStatus,
        total: total
    });

  } catch (error) {
    console.error('Error recording payment:', error);
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }
}
