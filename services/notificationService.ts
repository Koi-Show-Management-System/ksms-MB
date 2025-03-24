import api from "./api";

// Định nghĩa các enum cho các loại thông báo
export enum NotificationType {
  Registration = "Registration",
  System = "System",
  Show = "Show",
  Payment = "Payment",
}

// Interface cho response data từ API
export interface NotificationResponse {
  data: {
    size: number;
    page: number;
    total: number;
    totalPages: number;
    items: NotificationItem[];
  };
  statusCode: number;
  message: string;
}

// Interface cho mỗi item thông báo
export interface NotificationItem {
  id: string;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  sentDate: string;
}

// Interface cho các tham số query
export interface NotificationParams {
  isRead?: boolean;
  notificationType?: NotificationType;
  page?: number;
  size?: number;
}

/**
 * Lấy danh sách thông báo cho một tài khoản cụ thể
 * 
 * @param accountId - ID của tài khoản cần lấy thông báo
 * @param params - Các tham số query (isRead, notificationType, page, size)
 * @returns Promise với response data đã được định dạng
 */
export const getNotifications = async (
  accountId: string,
  params?: NotificationParams
): Promise<NotificationResponse> => {
  try {
    // Xây dựng URL với các tham số query - đúng format API
    let url = `/api/v1/notification/get-page/${accountId}`;
    
    // Thêm các tham số query nếu có
    const queryParams = new URLSearchParams();
    
    if (params) {
      if (params.isRead !== undefined) {
        queryParams.append("isRead", params.isRead.toString());
      }
      
      if (params.notificationType) {
        queryParams.append("notificationType", params.notificationType);
      }
      
      if (params.page) {
        queryParams.append("page", params.page.toString());
      }
      
      if (params.size) {
        queryParams.append("size", params.size.toString());
      }
    }
    
    // Thêm các tham số query vào URL nếu có
    const queryString = queryParams.toString();
    if (queryString) {
      url = `${url}?${queryString}`;
    }
    
    console.log(`Gọi API: ${url}`); // Log URL đầy đủ để kiểm tra
    const response = await api.get<NotificationResponse>(url);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy thông báo:", error);
    throw error;
  }
};

/**
 * Đánh dấu một thông báo đã đọc
 * 
 * @param notificationId - ID của thông báo cần đánh dấu
 * @returns Promise với thông tin xác nhận
 */
export const markNotificationAsRead = async (
  notificationId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // Sửa lỗi: thêm dấu / giữa endpoint và ID
    const url = `/api/v1/notification/mark-as-read/${notificationId}`;
    console.log(`Gọi API đánh dấu đã đọc: ${url}`);
    
    const response = await api.patch(url);
    
    // Log chi tiết response trong môi trường phát triển
    if (__DEV__) {
      console.log('Phản hồi đánh dấu đã đọc:', response.data);
    }
    
    return { 
      success: response.data?.statusCode === 200, 
      message: response.data?.message || "Đánh dấu đã đọc thành công" 
    };
  } catch (error: any) {
    // Log chi tiết lỗi
    console.error("Lỗi khi đánh dấu thông báo đã đọc:", error);
    if (__DEV__ && error.response) {
      console.error("Chi tiết lỗi:", {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url
      });
    }
    
    return { 
      success: false, 
      message: error.response?.data?.message || "Không thể đánh dấu thông báo đã đọc" 
    };
  }
};

/**
 * Đánh dấu tất cả thông báo của một tài khoản là đã đọc
 * 
 * @param accountId - ID của tài khoản
 * @returns Promise với thông tin xác nhận
 */
export const markAllNotificationsAsRead = async (
  accountId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // Đúng format API
    const url = `/api/v1/notification/mark-as-read-all/${accountId}`;
    console.log(`Gọi API đánh dấu tất cả đã đọc: ${url}`);
    
    const response = await api.patch(url);
    
    // Log chi tiết response trong môi trường phát triển
    if (__DEV__) {
      console.log('Phản hồi đánh dấu tất cả đã đọc:', response.data);
    }
    
    return { 
      success: response.data?.statusCode === 200, 
      message: response.data?.message || "Đánh dấu tất cả đã đọc thành công" 
    };
  } catch (error: any) {
    // Log chi tiết lỗi
    console.error("Lỗi khi đánh dấu tất cả thông báo đã đọc:", error);
    if (__DEV__ && error.response) {
      console.error("Chi tiết lỗi:", {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url
      });
    }
    
    return { 
      success: false, 
      message: error.response?.data?.message || "Không thể đánh dấu tất cả thông báo đã đọc" 
    };
  }
};

/**
 * Xóa một thông báo
 * 
 * @param notificationId - ID của thông báo cần xóa
 * @returns Promise với thông tin xác nhận
 */
export const deleteNotification = async (
  notificationId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const url = `/api/v1/notification/${notificationId}`;
    console.log(`Gọi API xóa thông báo: ${url}`);
    
    const response = await api.delete(url);
    return { 
      success: response.status === 200, 
      message: "Xóa thông báo thành công" 
    };
  } catch (error) {
    console.error("Lỗi khi xóa thông báo:", error);
    return { 
      success: false, 
      message: "Không thể xóa thông báo" 
    };
  }
}; 