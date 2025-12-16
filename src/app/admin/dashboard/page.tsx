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
  Bell,
  X 
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import Card from "@/components/ui/Card";
import ModalPortal from "@/components/ui/ModalPortal";
import Link from "next/link";
import { useState } from "react"; // Import useState
import useSWR from "swr"; // Import SWR

// Define a fetcher function for SWR
const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error('Failed to fetch data');
    }
    return res.json();
};

const ICON_MAP: any = {
    'Users': Users,
    'FileText': FileText,
    'CheckCircle2': CheckCircle2,
    'AlertCircle': AlertCircle
};

// Skeleton Loader Component for StatCard
const StatCardSkeleton = () => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 animate-pulse">
        <div className="h-6 w-2/3 bg-slate-200 rounded mb-3"></div>
        <div className="h-8 w-1/2 bg-slate-200 rounded mb-2"></div>
        <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
    </div>
);

// Skeleton Loader for Activity Item
const ActivityItemSkeleton = () => (
    <div className="flex items-start gap-4 animate-pulse">
        <div className="p-2 rounded-full bg-slate-200 h-9 w-9"></div>
        <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
        </div>
        <div className="h-3 bg-slate-200 rounded w-1/4"></div>
    </div>
);


export default function DashboardPage() {
  const { data: statsData, error: statsError, isLoading: statsLoading } = useSWR('/api/dashboard/stats', fetcher, { refreshInterval: 5000 });
  const { data: activityData, error: activityError, isLoading: activityLoading } = useSWR('/api/dashboard/activity', fetcher, { refreshInterval: 5000 });

  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [allActivity, setAllActivity] = useState<any[]>([]);
  const [loadingAllActivity, setLoadingAllActivity] = useState(false);

  const stats = statsData ? [
    { label: "Occupancy Rate", value: `${statsData.occupancyRate}%`, trend: `${statsData.occupiedRooms}/${statsData.totalRooms} Units`, icon: Users, colorClass: "bg-blue-50 text-blue-600" },
    { label: "Occupied Units", value: statsData.occupiedRooms, trend: "Active", icon: DoorOpen, colorClass: "bg-amber-50 text-amber-600" },
    { label: "Total Revenue", value: `₱${statsData.totalRevenue.toLocaleString()}`, trend: "Lifetime", icon: CreditCard, colorClass: "bg-emerald-50 text-emerald-600" },
    { label: "Outstanding Balance", value: `₱${statsData.outstandingBalance.toLocaleString()}`, icon: AlertCircle, colorClass: "bg-rose-50 text-rose-600" },
  ] : [];

  const handleViewAllActivity = async () => {
      setIsActivityModalOpen(true);
      if (allActivity.length > 0) return; // Don't re-fetch if already loaded

      setLoadingAllActivity(true);
      try {
          const res = await fetch('/api/dashboard/activity?limit=all');
          if (res.ok) {
              const data = await res.json();
              setAllActivity(data);
          }
      } catch (error) {
          console.error("Failed to fetch all activity", error);
      } finally {
          setLoadingAllActivity(false);
      }
  };

  if (statsError || activityError) return <div className="p-6 text-red-600">Failed to load dashboard data.</div>;

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
            stats.map((stat, index) => (
                <StatCard 
                    key={index}
                    label={stat.label}
                    value={stat.value}
                    trend={stat.trend}
                    icon={stat.icon}
                    colorClass={stat.colorClass}
                />
            ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
            <button onClick={handleViewAllActivity} className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
          </div>
          <div className="space-y-6">
            {activityLoading ? (
                Array.from({ length: 3 }).map((_, i) => <ActivityItemSkeleton key={i} />)
            ) : activityData?.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No recent activity.</p>
            ) : (
                activityData?.map((item: any, i: number) => {
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

      {isActivityModalOpen && (
          <ActivityHistoryModal
             onClose={() => setIsActivityModalOpen(false)}
             activities={allActivity}
             loading={loadingAllActivity}
          />
      )}
    </div>
  );
}

function ActivityHistoryModal({ onClose, activities, loading }: { onClose: () => void, activities: any[], loading: boolean }) {
    return (
        <ModalPortal>
            <div className="modal modal-open z-[60]">
                <div className="modal-box w-full max-w-2xl bg-white rounded-xl shadow-xl p-0 h-[80vh] flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                        <h3 className="text-xl font-bold text-slate-900">Activity History</h3>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6">
                        {loading ? (
                            <div className="flex justify-center py-8">Loading activities...</div>
                        ) : activities.length === 0 ? (
                            <p className="text-center text-slate-500 py-8">No activity history found.</p>
                        ) : (
                            <div className="space-y-6">
                                {activities.map((item, i) => {
                                    const IconComponent = ICON_MAP[item.icon] || AlertCircle;
                                    return (
                                        <div key={i} className="flex items-start gap-4">
                                            <div className={`p-2 rounded-full ${item.color} shrink-0`}>
                                                <IconComponent className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-semibold text-slate-900">{item.title}</h4>
                                                <p className="text-xs text-slate-500 truncate">{item.desc}</p>
                                            </div>
                                            <span className="text-xs text-slate-400 whitespace-nowrap">
                                                {new Date(item.time).toLocaleDateString()} {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    
                    <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end">
                        <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium">
                            Close
                        </button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button onClick={onClose}>close</button>
                </form>
            </div>
        </ModalPortal>
    );
}
