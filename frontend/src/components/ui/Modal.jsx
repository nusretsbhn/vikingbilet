import { useEffect } from 'react';
import Button from './Button';

export default function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-2xl bg-surface border border-border rounded-t-2xl sm:rounded-xl shadow-2xl max-h-[92vh] sm:max-h-[85vh] flex flex-col safe-bottom">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-border shrink-0">
          <h2 className="text-base sm:text-lg font-semibold pr-4">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Kapat">✕</Button>
        </div>
        <div className="px-4 sm:px-5 py-4 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-4 sm:px-5 py-3 sm:py-4 border-t border-border shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
