import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Button, Input } from '../../components/ui';
import { RoadixLogo } from '../../components/ui/RoadixLogo';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/auth.store';
import { useI18n } from '../../context/I18nContext';

const schema = z.object({
  email: z.string().min(1, 'Usuario requerido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

type Form = z.infer<typeof schema>;

const features = [
  'Gestión completa de órdenes de trabajo',
  'Kanban para seguimiento en tiempo real',
  'Control de inventario y repuestos',
  'Portal de cliente y facturación integrada',
];

export default function LoginPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    } catch {
      setError(t('login.errorInvalid'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* ── Left brand panel ────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-12 select-none">
        <div>
          <div className="flex items-center gap-3">
            <RoadixLogo size={44} />
            <span className="text-2xl font-bold text-white tracking-tight">Roadix</span>
          </div>
          <p className="mt-5 text-blue-200 text-lg font-light leading-relaxed max-w-xs">
            La plataforma SaaS para talleres<br />automotrices modernos.
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
          <div className="lg:hidden mb-8 flex flex-col items-center">
            <RoadixLogo size={52} />
            <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">Roadix</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Bienvenido de nuevo</h2>
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
