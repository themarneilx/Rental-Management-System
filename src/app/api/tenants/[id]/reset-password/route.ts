import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAdmin, unauthorized } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return unauthorized();

  try {
    const { id } = await params;

    // Generate random password
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let newPassword = "";
    for (let i = 0; i < 10; i++) {
        newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.update(tenants)
      .set({ 
        password: hashedPassword,
        mustChangePassword: true
      })
      .where(eq(tenants.id, id));

    return NextResponse.json({ password: newPassword });
  } catch (error: any) {
    console.error('Error resetting password:', error);
    return NextResponse.json({ error: error.message || 'Failed to reset password' }, { status: 500 });
  }
}
