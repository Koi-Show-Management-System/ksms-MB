// services/authService.ts
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define interface for login response
interface LoginResponseData {
  id: string;
  email: string;
  role: string;
  token: string;
}

interface ApiResponse {
  data: LoginResponseData;
  statusCode: number;
  message: string;
}

// Login function
export const login = async (email: string, password: string) => {
  try {
    const response = await api.post<ApiResponse>('/api/v1/auth/login', {
      email,
      password
    });
    
    const userData = response.data.data;
    
    // Store user data in AsyncStorage
    await AsyncStorage.setItem('userToken', userData.token);
    await AsyncStorage.setItem('userId', userData.id);
    await AsyncStorage.setItem('userEmail', userData.email);
    await AsyncStorage.setItem('userRole', userData.role);
    
    return userData;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Logout function
export const logout = async () => {
  try {
    // Remove all stored user data
    await AsyncStorage.multiRemove(['userToken', 'userId', 'userEmail', 'userRole']);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

// Check if user is already logged in
export const isAuthenticated = async () => {
  const token = await AsyncStorage.getItem('userToken');
  return !!token;
};