import { useState } from 'react';
import { LogOut, Sun, Moon, Globe, PlusCircle } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { authService } from '../../services/auth.service';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../context/I18nContext';
import { NuevaOtWizard } from '../NuevaOtWizard';

function getInitials(name?: string): string {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Header({ collapsed }: { collapsed: boolean }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useI18n();
  const [wizardOpen, setWizardOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      logout();
      navigate('/login');
    }
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200/80 bg-white/95 backdrop-blur-sm px-6 dark:border-slate-700/60 dark:bg-slate-900/95 transition-all duration-300 ${
        collapsed ? 'left-16' : 'left-60'
      }`}
    >
      <div />

      <div className="flex items-center gap-2">
        {/* New WO button */}
        <button
          onClick={() => setWizardOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-blue-600 hover:to-indigo-600 hover:shadow-md hover:shadow-blue-500/20 transition-all"
        >
          <PlusCircle size={16} />
          {t('wizard.headerBtn')}
        </button>

        {/* Language toggle */}
        <button
          onClick={toggleLang}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold tracking-wider text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          title={lang === 'es' ? 'Switch to English' : 'Cambiar a Español'}
        >
          <Globe size={14} />
          {lang.toUpperCase()}
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          title={theme === 'light' ? 'Dark mode' : 'Light mode'}
        >
          {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
        </button>

        {/* User pill */}
        <div className="flex items-center gap-2 rounded-full bg-gray-100 dark:bg-slate-800 px-3 py-1.5 ml-1">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-[10px] font-bold text-white flex-shrink-0">
            {getInitials(user?.nombre)}
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300 max-w-[120px] truncate">
            {user?.nombre}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          title={t('header.logout')}
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">{t('header.logout')}</span>
        </button>
      </div>

      <NuevaOtWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </header>
  );
}
