'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from '@/lib/hooks/redux/store';
import { AuthProvider } from '@/lib/api/contexts/AuthContext';
import { SnackbarProvider } from 'notistack';
import ThemeRegistry from '@/lib/theme/ThemeRegistry';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeRegistry>
          <SnackbarProvider 
            maxSnack={3} 
            autoHideDuration={5000}
            anchorOrigin={{ 
              vertical: 'bottom', 
              horizontal: 'right' 
            }}
          >
            <AuthProvider>
              {children}
            </AuthProvider>
          </SnackbarProvider>
        </ThemeRegistry>
        {process.env.NODE_ENV !== 'production' && <ReactQueryDevtools />}
      </QueryClientProvider>
    </ReduxProvider>
  );
}
