import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants, rooms } from '@/db/schema';
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

    // Get current tenant to find their room
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, id),
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    await db.transaction(async (tx) => {
      // 1. Update Tenant Status
      await tx.update(tenants)
        .set({ 
            status: 'Archived', 
            roomId: null,
            previousRoomId: tenant.roomId // Store the current room ID
        })
        .where(eq(tenants.id, id));

      // 2. Release Room if assigned
      if (tenant.roomId) {
        await tx.update(rooms)
          .set({ status: 'Vacant' })
          .where(eq(rooms.id, tenant.roomId));
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error archiving tenant:', error);
    return NextResponse.json({ error: 'Failed to archive tenant' }, { status: 500 });
  }
}
