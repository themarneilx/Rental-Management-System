import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants, rooms } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { verifyAdmin, unauthorized } from '@/lib/auth';

export async function GET(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) return unauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'Active'; // Default to active

    // Fetch tenants with their room details
    const allTenants = await db.query.tenants.findMany({
      where: eq(tenants.status, status),
      with: {
        room: true,
      },
      orderBy: [desc(tenants.createdAt)],
    });

    return NextResponse.json(allTenants);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) return unauthorized();

  try {
    const body = await request.json();
    const { 
      name, 
      email, 
      password, // Note: In a real app, hash this before saving!
      phone, 
      deposit, 
      leaseEnd, 
      roomId,
      moveInDate // Not in Drizzle schema but in GEMINI.md logic. 
      // Drizzle schema has: name, email, password, phone, deposit, leaseEnd, status, avatarUrl, roomId.
    } = body;

    // Logic: Check if room is VACANT first
    if (roomId) {
      const room = await db.query.rooms.findFirst({
        where: eq(rooms.id, roomId),
      });

      if (!room) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }

      if (room.status !== 'Vacant') {
        return NextResponse.json({ error: 'Room is not available' }, { status: 400 });
      }
    }

    // Transaction to create tenant and update room status
    const result = await db.transaction(async (tx) => {
      // 1. Create Tenant
      const [newTenant] = await tx.insert(tenants).values({
        name,
        email,
        password, // TODO: Hash password
        phone,
        deposit,
        leaseEnd: new Date(leaseEnd).toISOString(),
        status: 'Active',
        roomId: roomId || null,
      }).returning();

      // 2. Update Room Status if assigned
      if (roomId) {
        await tx.update(rooms)
          .set({ status: 'Occupied' })
          .where(eq(rooms.id, roomId));
      }

      return newTenant;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error creating tenant:', error);
    // Handle unique constraint violations (e.g., email)
    if (error.code === '23505') {
       return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 });
  }
}
