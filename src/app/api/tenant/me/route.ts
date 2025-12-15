import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || 'default_secret');

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);

    if (payload.role !== 'tenant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const tenantData = await db.query.tenants.findFirst({
      where: eq(tenants.id, payload.sub as string),
      with: {
        room: {
          with: {
            building: true
          }
        }
      }
    });

    if (!tenantData) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Map to TenantUser structure for consistency with frontend mock
    const tenantUser = {
      id: tenantData.id,
      name: tenantData.name,
      email: tenantData.email,
      phone: tenantData.phone,
      unitId: tenantData.roomId,
      unitName: tenantData.room?.name || 'N/A',
      building: tenantData.room?.building?.name || 'N/A',
      leaseEnd: tenantData.leaseEnd,
      avatar: tenantData.avatarUrl,
    };

    return NextResponse.json(tenantUser);
  } catch (error) {
    console.error('Error fetching tenant profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
