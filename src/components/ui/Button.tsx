import { LucideIcon } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  icon?: LucideIcon;
}

export default function Button({ children, onClick, variant = 'primary', className = '', icon: Icon, ...props }: ButtonProps) {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg shadow-blue-900/20",
    outline: "border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300",
    ghost: "text-slate-600 hover:bg-slate-100",
    danger: "text-rose-600 bg-rose-50 hover:bg-rose-100"
  };
  
  // Disabled styling overrides
  const disabledStyle = props.disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "";
  
  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className} ${disabledStyle}`} {...props}>
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
}
