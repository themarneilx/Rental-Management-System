import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { admins, tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || 'default_secret');

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);
    const userId = payload.sub as string;
    const role = payload.role as string;

    let userData: any = {
        id: userId,
        role: role,
        name: payload.name,
        email: payload.email,
        avatarUrl: null
    };

    if (role === 'tenant') {
        const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.id, userId)
        });
        if (tenant) {
            userData.name = tenant.name;
            userData.email = tenant.email;
            userData.avatarUrl = tenant.avatarUrl;
        }
    } else {
        // Assume Admin (SUPER_ADMIN, PROPERTY_MANAGER, BILLING_ADMIN)
        const admin = await db.query.admins.findFirst({
            where: eq(admins.id, userId)
        });
        if (admin) {
            userData.name = admin.name;
            userData.email = admin.email;
            userData.role = admin.role; // Update role from DB in case it changed
            userData.avatarUrl = admin.avatarUrl;
            userData.mustChangePassword = admin.mustChangePassword;
        }
    }
    
    return NextResponse.json(userData);
  } catch (error) {
    console.error("Auth Me Error:", error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}