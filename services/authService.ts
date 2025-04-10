import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./api";

// Define interface for login response
interface LoginResponseData {
  id: string;
  email: string;
  role: string;
  token: string;
  fullName: string;
}

interface ApiResponse {
  data: LoginResponseData;
  statusCode: number;
  message: string;
}

// Login function
export const login = async (email: string, password: string) => {
  try {
    const response = await api.post<ApiResponse>("/api/v1/auth/login", {
      email,
      password,
    });

    if (response.data.statusCode === 201) {
      const userData = response.data.data;

      // Store user data in AsyncStorage
      await AsyncStorage.setItem("userToken", userData.token);
      await AsyncStorage.setItem("userId", userData.id);
      await AsyncStorage.setItem("userEmail", userData.email);
      await AsyncStorage.setItem("userRole", userData.role);
      await AsyncStorage.setItem("userFullName", userData.fullName);

      return userData;
    } else {
      throw new Error(response.data.message || "Login failed");
    }
  } catch (error: any) {
    console.error("Login error:", error); // Giữ lại log để debug nếu cần
    // Kiểm tra xem interceptor có xử lý lỗi cụ thể không (dựa trên trường 'Error')
    if (error.response?.data?.Error) {
        // Interceptor đã hiển thị Toast, chỉ cần ném lại lỗi gốc
        throw error;
    } else {
        // Interceptor không hiển thị lỗi cụ thể, throw lỗi với message fallback
        throw new Error(error.response?.data?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
    }
  }
};

// Logout function
export const logout = async () => {
  try {
    // Remove all stored user data
    await AsyncStorage.multiRemove([
      "userToken",
      "userId",
      "userEmail",
      "userRole",
      "userFullName",
    ]);
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};

// Check if user is already logged in
export const isAuthenticated = async () => {
  const token = await AsyncStorage.getItem("userToken");
  return !!token;
};

// Register function
export const register = async (
  email: string,
  password: string,
  username: string,
  fullName: string
) => {
  try {
    const response = await api.post("/api/v1/auth/register", {
      email,
      password,
      username,
      fullName,
    });

    if (response.data.statusCode === 201) {
      return response.data;
    } else {
      throw new Error(response.data.message || "Registration failed");
    }
  } catch (error: any) {
    console.error("Registration error:", error); // Giữ lại log để debug nếu cần
    // Kiểm tra xem interceptor có xử lý lỗi cụ thể không (dựa trên trường 'Error')
    if (error.response?.data?.Error) {
        // Interceptor đã hiển thị Toast, chỉ cần ném lại lỗi gốc
        throw error;
    } else {
        // Interceptor không hiển thị lỗi cụ thể, throw lỗi với message fallback
        throw new Error(error.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.");
    }
  }
};
