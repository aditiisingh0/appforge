'use client';

import { ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/lib/auth';
import '@/lib/i18n';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  // Sync locale from user preference
  useEffect(() => {
    const savedLocale = localStorage.getItem('af_locale');
    if (savedLocale && savedLocale !== i18n.language) {
      i18n.changeLanguage(savedLocale);
    }
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: '10px',
                background: '#1f2937',
                color: '#f9fafb',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}
