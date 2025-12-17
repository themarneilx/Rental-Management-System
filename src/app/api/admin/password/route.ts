import { NextResponse } from 'next/server';
import { db } from '@/db';
import { admins } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || 'default_secret');

export async function PUT(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);
    // Allow any authenticated admin/user to try this, but we'll check role if needed.
    // Actually the payload has role.
    const userId = payload.sub as string;
    const role = payload.role as string;

    if (role === 'tenant') {
        return NextResponse.json({ error: 'Use tenant endpoint' }, { status: 403 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Missing password fields' }, { status: 400 });
    }

    const admin = await db.query.admins.findFirst({
      where: eq(admins.id, userId),
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
      .set({ 
        password: hashedPassword,
        mustChangePassword: false
      })
      .where(eq(admins.id, admin.id));

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing admin password:', error);
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
}