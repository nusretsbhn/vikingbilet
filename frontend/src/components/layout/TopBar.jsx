import useAuthStore from '../../store/authStore';

export default function TopBar({ title, onMenuOpen }) {
  const { user } = useAuthStore();

  const roleLabels = { admin: 'Admin', editor: 'Editör', viewer: 'Görüntüleyici' };

  return (
    <header className="h-14 lg:h-[60px] flex items-center justify-between px-3 sm:px-4 lg:px-6 border-b border-border bg-surface sticky top-0 z-30 safe-top">
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={onMenuOpen}
          className="lg:hidden shrink-0 w-9 h-9 flex items-center justify-center rounded-md text-secondary hover:bg-row-hover hover:text-primary"
          aria-label="Menüyü aç"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
        <h1 className="text-base lg:text-lg font-semibold truncate">{title}</h1>
      </div>
      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-header border border-border text-sm shrink-0">
        <span className="text-primary truncate max-w-[100px] lg:max-w-none">{user?.username}</span>
        <span className="text-dim">·</span>
        <span className="text-secondary text-xs">{roleLabels[user?.role] || user?.role}</span>
      </div>
    </header>
  );
}
