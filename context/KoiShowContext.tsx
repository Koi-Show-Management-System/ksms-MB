import React, { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchKoiShowData } from '../services/koiShowService';
import { KoiShow } from '../services/showService';
import { CompetitionCategory } from '../services/registrationService';

// Cấu trúc dữ liệu context
interface KoiShowContextType {
  showData: KoiShow | undefined;
  categories: CompetitionCategory[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Tạo context
const KoiShowContext = createContext<KoiShowContextType | undefined>(undefined);

// Custom hook để sử dụng context
export const useKoiShow = () => {
  const context = useContext(KoiShowContext);
  if (!context) {
    throw new Error('useKoiShow must be used within a KoiShowProvider');
  }
  return context;
};

interface KoiShowProviderProps {
  children: React.ReactNode;
  showId: string;
}

// Provider component
export const KoiShowProvider: React.FC<KoiShowProviderProps> = ({ children, showId }) => {
  // Sử dụng React Query để quản lý fetching và caching
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['koiShow', showId],
    queryFn: () => fetchKoiShowData(showId),
    enabled: !!showId, // Chỉ gọi API khi có showId
  });

  // Hàm refetch được chuẩn hóa
  const refetchData = async () => {
    await refetch();
  };

  // Giá trị context được cung cấp
  const value: KoiShowContextType = {
    showData: data?.show,
    categories: data?.categories || [],
    isLoading,
    error: error as Error | null,
    refetch: refetchData,
  };

  return (
    <KoiShowContext.Provider value={value}>
      {children}
    </KoiShowContext.Provider>
  );
}; 