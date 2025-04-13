// services/api.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'; // Import thêm AxiosError và InternalAxiosRequestConfig
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { navigateToAuth } from '@/utils/navigationService'; // Đường dẫn có thể cần điều chỉnh

const api = axios.create({
  baseURL: 'https://api.ksms.news',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  },
  withCredentials: false
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => { // Thêm type cho config
    try {
      const token = await AsyncStorage.getItem('userToken');
      // Log token (partially) kèm URL để rõ ràng hơn
      console.log(`[Interceptor] Token from AsyncStorage for ${config.url}:`, token ? token.substring(0, 10) + '...' : 'null');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(`[Interceptor] Authorization header SET for ${config.url}.`);
      } else {
        console.log(`[Interceptor] Authorization header NOT SET for ${config.url} (no token).`);
      }
      // Thêm debug log trong môi trường phát triển
      if (__DEV__) {
        const method = config.method?.toUpperCase() || 'UNKNOWN';
        const fullUrl = `${config.baseURL || ''}${config.url || ''}`; // Đảm bảo baseURL và url được định nghĩa
        console.log(`🚀 API REQUEST: [${method}] ${fullUrl}`);
        // Log TOÀN BỘ headers ngay trước khi return config
        console.log(`   Headers being sent for ${config.url}:`, JSON.stringify(config.headers));
        
        if (config.data) {
          console.log('   Request data:', JSON.stringify(config.data).substring(0, 500) + (JSON.stringify(config.data).length > 500 ? '...' : ''));
        }
        
        if (config.params) {
          console.log('   Request params:', config.params);
        }
      }
      
      return config;
    } catch (error) {
      if (__DEV__) {
        console.error(`[Interceptor] Error in request interceptor for ${config.url}:`, error);
      }
      // Đảm bảo promise bị reject đúng cách
      return Promise.reject(error);
      return Promise.reject(error);
    }
  },
  (error) => {
    // Lỗi này xảy ra trước khi request được gửi (ví dụ: lỗi setup config)
    if (__DEV__) {
      console.error('[Interceptor] Request setup error:', error);
    }
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // Thêm debug log trong môi trường phát triển (giữ nguyên)
    if (__DEV__) {
      const method = response.config.method?.toUpperCase() || 'UNKNOWN';
      const url = response.config.url || 'UNKNOWN';
      console.log(`✅ API RESPONSE: [${method}] ${url} - Status: ${response.status}`);
      const responseDataLog = JSON.stringify(response.data)?.substring(0, 500) + (JSON.stringify(response.data)?.length > 500 ? '...' : '');
      console.log('Response data:', responseDataLog);
    }

    // --- Hiển thị Toast cho thông báo thành công ---
    const responseData = response.data as { message?: string; [key: string]: any }; // Type assertion
    const successMessage = responseData?.message;

    // Chỉ hiển thị toast nếu có message và là string không rỗng
    if (successMessage && typeof successMessage === 'string' && successMessage.trim().length > 0) {
      // Xác định các phương thức không nên hiển thị toast thành công (ví dụ: GET)
      const method = response.config.method?.toUpperCase();
      const methodsToShowSuccess = ['POST', 'PUT', 'PATCH', 'DELETE']; // Chỉ hiển thị cho các phương thức thay đổi dữ liệu

      if (method && methodsToShowSuccess.includes(method)) {
          Toast.show({
            type: 'success', // Loại toast thành công
            text1: 'Thành công',
            text2: successMessage,
            visibilityTime: 3000, // Thời gian hiển thị ngắn hơn cho thành công
            autoHide: true,
          });
      }
    }
    // --- Kết thúc phần hiển thị Toast thành công ---

    return response; // Luôn trả về response gốc
  },
  async (error: AxiosError) => { // Thêm type AxiosError
    // Log chi tiết về lỗi trong môi trường phát triển (giữ nguyên)
    if (__DEV__) {
      const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
      const url = error.config?.url || 'UNKNOWN';
      console.error(`❌ API ERROR: [${method}] ${url}`);

      if (error.response) {
        console.error('Response error:', {
          status: error.response.status,
          statusText: error.response.statusText,
          // Log data cẩn thận hơn, có thể là object lớn
          data: JSON.stringify(error.response.data)?.substring(0, 500) + (JSON.stringify(error.response.data)?.length > 500 ? '...' : ''),
          headers: error.response.headers
        });
      } else if (error.request) {
        console.error('No response received:', {
          // request object có thể rất lớn, log cẩn thận
          requestInfo: `Method: ${error.request._method}, URL: ${error.request._url}`
        });
      } else {
        console.error('Request setup error:', error.message);
      }
    }

    // --- Phần hiển thị Toast và điều hướng ---
    if (error.response) {
      const responseData = error.response.data as { Error?: string; [key: string]: any }; // Type assertion an toàn hơn
      const errorMessage = responseData?.Error;
      const statusCode = error.response.status;

      if (statusCode === 401) {
        // Xử lý lỗi 401 (Unauthorized)
        await AsyncStorage.removeItem('userToken');
        Toast.show({
          type: 'error',
          text1: 'Phiên đăng nhập hết hạn',
          text2: 'Vui lòng đăng nhập lại.',
          visibilityTime: 4000,
          autoHide: true,
          // Gọi điều hướng SAU KHI toast ẩn đi để tránh giật màn hình
          onHide: () => navigateToAuth(),
        });
      } else if (errorMessage && typeof errorMessage === 'string') {
        // Các lỗi server khác có message cụ thể
        Toast.show({
          type: 'error',
          text1: 'Thông báo', // Bỏ statusCode khỏi tiêu đề
          text2: errorMessage,
          visibilityTime: 4000,
          autoHide: true,
        });
      } else {
        // Lỗi server chung (không có message hoặc không phải string)
        Toast.show({
          type: 'error',
          text1: 'Lỗi máy chủ', // Bỏ statusCode khỏi tiêu đề
          text2: 'Đã có lỗi xảy ra phía máy chủ. Vui lòng thử lại sau.',
          visibilityTime: 4000,
          autoHide: true,
        });
      }
    } else if (error.request) {
      // Lỗi mạng hoặc không nhận được phản hồi
      Toast.show({
        type: 'error',
        text1: 'Lỗi kết nối',
        text2: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.',
        visibilityTime: 4000,
        autoHide: true,
      });
    } else {
      // Lỗi khi thiết lập request
      Toast.show({
        type: 'error',
        text1: 'Lỗi không xác định',
        text2: 'Đã có lỗi xảy ra trong quá trình gửi yêu cầu.',
        visibilityTime: 4000,
        autoHide: true,
      });
    }
    // --- Kết thúc phần hiển thị Toast và điều hướng ---

    return Promise.reject(error); // Giữ nguyên để xử lý lỗi tiếp theo nếu cần
  }
);

export default api;