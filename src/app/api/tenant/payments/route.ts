import { NextResponse } from 'next/server';
import { db } from '@/db';
import { paymentProofs, tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyTenant, unauthorized } from '@/lib/auth';
import { uploadToImgBB } from '@/lib/imgbb';

export async function POST(request: Request) {
  const tenantPayload = await verifyTenant();
  if (!tenantPayload) return unauthorized();

  try {
    const formData = await request.formData();
    const amount = formData.get('amount') as string;
    const message = formData.get('message') as string;
    const file = formData.get('receipt') as File;

    if (!file) {
      return NextResponse.json({ error: 'Receipt image is required' }, { status: 400 });
    }

    if (!amount) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Upload to ImgBB
    const receiptUrl = await uploadToImgBB(file);

    // Save to DB
    await db.insert(paymentProofs).values({
      tenantId: tenantPayload.sub as string,
      amount: amount,
      receiptUrl: receiptUrl,
      message: message,
      status: 'Pending',
      submittedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error submitting payment proof:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit payment' }, { status: 500 });
  }
}
