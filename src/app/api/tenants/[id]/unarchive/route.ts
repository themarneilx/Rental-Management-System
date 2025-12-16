import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAdmin, unauthorized } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return unauthorized();

  try {
    const { id } = await params;

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, id),
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Unarchive: Set status to Active, but keep roomId null (they need to be assigned manually)
    await db.update(tenants)
      .set({ 
        status: 'Active',
        // We do NOT restore roomId here as it might be taken. 
        // Admin must re-assign manually.
      })
      .where(eq(tenants.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unarchiving tenant:', error);
    return NextResponse.json({ error: 'Failed to unarchive tenant' }, { status: 500 });
  }
}
