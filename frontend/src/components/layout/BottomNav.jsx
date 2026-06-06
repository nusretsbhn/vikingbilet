import { NavLink } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const items = [
  { to: '/dashboard', label: 'Özet', icon: '▣' },
  { to: '/biletler', label: 'Biletler', icon: '☰' },
  { to: '/acentalar', label: 'Acenta', icon: '◎' },
  { to: '/raporlar', label: 'Rapor', icon: '▤' },
];

export default function BottomNav() {
  const { user } = useAuthStore();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-surface border-t border-border safe-bottom">
      <div className="flex items-stretch justify-around h-14">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                isActive ? 'text-accent' : 'text-secondary'
              }`
            }
          >
            <span className="text-base leading-none">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
        {user?.role === 'admin' && (
          <NavLink
            to="/admin/settings"
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                isActive ? 'text-accent' : 'text-secondary'
              }`
            }
          >
            <span className="text-base leading-none">⚙</span>
            <span>Ayar</span>
          </NavLink>
        )}
      </div>
    </nav>
  );
}
