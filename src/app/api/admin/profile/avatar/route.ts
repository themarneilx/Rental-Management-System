import { NextResponse } from 'next/server';
import { db } from '@/db';
import { admins } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAdmin, unauthorized } from '@/lib/auth';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  const adminPayload = await verifyAdmin();
  if (!adminPayload) return unauthorized();

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type (optional but good)
    if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `admin-${adminPayload.sub}-${Date.now()}${path.extname(file.name)}`;
    const uploadDir = path.join(process.cwd(), 'public/uploads/avatars');
    
    // Ensure absolute path usage and handle saving
    const filePath = path.join(uploadDir, filename);

    await writeFile(filePath, buffer);

    const avatarUrl = `/uploads/avatars/${filename}`;

    await db.update(admins)
      .set({ avatarUrl: avatarUrl })
      .where(eq(admins.id, adminPayload.sub as string));

    return NextResponse.json({ message: 'Avatar updated', avatarUrl });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
  }
}
