import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants, rooms } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { verifyAdmin, unauthorized } from '@/lib/auth';
import { uploadToImgBB } from '@/lib/imgbb';
import bcrypt from 'bcryptjs';

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
        room: true, // Current room
        previousRoom: status === 'Archived' ? { with: { building: true } } : undefined, // Previous room for archived tenants
      },
      columns: { // Explicitly include contractUrl
        id: true,
        name: true,
        email: true,
        phone: true,
        deposit: true,
        leaseEnd: true,
        status: true,
        avatarUrl: true,
        contractUrl: true,
        roomId: true,
        previousRoomId: true,
        createdAt: true,
        updatedAt: true,
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
    const formData = await request.formData();
    
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const phone = formData.get('phone') as string;
    const deposit = formData.get('deposit') as string;
    const leaseEnd = formData.get('leaseEnd') as string;
    const roomId = formData.get('roomId') as string;
    const file = formData.get('avatar') as File | null;
    const contractFile = formData.get('contract') as File | null;

    let avatarUrl = null;
    if (file && file.size > 0) {
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'Avatar must be an image' }, { status: 400 });
        }
        avatarUrl = await uploadToImgBB(file);
    }

    let contractUrl = null;
    if (contractFile && contractFile.size > 0) {
        if (!contractFile.type.startsWith('image/')) {
             // For now, only images for ImgBB. If using PDF, we'd need another service.
             // If user insists on PDF, we'll need to warn or fail if ImgBB is the only option.
             // Assuming user will upload image of contract for now as per "photo" in prompt.
            return NextResponse.json({ error: 'Contract must be an image (PNG/JPG)' }, { status: 400 });
        }
        contractUrl = await uploadToImgBB(contractFile);
    }

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
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const insertData: any = {
        name,
        email,
        password: hashedPassword,
        phone,
        deposit,
        leaseEnd: new Date(leaseEnd).toISOString(),
        status: 'Active',
        roomId: roomId || null,
      };

      if (avatarUrl) {
          insertData.avatarUrl = avatarUrl;
      }
      if (contractUrl) {
          insertData.contractUrl = contractUrl;
      }
      
      // 1. Create Tenant
      const [newTenant] = await tx.insert(tenants).values(insertData).returning();

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
