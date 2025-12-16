"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CreditCard, 
  Clock,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { MOCK_TENANT_USER, TenantUser } from '@/data/mock';
import Badge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button'; 
import PaymentModal from '@/components/tenant/PaymentModal';
import { formatDateMonth } from '@/lib/utils';

interface BillingHistoryItem {
    id: string;
    displayId: string;
    type: 'INVOICE' | 'PAYMENT';
    date: string;
    amount: number;
    status: string;
    description: string;
    details?: {
        rentPeriod?: string;
        utilityPeriod?: string;
        rent: number;
        water: number;
        elec: number;
        penalty: number;
        prevBalance: number;
        amountPaid: number;
    } | null;
}

export default function TenantBillingPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<TenantUser>(MOCK_TENANT_USER);
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([]);
  const [totalDue, setTotalDue] = useState(0);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [hasPendingPayment, setHasPendingPayment] = useState(false); 

  useEffect(() => {
    const fetchBillingData = async () => {
      try {
        const res = await fetch('/api/tenant/dashboard'); // Reuse dashboard API for now
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
          setBillingHistory(data.billingHistory || []);
          setTotalDue(data.totalDue);
          setHasPendingPayment(data.hasPendingPayment);
        } else {
             if (res.status === 401) {
                 router.push('/login');
             }
        }
      } catch (error) {
        console.error('Failed to fetch billing data', error);
      }
    };
    fetchBillingData();
  }, [router]);

  const handlePaymentSuccess = () => {
      setHasPendingPayment(true);
  };

  return (
      <div className="space-y-6 animate-slide-in">
        <div className="flex justify-between items-end">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Activity & Billing</h1>
                <p className="text-slate-500">View all your transactions, invoices, and payments.</p>
            </div>
            <Button 
                disabled={hasPendingPayment || totalDue <= 0}
                onClick={() => !hasPendingPayment && setIsPaymentModalOpen(true)}
                className="py-2"
                variant={hasPendingPayment ? 'outline' : 'primary'}
                icon={hasPendingPayment ? Clock : CreditCard}
            >
                {hasPendingPayment ? 'Pending' : 'Pay Now'}
            </Button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-900">Transaction History</h3>
            </div>
            <div className="divide-y divide-slate-100">
            {billingHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No activity yet.</div>
            ) : (
                billingHistory.map((item) => (
                    <div key={item.id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-full border shrink-0 ${
                                item.type === 'INVOICE' 
                                    ? 'bg-orange-50 text-orange-600 border-orange-100' 
                                    : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            }`}>
                                {item.type === 'INVOICE' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                            </div>
                                                                                                    <div>
                                                                                                        <div className="flex items-center gap-2 mb-1">
                                                                                                            <p className="font-bold text-slate-900">{item.description}</p>
                                                                                                            <Badge status={item.status === 'Verified' ? 'Confirmed' : item.status} type={item.type === 'PAYMENT' ? 'payment' : 'invoice'} />
                                                                                                        </div>
                                                                                                        <p className="text-xs text-slate-500 flex items-center gap-2">
                                                                                                            {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' })} • {new Date(item.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Manila' })}
                                                                                                        </p>
                                                                                                        {item.type === 'INVOICE' && item.details && (
                                                                                                            <div className="mt-2 text-xs text-slate-500 space-y-1">
                                                                                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                                                                                                    <span>Rent: ₱{item.details.rent.toLocaleString()}</span>
                                                                                                                    <span>Water: ₱{item.details.water.toLocaleString()}</span>
                                                                                                                    <span>Electricity: ₱{item.details.elec.toLocaleString()}</span>
                                                                                                                    {item.details.penalty > 0 && (
                                                                                                                        <span className="text-rose-600">Penalty: ₱{item.details.penalty.toLocaleString()}</span>
                                                                                                                    )}
                                                                                                                    <span className={
                                                                                                                        item.details.prevBalance > 0 ? 'text-amber-600' : 
                                                                                                                        item.details.prevBalance < 0 ? 'text-emerald-600' : 'text-slate-500'
                                                                                                                    }>
                                                                                                                        Prev Balance: ₱{Math.abs(item.details.prevBalance).toLocaleString()}
                                                                                                                    </span>
                                                                                                                    <span>Paid: ₱{item.details.amountPaid.toLocaleString()}</span>
                                                                                                                </div>
                                                                                                                <div className="pt-1 border-t border-slate-100 mt-1 space-y-0.5">
                                                                                                                    <p>Rent: {formatDateMonth(item.details.rentPeriod || '')}</p>
                                                                                                                    <p>Utilities: {formatDateMonth(item.details.utilityPeriod || '')}</p>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        )}
                                                                                                        {item.type === 'PAYMENT' && (
                                                                                                            <p className="mt-1 text-xs text-slate-400">Ref: {item.id.slice(0, 8)}...</p>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div className="text-right shrink-0">
                                                                                                                                        <p className={`font-bold text-lg ${
                                                                                                                                            (item.type === 'INVOICE' && item.amount > 0) ? 'text-slate-900' : 'text-emerald-600'
                                                                                                                                        }`}>
                                                                                                                                            {item.type === 'INVOICE' 
                                                                                                                                                ? (item.amount > 0 ? '' : '+') 
                                                                                                                                                : '-'} ₱{Math.abs(item.amount).toLocaleString()}
                                                                                                                                        </p>                                                                                                    <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-bold">{item.type}</p>
                                                                                                </div>
                    </div>
                ))
            )}
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
