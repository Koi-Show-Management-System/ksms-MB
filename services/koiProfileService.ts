import axios, { AxiosError } from 'axios';

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

interface GetKoiProfilesParams {
  varietyIds?: string[];
  startSize?: number;
  endSize?: number;
  name?: string;
  page?: number;
  size?: number;
}

export interface KoiProfileListResponse {
  data: {
    items: KoiProfile[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
  };
  statusCode: number;
  message: string;
}

export const getKoiProfiles = async (params: GetKoiProfilesParams = {}): Promise<KoiProfileListResponse> => {
  try {
    const { page = 1, size = 10, varietyIds, startSize, endSize, name } = params;
    
    const response = await api.get('/api/v1/koi-profile/get-page', {
      params: {
        page,
        size,
        ...(varietyIds && varietyIds.length > 0 && { VarietyIds: varietyIds }),
        ...(startSize !== undefined && { StartSize: startSize }),
        ...(endSize !== undefined && { EndSize: endSize }),
        ...(name && { Name: name })
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

// Interface for update data (optional, for clarity)
export interface UpdateKoiProfileData {
  varietyId?: string;
  size?: number;
  age?: number;
  status?: string;
  // Files are handled by FormData, so not explicitly listed here unless needed for type checking elsewhere
}

// Update koi profile
export const updateKoiProfile = async (id: string, formData: FormData): Promise<KoiProfileResponse> => {
  try {
    console.log(`Updating koi profile ${id} with form data`);
    // Log FormData entries for debugging
    // formData.forEach((value, key) => {
    //   console.log(`${key}: ${value}`);
    // });
    const response = await api.put(`/api/v1/koi-profile/${id}`, formData, {
      headers: {
        // Content-Type is automatically set by Axios when using FormData
        // 'Content-Type': 'multipart/form-data',
      },
    });
    console.log('Update koi profile API response:', response.data);
    return response.data;
  } catch (error: unknown) { // Explicitly type error as unknown
    // Log detailed error information
    if (axios.isAxiosError(error)) { // Check if it's an AxiosError
      console.error('Axios error details:');
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('  Response data:', error.response.data);
        console.error('  Response status:', error.response.status);
        console.error('  Response headers:', error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('  Request data:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('  Error message:', error.message);
      }
      console.error('  Error config:', error.config);
    } else {
      // Handle non-Axios errors
      console.error('Non-Axios error:', error);
    }
    throw error; // Re-throw the error after logging
  }
};

// Cập nhật trạng thái cá Koi
export const updateKoiStatus = async (id: string, status: 'Active' | 'Inactive'): Promise<{ data: null; statusCode: number; message: string }> => {
  try {
    console.log(`Cập nhật trạng thái cá Koi ${id} thành ${status}`);
    const response = await api.put(`/api/v1/koi-profile/status/${id}?status=${status}`);
    console.log('Kết quả cập nhật trạng thái cá Koi:', response.data);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái cá Koi:', error);
    throw error;
  }
};
