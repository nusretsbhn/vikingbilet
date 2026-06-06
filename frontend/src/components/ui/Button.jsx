const variants = {
  default: 'bg-surface text-primary border-border hover:bg-row-hover',
  primary: 'bg-accent text-white border-accent hover:bg-accent/90',
  danger: 'bg-red/10 text-red border-red/30 hover:bg-red/20',
  ghost: 'bg-transparent text-secondary border-transparent hover:bg-row-hover hover:text-primary',
};

const sizes = {
  sm: 'h-7 px-2.5 text-xs',
  md: 'h-7 px-3 text-sm',
};

export default function Button({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  loading = false,
  disabled = false,
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-md border font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
