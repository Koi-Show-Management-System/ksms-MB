import api from './api';

export interface CompetitionCategory {
  id: string;
  name: string;
  sizeMin: number;
  sizeMax: number;
  description: string;
  maxEntries: number;
  registrationFee: number;
  startTime: string | null;
  endTime: string | null;
  varieties: string[];
  status: string;
  createdAt: string;
  updatedAt: string | null;
}

interface CategoryResponse {
  data: CompetitionCategory;
  statusCode: number;
  message: string;
}

interface CreateRegistrationResponse {
  data: {
    id: string;
  };
  statusCode: number;
  message: string;
}

interface CheckoutRegistrationResponse {
  data: {
    message: string;
    url: string;
  };
  statusCode: number;
  message: string;
}

export const findSuitableCategory = async (
  koiShowId: string,
  varietyId: string,
  size: string
): Promise<CategoryResponse> => {
  try {
    console.log('Calling findSuitableCategory with params:', { koiShowId, varietyId, size });
    const response = await api.get('/api/v1/registration/find-suitable-category', {
      params: {
        koiShowId,
        varietyId,
        size
      }
    });
    console.log('API Response:', response);
    return response.data;
  } catch (error: any) {
    console.error('Error finding suitable category:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    throw error;
  }
};

export const createRegistration = async (
  formData: FormData
): Promise<CreateRegistrationResponse> => {
  try {
    const response = await api.post('/api/v1/registration/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating registration:', error);
    throw error;
  }
};

export const checkoutRegistration = async (
  registrationId: string
): Promise<CheckoutRegistrationResponse> => {
  try {
    const response = await api.post(`/api/v1/registration/checkout/${registrationId}`);
    return response.data;
  } catch (error) {
    console.error('Error checking out registration:', error);
    throw error;
  }
};

export const getCompetitionCategories = async (showId: string, page: number = 1, size: number = 10) => {
  try {
    console.log('Calling getCompetitionCategories API with showId:', showId);
    const response = await api.get('/api/v1/competition-category/get-page', {
      params: {
        showId,
        page,
        size
      }
    });
    console.log('Competition categories response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching competition categories:', error);
    throw error;
  }
}; 