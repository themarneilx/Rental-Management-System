"use client";

import { useState, useEffect } from "react";
import { Tenant, Unit } from "@/data/mock";
import { Search, Plus, LogOut, X, Eye, Pencil, RefreshCw, AlertTriangle, Camera } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/StatusBadge";
import ModalPortal from "@/components/ui/ModalPortal";
import ContractModal from "@/components/ContractModal";

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

  // Archive Modal State
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [tenantToArchive, setTenantToArchive] = useState<Tenant | null>(null);

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
            previousRoomId: t.previousRoomId, // Map new field
            previousRoom: t.previousRoom ? { // Map previousRoom object
                id: t.previousRoom.id,
                name: t.previousRoom.name,
                building: t.previousRoom.building?.name || 'Unknown',
                type: t.previousRoom.type,
                rent: Number(t.previousRoom.rent),
                status: t.previousRoom.status,
            } : null,
            status: t.status,
            leaseEnd: t.leaseEnd?.split('T')[0] || '',
            deposit: Number(t.deposit),
            avatarUrl: t.avatarUrl,
            contractUrl: t.contractUrl
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

  const handleAddTenant = async (formData: FormData) => {
    try {
      // Ensure unitId maps to roomId if needed by backend
      if (formData.get('unitId')) {
          formData.append('roomId', formData.get('unitId') as string);
      }

      const res = await fetch('/api/tenants', {
        method: 'POST',
        body: formData
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
          deposit: Number(createdTenant.deposit),
          avatarUrl: createdTenant.avatarUrl,
          contractUrl: createdTenant.contractUrl
        };
        
        setTenants([newTenant, ...tenants]);
        if (newTenant.unitId) {
           setUnits(prev => prev.map(u => u.id === newTenant.unitId ? { ...u, status: 'Occupied' } : u));
        }
        setIsAddTenantModalOpen(false);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add tenant');
      }
    } catch (error) {
      console.error('Error adding tenant:', error);
      alert('Error adding tenant');
    }
  };

  const handleUpdateTenant = async (formData: FormData) => {
    try {
        const id = formData.get('id') as string;
        const res = await fetch(`/api/tenants/${id}`, {
            method: 'PUT',
            body: formData
        });

        if (res.ok) {
            const updatedTenantData = await res.json();
            const mappedTenant: Tenant = {
                id: updatedTenantData.id,
                name: updatedTenantData.name,
                email: updatedTenantData.email || '',
                phone: updatedTenantData.phone,
                unitId: updatedTenantData.roomId,
                previousRoomId: selectedTenant?.previousRoomId, // Preserve or update if needed
                previousRoom: selectedTenant?.previousRoom,
                status: updatedTenantData.status,
                leaseEnd: updatedTenantData.leaseEnd.split('T')[0],
                deposit: Number(updatedTenantData.deposit),
                avatarUrl: updatedTenantData.avatarUrl,
                contractUrl: updatedTenantData.contractUrl
            };

            setTenants(prev => prev.map(t => t.id === mappedTenant.id ? mappedTenant : t));
            
            // Refresh units to update statuses
            const roomsRes = await fetch('/api/rooms');
            if (roomsRes.ok) {
                const roomsData = await roomsRes.json();
                const mappedUnits: Unit[] = roomsData.map((r: any) => ({
                    id: r.id,
                    name: r.name,
                    building: r.building?.name || 'Unknown',
                    type: r.type,
                    rent: Number(r.rent),
                    status: r.status
                }));
                setUnits(mappedUnits);
            }

            setIsEditTenantModalOpen(false);
            setSelectedTenant(null);
        } else {
            const err = await res.json();
            alert(err.error || "Failed to update tenant");
        }
    } catch (error) {
        console.error("Error updating tenant:", error);
        alert("Error updating tenant");
    }
  };

  const handleArchiveClick = (tenant: Tenant) => {
      setTenantToArchive(tenant);
      setIsArchiveModalOpen(true);
  };

  const confirmArchive = async () => {
      if (!tenantToArchive) return;
      
      try {
          const res = await fetch(`/api/tenants/${tenantToArchive.id}/archive`, {
              method: 'PUT'
          });
          
          if (res.ok) {
              setTenants(prev => prev.map(t => {
                if (t.id === tenantToArchive.id) {
                  if (t.unitId) {
                    setUnits(uPrev => uPrev.map(u => u.id === t.unitId ? { ...u, status: 'Vacant' } : u));
                  }
                  return { ...t, status: 'Archived', unitId: null };
                }
                return t;
              }));
              setIsArchiveModalOpen(false);
              setTenantToArchive(null);
          } else {
              alert("Failed to archive tenant");
          }
      } catch (error) {
          console.error("Error archiving tenant:", error);
          alert("Error archiving tenant");
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
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs overflow-hidden">
                          {tenant.avatarUrl ? (
                             <img src={tenant.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                             tenant.name.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{tenant.name}</div>
                          <div className="text-xs text-slate-500">{tenant.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {tenant.status === 'Archived' && tenant.previousRoom ? (
                         <div>
                            <div className="text-sm font-medium text-slate-900">{tenant.previousRoom.name} <span className="text-xs text-slate-400">(Prev.)</span></div>
                            <div className="text-xs text-slate-500">{tenant.previousRoom.building}</div>
                         </div>
                      ) : tenantUnit ? (
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
                            onClick={() => handleArchiveClick(tenant)}
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

      {isArchiveModalOpen && tenantToArchive && (
          <ArchiveConfirmationModal
             onClose={() => setIsArchiveModalOpen(false)}
             onConfirm={confirmArchive}
             tenant={tenantToArchive}
          />
      )}
    </div>
  );
}

function AddTenantModal({ onClose, units, onSubmit }: { onClose: () => void, units: any[], onSubmit: (data: FormData) => Promise<void> }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    unitId: '',
    leaseEnd: '',
    deposit: 0,
    password: ''
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let pass = "";
    for (let i = 0; i < 10; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password: pass }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setAvatarFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleContractChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setContractFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const data = new FormData();
    data.append('name', formData.name);
    data.append('email', formData.email);
    data.append('phone', formData.phone);
    data.append('unitId', formData.unitId);
    data.append('leaseEnd', formData.leaseEnd);
    data.append('deposit', formData.deposit.toString());
    data.append('password', formData.password);
    if (avatarFile) {
        data.append('avatar', avatarFile);
    }
    if (contractFile) {
        data.append('contract', contractFile);
    }

    await onSubmit(data);
    setLoading(false);
  };

  return (
    <ModalPortal>
    <div className="modal modal-open z-[60]">
      <div className="modal-box w-full max-w-lg bg-white rounded-xl shadow-xl p-0 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-900">New Tenant</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex justify-center mb-4">
              <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
                      {previewUrl ? (
                          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                          <span className="text-2xl font-bold text-slate-400">?</span>
                      )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-sm">
                      <Camera className="w-4 h-4" />
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
              </div>
          </div>

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
            <label className="block text-sm font-medium text-slate-700 mb-1">Temporary Password</label>
            <div className="flex gap-2">
                <input required type="text" className="flex-1 p-2 border border-slate-200 rounded-lg font-mono text-sm" 
                  value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Click generate" />
                <button type="button" onClick={generatePassword} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors" title="Generate Password">
                    <RefreshCw className="w-4 h-4" />
                </button>
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

          <div className="pt-2 border-t border-slate-100">
             <label className="block text-sm font-medium text-slate-700 mb-1">Attach Contract (Image)</label>
             <input type="file" accept="image/*" className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" onChange={handleContractChange} />
             {contractFile && <p className="text-xs text-emerald-600 mt-1">Selected: {contractFile.name}</p>}
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
               {loading ? 'Adding...' : 'Add Tenant'}
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

function ViewTenantModal({ onClose, tenant, unit }: { onClose: () => void, tenant: Tenant, unit: Unit | null }) {
    const [isContractOpen, setIsContractOpen] = useState(false);

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
                            {tenant.avatarUrl ? (
                                <img src={tenant.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                            ) : (
                                tenant.name.charAt(0)
                            )}
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
                    
                    {tenant.contractUrl && (
                        <div className="space-y-3 pt-2">
                             <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Contract</h4>
                             <div 
                               className="relative group w-full h-32 bg-slate-100 rounded-lg overflow-hidden cursor-pointer border border-slate-200 hover:border-blue-500 transition-all"
                               onClick={() => setIsContractOpen(true)}
                             >
                                 <img src={tenant.contractUrl} alt="Contract" className="w-full h-full object-cover" />
                                 <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                     <div className="bg-white/90 p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity transform scale-90 group-hover:scale-100">
                                        <Eye className="w-5 h-5 text-blue-600" />
                                     </div>
                                 </div>
                             </div>
                        </div>
                    )}

                    <div className="pt-2">
                        <button onClick={onClose} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors">Close</button>
                    </div>
                </div>
            </div>
            
            {isContractOpen && tenant.contractUrl && (
                <ContractModal url={tenant.contractUrl} onClose={() => setIsContractOpen(false)} />
            )}

            <form method="dialog" className="modal-backdrop">
                <button onClick={onClose}>close</button>
            </form>
        </div>
    </ModalPortal>
    );
}

function EditTenantModal({ onClose, tenant, units, onSubmit }: { onClose: () => void, tenant: Tenant, units: Unit[], onSubmit: (data: FormData) => Promise<void> }) {
    const [formData, setFormData] = useState({ ...tenant });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [contractFile, setContractFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(tenant.avatarUrl || null);
    const [saving, setSaving] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleContractChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setContractFile(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const data = new FormData();
        data.append('id', formData.id);
        data.append('name', formData.name);
        data.append('email', formData.email);
        data.append('phone', formData.phone);
        data.append('unitId', formData.unitId || '');
        data.append('leaseEnd', formData.leaseEnd);
        data.append('deposit', formData.deposit.toString());
        if (avatarFile) {
            data.append('avatar', avatarFile);
        }
        if (contractFile) {
            data.append('contract', contractFile);
        }
        await onSubmit(data);
        setSaving(false);
    };

    return (
    <ModalPortal>
        <div className="modal modal-open z-[60]">
            <div className="modal-box w-full max-w-lg bg-white rounded-xl shadow-xl p-0 max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-900">Edit Tenant Details</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="flex justify-center">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl font-bold text-slate-400">{formData.name.charAt(0)}</span>
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-sm">
                                <Camera className="w-4 h-4" />
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                        </div>
                    </div>

                    <div className="space-y-4">
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
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                         <label className="block text-sm font-medium text-slate-700 mb-1">Attach Contract (Image)</label>
                         <input type="file" accept="image/*" className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" onChange={handleContractChange} />
                         {contractFile && <p className="text-xs text-emerald-600 mt-1">Selected: {contractFile.name}</p>}
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
                        <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
                            {saving ? 'Saving...' : 'Save Changes'}
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

function ArchiveConfirmationModal({ onClose, onConfirm, tenant }: { onClose: () => void, onConfirm: () => void, tenant: Tenant }) {
    return (
        <ModalPortal>
            <div className="modal modal-open z-[70]">
                <div className="modal-box w-full max-w-sm bg-white rounded-xl shadow-2xl p-0 overflow-hidden">
                    <div className="p-6 text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-rose-100 mb-4">
                            <AlertTriangle className="h-6 w-6 text-rose-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Archive Tenant?</h3>
                        <p className="text-sm text-slate-500">
                            Are you sure you want to archive <span className="font-bold text-slate-700">{tenant.name}</span>?
                        </p>
                        <p className="text-sm text-slate-500 mt-2">
                            This will release <span className="font-bold text-slate-700">Unit {tenant.unitId ? 'assigned' : 'N/A'}</span> to Vacant status.
                        </p>
                    </div>
                    <div className="bg-slate-50 px-4 py-3 flex justify-center gap-3 border-t border-slate-100">
                        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                        <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm">Confirm Archive</button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button onClick={onClose}>close</button>
                </form>
            </div>
        </ModalPortal>
    );
}

// Reuse ContractModal logic (simplified version of the admin one)
// Note: This component has been moved to src/components/ContractModal.tsx
// to be shared across the project.
// The code below is the OLD version and should not be re-added.
/*
function ContractModal({ url, onClose }: { url: string, onClose: () => void }) {
    return (
        <ModalPortal>
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="relative w-full max-w-4xl max-h-[90vh] flex items-center justify-center">
                    <button 
                        onClick={onClose} 
                        className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors"
                    >
                        <X className="w-8 h-8" />
                    </button>
                    <img 
                        src={url} 
                        alt="Contract Full View" 
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" 
                    />
                </div>
                <div className="absolute inset-0 -z-10" onClick={onClose}></div>
            </div>
        </ModalPortal>
    );
}
*/