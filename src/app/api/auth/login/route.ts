import { NextResponse } from 'next/server';
import { db } from '@/db';
import { admins, tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || 'default_secret');
const ALG = 'HS256';

export async function POST(request: Request) {
  try {
    const { email, password, type } = await request.json();

    let user = null;
    let role = '';

    if (type === 'admin') {
      user = await db.query.admins.findFirst({
        where: eq(admins.email, email),
      });
      role = user?.role || 'admin';
    } else {
      user = await db.query.tenants.findFirst({
        where: eq(tenants.email, email),
      });
      role = 'tenant';
    }

    if (!user || !user.password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Create JWT
    const token = await new SignJWT({ 
      sub: user.id, 
      email: user.email, 
      role: role,
      name: user.name 
    })
      .setProtectedHeader({ alg: ALG })
      .setIssuedAt()
      .setExpirationTime('24h') // 24 hours
      .sign(SECRET);

    const response = NextResponse.json({ success: true, role });
    
    // Set HTTP-only cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
