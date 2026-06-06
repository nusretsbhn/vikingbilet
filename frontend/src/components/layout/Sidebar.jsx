import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { logout as logoutApi } from '../../api/auth';
import Button from '../ui/Button';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '▣' },
  { to: '/biletler', label: 'Biletler', icon: '☰' },
  { to: '/acentalar', label: 'Acentalar', icon: '◎' },
  { to: '/raporlar', label: 'Raporlar', icon: '▤' },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch {
      // ignore
    }
    logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm transition-colors ${
      isActive
        ? 'bg-accent/15 text-accent font-medium'
        : 'text-secondary hover:bg-row-hover hover:text-primary'
    }`;

  const sidebarContent = (
    <>
      <div className="h-[60px] flex items-center px-4 border-b border-border shrink-0">
        {(!collapsed || mobileOpen) && (
          <div className="min-w-0">
            <div className="font-bold text-primary text-sm truncate">Viking Ölüdeniz</div>
            <div className="text-xs text-dim">Bilet Takip</div>
          </div>
        )}
        <button
          onClick={mobileOpen ? onMobileClose : onToggle}
          className="ml-auto text-secondary hover:text-primary text-lg p-1 lg:text-sm"
          aria-label={mobileOpen ? 'Menüyü kapat' : 'Kenar çubuğunu daralt'}
        >
          {mobileOpen ? '✕' : collapsed ? '→' : '←'}
        </button>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onMobileClose}
            className={navLinkClass}
          >
            <span className="text-base lg:text-sm shrink-0">{item.icon}</span>
            {(!collapsed || mobileOpen) && <span>{item.label}</span>}
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <>
            <NavLink
              to="/admin/settings"
              onClick={onMobileClose}
              className={navLinkClass}
            >
              <span className="text-base lg:text-sm shrink-0">⚙</span>
              {(!collapsed || mobileOpen) && <span>Ayarlar</span>}
            </NavLink>
            <NavLink
              to="/admin/users"
              onClick={onMobileClose}
              className={navLinkClass}
            >
              <span className="text-base lg:text-sm shrink-0">👤</span>
              {(!collapsed || mobileOpen) && <span>Kullanıcılar</span>}
            </NavLink>
          </>
        )}
      </nav>

      <div className="p-3 border-t border-border shrink-0 safe-bottom lg:safe-bottom-none">
        {(!collapsed || mobileOpen) && (
          <div className="text-xs text-secondary mb-2 truncate">{user?.username}</div>
        )}
        <Button variant="ghost" size="sm" className="w-full" onClick={handleLogout}>
          {collapsed && !mobileOpen ? '↪' : 'Çıkış'}
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobil drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-200 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="absolute inset-0 bg-black/40"
          onClick={onMobileClose}
          aria-hidden="true"
        />
        <aside
          className={`absolute left-0 top-0 h-full w-[min(280px,85vw)] bg-header border-r border-border flex flex-col shadow-xl transition-transform duration-200 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebarContent}
        </aside>
      </div>

      {/* Masaüstü sidebar */}
      <aside
        className={`hidden lg:flex fixed left-0 top-0 h-full bg-header border-r border-border flex-col transition-all z-40 ${
          collapsed ? 'w-16' : 'w-[220px]'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
