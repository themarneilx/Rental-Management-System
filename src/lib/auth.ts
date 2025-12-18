import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const secretKey = process.env.AUTH_SECRET;
if (!secretKey) {
  throw new Error('AUTH_SECRET environment variable is not defined');
}
export const JWT_SECRET = new TextEncoder().encode(secretKey);

export async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;

    if (role === 'SUPER_ADMIN' || role === 'PROPERTY_MANAGER' || role === 'BILLING_ADMIN') {
        return payload;
    }
    return null;
  } catch (error) {
    return null;
  }
}

export async function verifyTenant() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role === 'tenant') {
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
