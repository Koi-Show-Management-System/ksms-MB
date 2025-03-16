import api from './api';

export interface KoiVariety {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface KoiMedia {
  id: string;
  mediaUrl: string;
  mediaType: "Image" | "Video";
  createdAt: string;
  updatedAt: string | null;
}

export interface KoiProfile {
  id: string;
  name: string;
  size: number;
  age: number;
  gender: string;
  bloodline: string;
  variety: KoiVariety;
  koiMedia: KoiMedia[];
  status: string;
  createdAt: string;
  updatedAt: string | null;
}

interface KoiProfileResponse {
  data: KoiProfile;
  statusCode: number;
  message: string;
}

interface KoiProfileListResponse {
  data: {
    items: KoiProfile[];
    total: number;
    page: number;
    size: number;
  };
  statusCode: number;
  message: string;
}

interface GetKoiProfilesParams {
  varietyIds?: string[];
  startSize?: number;
  endSize?: number;
  name?: string;
  page?: number;
  size?: number;
}

export const getKoiProfiles = async (
  page: number = 1,
  size: number = 10
): Promise<KoiProfileListResponse> => {
  try {
    const response = await api.get('/api/v1/koi-profile/get-page', {
      params: {
        page,
        size
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching koi profiles:', error);
    throw error;
  }
};

export const getKoiProfileById = async (id: string): Promise<KoiProfileResponse> => {
  try {
    const response = await api.get(`/api/v1/koi-profile/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching koi profile:', error);
    throw error;
  }
};

// Interface khai báo trước khi sử dụng
export interface Variety {
  id: string;
  name: string;
  description: string;
}

// Get varieties
export const getVarieties = async () => {
  try {
    console.log('Calling getVarieties API');
    const response = await api.get('/api/v1/variety/get-page?page=1&size=50');
    console.log('Variety API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching varieties:', error);
    throw error;
  }
}

// Create new koi profile
export const createKoiProfile = async (formData: FormData) => {
  try {
    console.log('Creating new koi profile with form data');
    const response = await api.post('/api/v1/koi-profile/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('Create koi profile API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating koi profile:', error);
    throw error;
  }
}
