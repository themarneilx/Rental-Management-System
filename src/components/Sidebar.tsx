"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Users, 
  DoorOpen, 
  Receipt, 
  ShieldCheck, 
  Archive, 
  LogOut 
} from "lucide-react";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const MENU_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/tenants', label: 'Tenants', icon: Users },
  { href: '/admin/rooms', label: 'Rooms', icon: DoorOpen },
  { href: '/admin/billings', label: 'Billing & Meter', icon: Receipt },
  { href: '/admin/admins', label: 'Admins', icon: ShieldCheck },
  { href: '/admin/archive', label: 'Archives', icon: Archive },
];

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.name) {
          setUser(data);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/adminlog');
      router.refresh();
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const isActive = (path: string) => pathname === path;
  
  const initials = user?.name 
    ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() 
    : 'AU';

  return (
    <aside 
      className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0B1121] border-r border-slate-800 
        transform transition-transform duration-200 ease-in-out 
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} 
        flex flex-col
      `}
    >
      {/* Sidebar Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold mr-3 shadow-lg shadow-blue-500/30">
          N
        </div>
        <div>
          <h1 className="font-bold text-md tracking-tight text-white">Nicarjon Realty Corp.</h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Apartment Management System</p>
        </div>
      </div>

      {/* Sidebar Menu */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 mt-2">Menu</p>
        {MENU_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200
                ${active 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }
              `}
            >
              <item.icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Sidebar Footer (Profile) */}
      <div className="p-4 border-t border-slate-800">
         <div className="p-4 rounded-xl bg-[#1e293b] border border-slate-700/50">
           <div className="flex items-center gap-3 mb-3">
             <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold border border-slate-600">
               {initials}
             </div>
             <div className="flex-1 min-w-0">
               <p className="text-sm font-medium text-white truncate">{user?.name || 'Loading...'}</p>
               <p className="text-xs text-slate-400 truncate">{user?.email || '...'}</p>
             </div>
           </div>
           <button 
             onClick={handleLogout}
             className="w-full flex items-center gap-2 text-xs font-medium text-rose-400 hover:text-rose-300 transition-colors"
           >
             <LogOut className="w-4 h-4" /> Sign Out
           </button>
         </div>
      </div>
    </aside>
  );
}
