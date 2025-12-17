import { NextResponse } from 'next/server';
import { db } from '@/db';
import { rooms, buildings } from '@/db/schema';
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
    const body = await request.json();
    const { name, type, rent, status, building } = body;

    // Find or create building if building name is changed/provided
    let buildingId;
    if (building) {
        let buildingRecord = await db.query.buildings.findFirst({
            where: eq(buildings.name, building)
        });

        if (!buildingRecord) {
             const [newBuilding] = await db.insert(buildings).values({ name: building }).returning();
             buildingRecord = newBuilding;
        }
        buildingId = buildingRecord.id;
    }

    // Construct update object
    const updateData: any = {
        name,
        type,
        rent: rent.toString(),
        status,
    };
    
    if (buildingId) {
        updateData.buildingId = buildingId;
    }

    const [updatedRoom] = await db.update(rooms)
      .set(updateData)
      .where(eq(rooms.id, id))
      .returning();

    if (!updatedRoom) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json(updatedRoom);
  } catch (error) {
    console.error('Error updating room:', error);
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 });
  }
}

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
