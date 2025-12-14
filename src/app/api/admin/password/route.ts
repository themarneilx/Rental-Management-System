import { NextResponse } from 'next/server';
import { db } from '@/db';
import { admins } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAdmin, unauthorized } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function PUT(request: Request) {
  const adminPayload = await verifyAdmin();
  if (!adminPayload) return unauthorized();

  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Missing password fields' }, { status: 400 });
    }

    const admin = await db.query.admins.findFirst({
      where: eq(admins.id, adminPayload.sub as string),
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    const passwordMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Incorrect current password' }, { status: 401 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.update(admins)
      .set({ password: hashedPassword })
      .where(eq(admins.id, admin.id));

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing admin password:', error);
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
}
