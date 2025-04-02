// services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

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
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Thêm debug log trong môi trường phát triển
      if (__DEV__) {
        const method = config.method?.toUpperCase() || 'UNKNOWN';
        const url = `${config.baseURL}${config.url}`;
        console.log(`🚀 API REQUEST: [${method}] ${url}`);
        
        if (config.data) {
          console.log('Request data:', JSON.stringify(config.data).substring(0, 500) + (JSON.stringify(config.data).length > 500 ? '...' : ''));
        }
        
        if (config.params) {
          console.log('Request params:', config.params);
        }
      }
      
      return config;
    } catch (error) {
      if (__DEV__) {
        console.error('Lỗi trong interceptor request:', error);
      }
      return Promise.reject(error);
    }
  },
  (error) => {
    if (__DEV__) {
      console.error('Lỗi trong interceptor request:', error);
    }
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // Thêm debug log trong môi trường phát triển
    if (__DEV__) {
      const method = response.config.method?.toUpperCase() || 'UNKNOWN';
      const url = response.config.url || 'UNKNOWN';
      console.log(`✅ API RESPONSE: [${method}] ${url} - Status: ${response.status}`);
      
      // Giới hạn kích thước dữ liệu log
      const responseData = JSON.stringify(response.data).substring(0, 500) + 
                          (JSON.stringify(response.data).length > 500 ? '...' : '');
      console.log('Response data:', responseData);
    }
    
    return response;
  },
  async (error) => {
    // Log chi tiết về lỗi trong môi trường phát triển
    if (__DEV__) {
      const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
      const url = error.config?.url || 'UNKNOWN';
      console.error(`❌ API ERROR: [${method}] ${url}`);
      
      if (error.response) {
        // Phản hồi từ server với status code nằm ngoài phạm vi 2xx
        console.error('Response error:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        // Request đã được tạo nhưng không nhận được phản hồi
        console.error('No response received:', {
          request: error.request._response || error.request
        });
      } else {
        // Có lỗi khi thiết lập request
        console.error('Request error:', error.message);
      }
    }
    
    if (error.response?.status === 401) {
      // Handle unauthorized error (e.g., clear token and redirect to login)
      await AsyncStorage.removeItem('userToken');
      // You might want to add navigation logic here
    }
    
    return Promise.reject(error);
  }
);

export default api;