import api from "./api";

// Interface cho các loại dữ liệu
export interface CompetitionCategory {
  id: string;
  name: string;
  sizeMin: number;
  sizeMax: number;
  description: string;
  maxEntries: number;
  hasTank: boolean;
  registrationFee: number;
  startTime: string;
  endTime: string;
  varieties: string[];
  status: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface Round {
  id: string;
  name: string;
  roundOrder: number;
  roundType: "Preliminary" | "Evaluation" | "Final";
  numberOfRegistrationToAdvance: number;
  status: "upcoming" | "active" | "completed";
}

export interface RoundResult {
  id: string;
  totalScore: number;
  isPublic: boolean;
  comments: string | null;
  status: string; // "Pass", "Fail", etc.
  createdAt: string;
  updatedAt: string | null;
}

export interface KoiContestant {
  id: string;
  rank?: number;
  registration: {
    id: string;
    registrationNumber: string | null;
    registerName: string;
    koiSize: number;
    koiAge: number;
    registrationFee: number;
    qrcodeData: string;
    status: string;
    notes: string;
    checkInExpiredDate: string | null;
    isCheckedIn: boolean;
    checkInTime: string;
    checkInLocation: string;
    checkedInBy: string;
    createdAt: string;
    approvedAt: string;
    competitionCategory: {
      id: string;
      name: string;
    };
    koiMedia: {
      id: string;
      mediaUrl: string;
      mediaType: "Image" | "Video";
    }[];
    koiProfile: {
      name: string;
      gender: string;
      bloodline: string;
      variety: {
        id: string;
        name: string;
        description: string;
      };
    };
    koiShow: {
      id: string;
      name: string;
      status: string;
    };
  };
  checkInTime: string;
  checkOutTime: string | null;
  tankName: string;
  status: string;
  notes: string | null;
  roundResults: RoundResult[];
}

// Type cho response từ API
interface ApiResponse<T> {
  data: {
    size: number;
    page: number;
    total: number;
    totalPages: number;
    items: T[];
  };
  statusCode: number;
  message: string;
}

// Lấy danh sách hạng mục thi đấu
export const getCompetitionCategories = async (
  showId: string
): Promise<ApiResponse<CompetitionCategory>> => {
  try {
    const response = await api.get("/api/v1/competition-category/get-page", {
      params: {
        showId,
        page: 1,
        size: 10000,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy hạng mục:", error);
    throw error;
  }
};

// Lấy danh sách vòng đấu
export const getRounds = async (
  competitionCategoryId: string,
  roundType: string
): Promise<ApiResponse<Round>> => {
  try {
    const response = await api.get(`/api/v1/round/${competitionCategoryId}`, {
      params: {
        roundType,
        page: 1,
        size: 10000,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy vòng đấu:", error);
    throw error;
  }
};

// Lấy danh sách thí sinh trong vòng đấu
export const getContestants = async (
  roundId: string
): Promise<ApiResponse<KoiContestant>> => {
  try {
    const response = await api.get(`/api/v1/registration-round/${roundId}`, {
      params: {
        page: 1,
        size: 1000,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy thí sinh:", error);
    throw error;
  }
};

// Lấy token từ secure storage
const getToken = async () => {
  // Implement lấy token từ AsyncStorage hoặc SecureStore
  // return await SecureStore.getItemAsync('auth_token');
  return "your_token_here"; // Thay đổi để lấy token thực tế
};
