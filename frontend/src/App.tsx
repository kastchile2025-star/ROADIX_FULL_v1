import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { router } from './routes';
import { ThemeProvider } from './context/ThemeContext';
import { I18nProvider } from './context/I18nContext';
import { ConfirmProvider } from './components/ui';

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <ConfirmProvider>
          <RouterProvider router={router} />
          <Toaster position="top-right" />
        </ConfirmProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
