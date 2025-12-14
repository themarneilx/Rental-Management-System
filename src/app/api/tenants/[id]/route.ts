import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants, rooms } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAdmin, unauthorized } from '@/lib/auth';
import { uploadToImgBB } from '@/lib/imgbb';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return unauthorized();

  try {
    const { id } = await params;
    const formData = await request.formData();
    
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const leaseEnd = formData.get('leaseEnd') as string;
    const deposit = formData.get('deposit') as string;
    const unitId = formData.get('unitId') as string; // might be "null" or ""
    const file = formData.get('avatar') as File | null;
    const contractFile = formData.get('contract') as File | null;

    let avatarUrl;
    if (file && file.size > 0) {
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'Avatar must be an image' }, { status: 400 });
        }
        avatarUrl = await uploadToImgBB(file);
    }

    let contractUrl;
    if (contractFile && contractFile.size > 0) {
        if (!contractFile.type.startsWith('image/')) {
            return NextResponse.json({ error: 'Contract must be an image' }, { status: 400 });
        }
        contractUrl = await uploadToImgBB(contractFile);
    }

    const currentTenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, id)
    });

    if (!currentTenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    await db.transaction(async (tx) => {
        const updateData: any = {
            name,
            email,
            phone,
            leaseEnd: new Date(leaseEnd).toISOString(),
            deposit: deposit,
        };

        if (avatarUrl) {
            updateData.avatarUrl = avatarUrl;
        }
        if (contractUrl) {
            updateData.contractUrl = contractUrl;
        }

        // Handle Unit Change
        const newRoomId = (unitId === 'null' || unitId === '') ? null : unitId;
        
        if (newRoomId !== currentTenant.roomId) {
             // 1. Vacate old room if exists
             if (currentTenant.roomId) {
                 await tx.update(rooms).set({ status: 'Vacant' }).where(eq(rooms.id, currentTenant.roomId));
             }
             // 2. Occupy new room
             if (newRoomId) {
                 await tx.update(rooms).set({ status: 'Occupied' }).where(eq(rooms.id, newRoomId));
                 updateData.roomId = newRoomId;
             } else {
                 updateData.roomId = null;
             }
        }

        await tx.update(tenants).set(updateData).where(eq(tenants.id, id));
    });

    const updatedTenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, id),
        with: { room: true },
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
    });

    return NextResponse.json(updatedTenant);

  } catch (error: any) {
    console.error('Error updating tenant:', error);
    return NextResponse.json({ error: error.message || 'Failed to update tenant' }, { status: 500 });
  }
}
