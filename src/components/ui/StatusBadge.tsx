interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<string, string> = {
    Active: 'bg-emerald-100 text-emerald-700',
    Occupied: 'bg-emerald-100 text-emerald-700',
    Paid: 'bg-emerald-100 text-emerald-700',
    Pending: 'bg-amber-100 text-amber-700',
    Vacant: 'bg-slate-100 text-slate-700',
    Overdue: 'bg-rose-100 text-rose-700',
    Maintenance: 'bg-orange-100 text-orange-700',
    Archived: 'bg-slate-100 text-slate-600',
    Inactive: 'bg-slate-100 text-slate-600',
    'Super Admin': 'bg-purple-100 text-purple-700',
    'Property Manager': 'bg-blue-100 text-blue-700',
    'Billing Admin': 'bg-cyan-100 text-cyan-700',
    Partial: 'bg-yellow-100 text-yellow-700', // Added for partial payments
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}