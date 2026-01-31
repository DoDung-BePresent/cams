/**
 * Node modules
 */
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export const QueryProvider = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // Dữ liệu được coi là "tươi" trong 1 phút
            gcTime: 1000 * 60 * 60 * 24, // Giữ trong cache 24h (Garbage Collection)
            retry: 1, // Thử lại 1 lần nếu request lỗi
            refetchOnWindowFocus: false, // Không tự động tải lại khi quay lại tab
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};
