import { useState } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import useAuthStore from '../../store/authStore';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/biletler': 'Biletler',
  '/acentalar': 'Acentalar',
  '/raporlar': 'Raporlar',
  '/admin/settings': 'Ayarlar',
  '/admin/users': 'Kullanıcı Yönetimi',
};

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const title = pageTitles[location.pathname] || 'Viking Bilet Takip';

  return (
    <div className="min-h-screen bg-base pb-[calc(3.5rem+env(safe-area-inset-bottom))] lg:pb-0">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div
        className={`min-h-screen transition-[margin] duration-200 ml-0 ${
          collapsed ? 'lg:ml-16' : 'lg:ml-[220px]'
        }`}
      >
        <TopBar title={title} onMenuOpen={() => setMobileMenuOpen(true)} />
        <main className="p-3 sm:p-4 lg:p-6 overflow-x-hidden max-w-[1600px]">
          <Outlet />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
