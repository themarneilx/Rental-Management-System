import { LucideIcon } from "lucide-react";
import Card from "./Card";

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  icon: LucideIcon;
  colorClass: string;
}

export default function StatCard({ label, value, trend, icon: Icon, colorClass }: StatCardProps) {
  return (
    <Card className="p-6 flex items-start justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        {trend && (
          <p className={`text-xs mt-2 font-medium ${trend.includes('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend} from last month
          </p>
        )}
      </div>
      <div className={`p-3 rounded-lg ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
    </Card>
  );
}