const statusStyles = {
  'Tahsil edildi': 'bg-green/15 text-green',
  'Görülmedi': 'bg-amber/15 text-amber',
  'Misafir': 'bg-accent/15 text-accent',
};

export default function Badge({ children, className = '' }) {
  const status = children?.toString().trim();
  const style = statusStyles[status] || 'bg-dim/20 text-secondary';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style} ${className}`}>
      {children || '—'}
    </span>
  );
}
