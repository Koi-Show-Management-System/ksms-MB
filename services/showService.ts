import api from "./api";

// Types for Koi Shows
export interface ShowStatus {
  id: string;
  koiShowId: string;
  statusName: string;
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface TicketType {
  id: string;
  name: string;
  price: number;
  availableQuantity: number;
}

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
  status: string;
  createdAt: string;
  updatedAt: string;
  showStatuses: ShowStatus[];
  registrationFee: number;
  ticketTypes?: TicketType[];
  showRules?: string[];
  criteria?: string[];
}

interface ShowResponse {
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
export const getKoiShows = async (page: number = 1, size: number = 10): Promise<ShowResponse['data']> => {
  try {
    const response = await api.get<ShowResponse>(`/api/v1/koi-show/paged?page=${page}&size=${size}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching koi shows:', error);
    throw error;
  }
};

// Fetch a single show by ID
export const getKoiShowById = async (id: string): Promise<KoiShow> => {
  try {
    const response = await api.get<{ data: KoiShow }>(`/api/v1/koi-show/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching koi show details:', error);
    throw error;
  }
};
