import { NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, rooms } from '@/db/schema';
import { eq, sql, inArray } from 'drizzle-orm';
import { verifyAdmin, unauthorized } from '@/lib/auth';

export async function GET(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) return unauthorized();

  try {
    // 1. Calculate Occupancy Rate
    const allRooms = await db.select({ count: sql<number>`count(*)` }).from(rooms);
    const occupiedRooms = await db.select({ count: sql<number>`count(*)` }).from(rooms).where(eq(rooms.status, 'Occupied'));

    const totalRoomsCount = Number(allRooms[0]?.count) || 0;
    const occupiedRoomsCount = Number(occupiedRooms[0]?.count) || 0;
    const occupancyRate = totalRoomsCount > 0 ? (occupiedRoomsCount / totalRoomsCount) * 100 : 0;

    // 2. Calculate Revenue (Total Paid Invoices)
    // Assuming we want total revenue for all time, or maybe current month. Let's do all time for now.
    const revenueResult = await db.select({ 
        total: sql<number>`sum(${invoices.totalAmount})` 
    }).from(invoices).where(eq(invoices.status, 'Paid'));

    const totalRevenue = Number(revenueResult[0]?.total) || 0;

    // 3. Outstanding Balance (Unpaid Invoices)
    const pendingResult = await db.select({ 
        total: sql<number>`sum(${invoices.totalAmount})` 
    }).from(invoices).where(inArray(invoices.status, ['Pending', 'Overdue', 'Partial']));
    
    const outstandingBalance = Number(pendingResult[0]?.total) || 0;

    return NextResponse.json({
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        totalRevenue,
        outstandingBalance,
        totalRooms: totalRoomsCount,
        occupiedRooms: occupiedRoomsCount,
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
