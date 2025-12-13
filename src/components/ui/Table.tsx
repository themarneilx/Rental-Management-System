interface TableHeader {
  label: string;
  align?: string;
}

interface TableProps {
  headers: TableHeader[];
  children: React.ReactNode;
}

export default function Table({ headers, children }: TableProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto custom-scroll">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              {headers.map((h, i) => (
                <th 
                  key={i} 
                  className={`px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider ${h.align || 'text-left'}`}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}
