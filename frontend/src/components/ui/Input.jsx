export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs text-secondary font-medium">{label}</label>
      )}
      <input
        className={`h-[30px] px-2.5 rounded border border-border bg-white text-primary text-sm placeholder:text-dim focus:outline-none focus:border-border-focus ${error ? 'border-red' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red">{error}</span>}
    </div>
  );
}
