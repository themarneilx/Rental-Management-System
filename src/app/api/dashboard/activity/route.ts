import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants, invoices, paymentProofs } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { verifyAdmin, unauthorized } from '@/lib/auth';

export async function GET(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) return unauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam === 'all' ? 50 : 5;

    const recentTenants = await db.query.tenants.findMany({
      orderBy: [desc(tenants.createdAt)],
      limit: limit,
      with: { room: true }
    });

    const recentInvoices = await db.query.invoices.findMany({
      orderBy: [desc(invoices.date)],
      limit: limit,
      with: { tenant: true, room: true }
    });
    
    // Transform to unified structure
    const activities = [
        ...recentTenants.map(t => ({
            id: t.id,
            type: 'NEW_TENANT',
            title: 'New Tenant Added',
            desc: `${t.name} • Unit ${t.room?.name || 'Unassigned'}`,
            time: t.createdAt,
            color: 'bg-emerald-50 text-emerald-600',
            icon: 'Users'
        })),
        ...recentInvoices.map(i => ({
            id: i.id,
            type: 'INVOICE_GENERATED',
            title: 'Invoice Generated',
            desc: `${i.tenant?.name || 'Unknown'} • Unit ${i.room?.name || '?'}`,
            time: i.date, // This is a string YYYY-MM-DD usually if date type
            color: 'bg-blue-50 text-blue-600',
            icon: 'FileText'
        }))
    ];

    // Sort by time desc
    activities.sort((a, b) => new Date(b.time as any).getTime() - new Date(a.time as any).getTime());

    return NextResponse.json(activities.slice(0, limit));
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}
