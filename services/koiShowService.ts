import api from './api';
import { KoiShow } from './showService';
import { CompetitionCategory } from './registrationService';

// Các hàm gọi API
export const fetchKoiShowById = async (id: string): Promise<KoiShow> => {
  try {
    const response = await api.get<{ data: KoiShow }>(`/api/v1/koi-show/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching koi show details:', error);
    throw error;
  }
};

export const fetchCompetitionCategories = async (showId: string): Promise<CompetitionCategory[]> => {
  try {
    const response = await api.get('/api/v1/competition-category/get-page', {
      params: {
        showId,
        page: 1,
        size: 10000 // Lấy tất cả danh mục trong một request
      }
    });

    if (response.data && response.data.data && response.data.data.items) {
      return response.data.data.items;
    }

    return [];
  } catch (error) {
    console.error('Error fetching competition categories:', error);
    throw error;
  }
};

// Hàm để prefetch nhiều data cùng lúc
export const fetchKoiShowData = async (showId: string): Promise<{
  show: KoiShow;
  categories: CompetitionCategory[];
}> => {
  // Sử dụng Promise.all để gọi cả 2 API cùng lúc
  const [showData, categoriesData] = await Promise.all([
    fetchKoiShowById(showId),
    fetchCompetitionCategories(showId)
  ]);

  return {
    show: showData,
    categories: categoriesData
  };
};