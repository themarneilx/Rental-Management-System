import { NextResponse } from 'next/server';
import { db } from '@/db';
import { admins } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { verifyAdmin, unauthorized } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const admin = await verifyAdmin();
    if (!admin) return unauthorized();

    try {
        const { id } = await params;

        // Generate random password
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let newPassword = "";
        for (let i = 0; i < 12; i++) {
            newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        const [updatedAdmin] = await db.update(admins)
            .set({ 
                password: hashedPassword,
                mustChangePassword: true 
            })
            .where(eq(admins.id, id))
            .returning({ id: admins.id, name: admins.name });

        if (!updatedAdmin) {
            return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
        }

        return NextResponse.json({ 
            success: true, 
            newPassword,
            message: `Password reset for ${updatedAdmin.name}` 
        });

    } catch (error) {
        console.error('Error resetting password:', error);
        return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
    }
}
