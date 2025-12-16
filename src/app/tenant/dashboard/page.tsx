"use client";

import { useState, useEffect } from 'react';
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
import { MOCK_TENANT_USER, TenantUser, TenantInvoice } from '@/data/mock';
import Badge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button'; 
import PaymentModal from '@/components/tenant/PaymentModal';
import { formatDateMonth } from '@/lib/utils';

export default function TenantDashboardPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<TenantUser>(MOCK_TENANT_USER);
  const [recentActivity, setRecentActivity] = useState<any[]>([]); // Changed type to any[] or specific interface
  const [totalDue, setTotalDue] = useState(0);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [hasPendingPayment, setHasPendingPayment] = useState(false); 

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch('/api/tenant/dashboard');
        if (res.ok) {
          const data = await res.json();
          setUserData(prev => ({
            ...prev,
            name: data.name,
            email: data.email,
            phone: data.phone,
            unitName: data.unitName,
            building: data.buildingName,
            leaseEnd: data.leaseEnd,
            avatar: data.avatarUrl,
            contractUrl: data.contractUrl,
          }));
          setRecentActivity(data.recentActivity);
          setTotalDue(data.totalDue);
          setHasPendingPayment(data.hasPendingPayment);
        } else {
             if (res.status === 401) {
                 router.push('/login');
             }
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      }
    };
    fetchDashboardData();
  }, [router]);

  const handlePaymentSuccess = () => {
      setHasPendingPayment(true);
      // Ideally re-fetch
  };

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
            {recentActivity.map((item) => (
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
