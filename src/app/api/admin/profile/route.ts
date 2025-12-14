import { NextResponse } from 'next/server';
import { db } from '@/db';
import { admins } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAdmin, unauthorized } from '@/lib/auth';

export async function PUT(request: Request) {
  const adminPayload = await verifyAdmin();
  if (!adminPayload) return unauthorized();

  try {
    const { name } = await request.json();

    if (!name || name.trim() === '') {
        return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    }

    await db.update(admins)
      .set({ name: name.trim() })
      .where(eq(admins.id, adminPayload.sub as string));

    return NextResponse.json({ message: 'Name updated successfully', name: name.trim() });
  } catch (error) {
    console.error('Error updating admin profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
