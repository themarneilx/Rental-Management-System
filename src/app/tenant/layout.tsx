"use client";

import { useState, useEffect } from "react";
import TenantSidebar from "@/components/TenantSidebar";
import Header from "@/components/Header";

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; avatar?: string | null } | null>(null);
  const [initials, setInitials] = useState<string>('TU');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/tenant/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          if (data.name) {
            setInitials(data.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase());
          }
        }
      } catch (error) {
        console.error('Failed to fetch user in TenantLayout', error);
      }
    };
    fetchUser();
  }, []);

  const headerUser = user ? { ...user, avatarUrl: user.avatar } : null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex">
      <TenantSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} user={user} />
      
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} initials={initials} user={headerUser} />
        
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {children}
            </div>
        </main>
      </div>
      
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
