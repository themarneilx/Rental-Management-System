"use client";

import { useState, useEffect } from "react";
import { Admin } from "@/lib/types";
import { Plus, Search, Trash2, UserPlus, X, Pencil, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/StatusBadge";
import ModalPortal from "@/components/ui/ModalPortal";

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);
  const [isEditAdminModalOpen, setIsEditAdminModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);

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

  const handleUpdateAdmin = async (updatedData: any) => {
      try {
          const res = await fetch(`/api/admins/${updatedData.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedData)
          });

          if (res.ok) {
              const updatedAdmin = await res.json();
              setAdmins(prev => prev.map(a => a.id === updatedAdmin.id ? {
                  ...a,
                  name: updatedAdmin.name,
                  email: updatedAdmin.email,
                  role: updatedAdmin.role,
                  status: updatedAdmin.status // Update status if needed
              } : a));
              setIsEditAdminModalOpen(false);
              setSelectedAdmin(null);
          } else {
              alert('Failed to update admin');
          }
      } catch (error) {
          console.error('Error updating admin:', error);
      }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (window.confirm('Are you sure you want to remove this admin?')) {
        try {
            const res = await fetch(`/api/admins/${adminId}`, { method: 'DELETE' });
            if (res.ok) {
                setAdmins(prev => prev.filter(a => a.id !== adminId));
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to delete admin');
            }
        } catch (error) {
            console.error('Error deleting admin:', error);
        }
    }
  };

  const openEditAdmin = (admin: Admin) => {
      setSelectedAdmin(admin);
      setIsEditAdminModalOpen(true);
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
                    <div className="flex items-center justify-end gap-2">
                        <button 
                            onClick={() => openEditAdmin(admin)}
                            className="text-slate-400 hover:text-blue-600 transition-colors"
                            title="Edit Admin"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleDeleteAdmin(admin.id)}
                            className="text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete Admin"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
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

      {isEditAdminModalOpen && selectedAdmin && (
          <EditAdminModal
             onClose={() => setIsEditAdminModalOpen(false)}
             admin={selectedAdmin}
             onSubmit={handleUpdateAdmin}
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

function EditAdminModal({ onClose, admin, onSubmit }: { onClose: () => void, admin: Admin, onSubmit: (data: any) => void }) {
    const [formData, setFormData] = useState({ ...admin });
    const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <ModalPortal>
        <div className="modal modal-open z-[60]">
            <div className="modal-box w-full max-w-sm bg-white rounded-xl shadow-xl p-0">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-900">Edit Admin</h3>
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
                        <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                        <select className="w-full p-2 border border-slate-200 rounded-lg" 
                            value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                            <option value="SUPER_ADMIN">Super Admin</option>
                            <option value="PROPERTY_MANAGER">Property Manager</option>
                            <option value="BILLING_ADMIN">Billing Admin</option>
                        </select>
                    </div>
                    
                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                        <button type="button" onClick={() => setIsResetPasswordModalOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-amber-200">
                             <RefreshCw className="w-3.5 h-3.5" /> Reset Password
                        </button>
                        <div className="flex gap-2">
                             <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
                             <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">Save</button>
                        </div>
                    </div>
                </form>
            </div>
            
            {isResetPasswordModalOpen && (
                <AdminResetPasswordModal
                    adminId={admin.id}
                    adminName={admin.name}
                    onClose={() => setIsResetPasswordModalOpen(false)}
                />
            )}

            <form method="dialog" className="modal-backdrop">
                <button onClick={onClose}>close</button>
            </form>
        </div>
    </ModalPortal>
    );
}

function AdminResetPasswordModal({ adminId, adminName, onClose }: { adminId: string, adminName: string, onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    setLoading(true);
    setError(null);
    setNewPassword(null);

    try {
      const res = await fetch(`/api/admins/${adminId}/reset-password`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        setNewPassword(data.newPassword);
      } else {
        const err = await res.json();
        setError(err.error || "Failed to reset password.");
      }
    } catch (err) {
      console.error("Error resetting password:", err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
          
          <div className="p-6 text-center">
            {newPassword ? (
              <>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Password Reset Successful!</h3>
                <p className="text-sm text-slate-500 mb-4">
                  The password for <span className="font-bold text-slate-700">{adminName}</span> has been reset.
                </p>
                <div className="bg-slate-100 p-3 rounded-lg flex items-center justify-between font-mono text-sm text-slate-800">
                  <span>{newPassword}</span>
                  <button 
                    onClick={() => navigator.clipboard.writeText(newPassword)}
                    className="ml-2 px-2 py-1 bg-slate-200 rounded-md text-xs hover:bg-slate-300 transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                    Please provide this new password to the admin. They will be prompted to change it upon their next login.
                </p>
              </>
            ) : (
              <>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 mb-4">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Reset Password for {adminName}?</h3>
                <p className="text-sm text-slate-500">
                  This will generate a new random password. The admin will be required to change it upon their next login.
                </p>
                {error && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 mt-4">
                    {error}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="bg-slate-50 px-4 py-3 flex justify-end gap-3 border-t border-slate-100">
            {newPassword ? (
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
              >
                Done
              </button>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-sm"
                  disabled={loading}
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </ModalPortal>
  );
}