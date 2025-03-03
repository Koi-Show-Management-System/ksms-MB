// services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'https://api.ksms.news',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'text/plain'
  },
  timeout: 10000 // 10 seconds timeout
});

// Request interceptor for adding authorization token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle specific error status codes
    if (error.response?.status === 401) {
      // Handle unauthorized error (token expired)
      // Could redirect to login or refresh token
    }
    return Promise.reject(error);
  }
);

export default api;