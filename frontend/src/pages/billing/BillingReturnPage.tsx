import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card, Button } from '../../components/ui';
import { billingService } from '../../services/billing.service';
import { useAuthStore } from '../../store/auth.store';

export default function BillingReturnPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Estamos confirmando tu pago con Flow...');
  const appRedirectTarget = isAuthenticated ? '/app/billing' : '/app/login';

  const redirectToApp = () => {
    window.location.replace(appRedirectTarget);
  };

  useEffect(() => {
    let cancelled = false;

    const token = searchParams.get('token');
    if (!token) {
      setMessage('No se recibio un token de retorno desde Flow.');
      setLoading(false);
      return undefined;
    }

    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const run = async () => {
      for (let attempt = 1; attempt <= 8; attempt += 1) {
        try {
          const result = await billingService.getFlowStatus(token);
          const estado = result.conciliation?.estado;

          if (cancelled) return;

          if (estado === 'paid') {
            toast.success('Pago confirmado correctamente.');
            redirectToApp();
            return;
          }

          if (estado === 'failed') {
            setMessage('Flow informo que el pago fue rechazado o cancelado.');
            toast.error('El pago no fue aprobado.');
            setLoading(false);
            return;
          }

          if (attempt < 8) {
            setMessage(`Confirmando pago con Flow... intento ${attempt} de 8`);
            await wait(2500);
            continue;
          }

          setMessage(result.error ?? 'El pago fue procesado en Flow, pero la confirmacion aun esta pendiente. Puedes volver a Billing y revisar en unos segundos.');
          setLoading(false);
          return;
        } catch (error) {
          if (cancelled) return;

          const apiMessage =
            typeof error === 'object'
            && error !== null
            && 'response' in error
            && typeof (error as {
              response?: { data?: { message?: string } };
            }).response?.data?.message === 'string'
              ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
              : undefined;

          if (attempt < 8) {
            setMessage(`Esperando confirmacion de Flow... intento ${attempt} de 8`);
            await wait(2500);
            continue;
          }

          setMessage(apiMessage ?? 'No pudimos validar el pago de Flow.');
          setLoading(false);
          return;
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [appRedirectTarget, isAuthenticated, navigate, searchParams]);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl items-center justify-center px-4">
      <Card title="Confirmacion de pago">
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <span>{message}</span>
            </div>
          ) : (
            <p className="text-sm text-gray-700 dark:text-gray-300">{message}</p>
          )}

          {!loading && (
            <div className="flex justify-end">
              <Button onClick={redirectToApp}>
                {isAuthenticated ? 'Volver a Billing' : 'Ir a Login'}
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}