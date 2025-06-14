'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from '@/lib/hooks/redux/store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ReduxProvider>
  );
}