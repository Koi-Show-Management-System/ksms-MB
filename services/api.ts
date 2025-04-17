// services/api.ts
import { navigateToAuth } from "@/utils/navigationService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import Toast from "react-native-toast-message";

const api = axios.create({
  baseURL: "https://api.ksms.news",
  timeout: 100000, // Timeout này có thể cần tăng lên nếu upload file lớn, 30s như service update là hợp lý
  headers: {
    Accept: "application/json", // Giữ lại Accept nếu API của bạn luôn trả về JSON
  },
  withCredentials: false,
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      console.log(
        `[Interceptor] Token from AsyncStorage for ${config.url}:`,
        token ? token.substring(0, 10) + "..." : "null"
      );
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(
          `[Interceptor] Authorization header SET for ${config.url}.`
        );
      } else {
        console.log(
          `[Interceptor] Authorization header NOT SET for ${config.url} (no token).`
        );
      }
      // Axios sẽ tự đặt Content-Type phù hợp (multipart khi là FormData, json khi là object)
      if (__DEV__) {
        const method = config.method?.toUpperCase() || "UNKNOWN";
        const fullUrl = `${config.baseURL || ""}${config.url || ""}`;
        console.log(`🚀 API REQUEST: [${method}] ${fullUrl}`);
        // Log headers NGAY TRƯỚC KHI GỬI (sau khi interceptor xử lý)
        console.log(
          `   Headers being sent for ${config.url}:`,
          JSON.stringify(config.headers)
        ); // Kiểm tra Content-Type ở đây
        if (config.data && !(config.data instanceof FormData)) {
          // Chỉ log data nếu không phải FormData
          console.log(
            "   Request data:",
            JSON.stringify(config.data).substring(0, 500) +
              (JSON.stringify(config.data).length > 500 ? "..." : "")
          );
        } else if (config.data instanceof FormData) {
          console.log("   Request data: Instance of FormData (contains files)");
        }
        if (config.params) {
          console.log("   Request params:", config.params);
        }
      }

      return config;
    } catch (error) {
      if (__DEV__) {
        console.error(
          `[Interceptor] Error in request interceptor for ${config.url}:`,
          error
        );
      }
      return Promise.reject(error);
    }
  },
  (error) => {
    if (__DEV__) {
      console.error("[Interceptor] Request setup error:", error);
    }
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      const method = response.config.method?.toUpperCase() || "UNKNOWN";
      const url = response.config.url || "UNKNOWN";
      console.log(
        `✅ API RESPONSE: [${method}] ${url} - Status: ${response.status}`
      );
      const responseDataLog =
        JSON.stringify(response.data)?.substring(0, 500) +
        (JSON.stringify(response.data)?.length > 500 ? "..." : "");
      console.log("Response data:", responseDataLog);
    }

    const responseData = response.data as {
      message?: string;
      [key: string]: any;
    };
    const successMessage = responseData?.message;

    if (
      successMessage &&
      typeof successMessage === "string" &&
      successMessage.trim().length > 0
    ) {
      const method = response.config.method?.toUpperCase();
      const methodsToShowSuccess = ["POST", "PUT", "PATCH", "DELETE"];

      if (method && methodsToShowSuccess.includes(method)) {
        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: successMessage,
          visibilityTime: 3000,
          autoHide: true,
        });
      }
    }

    return response;
  },
  async (error: AxiosError) => {
    if (__DEV__) {
      const method = error.config?.method?.toUpperCase() || "UNKNOWN";
      const url = error.config?.url || "UNKNOWN";
      console.error(`❌ API ERROR: [${method}] ${url}`);

      if (error.response) {
        console.error("Response error:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data:
            JSON.stringify(error.response.data)?.substring(0, 500) +
            (JSON.stringify(error.response.data)?.length > 500 ? "..." : ""),
          headers: error.response.headers,
        });
      } else if (error.request) {
        console.error("No response received:", {
          requestInfo: `Method: ${error.request._method}, URL: ${error.request._url}`,
        });
      } else {
        console.error("Request setup error:", error.message);
      }
    }

    if (error.response) {
      const responseData = error.response.data as {
        Error?: string;
        message?: string;
        [key: string]: any;
      };
      const errorMessage = responseData?.Error || responseData?.message; // Ưu tiên Error, sau đó đến message
      const statusCode = error.response.status;

      if (statusCode === 401) {
        await AsyncStorage.removeItem("userToken");
        Toast.show({
          type: "error",
          text1: "Phiên đăng nhập hết hạn",
          text2: "Vui lòng đăng nhập lại.",
          visibilityTime: 4000,
          autoHide: true,
          onHide: () => navigateToAuth(),
        });
      } else if (errorMessage && typeof errorMessage === "string") {
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: errorMessage,
          visibilityTime: 4000,
          autoHide: true,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Lỗi máy chủ",
          text2: "Có lỗi xảy ra. Vui lòng thử lại.",
          visibilityTime: 4000,
          autoHide: true,
        });
      }
    } else if (error.request) {
      Toast.show({
        type: "error",
        text1: "Lỗi kết nối",
        text2: "Kiểm tra kết nối mạng.",
        visibilityTime: 4000,
        autoHide: true,
      });
    } else {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Có lỗi xảy ra khi gửi yêu cầu.",
        visibilityTime: 4000,
        autoHide: true,
      });
    }

    return Promise.reject(error);
  }
);

export default api;
