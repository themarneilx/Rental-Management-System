import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants } from '@/db/schema';
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
    const tenantId = payload.sub as string;

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Missing password fields' }, { status: 400 });
    }

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const passwordMatch = await bcrypt.compare(currentPassword, tenant.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Incorrect current password' }, { status: 401 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.update(tenants)
      .set({ password: hashedPassword })
      .where(eq(tenants.id, tenant.id));

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing tenant password:', error);
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
}
