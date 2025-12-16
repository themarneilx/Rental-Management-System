"use client";

import { useState, useEffect } from "react";
import { Unit, Tenant } from "@/data/mock";
import { Plus, Search, Eye, Pencil, Save, DoorOpen, Users, X, ArrowUpDown, ArrowUp, ArrowDown, Trash2, AlertTriangle } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/StatusBadge";
import ModalPortal from "@/components/ui/ModalPortal";
import ContractModal from "@/components/ContractModal";

export default function RoomsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Unit, direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const [selectedBuilding, setSelectedBuilding] = useState<string>("All");
  
  // Modals
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [isEditRoomModalOpen, setIsEditRoomModalOpen] = useState(false);
  const [isViewRoomModalOpen, setIsViewRoomModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Unit | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<Unit | null>(null);

  useEffect(() => {
    async function fetchData() {
        try {
            const [roomsRes, tenantsRes] = await Promise.all([
                fetch('/api/rooms'),
                fetch('/api/tenants')
            ]);

            if (roomsRes.ok && tenantsRes.ok) {
                const roomsData = await roomsRes.json();
                const tenantsData = await tenantsRes.json();

                const mappedUnits: Unit[] = roomsData.map((r: any) => ({
                    id: r.id,
                    name: r.name,
                    building: r.building?.name || 'Unknown',
                    type: r.type,
                    rent: Number(r.rent),
                    status: r.status
                }));

                const mappedTenants: Tenant[] = tenantsData.map((t: any) => ({
                    id: t.id,
                    name: t.name,
                    email: t.email || '',
                    phone: t.phone,
                    unitId: t.roomId,
                    status: t.status,
                    leaseEnd: t.leaseEnd?.split('T')[0] || '',
                    deposit: Number(t.deposit),
                    avatarUrl: t.avatarUrl
                }));

                setUnits(mappedUnits);
                setTenants(mappedTenants);
            }
        } catch (error) {
            console.error("Failed to fetch room data", error);
        } finally {
            setLoading(false);
        }
    }
    fetchData();
  }, []);

  const uniqueBuildings = Array.from(new Set(units.map(u => u.building))).sort();

  const filteredUnits = units.filter(u => {
    if (selectedBuilding !== "All" && u.building !== selectedBuilding) return false;

    const lowerSearch = searchTerm.toLowerCase();
    const matchesRoom = u.name.toLowerCase().includes(lowerSearch) ||
                        u.building.toLowerCase().includes(lowerSearch);
    
    if (matchesRoom) return true;

    const occupant = tenants.find(t => t.unitId === u.id && t.status === 'Active');
    return occupant ? occupant.name.toLowerCase().includes(lowerSearch) : false;
  });

  const sortedUnits = [...filteredUnits].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
  });

  const requestSort = (key: keyof Unit) => {
      let direction: 'asc' | 'desc' = 'asc';
      if (sortConfig.key === key && sortConfig.direction === 'asc') {
          direction = 'desc';
      }
      setSortConfig({ key, direction });
  };

  const SortIcon = ({ column }: { column: keyof Unit }) => {
      if (sortConfig.key !== column) return <ArrowUpDown className="w-3 h-3 ml-1 text-slate-400" />;
      return sortConfig.direction === 'asc' 
          ? <ArrowUp className="w-3 h-3 ml-1 text-blue-600" /> 
          : <ArrowDown className="w-3 h-3 ml-1 text-blue-600" />;
  };

  const handleAddRoom = async (newRoomData: any, newTenantData: any) => {
    try {
        // 1. Create Room
        const roomRes = await fetch('/api/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: newRoomData.name,
                buildingName: newRoomData.building,
                type: newRoomData.type,
                rent: newRoomData.rent,
                status: newTenantData ? 'Occupied' : newRoomData.status
            })
        });

        if (!roomRes.ok) {
            const errorData = await roomRes.json();
            throw new Error(errorData.error || 'Failed to create room');
        }
        const createdRoom = await roomRes.json();

        // 2. Create Tenant if provided
        let createdTenant = null;
        if (newTenantData) {
            const tenantRes = await fetch('/api/tenants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newTenantData,
                    roomId: createdRoom.id,
                    password: 'defaultPassword123' // Default password
                })
            });
            if (tenantRes.ok) {
                createdTenant = await tenantRes.json();
            }
        }

        // Update State
        const mappedRoom: Unit = {
            id: createdRoom.id,
            name: createdRoom.name,
            building: newRoomData.building, // Or fetch building name if returned
            type: createdRoom.type,
            rent: Number(createdRoom.rent),
            status: createdRoom.status
        };
        setUnits([...units, mappedRoom]);

        if (createdTenant) {
             const mappedTenant: Tenant = {
                id: createdTenant.id,
                name: createdTenant.name,
                email: createdTenant.email,
                phone: createdTenant.phone,
                unitId: createdRoom.id,
                status: createdTenant.status,
                leaseEnd: createdTenant.leaseEnd.split('T')[0],
                deposit: Number(createdTenant.deposit)
            };
            setTenants([...tenants, mappedTenant]);
        }

        setIsAddRoomModalOpen(false);

    } catch (error: any) {
        console.error('Error adding room:', error);
        throw error;
    }
  };

  const handleUpdateRoom = (updatedRoom: Unit, updatedTenant: Tenant | null) => {
    // Optimistic update for now, ideally API call
    setUnits(prev => prev.map(u => u.id === updatedRoom.id ? updatedRoom : u));
    if (updatedTenant) {
        setTenants(prev => prev.map(t => t.id === updatedTenant.id ? updatedTenant : t));
    }
    setIsEditRoomModalOpen(false);
    setSelectedRoom(null);
  };

  const openEditRoom = (room: Unit) => {
      setSelectedRoom(room);
      setIsEditRoomModalOpen(true);
  };

  const openViewRoom = (room: Unit) => {
      setSelectedRoom(room);
      setIsViewRoomModalOpen(true);
  };

  const handleDeleteRoom = (room: Unit) => {
      setRoomToDelete(room);
      setIsDeleteModalOpen(true);
  };

  const confirmDeleteRoom = async () => {
      if (!roomToDelete) return;

      try {
          const res = await fetch(`/api/rooms/${roomToDelete.id}`, { method: 'DELETE' });
          if (res.ok) {
              setUnits(prev => prev.filter(u => u.id !== roomToDelete.id));
              setIsDeleteModalOpen(false);
              setRoomToDelete(null);
          } else {
              const data = await res.json();
              alert(data.error || 'Failed to delete room');
          }
      } catch (error) {
          console.error('Error deleting room:', error);
          alert('Error deleting room');
      }
  };

  if (loading) return <div className="p-6">Loading rooms...</div>;

  return (
    <div className="space-y-6 animate-slide-in">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Room Management</h2>
            <p className="text-slate-500 text-sm">Overview of property units and occupancy.</p>
          </div>
          <button 
             onClick={() => setIsAddRoomModalOpen(true)}
             className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Room
          </button>
        </div>

        <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search rooms..." 
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600 whitespace-nowrap">Filter by Building:</span>
              <select 
                  className="p-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={selectedBuilding}
                  onChange={(e) => setSelectedBuilding(e.target.value)}
              >
                  <option value="All">All Buildings</option>
                  {uniqueBuildings.map(b => (
                      <option key={b} value={b}>{b}</option>
                  ))}
              </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th 
                    className="px-6 py-3 font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => requestSort('name')}
                >
                    <div className="flex items-center">Unit Name <SortIcon column="name" /></div>
                </th>
                <th 
                    className="px-6 py-3 font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => requestSort('building')}
                >
                    <div className="flex items-center">Building <SortIcon column="building" /></div>
                </th>
                <th className="px-6 py-3 font-semibold">Type</th>
                <th 
                    className="px-6 py-3 font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => requestSort('rent')}
                >
                    <div className="flex items-center">Rent <SortIcon column="rent" /></div>
                </th>
                <th className="px-6 py-3 font-semibold">Security Deposit</th>
                <th className="px-6 py-3 font-semibold">Occupant</th>
                <th 
                    className="px-6 py-3 font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => requestSort('status')}
                >
                    <div className="flex items-center">Status <SortIcon column="status" /></div>
                </th>
                <th className="px-6 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedUnits.map((unit) => {
                const currentTenant = tenants.find(t => t.unitId === unit.id && t.status === 'Active');
                return (
                  <tr key={unit.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{unit.name}</td>
                    <td className="px-6 py-4 text-slate-600">{unit.building}</td>
                    <td className="px-6 py-4">
                       <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                         {unit.type}
                       </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">₱{unit.rent.toLocaleString()}</td>
                    <td className="px-6 py-4 font-mono text-slate-600">
                        {currentTenant?.deposit ? `₱${currentTenant.deposit.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-4">
                       {currentTenant ? (
                         <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold overflow-hidden">
                                {currentTenant.avatarUrl ? (
                                    <img src={currentTenant.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    currentTenant.name.charAt(0)
                                )}
                            </div>
                            <span className="text-blue-600 font-medium">{currentTenant.name}</span>
                         </div>
                       ) : (
                         <span className="text-slate-400 italic">-</span>
                       )}
                    </td>
                    <td className="px-6 py-4"><Badge status={unit.status} /></td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openViewRoom(unit)} className="text-slate-400 hover:text-blue-600 transition-colors" title="View Details">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => openEditRoom(unit)} className="text-slate-400 hover:text-blue-600 transition-colors" title="Edit Room">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteRoom(unit)} className="text-slate-400 hover:text-rose-600 transition-colors" title="Delete Room">
                            <Trash2 className="w-4 h-4" />
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

      {/* Add Room Modal */}
      {isAddRoomModalOpen && (
          <AddRoomModal
             onClose={() => setIsAddRoomModalOpen(false)}
             onSubmit={handleAddRoom}
          />
      )}

      {/* Edit Room Modal */}
      {isEditRoomModalOpen && selectedRoom && (
          <EditRoomModal
             onClose={() => setIsEditRoomModalOpen(false)}
             room={selectedRoom}
             tenant={tenants.find(t => t.unitId === selectedRoom.id) || null}
             onSubmit={handleUpdateRoom}
          />
      )}

      {/* View Room Modal */}
      {isViewRoomModalOpen && selectedRoom && (
          <ViewRoomModal
             onClose={() => setIsViewRoomModalOpen(false)}
             room={selectedRoom}
             tenant={tenants.find(t => t.unitId === selectedRoom.id) || null}
          />
      )}

      {isDeleteModalOpen && roomToDelete && (
          <DeleteConfirmationModal
             onClose={() => setIsDeleteModalOpen(false)}
             onConfirm={confirmDeleteRoom}
             room={roomToDelete}
          />
      )}
    </div>
  );
}

const ROOM_TYPES = [
  "Commercial",
  "1 Bed + Bath",
  "1 Bed (No Bath)",
  "2 Bed (No Bath)",
  "1BHK",
  "2BHK",
  "3BHK"
];

function AddRoomModal({ onClose, onSubmit }: { onClose: () => void, onSubmit: (room: any, tenant: any) => Promise<void> }) {
    const [formData, setFormData] = useState({
        name: '',
        building: 'Building 1',
        type: '1BHK',
        rent: 0,
        status: 'Vacant'
    });
    const [addTenant, setAddTenant] = useState(false);
    const [tenantData, setTenantData] = useState({
        name: '',
        email: '',
        phone: '',
        leaseEnd: '',
        deposit: 0
    });
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null); // Clear previous errors

        const newRoom = {
            id: `U-${Math.floor(Math.random() * 10000)}`,
            ...formData,
        };

        const newTenant = addTenant ? {
            id: `T-${Math.floor(Math.random() * 1000)}`,
            ...tenantData
        } : null;

        try {
            await onSubmit(newRoom, newTenant);
        } catch (error: any) {
            setErrorMessage(error.message || 'An unexpected error occurred.');
        }
    };

    return (
    <ModalPortal>
        <div className="modal modal-open z-[60]">
            <div className="modal-box w-full max-w-lg bg-white rounded-xl shadow-xl p-0 max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-900">Add New Room</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Room Details</h4>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Room Name (e.g. 1-1)</label>
                            <input type="text" className="w-full p-2 border border-slate-200 rounded-lg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Building</label>
                            <select className="w-full p-2 border border-slate-200 rounded-lg" value={formData.building} onChange={e => setFormData({...formData, building: e.target.value})}>
                                <option value="Building 1">Building 1</option>
                                <option value="Building 2">Building 2</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                                <select className="w-full p-2 border border-slate-200 rounded-lg" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                                    {ROOM_TYPES.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Rent Amount</label>
                                <input type="number" className="w-full p-2 border border-slate-200 rounded-lg" value={formData.rent} onChange={e => setFormData({...formData, rent: Number(e.target.value)})} required />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2 mb-4">
                            <input 
                                type="checkbox" 
                                id="addTenant" 
                                checked={addTenant} 
                                onChange={(e) => setAddTenant(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" 
                            />
                            <label htmlFor="addTenant" className="text-sm font-medium text-slate-700 select-none">Occupied immediately? (Add Tenant)</label>
                        </div>

                        {!addTenant && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Initial Status</label>
                                <select 
                                    className="w-full p-2 border border-slate-200 rounded-lg"
                                    value={formData.status}
                                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                                >
                                    <option value="Vacant">Vacant</option>
                                    <option value="Maintenance">Maintenance</option>
                                </select>
                            </div>
                        )}

                        {addTenant && (
                            <div className="space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">
                                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Tenant Details</h4>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                    <input required type="text" className="w-full p-2 border border-slate-200 rounded-lg" 
                                      value={tenantData.name} onChange={e => setTenantData({...tenantData, name: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                   <div>
                                      <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                      <input required type="email" className="w-full p-2 border border-slate-200 rounded-lg" 
                                        value={tenantData.email} onChange={e => setTenantData({...tenantData, email: e.target.value})} />
                                   </div>
                                   <div>
                                      <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                      <input required type="text" className="w-full p-2 border border-slate-200 rounded-lg" 
                                        value={tenantData.phone} onChange={e => setTenantData({...tenantData, phone: e.target.value})} />
                                   </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                   <div>
                                      <label className="block text-sm font-medium text-slate-700 mb-1">Lease End Date</label>
                                      <input required type="date" className="w-full p-2 border border-slate-200 rounded-lg" 
                                        value={tenantData.leaseEnd} onChange={e => setTenantData({...tenantData, leaseEnd: e.target.value})} />
                                   </div>
                                   <div>
                                      <label className="block text-sm font-medium text-slate-700 mb-1">Security Deposit</label>
                                      <input required type="number" className="w-full p-2 border border-slate-200 rounded-lg" 
                                        value={tenantData.deposit} onChange={e => setTenantData({...tenantData, deposit: Number(e.target.value)})} />
                                   </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {errorMessage && (
                        <div className="text-sm text-rose-600 bg-rose-50 p-3 rounded-lg flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            {errorMessage}
                        </div>
                    )}

                    <div className="pt-2 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">Add Room {addTenant ? '& Tenant' : ''}</button>
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

function EditRoomModal({ onClose, room, tenant, onSubmit }: { onClose: () => void, room: Unit, tenant: Tenant | null, onSubmit: (r: Unit, t: Tenant | null) => void }) {
    const [roomData, setRoomData] = useState({ ...room });
    const [tenantData, setTenantData] = useState(tenant ? { ...tenant } : null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalRoomData = {
            ...roomData,
            status: tenantData ? 'Occupied' : roomData.status
        };
        onSubmit(finalRoomData, tenantData);
    };

    return (
    <ModalPortal>
        <div className="modal modal-open z-[60]">
            <div className="modal-box w-full max-w-lg bg-white rounded-xl shadow-xl p-0 max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-900">Edit Room Details</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Room Section */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                             <DoorOpen className="w-4 h-4 text-blue-500" /> Room Information
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Room Name</label>
                                <input type="text" className="w-full p-2 border border-slate-200 rounded text-sm" value={roomData.name} onChange={e => setRoomData({...roomData, name: e.target.value})} required />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Building</label>
                                <select className="w-full p-2 border border-slate-200 rounded text-sm" value={roomData.building} onChange={e => setRoomData({...roomData, building: e.target.value})}>
                                    <option value="Building 1">Building 1</option>
                                    <option value="Building 2">Building 2</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
                                <select className="w-full p-2 border border-slate-200 rounded text-sm" value={roomData.type} onChange={e => setRoomData({...roomData, type: e.target.value})}>
                                    {ROOM_TYPES.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Rent</label>
                                <input type="number" className="w-full p-2 border border-slate-200 rounded text-sm" value={roomData.rent} onChange={e => setRoomData({...roomData, rent: Number(e.target.value)})} required />
                            </div>
                        </div>
                        
                        {!tenantData && (
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                                <select 
                                    className="w-full p-2 border border-slate-200 rounded text-sm"
                                    value={roomData.status}
                                    onChange={(e) => setRoomData({...roomData, status: e.target.value})}
                                >
                                    <option value="Vacant">Vacant</option>
                                    <option value="Maintenance">Maintenance</option>
                                </select>
                            </div>
                        )}
                        {tenantData && (
                             <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                                Status locked to <strong>Occupied</strong> while tenant is assigned.
                             </div>
                        )}
                    </div>

                    {tenantData && (
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <Users className="w-4 h-4 text-emerald-500" /> Current Tenant
                            </h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Tenant Name</label>
                                    <input type="text" className="w-full p-2 border border-slate-200 rounded text-sm" value={tenantData.name} onChange={e => setTenantData({...tenantData, name: e.target.value})} required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                                        <input type="email" className="w-full p-2 border border-slate-200 rounded text-sm" value={tenantData.email} onChange={e => setTenantData({...tenantData, email: e.target.value})} required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Phone</label>
                                        <input type="text" className="w-full p-2 border border-slate-200 rounded text-sm" value={tenantData.phone} onChange={e => setTenantData({...tenantData, phone: e.target.value})} required />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2">
                           <Save className="w-4 h-4" /> Save Changes
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

function ViewRoomModal({ onClose, room, tenant }: { onClose: () => void, room: Unit, tenant: Tenant | null }) {
    const [isAvatarOpen, setIsAvatarOpen] = useState(false);

    return (
    <ModalPortal>
        <div className="modal modal-open z-[60]">
            <div className="modal-box w-full max-w-md bg-white rounded-xl shadow-xl p-0">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-900">Room Details</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-start">
                        <div>
                             <h2 className="text-2xl font-bold text-slate-900">{room.name}</h2>
                             <p className="text-slate-500">{room.building}</p>
                        </div>
                        <Badge status={room.status} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                         <div>
                             <p className="text-xs text-slate-500 uppercase">Type</p>
                             <p className="font-medium text-slate-900">{room.type}</p>
                         </div>
                         <div>
                             <p className="text-xs text-slate-500 uppercase">Rent</p>
                             <p className="font-medium text-slate-900">₱{room.rent.toLocaleString()}</p>
                         </div>
                    </div>

                    <div className="space-y-3">
                         <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Occupant Information</h4>
                         {tenant ? (
                             <div className="flex items-start gap-3 p-3 border border-slate-100 rounded-lg">
                                 <div 
                                    className={`w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-blue-600 font-bold overflow-hidden ${tenant.avatarUrl ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                                    onClick={() => tenant.avatarUrl && setIsAvatarOpen(true)}
                                 >
                                     {tenant.avatarUrl ? (
                                         <img src={tenant.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                     ) : (
                                         tenant.name.charAt(0)
                                     )}
                                 </div>
                                 <div>
                                     <p className="font-bold text-slate-900">{tenant.name}</p>
                                     <p className="text-xs text-slate-500">{tenant.email}</p>
                                     <p className="text-xs text-slate-500">{tenant.phone}</p>
                                     <div className="mt-2 text-xs font-mono bg-slate-100 inline-block px-2 py-1 rounded">
                                         Lease Ends: {tenant.leaseEnd}
                                     </div>
                                 </div>
                             </div>
                         ) : (
                             <p className="text-sm text-slate-500 italic">This room is currently vacant.</p>
                         )}
                    </div>
                    <div className="pt-2">
                        <button onClick={onClose} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors">Close</button>
                    </div>
                </div>
            </div>
            
            {isAvatarOpen && tenant?.avatarUrl && (
                <ContractModal url={tenant.avatarUrl} onClose={() => setIsAvatarOpen(false)} />
            )}

            <form method="dialog" className="modal-backdrop">
                <button onClick={onClose}>close</button>
            </form>
        </div>
    </ModalPortal>
    );
}

function DeleteConfirmationModal({ onClose, onConfirm, room }: { onClose: () => void, onConfirm: () => void, room: Unit }) {
    return (
        <ModalPortal>
            <div className="modal modal-open z-[70]">
                <div className="modal-box w-full max-w-sm bg-white rounded-xl shadow-2xl p-0 overflow-hidden">
                    <div className="p-6 text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-rose-100 mb-4">
                            <AlertTriangle className="h-6 w-6 text-rose-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Room?</h3>
                        <p className="text-sm text-slate-500">
                            Are you sure you want to delete <span className="font-bold text-slate-700">{room.name}</span> in <span className="font-bold text-slate-700">{room.building}</span>?
                        </p>
                        <p className="text-xs text-rose-500 mt-2 font-medium">
                            This action cannot be undone.
                        </p>
                    </div>
                    <div className="bg-slate-50 px-4 py-3 flex justify-center gap-3 border-t border-slate-100">
                        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                        <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm">Delete Room</button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button onClick={onClose}>close</button>
                </form>
            </div>
        </ModalPortal>
    );
}