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

interface Variety {
  id: string;
  name: string;
  description: string;
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
