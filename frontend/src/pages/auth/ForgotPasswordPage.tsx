import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Wrench } from 'lucide-react';
import { Button, Input } from '../../components/ui';
import { authService } from '../../services/auth.service';

const schema = z.object({
  email: z.string().email('Email inválido'),
});

type Form = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Form) => {
    setLoading(true);
    try {
      await authService.forgotPassword(data.email);
      setSent(true);
    } catch {
      // Still show success to prevent email enumeration
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center">
          <Wrench className="mb-2 h-10 w-10 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Recuperar Contraseña</h1>
          <p className="text-sm text-gray-500">Te enviaremos un enlace para restablecer tu contraseña</p>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-700">
              Si el email está registrado, recibirás instrucciones para restablecer tu contraseña.
            </div>
            <Link to="/login" className="text-sm font-medium text-blue-600 hover:underline">
              Volver al login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              {...register('email')}
              error={errors.email?.message}
            />
            <Button type="submit" loading={loading} className="w-full">
              Enviar enlace
            </Button>
            <p className="text-center text-sm">
              <Link to="/login" className="text-gray-500 hover:text-blue-600 hover:underline">
                Volver al login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
