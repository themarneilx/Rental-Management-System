"use client";

import { Bell, MoreVertical } from "lucide-react";

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Header({ sidebarOpen, setSidebarOpen }: HeaderProps) {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8">
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)} 
        className="lg:hidden p-2 text-slate-600"
      >
        <MoreVertical className="w-6 h-6" />
      </button>
      
      <div className="text-sm text-slate-500 font-medium hidden sm:block">
        {currentDate}
      </div>
      
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
        </button>
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-sm ring-2 ring-blue-100">
          A
        </div>
      </div>
    </header>
  );
}
