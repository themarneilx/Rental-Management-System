import { NextResponse } from 'next/server';
import { db } from '@/db';
import { admins } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAdmin, unauthorized } from '@/lib/auth';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const admin = await verifyAdmin();
    if (!admin) return unauthorized();
    
    // Optional: Check if admin is SUPER_ADMIN or editing themselves (policy dependent)
    
    try {
        const { id } = await params;
        const { name, email, role } = await request.json();

        const [updatedAdmin] = await db.update(admins)
            .set({ name, email, role })
            .where(eq(admins.id, id))
            .returning({
                id: admins.id,
                name: admins.name,
                email: admins.email,
                role: admins.role,
                status: admins.status,
                createdAt: admins.createdAt
            });

        if (!updatedAdmin) {
             return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
        }

        return NextResponse.json(updatedAdmin);
    } catch (error) {
        console.error('Error updating admin:', error);
        return NextResponse.json({ error: 'Failed to update admin' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const admin = await verifyAdmin();
    if (!admin) return unauthorized();

    try {
        const { id } = await params;
        
        // Prevent deleting yourself
        if (id === admin.sub) {
            return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
        }

        await db.delete(admins).where(eq(admins.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting admin:', error);
        return NextResponse.json({ error: 'Failed to delete admin' }, { status: 500 });
    }
}
