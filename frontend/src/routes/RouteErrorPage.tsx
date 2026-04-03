import { AlertTriangle, LogIn, RefreshCw } from 'lucide-react';
import { useRouteError } from 'react-router-dom';
import { clearChunkLoadRecoveryFlag, isChunkLoadError } from '../utils/chunkLoadRecovery';

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    const routeError = error as { statusText?: unknown; data?: unknown; message?: unknown };
    if (typeof routeError.message === 'string' && routeError.message) {
      return routeError.message;
    }
    if (typeof routeError.statusText === 'string' && routeError.statusText) {
      return routeError.statusText;
    }
    if (typeof routeError.data === 'string' && routeError.data) {
      return routeError.data;
    }
  }

  return 'Ocurrio un error inesperado en la aplicacion.';
}

export default function RouteErrorPage() {
  const error = useRouteError();
  const chunkError = isChunkLoadError(error);
  const errorMessage = getErrorMessage(error);

  const reloadApp = () => {
    clearChunkLoadRecoveryFlag();
    window.location.reload();
  };

  const goToLogin = () => {
    clearChunkLoadRecoveryFlag();
    window.location.assign('/app/login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {chunkError ? 'La aplicacion se actualizo mientras la estabas usando' : 'No pudimos abrir esta pantalla'}
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {chunkError
            ? 'Una parte del frontend ya no coincide con tu sesion actual. Recarga la aplicacion para sincronizar los archivos nuevos del deploy.'
            : 'Ocurrio un problema al cargar esta ruta. Puedes reintentar o volver al login.'}
        </p>

        <div className="mt-4 rounded-xl bg-slate-100 p-4 text-xs leading-5 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
          {errorMessage}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reloadApp}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            Recargar aplicacion
          </button>

          <button
            type="button"
            onClick={goToLogin}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <LogIn className="h-4 w-4" />
            Ir a login
          </button>
        </div>
      </div>
    </div>
  );
}