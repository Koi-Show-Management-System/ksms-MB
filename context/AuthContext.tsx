import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as apiLogin, logout as apiLogout } from '../services/authService';
import { signalRService } from '../services/signalRService';
import { router } from 'expo-router';

// Define user roles
export enum UserRole {
  GUEST = 'guest',
  USER = 'user',
  ADMIN = 'admin',
}

// Define user data interface
interface UserData {
  id: string;
  email: string;
  role: string;
  fullName: string;
  token?: string;
}

// Define context interface
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userData: UserData | null;
  userRole: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<any>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  isGuest: () => boolean;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  userData: null,
  userRole: null,
  login: async () => {},
  loginAsGuest: async () => {},
  logout: async () => {},
  isGuest: () => false,
});

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const role = await AsyncStorage.getItem('userRole');

        if (token) {
          // Regular authenticated user
          const userId = await AsyncStorage.getItem('userId') || '';
          const userEmail = await AsyncStorage.getItem('userEmail') || '';
          const userFullName = await AsyncStorage.getItem('userFullName') || '';

          setUserData({
            id: userId,
            email: userEmail,
            role: role || '',
            fullName: userFullName,
            token: token,
          });

          setUserRole(role);
          setIsAuthenticated(true);
        } else if (role === UserRole.GUEST) {
          // Guest user
          setUserData({
            id: 'guest',
            email: 'guest@example.com',
            role: UserRole.GUEST,
            fullName: 'Khách',
          });

          setUserRole(UserRole.GUEST);
          setIsAuthenticated(false); // Guest is not technically authenticated
        } else {
          // Not authenticated
          setUserData(null);
          setUserRole(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsAuthenticated(false);
        setUserData(null);
        setUserRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      setIsLoading(true);
      const user = await apiLogin(email, password, rememberMe);

      setUserData({
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        token: user.token,
      });

      setUserRole(user.role);
      setIsAuthenticated(true);

      return user;
    } catch (error) {
      console.error('Login error in context:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Login as guest function
  const loginAsGuest = async () => {
    try {
      setIsLoading(true);

      // Clear any existing auth data
      await AsyncStorage.multiRemove([
        'userToken',
        'userId',
        'userEmail',
      ]);

      // Set guest role
      await AsyncStorage.setItem('userRole', UserRole.GUEST);
      await AsyncStorage.setItem('userFullName', 'Khách');

      // Update state
      setUserData({
        id: 'guest',
        email: 'guest@example.com',
        role: UserRole.GUEST,
        fullName: 'Khách',
      });

      setUserRole(UserRole.GUEST);
      setIsAuthenticated(false); // Guest is not technically authenticated

      // Điều hướng sẽ được xử lý từ component, không xử lý ở đây
    } catch (error) {
      console.error('Guest login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);

      // If user is not a guest, call the API logout
      if (userRole !== UserRole.GUEST) {
        await apiLogout();
      } else {
        // For guest users, just stop SignalR if it's running
        await signalRService.stopConnection();
      }

      // Clear all auth data
      await AsyncStorage.multiRemove([
        'userToken',
        'userId',
        'userEmail',
        'userRole',
        'userFullName',
      ]);

      // Reset state
      setUserData(null);
      setUserRole(null);
      setIsAuthenticated(false);

      // Đảm bảo sử dụng replace để ngăn người dùng quay lại màn hình chính sau khi đăng xuất
      router.replace('/(auth)/welcomeScreen');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user is a guest
  const isGuest = () => userRole === UserRole.GUEST;

  // Context value
  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    userData,
    userRole,
    login,
    loginAsGuest,
    logout,
    isGuest,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
