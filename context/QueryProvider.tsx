import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Tạo một instance của QueryClient với các cấu hình mặc định
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tối ưu cấu hình cho môi trường mobile
      retry: 2, // Số lần thử lại nếu request thất bại
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Tăng thời gian giữa các lần thử lại
      staleTime: 5 * 60 * 1000, // Dữ liệu được coi là cũ sau 5 phút
      gcTime: 10 * 60 * 1000, // Dữ liệu được lưu trong cache trước khi bị garbage collected sau 10 phút
      refetchOnWindowFocus: false, // Không refetch khi focus lại window (không phù hợp trên mobile)
      refetchOnMount: true, // Refetch dữ liệu khi component được mount
    },
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}; 