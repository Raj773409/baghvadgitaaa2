import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { I18nProvider } from './i18n';
import { AppRoutes } from './app/routes';
import { ToastProvider } from './components/ui/Toaster';

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
