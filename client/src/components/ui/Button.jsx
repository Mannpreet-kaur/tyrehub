export function Button({ children, variant = 'primary', className = '', ...props }) {
  const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
    danger: "bg-red-600 text-white hover:bg-red-700",
    outline: "border border-slate-300 hover:bg-slate-100",
    ghost: "hover:bg-slate-100"
  };

  const heights = {
    sm: "h-9 px-3",
    md: "h-10 py-2 px-4",
    lg: "h-11 px-8"
  };

  const finalClasses = `${baseClasses} ${variants[variant]} ${heights.md} ${className}`;

  return (
    <button className={finalClasses} {...props}>
      {children}
    </button>
  );
}
