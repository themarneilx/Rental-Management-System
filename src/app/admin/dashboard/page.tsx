"use client";

import { 
  Users, 
  DoorOpen, 
  CreditCard, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  Plus, 
  Zap, 
  Bell 
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import Card from "@/components/ui/Card";
import Link from "next/link";
import { useEffect, useState } from "react";

const ICON_MAP: any = {
    'Users': Users,
    'FileText': FileText,
    'CheckCircle2': CheckCircle2,
    'AlertCircle': AlertCircle
};

export default function DashboardPage() {
  const [statsData, setStatsData] = useState({
    totalTenants: 0, 
    occupancyRate: 0,
    totalRevenue: 0,
    outstandingBalance: 0,
    occupiedRooms: 0,
    totalRooms: 0
  });
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, activityRes] = await Promise.all([
            fetch('/api/dashboard/stats'),
            fetch('/api/dashboard/activity')
        ]);

        if (statsRes.ok) {
          const data = await statsRes.json();
          setStatsData(data);
        }
        if (activityRes.ok) {
            const data = await activityRes.json();
            setActivity(data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const stats = [
    { label: "Occupancy Rate", value: `${statsData.occupancyRate}%`, trend: `${statsData.occupiedRooms}/${statsData.totalRooms} Units`, icon: Users, colorClass: "bg-blue-50 text-blue-600" },
    { label: "Occupied Units", value: statsData.occupiedRooms, trend: "Active", icon: DoorOpen, colorClass: "bg-amber-50 text-amber-600" },
    { label: "Total Revenue", value: `₱${statsData.totalRevenue.toLocaleString()}`, trend: "Lifetime", icon: CreditCard, colorClass: "bg-emerald-50 text-emerald-600" },
    { label: "Outstanding Balance", value: `₱${statsData.outstandingBalance.toLocaleString()}`, icon: AlertCircle, colorClass: "bg-rose-50 text-rose-600" },
  ];

  if (loading) {
      return <div className="p-6">Loading dashboard stats...</div>;
  }

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard 
            key={index}
            label={stat.label}
            value={stat.value}
            trend={stat.trend}
            icon={stat.icon}
            colorClass={stat.colorClass}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
          </div>
          <div className="space-y-6">
            {activity.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No recent activity.</p>
            ) : (
                activity.map((item, i) => {
                    const IconComponent = ICON_MAP[item.icon] || AlertCircle;
                    return (
                        <div key={i} className="flex items-start gap-4">
                            <div className={`p-2 rounded-full ${item.color}`}>
                            <IconComponent className="w-5 h-5" />
                            </div>
                            <div>
                            <h4 className="text-sm font-semibold text-slate-900">{item.title}</h4>
                            <p className="text-xs text-slate-500">{item.desc}</p>
                            </div>
                            <span className="ml-auto text-xs text-slate-400">
                                {new Date(item.time).toLocaleDateString()}
                            </span>
                        </div>
                    );
                })
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6 bg-gradient-to-br from-blue-900 to-slate-900 text-white border-none">
          <h3 className="text-lg font-bold mb-2">Quick Actions</h3>
          <p className="text-blue-200 text-sm mb-6">Common tasks for today</p>
          <div className="space-y-3">
            <Link 
              href="/admin/tenants?action=new" 
              className="w-full flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add New Tenant
            </Link>
            <Link 
              href="/admin/billings?action=reading"
              className="w-full flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium"
            >
              <Zap className="w-4 h-4" /> Record Reading
            </Link>
            <button className="w-full flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium">
              <Bell className="w-4 h-4" /> Send Reminders
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
