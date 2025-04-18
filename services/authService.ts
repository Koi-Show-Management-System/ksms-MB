import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./api";
import { signalRService } from "./signalRService";

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

    // Add more robust checks for API response structure
    if (response?.data?.statusCode === 201 && response.data.data) {
      const userData = response.data.data;

      // Ensure essential data exists before storing
      if (userData.token && userData.id && userData.email && userData.role) {
        // Store user data in AsyncStorage
        await AsyncStorage.setItem("userToken", userData.token);
        await AsyncStorage.setItem("userId", userData.id);
        await AsyncStorage.setItem("userEmail", userData.email);
        await AsyncStorage.setItem("userRole", userData.role);
        // Handle potential null fullName safely
        await AsyncStorage.setItem("userFullName", userData.fullName ?? "");

        // Thiết lập kết nối SignalR sau khi đăng nhập thành công
        try {
          await signalRService.setupConnection();
        } catch (signalRError) {
          console.error("Error setting up SignalR connection:", signalRError);
          // Không throw lỗi ở đây để tránh ảnh hưởng đến luồng đăng nhập
        }

        return userData;
      } else {
        console.error(
          "Login error: Missing essential user data in response",
          userData
        );
        throw new Error("Dữ liệu đăng nhập không đầy đủ. Vui lòng thử lại.");
      }
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
      throw new Error(
        error.response?.data?.message ||
          "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin."
      );
    }
  }
};

// Logout function
export const logout = async () => {
  try {
    // Dừng kết nối SignalR trước khi xóa token
    await signalRService.stopConnection();

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

    // Add checks for registration response
    if (response?.data?.statusCode === 201) {
      // Optionally, you could verify the structure of response.data here if needed
      return response.data;
    } else {
      // Use optional chaining for safer access to message
      throw new Error(response?.data?.message || "Đăng ký thất bại.");
    }
  } catch (error: any) {
    console.error("Registration error:", error); // Giữ lại log để debug nếu cần
    // Kiểm tra xem interceptor có xử lý lỗi cụ thể không (dựa trên trường 'Error')
    if (error.response?.data?.Error) {
      // Interceptor đã hiển thị Toast, chỉ cần ném lại lỗi gốc
      throw error;
    } else {
      // Interceptor không hiển thị lỗi cụ thể, throw lỗi với message fallback
      throw new Error(
        error.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại."
      );
    }
  }
};

// Forgot password function
export async function forgotPassword(email: string): Promise<void> {
  try {
    const response = await api.post(
      `/api/v1/auth/forgot-password?email=${encodeURIComponent(email)}`,
      null, // Không truyền body
      {
        headers: {
          Accept: "application/json",
        },
      }
    );
    if (response?.data?.statusCode === 200) return;
    throw new Error(response?.data?.message || "Không gửi được mã OTP");
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Không gửi được mã OTP");
  }
}

// Reset password function
export async function resetPassword(
  email: string,
  otp: string,
  newPassword: string
): Promise<void> {
  try {
    const response = await api.put(
      "/api/v1/auth/reset-password",
      { email, otp, newPassword },
      {
        headers: { Accept: "application/json" },
      }
    );
    if (response?.data?.statusCode === 200) return;
    throw new Error(response?.data?.message || "Đặt lại mật khẩu thất bại");
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Đặt lại mật khẩu thất bại"
    );
  }
}
