import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Wrench } from 'lucide-react';
import { Button, Input } from '../../components/ui';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/auth.store';

const schema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  telefono: z.string().optional(),
  taller_nombre: z.string().min(2, 'Nombre del taller requerido'),
  taller_rut: z.string().optional(),
});

type Form = z.infer<typeof schema>;

export default function RegisterPage() {
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
      const res = await authService.register(data);
      setAuth(
        { ...res.user, taller_id: res.user.taller_id } as any,
        res.accessToken,
        res.refreshToken,
      );
      navigate('/');
    } catch {
      setError('Error al registrar. Es posible que el email ya esté en uso.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center">
          <Wrench className="mb-2 h-10 w-10 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Crear cuenta</h1>
          <p className="text-sm text-gray-500">14 días de prueba gratuita</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Tu nombre"
            {...register('nombre')}
            error={errors.nombre?.message}
          />
          <Input
            label="Email"
            type="email"
            {...register('email')}
            error={errors.email?.message}
          />
          <Input
            label="Contraseña"
            type="password"
            {...register('password')}
            error={errors.password?.message}
          />
          <Input
            label="Teléfono (opcional)"
            {...register('telefono')}
            error={errors.telefono?.message}
          />
          <hr className="my-2 border-gray-200" />
          <Input
            label="Nombre del taller"
            {...register('taller_nombre')}
            error={errors.taller_nombre?.message}
          />
          <Input
            label="RUT del taller (opcional)"
            {...register('taller_rut')}
            error={errors.taller_rut?.message}
          />
          <Button type="submit" loading={loading} className="w-full">
            Crear cuenta
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
