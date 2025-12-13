"use client";

import { useState, useEffect } from "react";
import { Tenant, Unit } from "@/data/mock";
import { Search, Plus, LogOut, X, Eye, Pencil } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/StatusBadge";
import ModalPortal from "@/components/ui/ModalPortal";

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddTenantModalOpen, setIsAddTenantModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modals for View/Edit
  const [isViewTenantModalOpen, setIsViewTenantModalOpen] = useState(false);
  const [isEditTenantModalOpen, setIsEditTenantModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [tenantsRes, roomsRes] = await Promise.all([
          fetch('/api/tenants'),
          fetch('/api/rooms')
        ]);

        if (tenantsRes.ok && roomsRes.ok) {
          const tenantsData = await tenantsRes.json();
          const roomsData = await roomsRes.json();

          const mappedTenants: Tenant[] = tenantsData.map((t: any) => ({
            id: t.id,
            name: t.name,
            email: t.email || '',
            phone: t.phone,
            unitId: t.roomId,
            status: t.status,
            leaseEnd: t.leaseEnd?.split('T')[0] || '',
            deposit: Number(t.deposit)
          }));

          const mappedUnits: Unit[] = roomsData.map((r: any) => ({
            id: r.id,
            name: r.name,
            building: r.building?.name || 'Unknown',
            type: r.type,
            rent: Number(r.rent),
            status: r.status
          }));

          setTenants(mappedTenants);
          setUnits(mappedUnits);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const activeTenants = tenants.filter(t => t.status === 'Active');
  const filteredTenants = activeTenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddTenant = async (newTenantData: any) => {
    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTenantData,
          password: 'defaultPassword123', // Temporary default
          roomId: newTenantData.unitId
        })
      });

      if (res.ok) {
        const createdTenant = await res.json();
        const newTenant: Tenant = {
          id: createdTenant.id,
          name: createdTenant.name,
          email: createdTenant.email || '',
          phone: createdTenant.phone,
          unitId: createdTenant.roomId,
          status: createdTenant.status,
          leaseEnd: createdTenant.leaseEnd.split('T')[0],
          deposit: Number(createdTenant.deposit)
        };
        
        setTenants([newTenant, ...tenants]);
        if (newTenant.unitId) {
           setUnits(prev => prev.map(u => u.id === newTenant.unitId ? { ...u, status: 'Occupied' } : u));
        }
        setIsAddTenantModalOpen(false);
      } else {
        alert('Failed to add tenant');
      }
    } catch (error) {
      console.error('Error adding tenant:', error);
      alert('Error adding tenant');
    }
  };

  const handleUpdateTenant = (updatedTenant: Tenant) => {
    // TODO: Implement API PUT for updating tenant
    setTenants(prev => prev.map(t => t.id === updatedTenant.id ? updatedTenant : t));
    setIsEditTenantModalOpen(false);
    setSelectedTenant(null);
  };

  const handleArchiveTenant = (tenantId: string) => {
    if (window.confirm('Are you sure you want to move this tenant to archives? This will free up their unit.')) {
      setTenants(prev => prev.map(t => {
        if (t.id === tenantId) {
          if (t.unitId) {
            setUnits(uPrev => uPrev.map(u => u.id === t.unitId ? { ...u, status: 'Vacant' } : u));
          }
          return { ...t, status: 'Archived', unitId: null };
        }
        return t;
      }));
    }
  };

  const openViewTenant = (tenant: Tenant) => {
      setSelectedTenant(tenant);
      setIsViewTenantModalOpen(true);
  };

  const openEditTenant = (tenant: Tenant) => {
      setSelectedTenant(tenant);
      setIsEditTenantModalOpen(true);
  };

  if (loading) return <div className="p-6">Loading tenants...</div>;

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Tenant Management</h2>
          <p className="text-slate-500 text-sm">Manage all current active tenants.</p>
        </div>
        <button 
          onClick={() => setIsAddTenantModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Tenant
        </button>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search tenants..." 
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">Tenant Details</th>
                <th className="px-6 py-3 font-semibold">Unit Info</th>
                <th className="px-6 py-3 font-semibold">Contact</th>
                <th className="px-6 py-3 font-semibold">Security Deposit</th>
                <th className="px-6 py-3 font-semibold">Lease End</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTenants.map((tenant) => {
                const tenantUnit = units.find(u => u.id === tenant.unitId);
                return (
                  <tr key={tenant.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                          {tenant.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{tenant.name}</div>
                          <div className="text-xs text-slate-500">{tenant.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {tenantUnit ? (
                         <div>
                            <div className="text-sm font-medium text-slate-900">{tenantUnit.name}</div>
                            <div className="text-xs text-slate-500">{tenantUnit.building}</div>
                         </div>
                      ) : (
                        <span className="text-slate-400 italic">No Unit</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="text-xs">{tenant.email}</div>
                      <div className="text-xs">{tenant.phone}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">₱{tenant.deposit.toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-600 font-mono text-xs">{tenant.leaseEnd}</td>
                    <td className="px-6 py-4"><Badge status={tenant.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openViewTenant(tenant)}
                            className="text-slate-400 hover:text-blue-600 transition-colors"
                            title="View Details"
                          >
                              <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => openEditTenant(tenant)}
                            className="text-slate-400 hover:text-blue-600 transition-colors"
                            title="Edit Tenant"
                          >
                              <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleArchiveTenant(tenant.id)}
                            className="text-slate-400 hover:text-rose-600 transition-colors"
                            title="Move to Archive"
                          >
                            <LogOut className="w-4 h-4" />
                          </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {isAddTenantModalOpen && (
        <AddTenantModal 
          onClose={() => setIsAddTenantModalOpen(false)}
          units={units.filter(u => u.status === 'Vacant')}
          onSubmit={handleAddTenant}
        />
      )}

      {isViewTenantModalOpen && selectedTenant && (
          <ViewTenantModal
             onClose={() => setIsViewTenantModalOpen(false)}
             tenant={selectedTenant}
             unit={units.find(u => u.id === selectedTenant.unitId) || null}
          />
      )}

      {isEditTenantModalOpen && selectedTenant && (
          <EditTenantModal
             onClose={() => setIsEditTenantModalOpen(false)}
             tenant={selectedTenant}
             units={units}
             onSubmit={handleUpdateTenant}
          />
      )}
    </div>
  );
}

function AddTenantModal({ onClose, units, onSubmit }: { onClose: () => void, units: any[], onSubmit: (t: any) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    unitId: '',
    leaseEnd: '',
    deposit: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <ModalPortal>
    <div className="modal modal-open z-[60]">
      <div className="modal-box w-full max-w-lg bg-white rounded-xl shadow-xl p-0">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-900">New Tenant</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input required type="text" className="w-full p-2 border border-slate-200 rounded-lg" 
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input required type="email" className="w-full p-2 border border-slate-200 rounded-lg" 
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input required type="text" className="w-full p-2 border border-slate-200 rounded-lg" 
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
             </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Assign Unit</label>
            <select required className="w-full p-2 border border-slate-200 rounded-lg"
               value={formData.unitId} onChange={e => setFormData({...formData, unitId: e.target.value})}>
               <option value="">-- Select Vacant Unit --</option>
               {units.map(u => <option key={u.id} value={u.id}>{u.name} - {u.type} (₱{u.rent})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lease End Date</label>
                <input required type="date" className="w-full p-2 border border-slate-200 rounded-lg" 
                  value={formData.leaseEnd} onChange={e => setFormData({...formData, leaseEnd: e.target.value})} />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Security Deposit</label>
                <input required type="number" className="w-full p-2 border border-slate-200 rounded-lg" 
                  value={formData.deposit} onChange={e => setFormData({...formData, deposit: Number(e.target.value)})} />
             </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">Add Tenant</button>
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

function ViewTenantModal({ onClose, tenant, unit }: { onClose: () => void, tenant: Tenant, unit: Unit | null }) {
    return (
    <ModalPortal>
        <div className="modal modal-open z-[60]">
            <div className="modal-box w-full max-w-md bg-white rounded-xl shadow-xl p-0">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-900">Tenant Details</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex items-start gap-3 p-3 border border-slate-100 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-blue-600 font-bold">
                            {tenant.name.charAt(0)}
                        </div>
                        <div>
                            <p className="font-bold text-slate-900">{tenant.name}</p>
                            <p className="text-xs text-slate-500">{tenant.email}</p>
                            <p className="text-xs text-slate-500">{tenant.phone}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                         <div>
                             <p className="text-xs text-slate-500 uppercase">Lease End</p>
                             <p className="font-medium text-slate-900">{tenant.leaseEnd}</p>
                         </div>
                         <div>
                             <p className="text-xs text-slate-500 uppercase">Security Deposit</p>
                             <p className="font-medium text-slate-900">₱{tenant.deposit.toLocaleString()}</p>
                         </div>
                    </div>

                    <div className="space-y-3">
                         <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Assigned Unit</h4>
                         {unit ? (
                             <div className="flex items-start gap-3 p-3 border border-slate-100 rounded-lg">
                                 <div>
                                     <p className="font-bold text-slate-900">{unit.name}</p>
                                     <p className="text-xs text-slate-500">{unit.building} • {unit.type}</p>
                                     <p className="text-xs text-slate-500">Rent: ₱{unit.rent.toLocaleString()}</p>
                                 </div>
                             </div>
                         ) : (
                             <p className="text-sm text-slate-500 italic">No unit currently assigned.</p>
                         )}
                    </div>
                    <div className="pt-2">
                        <button onClick={onClose} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors">Close</button>
                    </div>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={onClose}>close</button>
            </form>
        </div>
    </ModalPortal>
    );
}

function EditTenantModal({ onClose, tenant, units, onSubmit }: { onClose: () => void, tenant: Tenant, units: Unit[], onSubmit: (t: Tenant) => void }) {
    const [formData, setFormData] = useState({ ...tenant });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
    <ModalPortal>
        <div className="modal modal-open z-[60]">
            <div className="modal-box w-full max-w-lg bg-white rounded-xl shadow-xl p-0 max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-900">Edit Tenant Details</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                        <input required type="text" className="w-full p-2 border border-slate-200 rounded-lg" 
                            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                          <input required type="email" className="w-full p-2 border border-slate-200 rounded-lg" 
                            value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                          <input required type="text" className="w-full p-2 border border-slate-200 rounded-lg" 
                            value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                       </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Assign Unit</label>
                        <select className="w-full p-2 border border-slate-200 rounded-lg"
                           value={formData.unitId || ''} onChange={e => setFormData({...formData, unitId: e.target.value || null})}>
                           <option value="">-- No Unit --</option>
                           {units.filter(u => u.status === 'Vacant' || u.id === formData.unitId).map(u => <option key={u.id} value={u.id}>{u.name} - {u.type} (₱{u.rent})</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Lease End Date</label>
                          <input required type="date" className="w-full p-2 border border-slate-200 rounded-lg" 
                            value={formData.leaseEnd} onChange={e => setFormData({...formData, leaseEnd: e.target.value})} />
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Security Deposit</label>
                          <input required type="number" className="w-full p-2 border border-slate-200 rounded-lg" 
                            value={formData.deposit} onChange={e => setFormData({...formData, deposit: Number(e.target.value)})} />
                       </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">Save Changes</button>
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