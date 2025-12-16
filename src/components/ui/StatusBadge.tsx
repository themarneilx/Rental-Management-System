interface StatusBadgeProps {
  status: string;
  type?: 'invoice' | 'payment';
}

export default function StatusBadge({ status, type }: StatusBadgeProps) {
  let displayStatus = status;
  let styleKey = status;

  if (status === 'Overdue' && type !== 'payment') {
    displayStatus = 'Due Now';
    styleKey = 'Overdue'; // Use the Overdue style for "Due Now"
  } else if (status === 'Pending' && type !== 'payment') {
    displayStatus = 'Pending'; // Explicitly keep 'Pending' as 'Pending' for non-payment contexts
    styleKey = 'Pending'; // Use the Pending style for this
  }
  
  // The rest of the statuses and their styles remain the same
  const styles: Record<string, string> = {
    Active: 'bg-emerald-100 text-emerald-700',
    Occupied: 'bg-emerald-100 text-emerald-700',
    Paid: 'bg-emerald-100 text-emerald-700',
    Pending: 'bg-amber-100 text-amber-700', // Keep original Pending style for other use cases if any, but it won't be used for invoices anymore
    Vacant: 'bg-slate-100 text-slate-700',
    Overdue: 'bg-rose-100 text-rose-700',
    Maintenance: 'bg-orange-100 text-orange-700',
    Archived: 'bg-slate-100 text-slate-600',
    Inactive: 'bg-slate-100 text-slate-600',
    'Super Admin': 'bg-purple-100 text-purple-700',
    'Property Manager': 'bg-blue-100 text-blue-700',
    'Billing Admin': 'bg-cyan-100 text-cyan-700',
    Partial: 'bg-yellow-100 text-yellow-700', // Added for partial payments
    Confirmed: 'bg-emerald-100 text-emerald-700', // Added for confirmed payments
    Rejected: 'bg-rose-100 text-rose-700', // Added for rejected payments
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[styleKey] || 'bg-slate-100 text-slate-600'}`}>
      {displayStatus}
    </span>
  );
}