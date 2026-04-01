import { Outlet, useLocation } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { TourGuide } from '../TourGuide';

function loadCollapsed(): boolean {
  return localStorage.getItem('roadix-sidebar-collapsed') === 'true';
}

export function AppLayout() {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(loadCollapsed);
  const [tourOpen, setTourOpen] = useState(false);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('roadix-sidebar-collapsed', String(next));
      return next;
    });
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} onTour={() => setTourOpen(true)} />
      <Header collapsed={collapsed} />
      <main className={`mt-16 p-6 transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-60'}`}>
        <Outlet />
      </main>
      <TourGuide open={tourOpen} onClose={() => setTourOpen(false)} />
    </div>
  );
}
