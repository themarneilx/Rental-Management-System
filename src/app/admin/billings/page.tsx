"use client";

import { useState, useEffect } from "react";
import { Invoice, Tenant, Unit } from "@/data/mock";
import { Plus, Zap, Settings, Eye, Pencil, Calendar, Droplets, X } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/StatusBadge";
import ModalPortal from "@/components/ui/ModalPortal";

// Helper functions from design.jsx
const formatDateMonth = (dateStr: string) => {
    if (!dateStr) return '';
    // Handle YYYY-MM format
    if (dateStr.match(/^\d{4}-\d{2}$/)) {
        const [year, month] = dateStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    return dateStr;
};

const getNextMonth = (currentMonthStr: string) => {
    if (!currentMonthStr) return new Date().toISOString().slice(0, 7);
    const [year, month] = currentMonthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().slice(0, 7);
};

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
                    date: inv.date
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
    collected: invoices.filter(i => i.status === 'Paid').reduce((acc, curr) => acc + curr.total, 0),
    receivables: invoices.filter(i => i.status === 'Pending' || i.status === 'Overdue').reduce((acc, curr) => acc + curr.total, 0),
    overdue: invoices.filter(i => i.status === 'Overdue').length,
    totalExp: 0 // Not tracked yet
  };

  const monthsSet = new Set(invoices.map(inv => inv.rentPeriod));
  monthsSet.add(new Date().toISOString().slice(0, 7));
  const availableMonths = Array.from(monthsSet).sort().reverse();

  const filteredInvoices = invoices.filter(inv => inv.rentPeriod === billingMonthTab || inv.utilityPeriod === billingMonthTab);

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
                rentPeriod: newReadingData.rentPeriod,
                utilityPeriod: newReadingData.utilityPeriod
            })
        });

        if (res.ok) {
            const generatedInvoice = await res.json();
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
                credit: Number(generatedInvoice.credit),
                total: Number(generatedInvoice.totalAmount),
                status: generatedInvoice.status,
                date: generatedInvoice.date
            };

            setInvoices([mappedInvoice, ...invoices]);
            setIsBillingModalOpen(false);
            setBillingMonthTab(mappedInvoice.rentPeriod);
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
                    <tr key={inv.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-mono text-blue-600 text-xs font-medium">{inv.id}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{tenant.name}</div>
                        <div className="text-xs text-slate-500">{unit.name} • {unit.building}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                          <div className="text-xs">Rent: {formatDateMonth(inv.rentPeriod)}</div>
                          <div className="text-xs">Util: {formatDateMonth(inv.utilityPeriod)}</div>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-600">
                          <div className="font-mono">₱{inv.waterCost.toLocaleString()}</div>
                          <div className="text-[10px] text-slate-400">({(inv.waterReading?.curr - inv.waterReading?.prev).toFixed(1)} cum)</div>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-600">
                          <div className="font-mono">₱{inv.elecCost.toLocaleString()}</div>
                          <div className="text-[10px] text-slate-400">({(inv.elecReading?.curr - inv.elecReading?.prev).toFixed(1)} kWh)</div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-slate-600">₱{inv.rent.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-mono text-rose-600">₱{inv.penalty?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 text-right font-mono text-orange-600">₱{inv.prevBalance?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 text-right font-mono text-emerald-600">-₱{inv.credit?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">₱{inv.total.toLocaleString()}</td>
                      <td className="px-6 py-4 text-center"><Badge status={inv.status} /></td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex items-center justify-end gap-2">
                           <button className="text-slate-400 hover:text-blue-600 transition-colors" title="View">
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
    </div>
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
            .filter((inv: Invoice) => inv.tenantId === selectedTenantId)
            .sort((a: Invoice, b: Invoice) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (tenantInvoices.length > 0) {
            const lastInvoice = tenantInvoices[0];
            setPrevWater(lastInvoice.waterReading ? lastInvoice.waterReading.curr : 0);
            setPrevElec(lastInvoice.elecReading ? lastInvoice.elecReading.curr : 0);
            setRentPeriod(getNextMonth(lastInvoice.rentPeriod));
            setUtilityPeriod(getNextMonth(lastInvoice.utilityPeriod));
            setPrevBalance(lastInvoice.total - lastInvoice.credit); 
        } else {
            setPrevWater(0);
            setPrevElec(0);
            setRentPeriod(new Date().toISOString().slice(0, 7));
            setUtilityPeriod(new Date().toISOString().slice(0, 7));
            setPrevBalance(0);
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                     <Calendar className="w-4 h-4 text-slate-400" /> Rent Billing Period
                  </label>
                  <input 
                      type="month" 
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                      value={rentPeriod}
                      onChange={(e) => setRentPeriod(e.target.value)}
                      required
                      min={new Date(new Date().setFullYear(new Date().getFullYear() - 10)).toISOString().slice(0, 7)}
                      max={new Date(new Date().setFullYear(new Date().getFullYear() + 10)).toISOString().slice(0, 7)}
                    />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                     <Calendar className="w-4 h-4 text-slate-400" /> Utilities Billing Period
                  </label>
                  <input 
                      type="month" 
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                      value={utilityPeriod}
                      onChange={(e) => setUtilityPeriod(e.target.value)}
                      required
                      min={new Date(new Date().setFullYear(new Date().getFullYear() - 10)).toISOString().slice(0, 7)}
                      max={new Date(new Date().setFullYear(new Date().getFullYear() + 10)).toISOString().slice(0, 7)}
                    />
                </div>
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                   <Calendar className="w-4 h-4 text-slate-400" /> Rent Billing Period
                </label>
                <input 
                    type="month" 
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                    value={rentPeriod}
                    onChange={(e) => setRentPeriod(e.target.value)}
                    required
                    min={new Date(new Date().setFullYear(new Date().getFullYear() - 10)).toISOString().slice(0, 7)}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() + 10)).toISOString().slice(0, 7)}
                  />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                   <Calendar className="w-4 h-4 text-slate-400" /> Utilities Billing Period
                </label>
                <input 
                    type="month" 
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                    value={utilityPeriod}
                    onChange={(e) => setUtilityPeriod(e.target.value)}
                    required
                    min={new Date(new Date().setFullYear(new Date().getFullYear() - 10)).toISOString().slice(0, 7)}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() + 10)).toISOString().slice(0, 7)}
                  />
              </div>
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