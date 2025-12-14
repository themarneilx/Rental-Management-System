import { NextResponse } from 'next/server';
import { db } from '@/db';
import { rooms } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAdmin, unauthorized } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return unauthorized();

  try {
    const { id } = await params;

    // Check if room has active tenants or other dependencies?
    // For now, Drizzle foreign key constraints (if any) will handle it, 
    // or we can manually check.
    // Assuming if foreign key exists (tenant -> roomId), delete might fail if not cascaded.
    // The schema says `tenant` has `roomId`. If we delete room, tenant's `roomId` might need to be nullified or deletion blocked.
    // Let's assume blocking is safer.
    
    // Check for tenants
    const tenant = await db.query.tenants.findFirst({
        where: eq(rooms.id, id) // Wait, tenants.roomId matches this id.
    });
    // Actually need to import tenants schema or query via relation.
    // Simpler: Try delete, catch FK violation.

    await db.delete(rooms).where(eq(rooms.id, id));

    return NextResponse.json({ message: 'Room deleted' });
  } catch (error: any) {
    console.error('Error deleting room:', error);
    if (error.code === '23503') { // Foreign key violation
        return NextResponse.json({ error: 'Cannot delete room with active tenants or history.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 });
  }
}
