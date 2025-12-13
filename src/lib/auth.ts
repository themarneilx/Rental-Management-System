import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || 'default_secret');

export async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);
    const role = payload.role as string;

    if (role === 'SUPER_ADMIN' || role === 'PROPERTY_MANAGER' || role === 'BILLING_ADMIN') {
        return payload;
    }
    return null;
  } catch (error) {
    return null;
  }
}

export function unauthorized() {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
