"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Camera, 
  Eye
} from 'lucide-react';
import { TenantUser } from '@/lib/types';
import Button from '@/components/ui/Button'; 
import ContractModal from "@/components/ContractModal";
import useSWR from 'swr'; // Import SWR

// Define a fetcher function for SWR
const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error('Failed to fetch data');
    }
    return res.json();
};

// Skeleton Loader Component for Tenant Profile Page
const ProfileSkeleton = () => (
    <div className="max-w-2xl animate-pulse">
        <div className="mb-6 space-y-2">
            <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            <div className="h-5 bg-slate-200 rounded w-1/2"></div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
            {/* Avatar Section */}
            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-100">
                <div className="w-24 h-24 rounded-full bg-slate-200"></div>
                <div className="space-y-2">
                    <div className="h-6 bg-slate-200 rounded w-32"></div>
                    <div className="h-4 bg-slate-200 rounded w-48"></div>
                </div>
            </div>

            {/* Editable Fields */}
            <div className="space-y-6">
                <div className="h-6 bg-slate-200 rounded w-40 mb-4"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-24"></div>
                        <div className="h-10 bg-slate-200 rounded-lg"></div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-24"></div>
                        <div className="h-10 bg-slate-200 rounded-lg"></div>
                    </div>
                </div>
                <div className="h-10 bg-slate-200 rounded-lg w-24"></div>
            </div>

            {/* Password Section */}
            <div className="mt-8 pt-4 border-t border-slate-100 space-y-6">
                <div className="h-6 bg-slate-200 rounded w-40 mb-4"></div>
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-24"></div>
                        <div className="h-10 bg-slate-200 rounded-lg"></div>
                    </div>
                ))}
                <div className="h-10 bg-slate-200 rounded-lg w-32"></div>
            </div>
        </div>
    </div>
);


export default function TenantProfilePage() {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR('/api/tenant/dashboard', fetcher, { refreshInterval: 5000 }); // Reuse dashboard API for initial data

  const [isContractOpen, setIsContractOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  // Derive userData from SWR
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

  // Handle unauthorized access
  if (error && error.message === 'Failed to fetch data' && !isLoading) {
    router.push('/login');
    return null; 
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optimistically update UI
    const previousAvatar = userData.avatar;
    const reader = new FileReader();
    reader.onloadend = () => {
        mutate({ ...data, avatarUrl: reader.result as string }, false); // Optimistic update
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch('/api/tenant/profile/avatar', {
            method: 'POST',
            body: formData
        });

        if (res.ok) {
            const result = await res.json();
            mutate({ ...data, avatarUrl: result.avatarUrl }); // Final update with actual URL
        } else {
            console.error('Failed to upload avatar');
            alert('Failed to update avatar.');
            mutate({ ...data, avatarUrl: previousAvatar }); // Revert on error
        }
    } catch (error) {
        console.error('Error uploading avatar:', error);
        alert('Error uploading avatar. Please check your connection.');
        mutate({ ...data, avatarUrl: previousAvatar }); // Revert on error
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setPasswordMsg({ type: '', text: '' });

      if (passwordData.new !== passwordData.confirm) {
          setPasswordMsg({ type: 'error', text: 'New passwords do not match' });
          return;
      }

      try {
          const res = await fetch('/api/tenant/password', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  currentPassword: passwordData.current,
                  newPassword: passwordData.new
              })
          });
          
          const result = await res.json();
          if (res.ok) {
              setPasswordMsg({ type: 'success', text: 'Password updated successfully' });
              setPasswordData({ current: '', new: '', confirm: '' });
              mutate(); // Revalidate profile data if password change implies new auth token or similar.
          } else {
              setPasswordMsg({ type: 'error', text: result.error || 'Failed to update password' });
          }
      } catch (error) {
          console.error(error);
          setPasswordMsg({ type: 'error', text: 'An unexpected error occurred' });
      }
  };

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  return (
      <div className="max-w-2xl animate-slide-in">
        <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
            <p className="text-slate-500">Manage your personal information.</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
            {/* Avatar Section */}
            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-100">
            <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-md overflow-hidden">
                {userData.avatar ? (
                    <img src={userData.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <User className="w-10 h-10" />
                    </div>
                )}
                </div>
                <label className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-sm">
                <Camera className="w-4 h-4" />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                </label>
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-900">{userData.name}</h3>
                <p className="text-sm text-slate-500">Tenant • Unit {userData.unitName}</p>
            </div>
            </div>

            {/* Editable Fields */}
            <div className="space-y-6">
            <h4 className="font-bold text-lg text-slate-900 mb-4">Contact Information</h4>
            <form className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                        <input 
                            type="email" 
                            value={userData.email} 
                            onChange={(e) => { /* SWR will revalidate, but local state update will be lost unless you also use a local state. For now, rely on SWR revalidation. */ }}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                        <input 
                            type="text" 
                            value={userData.phone} 
                            onChange={(e) => { /* Same as email */ }}
                            className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>
                <Button type="submit" className="mt-4">Save Changes</Button>
            </form>

            {/* Contract Section */}
            {userData.contractUrl && (
                <div className="mt-8 pt-8 border-t border-slate-100">
                    <h4 className="font-bold text-lg text-slate-900 mb-4">Lease Contract</h4>
                    <div 
                        className="relative group w-full h-40 bg-slate-100 rounded-xl overflow-hidden cursor-pointer border border-slate-200 hover:border-blue-500 transition-all"
                        onClick={() => setIsContractOpen(true)}
                    >
                        <img src={userData.contractUrl} alt="Lease Contract" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <div className="bg-white/90 p-3 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 flex items-center gap-2">
                                <Eye className="w-5 h-5 text-blue-600" />
                                <span className="text-xs font-bold text-slate-700">View Contract</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <h4 className="font-bold text-lg text-slate-900 mt-8 mb-4 pt-4 border-t border-slate-100">Change Password</h4>
            <form className="space-y-4" onSubmit={handleChangePassword}>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                    <input 
                        type="password" 
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                        value={passwordData.current}
                        onChange={e => setPasswordData({...passwordData, current: e.target.value})}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                    <input 
                        type="password" 
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                        value={passwordData.new}
                        onChange={e => setPasswordData({...passwordData, new: e.target.value})}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                    <input 
                        type="password" 
                        className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                        value={passwordData.confirm}
                        onChange={e => setPasswordData({...passwordData, confirm: e.target.value})}
                        required
                    />
                </div>
                {passwordMsg.text && (
                    <p className={`text-sm ${passwordMsg.type === 'error' ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {passwordMsg.text}
                    </p>
                )}
                <Button type="submit" className="mt-4" variant="outline">Change Password</Button>
            </form>

            </div>
        </div>

        {isContractOpen && userData.contractUrl && (
            <ContractModal url={userData.contractUrl} onClose={() => setIsContractOpen(false)} />
        )}
      </div>
  );
}
