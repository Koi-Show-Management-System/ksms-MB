import api from './api';

// Types for Koi Shows
export interface KoiShow {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  startExhibitionDate: string;
  endExhibitionDate: string;
  location: string;
  description: string;
  registrationDeadline: string;
  minParticipants: number;
  maxParticipants: number;
  hasGrandChampion: boolean;
  hasBestInShow: boolean;
  imgUrl: string;
  registrationFee: number;
  status: string; // "upcoming", "planned", "active", "completed"
  showStatuses: any[];
}

interface KoiShowResponse {
  data: {
    size: number;
    page: number;
    total: number;
    totalPages: number;
    items: KoiShow[];
  };
  statusCode: number;
  message: string;
}

// Fetch shows with pagination
export const getKoiShows = async (page = 1, size = 10) => {
  try {
    const response = await api.get<KoiShowResponse>(`/api/v1/koi-show/paged?page=${page}&size=${size}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching Koi shows:', error);
    throw error;
  }
};