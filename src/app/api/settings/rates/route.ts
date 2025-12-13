import { NextResponse } from 'next/server';
import { db } from '@/db';
import { settings } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { verifyAdmin, unauthorized } from '@/lib/auth';

export async function GET(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) return unauthorized();

  try {
    let config = await db.query.settings.findFirst();

    if (!config) {
        // Initialize default settings if missing
        const [newConfig] = await db.insert(settings).values({}).returning();
        config = newConfig;
    }

    return NextResponse.json({
        ELECTRICITY: Number(config.electricityRate),
        WATER: Number(config.waterRate)
    });
  } catch (error) {
    console.error('Error fetching rates:', error);
    return NextResponse.json({ error: 'Failed to fetch rates' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) return unauthorized();

  try {
    const { ELECTRICITY, WATER } = await request.json();

    // Ensure we are updating the singleton record
    let config = await db.query.settings.findFirst();

    if (!config) {
        await db.insert(settings).values({
            electricityRate: ELECTRICITY.toString(),
            waterRate: WATER.toString()
        });
    } else {
        await db.update(settings)
          .set({
             electricityRate: ELECTRICITY.toString(),
             waterRate: WATER.toString(),
             updatedAt: new Date()
          })
          .where(eq(settings.id, config.id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating rates:', error);
    return NextResponse.json({ error: 'Failed to update rates' }, { status: 500 });
  }
}
