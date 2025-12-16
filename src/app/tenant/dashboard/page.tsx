"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  ArrowRight, 
  ArrowUpRight,
  Calendar, 
  CreditCard, 
  Check, 
  FileText, 
  Clock
} from 'lucide-react';
import { TenantUser, TenantInvoice } from '@/lib/types';
import Badge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button'; 
import PaymentModal from '@/components/tenant/PaymentModal';
import { formatDateMonth } from '@/lib/utils';
import useSWR from 'swr'; // Import SWR

// Define a fetcher function for SWR
const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error('Failed to fetch data');
    }
    return res.json();
};

// Skeleton Loader Component for Tenant Dashboard
const DashboardSkeleton = () => (
    <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
        <div className="h-5 bg-slate-200 rounded w-1/2"></div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-40 bg-slate-200 rounded-2xl"></div>
            <div className="h-40 bg-slate-200 rounded-2xl"></div>
            <div className="h-40 bg-slate-200 rounded-2xl"></div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-slate-200"></div>
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-slate-200"></div>
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
            </div>
        </div>
    </div>
);


export default function TenantDashboardPage() {
  const router = useRouter();
  const { data, error, isLoading } = useSWR('/api/tenant/dashboard', fetcher, { refreshInterval: 5000 });

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const userData: TenantUser = data ? {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    unitId: data.unitId,
    unitName: data.unitName,
    building: data.buildingName,
    leaseEnd: data.leaseEnd,
    avatar: data.avatarUrl,
    contractUrl: data.contractUrl,
  } : {
    id: '', name: '', email: '', phone: '', unitId: '', unitName: '', building: '', leaseEnd: '', avatar: null
  };
  const recentActivity = data?.recentActivity || [];
  const totalDue = data?.totalDue || 0;
  const hasPendingPayment = data?.hasPendingPayment || false;

  // Handle unauthorized access
  if (error && error.message === 'Failed to fetch data' && !isLoading) {
    router.push('/login');
    return null; 
  }

  const handlePaymentSuccess = () => {
      // SWR will revalidate automatically due to refreshInterval
      // No need to manually setHasPendingPayment(true) here
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 animate-slide-in">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome back, {userData.name.split(' ')[0]}!</h1>
            <p className="text-slate-500">Here's what's happening with your unit today.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Unit Card */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-900/20">
            <div className="flex items-start justify-between mb-8">
                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <Building2 className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium backdrop-blur-sm">Occupied</span>
            </div>
            <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Current Unit</p>
                <h3 className="text-3xl font-bold">Unit {userData.unitName}</h3>
                <p className="text-blue-200 text-sm mt-1">{userData.building}</p>
            </div>
            </div>

            {/* Balance Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
                <div className="flex items-start justify-between mb-6">
                <div className={`p-3 rounded-xl ${totalDue < 0 ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    <CreditCard className="w-6 h-6" />
                </div>
                </div>
                <div>
                <p className="text-slate-500 text-sm font-medium mb-1">{totalDue < 0 ? 'Credit Balance' : 'Total Due'}</p>
                <h3 className={`text-3xl font-bold ${totalDue < 0 ? 'text-blue-600' : 'text-slate-900'}`}>
                    ₱{Math.abs(totalDue).toLocaleString()}
                </h3>
                <p className={`${totalDue > 0 ? 'text-amber-600' : 'text-slate-500'} text-sm mt-1 flex items-center gap-1`}>
                    <Check className="w-3 h-3" /> {totalDue > 0 ? 'Due Now' : 'No Balance Due'}
                </p>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
                <Button 
                    disabled={hasPendingPayment || totalDue <= 0}
                    onClick={() => !hasPendingPayment && setIsPaymentModalOpen(true)}
                    className="w-full py-2"
                    variant={hasPendingPayment ? 'outline' : 'primary'}
                    icon={hasPendingPayment ? Clock : ArrowRight}
                >
                    {hasPendingPayment ? 'Pending' : 'Pay Now'}
                </Button>
            </div>
            </div>

            {/* Lease Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-start justify-between mb-8">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <Calendar className="w-6 h-6" />
                </div>
            </div>
            <div>
                <p className="text-slate-500 text-sm font-medium mb-1">Lease Ends</p>
                                      <h3 className="text-3xl font-bold text-slate-900">
                                        {new Date(userData.leaseEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Manila' })}
                                      </h3>                <p className="text-slate-400 text-sm mt-1">{new Date(userData.leaseEnd).getFullYear()}</p>
            </div>
            </div>
        </div>

        {/* Recent Activity Preview */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900">Recent Activity</h3>
            <Button onClick={() => router.push('/tenant/billing')} variant="ghost" className="text-sm">
                View All <ArrowRight className="w-4 h-4" />
            </Button>
            </div>
            <div className="space-y-4">
            {recentActivity.map((item: any) => ( // Cast item to any for now
                <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className={`p-2 bg-white rounded-lg border border-slate-200 ${item.type === 'PAYMENT' ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {item.type === 'PAYMENT' ? <ArrowUpRight className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>
                    <div>
                        <p className="font-semibold text-slate-900">{item.type === 'PAYMENT' ? 'Payment Submission' : 'Rent & Utilities'}</p>
                        {item.type === 'INVOICE' ? (
                            <>
                                <p className="text-xs text-slate-500">Rent: {formatDateMonth(item.details.rentPeriod)}</p>
                                <p className="text-xs text-slate-500">Utilities: {formatDateMonth(item.details.utilityPeriod)}</p>
                            </>
                        ) : (
                            <p className="text-xs text-slate-500">{new Date(item.date).toLocaleDateString()}</p>
                        )}
                    </div>
                </div>
                <div className="text-right">
                    <p className={`font-bold ${item.type === 'PAYMENT' ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {item.type === 'PAYMENT' ? '-' : ''}₱{item.amount.toLocaleString()}
                    </p>
                    <Badge status={item.status} type={item.type === 'PAYMENT' ? 'payment' : 'invoice'} />
                </div>
                </div>
            ))}
            </div>
        </div>

        {isPaymentModalOpen && (
            <PaymentModal 
                user={userData} 
                onClose={() => setIsPaymentModalOpen(false)} 
                onSuccess={handlePaymentSuccess}
            />
        )}
    </div>
  );
}
