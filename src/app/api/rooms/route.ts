import { NextResponse } from 'next/server';
import { db } from '@/db';
import { rooms, buildings } from '@/db/schema';
import { eq, like, and } from 'drizzle-orm';
import { verifyAdmin, unauthorized } from '@/lib/auth';

export async function GET(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) return unauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = db.query.rooms.findMany({
      with: {
        building: true
      }
    });

    if (status) {
      query = db.query.rooms.findMany({
        where: eq(rooms.status, status),
        with: {
          building: true
        }
      });
    }

    const allRooms = await query;
    return NextResponse.json(allRooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) return unauthorized();

  try {
    const body = await request.json();
    const { name, type, rent, status, buildingName } = body;

    // Check if building exists, or create it
    let building = await db.query.buildings.findFirst({
      where: eq(buildings.name, buildingName)
    });

    if (!building) {
      const [newBuilding] = await db.insert(buildings).values({
        name: buildingName
      }).returning();
      building = newBuilding;
    }

    // Check for duplicate room name in the same building
    const existingRoom = await db.query.rooms.findFirst({
      where: and(
        eq(rooms.name, name),
        eq(rooms.buildingId, building.id)
      )
    });

    if (existingRoom) {
      return NextResponse.json({ error: `Room ${name} already exists in ${buildingName}` }, { status: 409 });
    }

    const [newRoom] = await db.insert(rooms).values({
      name,
      type,
      rent: rent.toString(),
      status: status || 'Vacant',
      buildingId: building.id
    }).returning();

    return NextResponse.json(newRoom, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
