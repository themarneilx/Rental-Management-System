"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, KeyRound, Save, Camera } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface AdminUser {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
}

export default function AdminProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<AdminUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                } else {
                    router.push('/adminlog'); // Redirect to login if not authenticated
                }
            } catch (err) {
                console.error("Failed to fetch user data:", err);
                router.push('/adminlog'); // Redirect to login on error
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [router]);

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/admin/profile/avatar', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setUser(prev => prev ? { ...prev, avatarUrl: data.avatarUrl } : null);
                router.refresh();
            } else {
                alert('Failed to upload avatar');
            }
        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('Error uploading avatar');
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (newPassword !== confirmNewPassword) {
            setError("New passwords do not match.");
            return;
        }
        if (!currentPassword || !newPassword) {
            setError("Please fill in all password fields.");
            return;
        }

        try {
            const res = await fetch('/api/admin/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await res.json();

            if (res.ok) {
                setMessage(data.message || 'Password changed successfully!');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmNewPassword('');
            } else {
                setError(data.error || 'Failed to change password.');
            }
        } catch (err) {
            console.error("Error changing password:", err);
            setError('An unexpected error occurred.');
        }
    };

    if (loading) return <div className="p-6">Loading profile...</div>;
    if (!user) return <div className="p-6 text-rose-600">Failed to load user profile.</div>;

    return (
        <div className="space-y-6 animate-slide-in">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Admin Profile</h2>
                <p className="text-slate-500 text-sm">Manage your personal information and security settings.</p>
            </div>

            <Card className="p-6 space-y-6">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                    <div className="relative group">
                        <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-3xl font-bold overflow-hidden border-4 border-white shadow-sm">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                user.name.charAt(0).toUpperCase()
                            )}
                        </div>
                        <label className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-md">
                            <Camera className="w-4 h-4" />
                            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                        </label>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">{user.name}</h3>
                        <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-700">Role: <span className="font-semibold text-blue-600">{user.role}</span></p>
                </div>
            </Card>

            <Card className="p-6 space-y-6">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-slate-500" /> Change Password
                </h3>
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                        <input
                            type="password"
                            className="w-full p-2 border border-slate-200 rounded-lg"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                        <input
                            type="password"
                            className="w-full p-2 border border-slate-200 rounded-lg"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                        <input
                            type="password"
                            className="w-full p-2 border border-slate-200 rounded-lg"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            required
                        />
                    </div>
                    {message && <p className="text-emerald-600 text-sm">{message}</p>}
                    {error && <p className="text-rose-600 text-sm">{error}</p>}
                    <div className="pt-2">
                        <Button type="submit" className="flex items-center gap-2">
                            <Save className="w-4 h-4" /> Update Password
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
