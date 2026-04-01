import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { router } from './routes';
import { ThemeProvider } from './context/ThemeContext';
import { I18nProvider } from './context/I18nContext';

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" />
      </I18nProvider>
    </ThemeProvider>
  );
}
