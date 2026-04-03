import { useState } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Globe, Moon, Sun } from 'lucide-react';
import { Button, Input } from '../../components/ui';
import { RoadixLogo } from '../../components/ui/RoadixLogo';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/auth.store';
import { useI18n } from '../../context/I18nContext';
import { useTheme } from '../../context/ThemeContext';

const schema = z.object({
  email: z.string().min(1, 'Usuario requerido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

type Form = z.infer<typeof schema>;

export default function LoginPage() {
  const { t, lang, toggleLang } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const features = [
    t('login.feature1'),
    t('login.feature2'),
    t('login.feature3'),
    t('login.feature4'),
  ];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Form) => {
    setLoading(true);
    setError('');
    try {
      const res = await authService.login(data.email, data.password);
      setAuth(
        { ...res.user, taller_id: res.user.taller_id } as any,
        res.accessToken,
        res.refreshToken,
      );
      navigate('/');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          setError(t('login.errorTimeout'));
        } else if (error.response?.status === 401) {
          setError(t('login.errorInvalid'));
        } else {
          setError(t('login.errorServer'));
        }
      } else {
        setError(t('login.errorServer'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen">
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <button
          onClick={toggleLang}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold tracking-wider text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          title={lang === 'es' ? t('login.switchToEnglish') : t('login.switchToSpanish')}
        >
          <Globe size={14} />
          {lang.toUpperCase()}
        </button>
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          title={theme === 'light' ? t('login.themeDark') : t('login.themeLight')}
        >
          {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
        </button>
      </div>

      {/* ── Left brand panel ────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-12 select-none">
        <div>
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <RoadixLogo size={44} />
            <span className="text-2xl font-bold text-white tracking-tight">Roadix</span>
          </a>
          <p className="mt-5 text-blue-200 text-lg font-light leading-relaxed max-w-xs">
            {t('login.taglineLine1')}<br />{t('login.taglineLine2')}
          </p>
        </div>

        <div className="space-y-4">
          {features.map((f) => (
            <div key={f} className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <span className="text-slate-300 text-sm leading-relaxed">{f}</span>
            </div>
          ))}
        </div>

        <p className="text-slate-600 text-xs">© 2026 QCORE · v1.26</p>
      </div>

      {/* ── Right form panel ────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center bg-white dark:bg-slate-900 px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile-only logo */}
          <a href="/" className="lg:hidden mb-8 flex flex-col items-center hover:opacity-80 transition-opacity">
            <RoadixLogo size={52} />
            <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">Roadix</h1>
          </a>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('login.welcome')}</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('login.subtitle')}</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/40 p-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label={t('login.userLabel')}
              type="text"
              autoComplete="username"
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              label={t('login.passwordLabel')}
              type="password"
              autoComplete="current-password"
              {...register('password')}
              error={errors.password?.message}
            />
            <Button type="submit" loading={loading} className="w-full mt-2">
              {t('login.submit')}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {t('login.noAccount')}{' '}
            <Link to="/register" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              {t('login.createAccount')}
            </Link>
          </p>
          <p className="mt-2 text-center text-sm">
            <Link
              to="/forgot-password"
              className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors hover:underline"
            >
              {t('login.forgotPassword')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
