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
    console.log(`Đang cập nhật hồ sơ Koi ${id}`);
    
    // Kiểm tra dữ liệu trước khi gửi
    if (!id) {
      throw new Error('ID Koi không hợp lệ');
    }
    
    // Kiểm tra xem formData có dữ liệu không
    let hasData = false;
    formData.forEach(() => { hasData = true; });
    
    if (!hasData) {
      throw new Error('Không có dữ liệu để cập nhật');
    }
    
    // Gửi yêu cầu cập nhật
    const response = await api.put(`/api/v1/koi-profile/${id}`, formData, {
      headers: {
        // Content-Type tự động được thiết lập bởi Axios khi sử dụng FormData
      },
      timeout: 30000, // Tăng timeout lên 30 giây để xử lý upload file
    });
    
    console.log('Kết quả cập nhật hồ sơ Koi:', response.data);
    return response.data;
  } catch (error: unknown) {
    // Xử lý và ghi log lỗi chi tiết
    console.error('Lỗi khi cập nhật hồ sơ Koi:');
    
    if (axios.isAxiosError(error)) {
      // Xử lý lỗi Axios
      if (error.response) {
        // Máy chủ trả về lỗi với mã trạng thái
        console.error('  Dữ liệu phản hồi:', error.response.data);
        console.error('  Mã trạng thái:', error.response.status);
        console.error('  Headers phản hồi:', error.response.headers);
        
        // Tạo đối tượng phản hồi tùy chỉnh cho lỗi từ máy chủ
        const customResponse: KoiProfileResponse = {
          data: {} as KoiProfile, // Dữ liệu trống
          statusCode: error.response.status,
          message: error.response.data?.message || 'Lỗi từ máy chủ'
        };
        
        // Nếu máy chủ trả về dữ liệu có cấu trúc, sử dụng nó
        if (error.response.data && typeof error.response.data === 'object') {
          if (error.response.data.statusCode) {
            customResponse.statusCode = error.response.data.statusCode;
          }
          if (error.response.data.message) {
            customResponse.message = error.response.data.message;
          }
        }
        
        throw customResponse; // Ném lỗi có cấu trúc
      } else if (error.request) {
        // Yêu cầu đã được gửi nhưng không nhận được phản hồi
        console.error('  Dữ liệu yêu cầu:', error.request);
        throw {
          data: {} as KoiProfile,
          statusCode: 0,
          message: 'Không nhận được phản hồi từ máy chủ. Vui lòng kiểm tra kết nối mạng.'
        };
      } else {
        // Lỗi khi thiết lập yêu cầu
        console.error('  Thông báo lỗi:', error.message);
        throw {
          data: {} as KoiProfile,
          statusCode: 0,
          message: `Lỗi khi gửi yêu cầu: ${error.message}`
        };
      }
      
      // Log cấu hình yêu cầu để debug
      if (error.config) {
        console.error('  Cấu hình yêu cầu:', {
          url: error.config.url,
          method: error.config.method,
          headers: error.config.headers,
          timeout: error.config.timeout
        });
      }
    } else if (error instanceof Error) {
      // Xử lý lỗi JavaScript thông thường
      console.error('  Lỗi JavaScript:', error.message);
      throw {
        data: {} as KoiProfile,
        statusCode: 0,
        message: error.message
      };
    } else {
      // Xử lý các loại lỗi khác
      console.error('  Lỗi không xác định:', error);
      throw {
        data: {} as KoiProfile,
        statusCode: 0,
        message: 'Đã xảy ra lỗi không xác định'
      };
    }
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
