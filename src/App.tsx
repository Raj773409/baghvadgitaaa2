import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { I18nProvider } from './i18n';
import { AppRoutes } from './app/routes';

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AppRoutes />
      </I18nProvider>
    </ThemeProvider>
  );
}
