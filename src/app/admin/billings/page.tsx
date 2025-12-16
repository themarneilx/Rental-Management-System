"use client";

import { useState, useEffect } from "react";
import { Invoice, Tenant, Unit } from "@/data/mock";
import { Plus, Zap, Settings, Eye, Pencil, Calendar, Droplets, X, DollarSign } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/StatusBadge";
import ModalPortal from "@/components/ui/ModalPortal";

// Helper functions from design.jsx
const formatDateMonth = (dateStr: string) => {
    if (!dateStr) return '';
    
    // Handle "YYYY-MM-DD to YYYY-MM-DD" format
    if (dateStr.includes(' to ')) {
        const [start, end] = dateStr.split(' to ');
        const startDate = new Date(start);
        const endDate = new Date(end);
        
        const format = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return `${format(startDate)} - ${format(endDate)}`;
    }

    // Handle YYYY-MM format
    if (dateStr.match(/^\d{4}-\d{2}$/)) {
        const [year, month] = dateStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    return dateStr;
};

const getNextMonth = (currentMonthStr: string) => {
    if (!currentMonthStr) {
        // Default to current month start-end
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const fmt = (d: Date) => d.toISOString().slice(0, 10);
        return `${fmt(start)} to ${fmt(end)}`;
    }

    // Handle range
    if (currentMonthStr.includes(' to ')) {
        const [start, end] = currentMonthStr.split(' to ');
        const startDate = new Date(start);
        const endDate = new Date(end);

        // Add 1 month
        startDate.setMonth(startDate.getMonth() + 1);
        
        // For end date, we want to maintain "End of Month" logic if it was end of month
        // Check if old end date was last day of its month
        const oldEndMonth = new Date(end);
        oldEndMonth.setDate(oldEndMonth.getDate() + 1);
        const isLastDay = oldEndMonth.getDate() === 1;

        endDate.setMonth(endDate.getMonth() + 1);

        if (isLastDay) {
             // Set to end of new month
             endDate.setDate(0); // This sets it to last day of PREVIOUS month of current pointer?? 
             // Wait, setMonth + 1 sets it to same day next month.
             // If we want last day of that new month:
             const targetMonth = new Date(endDate);
             targetMonth.setMonth(targetMonth.getMonth() + 1);
             targetMonth.setDate(0);
             // Actually simplest: new Date(year, month+1, 0)
             const nextMonthEnd = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
             
             // Wait, simpler logic: just add 1 month. If it overflows, Date handles it?
             // No, "Jan 31" + 1 month -> "Mar 3" or similar.
             // We want "Feb 28/29".
        }
        
        // Re-implementing simplified next month logic
        const addMonth = (d: Date) => {
            const current = new Date(d);
            const next = new Date(current.getFullYear(), current.getMonth() + 1, 1);
            // If original was last day, make next last day?
            // Let's stick to simple +1 month but handle overflow
            const expectedMonth = (current.getMonth() + 1) % 12;
            current.setMonth(current.getMonth() + 1);
             if (current.getMonth() !== expectedMonth && current.getMonth() !== (expectedMonth + 12)%12 ) {
                 // Overflowed (e.g. Jan 31 -> Mar 2). Set to last day of prev month (Feb 28)
                 current.setDate(0);
             }
             return current;
        };
        
        const nextStart = addMonth(startDate); // Wait, we already did setMonth above.
        // Let's reset and do it cleanly
        const d1 = new Date(start);
        const d2 = new Date(end);
        
        // Next Start
        const nextD1 = new Date(d1.getFullYear(), d1.getMonth() + 1, d1.getDate());
        
        // Next End - Special Check for End of Month
        const d2NextDay = new Date(d2);
        d2NextDay.setDate(d2.getDate() + 1);
        const wasEndOfMonth = d2NextDay.getDate() === 1;
        
        let nextD2 = new Date(d2.getFullYear(), d2.getMonth() + 1, d2.getDate());
        if (wasEndOfMonth) {
             // Set to end of the new month
             nextD2 = new Date(nextD2.getFullYear(), nextD2.getMonth() + 1, 0);
        }

        const fmt = (d: Date) => d.toISOString().slice(0, 10);
        return `${fmt(nextD1)} to ${fmt(nextD2)}`;
    }

    const [year, month] = currentMonthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().slice(0, 7);
};

// --- Custom Date Range Component ---
function DateRangeInput({ label, value, onChange, required = false }: { label: string, value: string, onChange: (val: string) => void, required?: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    
    // Parse initial value or default
    const [startVal, endVal] = value && value.includes(' to ') 
        ? value.split(' to ') 
        : [new Date().toISOString().slice(0,10), new Date().toISOString().slice(0,10)];

    const [tempStart, setTempStart] = useState(startVal);
    const [tempEnd, setTempEnd] = useState(endVal);

    useEffect(() => {
        if (value && value.includes(' to ')) {
            const [s, e] = value.split(' to ');
            setTempStart(s);
            setTempEnd(e);
        }
    }, [value]);

    const handleApply = () => {
        onChange(`${tempStart} to ${tempEnd}`);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" /> {label}
            </label>
            <div 
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white cursor-pointer flex items-center justify-between hover:border-blue-400 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="text-slate-700">{formatDateMonth(value) || 'Select Date Range'}</span>
                <Calendar className="w-4 h-4 text-slate-400" />
            </div>
            
            {/* Popover */}
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 mt-2 p-4 bg-white rounded-xl shadow-xl border border-slate-200 z-20 w-72 animate-in fade-in zoom-in-95 duration-200">
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Start Date</label>
                                <input 
                                    type="date" 
                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm mt-1"
                                    value={tempStart}
                                    onChange={(e) => setTempStart(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">End Date</label>
                                <input 
                                    type="date" 
                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm mt-1"
                                    value={tempEnd}
                                    onChange={(e) => setTempEnd(e.target.value)}
                                />
                            </div>
                            <div className="pt-2">
                                <button 
                                    type="button" 
                                    onClick={handleApply}
                                    className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                >
                                    Apply Range
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [rates, setRates] = useState({ ELECTRICITY: 21, WATER: 70 });
  const [billingMonthTab, setBillingMonthTab] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [isEditInvoiceModalOpen, setIsEditInvoiceModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  
  // View Modal State
  const [isViewInvoiceModalOpen, setIsViewInvoiceModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    async function fetchData() {
        try {
            const [invRes, tenRes, unitRes, ratesRes] = await Promise.all([
                fetch('/api/invoices'),
                fetch('/api/tenants'),
                fetch('/api/rooms'),
                fetch('/api/settings/rates')
            ]);

            if (invRes.ok && tenRes.ok && unitRes.ok && ratesRes.ok) {
                const invData = await invRes.json();
                const tenData = await tenRes.json();
                const unitData = await unitRes.json();
                const ratesData = await ratesRes.json();

                const mappedInvoices: Invoice[] = invData.map((inv: any) => ({
                    id: inv.invoiceNumber, // Use invoiceNumber for display ID
                    tenantId: inv.tenantId,
                    unitId: inv.unitId,
                    rentPeriod: inv.rentPeriod,
                    utilityPeriod: inv.utilityPeriod,
                    rent: Number(inv.rentAmount),
                    waterReading: { prev: Number(inv.waterPrev), curr: Number(inv.waterCurr) },
                    elecReading: { prev: Number(inv.elecPrev), curr: Number(inv.elecCurr) },
                    waterCost: Number(inv.waterCost),
                    elecCost: Number(inv.elecCost),
                    penalty: Number(inv.penalty),
                    prevBalance: Number(inv.prevBalance),
                    credit: Number(inv.credit),
                    total: Number(inv.totalAmount),
                    status: inv.status,
                    date: inv.date,
                    amountPaid: Number(inv.amountPaid || 0) // Initialize amountPaid from fetched data, defaulting to 0
                }));

                const mappedTenants: Tenant[] = tenData.map((t: any) => ({
                    id: t.id,
                    name: t.name,
                    email: t.email || '',
                    phone: t.phone,
                    unitId: t.roomId,
                    status: t.status,
                    leaseEnd: t.leaseEnd?.split('T')[0] || '',
                    deposit: Number(t.deposit)
                }));

                const mappedUnits: Unit[] = unitData.map((r: any) => ({
                    id: r.id,
                    name: r.name,
                    building: r.building?.name || 'Unknown',
                    type: r.type,
                    rent: Number(r.rent),
                    status: r.status
                }));

                setInvoices(mappedInvoices);
                setTenants(mappedTenants);
                setUnits(mappedUnits);
                setRates(ratesData);
            }
        } catch (error) {
            console.error("Failed to fetch billing data", error);
        } finally {
            setLoading(false);
        }
    }
    fetchData();
  }, []);

  // Derived Data (Calculated from real invoices)
  const stats = {
    collected: invoices.reduce((acc, curr) => {
        if (curr.status === 'Paid') {
            return acc + curr.total;
        } 
        if (curr.status === 'Partial' && curr.amountPaid) {
            return acc + curr.amountPaid;
        }
        return acc;
    }, 0),
    receivables: invoices.reduce((acc, curr) => {
        if (curr.status === 'Revoked') return acc; // Exclude revoked
        if (curr.status === 'Pending' || curr.status === 'Overdue') {
            return acc + curr.total;
        }
        if (curr.status === 'Partial' && curr.amountPaid !== undefined) {
            // Only add remaining balance if there's an amountPaid and it's less than total
            const remaining = curr.total - curr.amountPaid;
            if (remaining > 0) {
                return acc + remaining;
            }
        }
        return acc;
    }, 0),
    overdue: invoices.filter(i => i.status === 'Overdue').length,
    totalExp: 0 // Not tracked yet
  };

  const monthsSet = new Set(invoices.map(inv => {
      // Extract YYYY-MM from potential range
      if (inv.utilityPeriod.includes(' to ')) {
          return inv.utilityPeriod.split(' to ')[0].slice(0, 7);
      }
      return inv.utilityPeriod;
  }));
  monthsSet.add(new Date().toISOString().slice(0, 7));
  const availableMonths = Array.from(monthsSet).sort();

  const filteredInvoices = invoices.filter(inv => 
      inv.utilityPeriod.startsWith(billingMonthTab)
  );

  const handleAddInvoice = async (newReadingData: any) => {
    try {
        const res = await fetch('/api/invoices/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tenantId: newReadingData.tenantId,
                waterCurrent: newReadingData.waterReading.curr,
                electricCurrent: newReadingData.elecReading.curr,
                penalty: newReadingData.penalty,
                prevBalance: newReadingData.prevBalance,
                credit: newReadingData.credit,
                rentPeriod: newReadingData.rentPeriod,
                utilityPeriod: newReadingData.utilityPeriod
            })
        });

        if (res.ok) {
            const generatedInvoice: any = await res.json(); // Cast to any to resolve type issue
             const mappedInvoice: Invoice = {
                id: generatedInvoice.invoiceNumber,
                tenantId: generatedInvoice.tenantId,
                unitId: generatedInvoice.unitId,
                rentPeriod: generatedInvoice.rentPeriod,
                utilityPeriod: generatedInvoice.utilityPeriod,
                rent: Number(generatedInvoice.rentAmount),
                waterReading: { prev: Number(generatedInvoice.waterPrev), curr: Number(generatedInvoice.waterCurr) },
                elecReading: { prev: Number(generatedInvoice.elecPrev), curr: Number(generatedInvoice.elecCurr) },
                waterCost: Number(generatedInvoice.waterCost),
                elecCost: Number(generatedInvoice.elecCost),
                penalty: Number(generatedInvoice.penalty),
                prevBalance: Number(generatedInvoice.prevBalance),
                // @ts-ignore
                credit: Number(generatedInvoice.credit), // Restored
                total: Number(generatedInvoice.totalAmount),
                status: generatedInvoice.status,
                date: generatedInvoice.date,
                amountPaid: 0 // Initialize amountPaid for new invoices
            };

            setInvoices([mappedInvoice, ...invoices]);
            setIsBillingModalOpen(false);
            setBillingMonthTab(mappedInvoice.utilityPeriod.slice(0, 7));
        } else {
            alert('Failed to generate invoice');
        }
    } catch (error) {
        console.error('Error generating invoice:', error);
    }
  };

  const handleUpdateInvoice = (updatedInvoice: Invoice) => {
    // TODO: Implement API update
    setInvoices(prev => prev.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv));
    setIsEditInvoiceModalOpen(false);
    setEditingInvoice(null);
  };

  const handleUpdateRates = async (newRates: { ELECTRICITY: number, WATER: number }) => {
    try {
        const res = await fetch('/api/settings/rates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newRates)
        });

        if (res.ok) {
            setRates(newRates);
            setIsRateModalOpen(false);
        } else {
            alert('Failed to update rates');
        }
    } catch (error) {
        console.error('Error updating rates:', error);
    }
  };

  const openEditInvoice = (invoice: Invoice) => {
      setEditingInvoice(invoice);
      setIsEditInvoiceModalOpen(true);
  };

  const openViewInvoice = (invoice: Invoice) => {
      setViewingInvoice(invoice);
      setIsViewInvoiceModalOpen(true);
  };

  const openPaymentModal = (invoice: Invoice) => {
      setPaymentInvoice(invoice);
      setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (invoiceId: string, type: 'Full' | 'Partial', amount: number) => {
      try {
          const res = await fetch(`/api/invoices/${invoiceId}/payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ amount })
          });

          if (res.ok) {
              const data = await res.json();
              setInvoices(prev => prev.map(inv => {
                  if (inv.id === invoiceId) {
                     return { ...inv, status: data.status, amountPaid: data.amountPaid };
                  }
                  return inv;
              }));
              setIsPaymentModalOpen(false);
              setPaymentInvoice(null);
          } else {
              alert('Failed to record payment');
          }
      } catch (error) {
          console.error('Error recording payment:', error);
          alert('An error occurred while recording payment');
      }
  };

  if (loading) return <div className="p-6">Loading billing data...</div>;

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Billing & Meter Readings</h2>
          <p className="text-slate-500 text-sm">Track utilities, generate invoices, and manage payments.</p>
        </div>
        <div className="flex gap-2">
            <button 
              onClick={() => setIsRateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Settings className="w-4 h-4" /> Rates
            </button>
            <button 
              onClick={() => setIsBillingModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Zap className="w-4 h-4" /> Record Reading
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-center">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Electricity Rate</p>
          <p className="text-xl font-bold text-slate-900">₱{rates.ELECTRICITY}<span className="text-xs text-slate-400 font-normal">/kWh</span></p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-center">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Water Rate</p>
          <p className="text-xl font-bold text-slate-900">₱{rates.WATER}<span className="text-xs text-slate-400 font-normal">/m³</span></p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-center">
           <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Receivables</p>
           <p className="text-xl font-bold text-slate-900">₱{stats.receivables.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-center">
           <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Collected</p>
           <p className="text-xl font-bold text-slate-900">₱{stats.collected.toLocaleString()}</p>
        </div>
      </div>

      <div className="border-b border-slate-200 overflow-x-auto">
        <div className="flex space-x-2 pb-1">
          {availableMonths.map(month => (
            <button
              key={month}
              onClick={() => setBillingMonthTab(month)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                 billingMonthTab === month 
                   ? 'border-blue-600 text-blue-600' 
                   : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {formatDateMonth(month)}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">Invoice ID</th>
                <th className="px-6 py-3 font-semibold">Tenant / Unit</th>
                <th className="px-6 py-3 font-semibold">Periods</th>
                <th className="px-6 py-3 font-semibold text-right">Water</th>
                <th className="px-6 py-3 font-semibold text-right">Electric</th>
                <th className="px-6 py-3 font-semibold text-right">Rent</th>
                <th className="px-6 py-3 font-semibold text-right">Penalty</th>
                <th className="px-6 py-3 font-semibold text-right">Prev Bal.</th>
                <th className="px-6 py-3 font-semibold text-right">Credit</th>
                <th className="px-6 py-3 font-semibold text-right">Total Due</th>
                <th className="px-6 py-3 font-semibold text-center">Status</th>
                <th className="px-6 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr><td colSpan={12} className="px-6 py-8 text-center text-slate-500">No invoices found for this month.</td></tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const tenant = tenants.find(t => t.id === inv.tenantId) || { name: 'Unknown' } as Tenant;
                  const unit = units.find(u => u.id === inv.unitId) || { name: '?', building: '' } as Unit;
                  return (
                    <tr key={inv.id} className={`hover:bg-slate-50/50 ${inv.status === 'Revoked' ? 'opacity-50 bg-slate-50' : ''}`}>
                      <td className={`px-6 py-4 font-mono text-xs font-medium ${inv.status === 'Revoked' ? 'text-slate-500 line-through' : 'text-blue-600'}`}>{inv.id}</td>
                      <td className="px-6 py-4">
                        <div className={`font-medium ${inv.status === 'Revoked' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{tenant.name}</div>
                        <div className="text-xs text-slate-500">{unit.name} • {unit.building}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                          <div className="text-xs">Rent: {formatDateMonth(inv.rentPeriod)}</div>
                          <div className="text-xs">Util: {formatDateMonth(inv.utilityPeriod)}</div>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-600">
                          <div className="font-mono">₱{inv.waterCost.toLocaleString()}</div>
                          <div className="text-[10px] text-slate-400">({(inv.waterReading?.curr - inv.waterReading?.prev).toFixed(1)} m³)</div>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-600">
                          <div className="font-mono">₱{inv.elecCost.toLocaleString()}</div>
                          <div className="text-[10px] text-slate-400">({(inv.elecReading?.curr - inv.elecReading?.prev).toFixed(1)} kWh)</div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-slate-600">₱{inv.rent.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-mono text-rose-600">₱{inv.penalty?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 text-right font-mono text-orange-600">₱{inv.prevBalance?.toLocaleString() || 0}</td>
                      {/* @ts-ignore */}
                      <td className="px-6 py-4 text-right font-mono text-emerald-600">-₱{inv.credit?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                          ₱{(inv.total - (inv.amountPaid || 0)).toLocaleString()}
                          {(inv.amountPaid || 0) > 0 && inv.status !== 'Paid' && (
                              <span className="block text-[10px] text-slate-400 font-normal">Bal. of ₱{inv.total.toLocaleString()}</span>
                          )}
                      </td>
                      <td className="px-6 py-4 text-center"><Badge status={inv.status} /></td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex items-center justify-end gap-2">
                           <button onClick={() => openPaymentModal(inv)} className="text-emerald-500 hover:text-emerald-700 transition-colors" title="Record Payment">
                              <span className="w-4 h-4 text-center">₱</span>
                           </button>
                           <button onClick={() => openViewInvoice(inv)} className="text-slate-400 hover:text-blue-600 transition-colors" title="View">
                              <Eye className="w-4 h-4" />
                           </button>
                           <button onClick={() => openEditInvoice(inv)} className="text-slate-400 hover:text-blue-600 transition-colors" title="Edit">
                              <Pencil className="w-4 h-4" />
                           </button>
                         </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modals */}
      {isBillingModalOpen && (
        <BillingModal 
          onClose={() => setIsBillingModalOpen(false)} 
          tenants={tenants.filter(t => t.status === 'Active')}
          units={units}
          rates={rates}
          invoices={invoices}
          onSubmit={handleAddInvoice}
        />
      )}

      {isEditInvoiceModalOpen && editingInvoice && (
        <EditInvoiceModal
          onClose={() => setIsEditInvoiceModalOpen(false)}
          invoice={editingInvoice}
          rates={rates}
          onSubmit={handleUpdateInvoice}
        />
      )}

      {isRateModalOpen && (
          <RateModal
            onClose={() => setIsRateModalOpen(false)}
            rates={rates}
            onSubmit={handleUpdateRates}
          />
      )}

      {isViewInvoiceModalOpen && viewingInvoice && (
        <ViewInvoiceModal
          onClose={() => setIsViewInvoiceModalOpen(false)}
          invoice={viewingInvoice}
          rates={rates}
          tenants={tenants}
          units={units}
        />
      )}

      {isPaymentModalOpen && paymentInvoice && (
          <PaymentModal
            onClose={() => setIsPaymentModalOpen(false)}
            invoice={paymentInvoice}
            onSubmit={handlePaymentSubmit}
          />
      )}
    </div>
  );
}

function PaymentModal({ onClose, invoice, onSubmit }: any) {
    const [paymentType, setPaymentType] = useState<'Full' | 'Partial'>('Full');
    const [amount, setAmount] = useState(invoice.total - (invoice.amountPaid || 0)); // Initialize with remaining due

    useEffect(() => {
        if (paymentType === 'Full') {
            setAmount(invoice.total - (invoice.amountPaid || 0)); // Set to remaining due for full payment
        } else {
            setAmount(0); // For partial, start at 0
        }
    }, [paymentType, invoice.total, invoice.amountPaid]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(invoice.id, paymentType, Number(amount));
    };

    return (
        <ModalPortal>
            <div className="modal modal-open z-[60]">
                <div className="modal-box w-full max-w-sm bg-white rounded-xl shadow-xl p-0">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-900">Record Payment</h3>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div>
                            <p className="text-sm text-slate-500 mb-2">Invoice: <span className="font-mono font-medium text-slate-700">{invoice.id}</span></p>
                            <p className="text-sm text-slate-500">Total Due: <span className="font-bold text-slate-900">₱{invoice.total.toLocaleString()}</span></p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Payment Type</label>
                            <select 
                                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white"
                                value={paymentType}
                                onChange={(e) => setPaymentType(e.target.value as 'Full' | 'Partial')}
                            >
                                <option value="Full">Full Payment</option>
                                <option value="Partial">Partial Payment</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Amount Paid (₱)</label>
                            <input 
                                type="number" 
                                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                required
                                min={0}
                                readOnly={paymentType === 'Full'}
                            />
                        </div>

                        <div className="pt-2 flex justify-end gap-3">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
                            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm">
                                Confirm Payment
                            </button>
                        </div>
                    </form>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button onClick={onClose}>close</button>
                </form>
            </div>
        </ModalPortal>
    );
}

function BillingModal({ onClose, tenants, units, rates, invoices, onSubmit }: any) {
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [rentPeriod, setRentPeriod] = useState('');
  const [utilityPeriod, setUtilityPeriod] = useState('');
  
  const [prevWater, setPrevWater] = useState(0);
  const [currWater, setCurrWater] = useState(0);
  const [prevElec, setPrevElec] = useState(0);
  const [currElec, setCurrElec] = useState(0);
  const [penalty, setPenalty] = useState(0);
  const [prevBalance, setPrevBalance] = useState(0);
  const [credit, setCredit] = useState(0);

  useEffect(() => {
    if (selectedTenantId) {
        const tenantInvoices = invoices
            .filter((inv: Invoice) => inv.tenantId === selectedTenantId);

        // Calculate total outstanding balance from all previous invoices
        const outstandingBalance = tenantInvoices.reduce((sum: number, inv: Invoice) => {
            // Only consider invoices that are not fully paid AND not revoked
            if (inv.status !== 'Paid' && inv.status !== 'Revoked') {
                const paid = inv.amountPaid || 0;
                const remaining = inv.total - paid;
                return sum + Math.max(0, remaining);
            }
            return sum;
        }, 0);
        
        setPrevBalance(outstandingBalance);

        // Auto-calculate penalty (5% of outstanding balance)
        const autoPenalty = outstandingBalance > 0 ? outstandingBalance * 0.05 : 0;
        setPenalty(Number(autoPenalty.toFixed(2)));

        // Get the latest invoice for previous meter readings
        const latestInvoice = tenantInvoices
            .sort((a: Invoice, b: Invoice) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        if (latestInvoice) {
            setPrevWater(latestInvoice.waterReading ? latestInvoice.waterReading.curr : 0);
            setPrevElec(latestInvoice.elecReading ? latestInvoice.elecReading.curr : 0);
            setRentPeriod(getNextMonth(latestInvoice.rentPeriod));
            setUtilityPeriod(getNextMonth(latestInvoice.utilityPeriod));
        } else {
            // If no previous invoices, default to 0 and current month
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
            const range = `${start} to ${end}`;

            setPrevWater(0);
            setPrevElec(0);
            setRentPeriod(range);
            setUtilityPeriod(range);
        }
    }
  }, [selectedTenantId, invoices]);

  const selectedTenant = tenants.find((t: Tenant) => t.id === selectedTenantId);
  const selectedUnit = selectedTenant ? units.find((u: Unit) => u.id === selectedTenant.unitId) : null;
  const rent = selectedUnit ? selectedUnit.rent : 0;

  const waterUsage = Math.max(0, currWater - prevWater);
  const elecUsage = Math.max(0, currElec - prevElec);
  
  const waterBill = waterUsage * rates.WATER;
  const elecBill = elecUsage * rates.ELECTRICITY;
  
  const total = rent + waterBill + elecBill + Number(penalty) + Number(prevBalance) - Number(credit);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;

    onSubmit({
      id: `INV-${Math.floor(Math.random() * 10000)}`,
      tenantId: selectedTenantId,
      unitId: selectedTenant.unitId,
      rentPeriod: rentPeriod,
      utilityPeriod: utilityPeriod,
      waterReading: { prev: Number(prevWater), curr: Number(currWater) },
      elecReading: { prev: Number(prevElec), curr: Number(currElec) },
      waterCost: waterBill,
      elecCost: elecBill,
      rent: rent,
      penalty: Number(penalty),
      prevBalance: Number(prevBalance), 
      credit: Number(credit),
      total: total,
      status: 'Pending',
      date: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <ModalPortal>
    <div className="modal modal-open z-[60]">
      <div className="modal-box w-11/12 max-w-2xl bg-white rounded-xl shadow-xl p-0 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-900">Record New Reading</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
             <Plus className="w-6 h-6 rotate-45" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Select Tenant</label>
               <select 
                 className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                 value={selectedTenantId}
                 onChange={(e) => setSelectedTenantId(e.target.value)}
                 required
               >
                 <option value="">-- Choose Tenant --</option>
                 {tenants.map((t: Tenant) => {
                    const u = units.find((unit: Unit) => unit.id === t.unitId);
                    return <option key={t.id} value={t.id}>{t.name} ({u ? u.name : 'No Unit'})</option>
                 })}
               </select>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <DateRangeInput 
                    label="Utilities Billing Period"
                    value={utilityPeriod}
                    onChange={setUtilityPeriod}
                />
                <DateRangeInput 
                    label="Rent Billing Period"
                    value={rentPeriod}
                    onChange={setRentPeriod}
                />
             </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
             <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-600">Base Rent</span>
                <span className="font-bold text-slate-900">₱{rent.toLocaleString()}</span>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-blue-600 flex items-center gap-2">
                <Zap className="w-4 h-4" /> Electricity (₱{rates.ELECTRICITY}/kWh)
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500">Previous</label>
                  <input type="number" className="w-full p-2 border border-slate-200 rounded text-sm bg-slate-50" 
                    value={prevElec} readOnly />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Present</label>
                  <input type="number" className="w-full p-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-blue-500" 
                    value={currElec} onChange={(e) => setCurrElec(Number(e.target.value))} required />
                </div>
              </div>
              <div className="text-right text-sm text-slate-600">
                 Consumption: <span className="font-mono">{(currElec - prevElec).toFixed(1)} kWh</span>
                 <br />
                 Bill: <span className="font-bold">₱{elecBill.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-cyan-600 flex items-center gap-2">
                <Droplets className="w-4 h-4" /> Water (₱{rates.WATER}/m³)
              </h4>
               <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500">Previous</label>
                  <input type="number" className="w-full p-2 border border-slate-200 rounded text-sm bg-slate-50" 
                    value={prevWater} readOnly />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Present</label>
                  <input type="number" className="w-full p-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-cyan-500" 
                    value={currWater} onChange={(e) => setCurrWater(Number(e.target.value))} required />
                </div>
              </div>
              <div className="text-right text-sm text-slate-600">
                 Consumption: <span className="font-mono">{(currWater - prevWater).toFixed(2)} m³</span>
                 <br />
                 Bill: <span className="font-bold">₱{waterBill.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100">
             <div className="grid grid-cols-3 gap-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Penalty / Charges</label>
                   <input type="number" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" 
                     value={penalty} onChange={(e) => setPenalty(Number(e.target.value))} />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Prev. Balance (Debt)</label> 
                   <input type="number" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm text-orange-600 font-medium" 
                     value={prevBalance} onChange={(e) => setPrevBalance(Number(e.target.value))} />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Credit (Deduction)</label>
                   <input type="number" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm text-emerald-600 font-medium" 
                     value={credit} onChange={(e) => setCredit(Number(e.target.value))} />
                </div>
             </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            <div>
              <p className="text-sm text-slate-500">Total Invoice Amount</p>
              <p className="text-2xl font-bold text-blue-600">₱{total.toLocaleString()}</p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
              <button type="submit" className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors">
                Generate Invoice
              </button>
            </div>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </div>
    </ModalPortal>
  );
}

function EditInvoiceModal({ onClose, invoice, rates, onSubmit }: any) {
  const [rentPeriod, setRentPeriod] = useState(invoice.rentPeriod);
  const [utilityPeriod, setUtilityPeriod] = useState(invoice.utilityPeriod);
  
  const [prevWater, setPrevWater] = useState(invoice.waterReading?.prev || 0);
  const [currWater, setCurrWater] = useState(invoice.waterReading?.curr || 0);
  const [prevElec, setPrevElec] = useState(invoice.elecReading?.prev || 0);
  const [currElec, setCurrElec] = useState(invoice.elecReading?.curr || 0);
  const [penalty, setPenalty] = useState(invoice.penalty || 0);
  const [prevBalance, setPrevBalance] = useState(invoice.prevBalance || 0);
  const [credit, setCredit] = useState(invoice.credit || 0);
  const [status, setStatus] = useState(invoice.status);

  const rent = invoice.rent || 0;

  const waterUsage = Math.max(0, currWater - prevWater);
  const elecUsage = Math.max(0, currElec - prevElec);
  
  const waterBill = waterUsage * rates.WATER;
  const elecBill = elecUsage * rates.ELECTRICITY;
  
  const total = rent + waterBill + elecBill + Number(penalty) + Number(prevBalance) - Number(credit);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...invoice,
      rentPeriod,
      utilityPeriod,
      waterReading: { prev: Number(prevWater), curr: Number(currWater) },
      elecReading: { prev: Number(prevElec), curr: Number(currElec) },
      waterCost: waterBill,
      elecCost: elecBill,
      penalty: Number(penalty),
      prevBalance: Number(prevBalance),
      credit: Number(credit),
      total: total,
      status: status
    });
  };

  return (
    <ModalPortal>
    <div className="modal modal-open z-[60]">
      <div className="modal-box w-11/12 max-w-2xl bg-white rounded-xl shadow-xl p-0 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-900">Edit Invoice {invoice.id}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
             <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
           <div className="grid grid-cols-2 gap-4">
              <DateRangeInput 
                  label="Rent Billing Period"
                  value={rentPeriod}
                  onChange={setRentPeriod}
              />
              <DateRangeInput 
                  label="Utilities Billing Period"
                  value={utilityPeriod}
                  onChange={setUtilityPeriod}
              />
           </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-blue-600 flex items-center gap-2">
                <Zap className="w-4 h-4" /> Electricity
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500">Previous</label>
                  <input type="number" className="w-full p-2 border border-slate-200 rounded text-sm bg-slate-50" 
                    value={prevElec} onChange={(e) => setPrevElec(Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Present</label>
                  <input type="number" className="w-full p-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-blue-500" 
                    value={currElec} onChange={(e) => setCurrElec(Number(e.target.value))} required />
                </div>
              </div>
              <div className="text-right text-sm text-slate-600">
                 Bill: <span className="font-bold">₱{elecBill.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-cyan-600 flex items-center gap-2">
                <Droplets className="w-4 h-4" /> Water
              </h4>
               <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500">Previous</label>
                  <input type="number" className="w-full p-2 border border-slate-200 rounded text-sm bg-slate-50" 
                    value={prevWater} onChange={(e) => setPrevWater(Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Present</label>
                  <input type="number" className="w-full p-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-cyan-500" 
                    value={currWater} onChange={(e) => setCurrWater(Number(e.target.value))} required />
                </div>
              </div>
              <div className="text-right text-sm text-slate-600">
                 Bill: <span className="font-bold">₱{waterBill.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100">
             <div className="grid grid-cols-3 gap-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Penalty / Charges</label>
                   <input type="number" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" 
                     value={penalty} onChange={(e) => setPenalty(Number(e.target.value))} />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Prev. Balance (Debt)</label>
                   <input type="number" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm text-orange-600 font-medium" 
                     value={prevBalance} onChange={(e) => setPrevBalance(Number(e.target.value))} />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Credit (Deduction)</label>
                   <input type="number" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm text-emerald-600 font-medium" 
                     value={credit} onChange={(e) => setCredit(Number(e.target.value))} />
                </div>
             </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
             <label className="block text-sm font-medium text-slate-700 mb-1">Payment Status</label>
             <select 
               className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
               value={status} 
               onChange={(e) => setStatus(e.target.value)}
             >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
             </select>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            <div>
              <p className="text-sm text-slate-500">Total Invoice Amount</p>
              <p className="text-2xl font-bold text-blue-600">₱{total.toLocaleString()}</p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
              <button type="submit" className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </div>
    </ModalPortal>
  );
}

function RateModal({ onClose, rates, onSubmit }: any) {
    const [elecRate, setElecRate] = useState(rates.ELECTRICITY);
    const [waterRate, setWaterRate] = useState(rates.WATER);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ ELECTRICITY: Number(elecRate), WATER: Number(waterRate) });
    };

    return (
    <ModalPortal>
        <div className="modal modal-open z-[60]">
            <div className="modal-box w-full max-w-sm bg-white rounded-xl shadow-xl p-0">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-900">Update Rates</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Electricity Rate (per kWh)</label>
                        <input type="number" className="w-full p-2 border border-slate-200 rounded-lg" value={elecRate} onChange={e => setElecRate(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Water Rate (per m³)</label>
                        <input type="number" className="w-full p-2 border border-slate-200 rounded-lg" value={waterRate} onChange={e => setWaterRate(e.target.value)} required />
                    </div>
                    <div className="pt-2 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">Update Rates</button>
                    </div>
                </form>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={onClose}>close</button>
            </form>
        </div>
    </ModalPortal>
    );
}

function ViewInvoiceModal({ onClose, invoice, rates, tenants, units }: any) {
  const tenant = tenants.find((t: any) => t.id === invoice.tenantId) || { name: 'Unknown', email: 'N/A', phone: 'N/A' };
  const unit = units.find((u: any) => u.id === invoice.unitId) || { name: 'Unknown', building: 'Unknown' };

  return (
    <ModalPortal>
    <div className="modal modal-open z-[60] print-invoice-portal">
      <div className="modal-box w-11/12 max-w-3xl bg-white rounded-xl shadow-xl p-0 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
             <h3 className="text-xl font-bold text-slate-900">Invoice Details</h3>
             <p className="text-sm text-slate-500 font-mono">{invoice.id}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors no-print">
             <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-8 space-y-8">
           {/* Header Info */}
           <div className="flex flex-col md:flex-row justify-between gap-6 p-6 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                 <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tenant</p>
                 <p className="text-lg font-bold text-slate-900">{tenant.name}</p>
                 <div className="text-sm text-slate-500 space-y-0.5">
                    <p>{tenant.email}</p>
                    <p>{tenant.phone}</p>
                 </div>
              </div>
              <div className="md:text-right">
                 <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Unit Details</p>
                 <p className="text-lg font-bold text-slate-900">{unit.name}</p>
                 <p className="text-sm text-slate-500">{unit.building}</p>
                 <div className="mt-2">
                    <Badge status={invoice.status} />
                 </div>
              </div>
           </div>

           {/* Billing Periods */}
           <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border border-slate-100 rounded-lg">
                 <p className="text-xs text-slate-500 mb-1">Rent Period</p>
                 <p className="font-medium text-slate-900">{formatDateMonth(invoice.rentPeriod)}</p>
              </div>
              <div className="p-4 border border-slate-100 rounded-lg">
                 <p className="text-xs text-slate-500 mb-1">Utility Period</p>
                 <p className="font-medium text-slate-900">{formatDateMonth(invoice.utilityPeriod)}</p>
              </div>
           </div>

           {/* Utilities Breakdown */}
           <div className="space-y-4">
              <h4 className="font-semibold text-slate-900 pb-2 border-b border-slate-100">Utility Consumption</h4>
              
              {/* Electricity */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 rounded-lg bg-blue-50/30 border border-blue-100">
                  <div className="md:col-span-3 flex items-center gap-3">
                     <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <Zap className="w-5 h-5" />
                     </div>
                     <div>
                        <p className="font-semibold text-slate-900">Electricity</p>
                        <p className="text-xs text-slate-500">Rate: ₱{rates.ELECTRICITY}/kWh</p>
                     </div>
                  </div>
                  <div className="md:col-span-6 grid grid-cols-3 gap-4 text-sm">
                      <div>
                         <p className="text-xs text-slate-400">Previous</p>
                         <p className="font-mono text-slate-700">{invoice.elecReading?.prev ?? 0}</p>
                      </div>
                      <div>
                         <p className="text-xs text-slate-400">Current</p>
                         <p className="font-mono text-slate-900 font-medium">{invoice.elecReading?.curr ?? 0}</p>
                      </div>
                      <div>
                         <p className="text-xs text-slate-400">Usage</p>
                         <p className="font-mono text-blue-600 font-bold">
                            {((invoice.elecReading?.curr ?? 0) - (invoice.elecReading?.prev ?? 0)).toFixed(1)} kWh
                         </p>
                      </div>
                  </div>
                  <div className="md:col-span-3 text-right">
                      <p className="text-lg font-bold text-slate-900">₱{invoice.elecCost.toLocaleString()}</p>
                  </div>
              </div>

              {/* Water */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 rounded-lg bg-cyan-50/30 border border-cyan-100">
                  <div className="md:col-span-3 flex items-center gap-3">
                     <div className="p-2 bg-cyan-100 text-cyan-600 rounded-lg">
                        <Droplets className="w-5 h-5" />
                     </div>
                     <div>
                        <p className="font-semibold text-slate-900">Water</p>
                        <p className="text-xs text-slate-500">Rate: ₱{rates.WATER}/m³</p>
                     </div>
                  </div>
                  <div className="md:col-span-6 grid grid-cols-3 gap-4 text-sm">
                      <div>
                         <p className="text-xs text-slate-400">Previous</p>
                         <p className="font-mono text-slate-700">{invoice.waterReading?.prev ?? 0}</p>
                      </div>
                      <div>
                         <p className="text-xs text-slate-400">Current</p>
                         <p className="font-mono text-slate-900 font-medium">{invoice.waterReading?.curr ?? 0}</p>
                      </div>
                      <div>
                         <p className="text-xs text-slate-400">Usage</p>
                         <p className="font-mono text-cyan-600 font-bold">
                            {((invoice.waterReading?.curr ?? 0) - (invoice.waterReading?.prev ?? 0)).toFixed(2)} m³
                         </p>
                      </div>
                  </div>
                  <div className="md:col-span-3 text-right">
                      <p className="text-lg font-bold text-slate-900">₱{invoice.waterCost.toLocaleString()}</p>
                  </div>
              </div>
           </div>

           {/* Financial Summary */}
           <div className="pt-4">
              <h4 className="font-semibold text-slate-900 pb-2 border-b border-slate-100 mb-4">Financial Breakdown</h4>
              <div className="space-y-3 text-sm">
                 <div className="flex justify-between items-center text-slate-600">
                    <span>Base Rent</span>
                    <span className="font-mono">₱{invoice.rent.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center text-slate-600">
                    <span>Electricity Bill</span>
                    <span className="font-mono">₱{invoice.elecCost.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center text-slate-600">
                    <span>Water Bill</span>
                    <span className="font-mono">₱{invoice.waterCost.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center text-rose-600">
                    <span>Penalty / Other Charges</span>
                    <span className="font-mono">+ ₱{invoice.penalty?.toLocaleString() || 0}</span>
                 </div>
                 <div className="flex justify-between items-center text-orange-600">
                    <span>Previous Balance (Arrears)</span>
                    <span className="font-mono">+ ₱{invoice.prevBalance?.toLocaleString() || 0}</span>
                 </div>
                 <div className="flex justify-between items-center text-emerald-600">
                    <span>Credit / Deposit Deduction</span>
                    <span className="font-mono">- ₱{invoice.credit?.toLocaleString() || 0}</span>
                 </div>
                 
                 <div className="flex justify-between items-center pt-4 border-t border-slate-200 mt-2">
                    <span className="text-lg font-bold text-slate-900">Total Amount Due</span>
                    <span className="text-2xl font-bold text-blue-600">₱{invoice.total.toLocaleString()}</span>
                 </div>
              </div>
           </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end gap-3 no-print">
           <button onClick={onClose} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">
              Close
           </button>
           <button onClick={() => window.print()} className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2">
              Print Invoice
           </button>
        </div>

      </div>
      <form method="dialog" className="modal-backdrop no-print">
        <button onClick={onClose}>close</button>
      </form>
    </div>
    </ModalPortal>
  );
}