import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyTenant, unauthorized } from '@/lib/auth';
import { uploadToImgBB } from '@/lib/imgbb';

export async function POST(request: Request) {
  const tenantPayload = await verifyTenant();
  if (!tenantPayload) return unauthorized();

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Upload to ImgBB
    const avatarUrl = await uploadToImgBB(file);

    await db.update(tenants)
      .set({ avatarUrl: avatarUrl })
      .where(eq(tenants.id, tenantPayload.sub as string));

    return NextResponse.json({ message: 'Avatar updated', avatarUrl });
  } catch (error: any) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload avatar' }, { status: 500 });
  }
}
