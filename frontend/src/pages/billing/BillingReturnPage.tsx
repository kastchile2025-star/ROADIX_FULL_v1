import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card, Button } from '../../components/ui';
import { billingService } from '../../services/billing.service';
import { useAuthStore } from '../../store/auth.store';

export default function BillingReturnPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Estamos confirmando tu pago con Flow...');
  const [canRetry, setCanRetry] = useState(false);
  const appRedirectTarget = isAuthenticated ? '/app/billing' : '/app/login';

  const redirectToApp = () => {
    window.location.replace(appRedirectTarget);
  };

  const pollToken = async (token: string, maxAttempts: number, cancelled: { current: boolean }) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const result = await billingService.getFlowStatus(token);
        const estado = result.conciliation?.estado;

        if (cancelled.current) return;

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

        if (attempt < maxAttempts) {
          setMessage(`Confirmando pago con Flow... intento ${attempt} de ${maxAttempts}`);
          await new Promise((resolve) => setTimeout(resolve, 2500));
          continue;
        }

        setMessage('El pago fue procesado en Flow, pero la confirmacion aun esta pendiente. Puedes volver a Billing donde se verificara automaticamente.');
        setLoading(false);
        setCanRetry(true);
        return;
      } catch (error) {
        if (cancelled.current) return;

        if (attempt < maxAttempts) {
          setMessage(`Esperando confirmacion de Flow... intento ${attempt} de ${maxAttempts}`);
          await new Promise((resolve) => setTimeout(resolve, 2500));
          continue;
        }

        setMessage('No pudimos validar el pago con Flow en este momento. Vuelve a Billing donde se verificara automaticamente.');
        setLoading(false);
        setCanRetry(true);
        return;
      }
    }
  };

  const handleRetry = () => {
    const token = searchParams.get('token');
    if (!token) return;
    setLoading(true);
    setCanRetry(false);
    setMessage('Reintentando verificacion de pago...');
    const cancelled = { current: false };
    void pollToken(token, 4, cancelled);
  };

  useEffect(() => {
    const cancelled = { current: false };

    const token = searchParams.get('token');
    if (!token) {
      setMessage('No se recibio un token de retorno desde Flow.');
      setLoading(false);
      return undefined;
    }

    void pollToken(token, 8, cancelled);

    return () => {
      cancelled.current = true;
    };
  }, [searchParams]);

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
            <div className="flex justify-end gap-2">
              {canRetry && (
                <Button variant="secondary" onClick={handleRetry}>
                  Reintentar
                </Button>
              )}
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