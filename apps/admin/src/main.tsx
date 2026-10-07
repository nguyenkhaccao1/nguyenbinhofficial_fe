import '@fontsource-variable/inter';
import './index.css';
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { ApiError } from '@nb/shared';
import { Toaster } from 'sonner';
import { ConfirmHost } from '@/components/ui/Dialog';
import { router } from './router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Khong thu lai loi 4xx (quyen, validation, not found) — chi thu lai loi mang/5xx.
      retry: (count, error) => count < 2 && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
    },
  },
  mutationCache: new MutationCache(),
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ConfirmHost />
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  </StrictMode>,
);
