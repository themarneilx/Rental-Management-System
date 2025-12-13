"use client";

import { useState, useEffect } from "react";
import { Tenant } from "@/data/mock";
import { Search } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/StatusBadge";

export default function ArchivePage() {
  const [archivedTenants, setArchivedTenants] = useState<Tenant[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArchives() {
      try {
        const res = await fetch('/api/tenants?status=Archived');
        if (res.ok) {
          const data = await res.json();
          const mappedTenants: Tenant[] = data.map((t: any) => ({
            id: t.id,
            name: t.name,
            email: t.email || '',
            phone: t.phone,
            unitId: t.roomId,
            status: t.status,
            leaseEnd: t.leaseEnd?.split('T')[0] || '',
            deposit: Number(t.deposit)
          }));
          setArchivedTenants(mappedTenants);
        }
      } catch (error) {
        console.error("Failed to fetch archives", error);
      } finally {
        setLoading(false);
      }
    }
    fetchArchives();
  }, []);

  const filteredTenants = archivedTenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-6">Loading archives...</div>;

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Archives</h2>
        <p className="text-slate-500 text-sm">Historical records of past tenants.</p>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search archives..." 
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">Tenant</th>
                <th className="px-6 py-3 font-semibold">Contact</th>
                <th className="px-6 py-3 font-semibold">Previous Unit</th>
                <th className="px-6 py-3 font-semibold">Lease Ended</th>
                <th className="px-6 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTenants.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No archived records found.</td></tr>
              ) : (
                filteredTenants.map((tenant) => (
                  <tr key={tenant.id} className="opacity-75 hover:opacity-100 transition-opacity hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{tenant.name}</td>
                    <td className="px-6 py-4 text-slate-600">
                        <div>{tenant.email}</div>
                        <div className="text-xs">{tenant.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 italic">
                        {/* We don't store previous unit name easily yet, unless we query history. */}
                        {tenant.unitId || 'Not Assigned'} 
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">{tenant.leaseEnd}</td>
                    <td className="px-6 py-4"><Badge status="Archived" /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
