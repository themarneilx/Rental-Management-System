import { NextResponse } from 'next/server';
import { db } from '@/db';
import { admins } from '@/db/schema';
import { desc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { verifyAdmin, unauthorized } from '@/lib/auth';

export async function GET(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) return unauthorized();

  try {
    const allAdmins = await db.query.admins.findMany({
      orderBy: [desc(admins.createdAt)],
      columns: {
        password: false // Exclude password
      }
    });

    return NextResponse.json(allAdmins);
  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
  }
}

export async function POST(request: Request) {
    const admin = await verifyAdmin();
    if (!admin) return unauthorized();

    try {
        const { name, email, password, role } = await request.json();
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        const [newAdmin] = await db.insert(admins).values({
            name,
            email,
            password: hashedPassword,
            role: role || 'PROPERTY_MANAGER',
            status: 'Active'
        }).returning({
            id: admins.id,
            name: admins.name,
            email: admins.email,
            role: admins.role,
            status: admins.status,
            createdAt: admins.createdAt
        });

        return NextResponse.json(newAdmin, { status: 201 });
    } catch (error) {
        console.error('Error creating admin:', error);
        return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 });
    }
}
