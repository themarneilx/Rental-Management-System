"use client";

import { useState, useEffect } from "react";
import { Admin } from "@/lib/types";
import { Plus, Search, Trash2, UserPlus, X } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/StatusBadge";
import ModalPortal from "@/components/ui/ModalPortal";

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);

  useEffect(() => {
    async function fetchAdmins() {
        try {
            const res = await fetch('/api/admins');
            if (res.ok) {
                const data = await res.json();
                const mappedAdmins: Admin[] = data.map((a: any) => ({
                    id: a.id,
                    name: a.name,
                    email: a.email,
                    role: a.role,
                    status: a.status,
                    joined: new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                    avatarUrl: a.avatarUrl
                }));
                setAdmins(mappedAdmins);
            }
        } catch (error) {
            console.error("Failed to fetch admins", error);
        } finally {
            setLoading(false);
        }
    }
    fetchAdmins();
  }, []);

  const handleAddAdmin = async (newAdminData: any) => {
      try {
          const res = await fetch('/api/admins', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newAdminData)
          });

          if (res.ok) {
              const createdAdmin = await res.json();
              const mappedAdmin: Admin = {
                  id: createdAdmin.id,
                  name: createdAdmin.name,
                  email: createdAdmin.email,
                  role: createdAdmin.role,
                  status: createdAdmin.status,
                  joined: new Date(createdAdmin.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              };
              setAdmins([mappedAdmin, ...admins]);
              setIsAddAdminModalOpen(false);
          } else {
              alert('Failed to create admin');
          }
      } catch (error) {
          console.error('Error creating admin:', error);
      }
  };

  const handleDeleteAdmin = (adminId: string) => {
    // TODO: Implement delete API
    if (window.confirm('Are you sure you want to remove this admin?')) {
        setAdmins(prev => prev.filter(a => a.id !== adminId));
    }
  };

  if (loading) return <div className="p-6">Loading admins...</div>;

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Administrator Management</h2>
          <p className="text-slate-500 text-sm">Manage system access and permissions.</p>
        </div>
        <button 
          onClick={() => setIsAddAdminModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" /> Add Admin
        </button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">Admin User</th>
                <th className="px-6 py-3 font-semibold">Role</th>
                <th className="px-6 py-3 font-semibold">Email</th>
                <th className="px-6 py-3 font-semibold">Date Joined</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs overflow-hidden flex-shrink-0">
                          {admin.avatarUrl ? (
                              <img src={admin.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                              admin.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{admin.name}</div>
                          <div className="text-xs text-slate-500">{admin.id}</div>
                        </div>
                     </div>
                  </td>
                  <td className="px-6 py-4"><Badge status={admin.role} /></td>
                  <td className="px-6 py-4 text-slate-600">{admin.email}</td>
                  <td className="px-6 py-4 text-slate-600 text-xs font-mono">{admin.joined}</td>
                  <td className="px-6 py-4"><Badge status={admin.status} /></td>
                  <td className="px-6 py-4 text-right">
                    <button 
                        onClick={() => handleDeleteAdmin(admin.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete Admin"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {isAddAdminModalOpen && (
          <AddAdminModal
             onClose={() => setIsAddAdminModalOpen(false)}
             onSubmit={handleAddAdmin}
          />
      )}
    </div>
  );
}

function AddAdminModal({ onClose, onSubmit }: { onClose: () => void, onSubmit: (admin: any) => void }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'PROPERTY_MANAGER',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <ModalPortal>
        <div className="modal modal-open z-[60]">
            <div className="modal-box w-full max-w-sm bg-white rounded-xl shadow-xl p-0">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-900">Add New Admin</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                        <input required type="text" className="w-full p-2 border border-slate-200 rounded-lg" 
                            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input required type="email" className="w-full p-2 border border-slate-200 rounded-lg" 
                            value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <input required type="password" className="w-full p-2 border border-slate-200 rounded-lg" 
                            value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                        <select className="w-full p-2 border border-slate-200 rounded-lg" 
                            value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                            <option value="SUPER_ADMIN">Super Admin</option>
                            <option value="PROPERTY_MANAGER">Property Manager</option>
                            <option value="BILLING_ADMIN">Billing Admin</option>
                        </select>
                    </div>
                    <div className="pt-2 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">Add Admin</button>
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