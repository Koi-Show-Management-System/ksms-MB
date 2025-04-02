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
  if (__DEV__) {
    console.log(`Bắt đầu đánh dấu thông báo đã đọc: ${notificationId}`);
  }
  
  try {
    // Kiểm tra ID hợp lệ
    if (!notificationId || notificationId.trim() === '') {
      console.error("ID thông báo không hợp lệ:", notificationId);
      return {
        success: false,
        message: "ID thông báo không hợp lệ"
      };
    }
    
    // Sử dụng endpoint đúng với phương thức PATCH
    const url = `/api/v1/notification/mark-as-read${notificationId}`;
    
    if (__DEV__) {
      console.log(`Gọi API với URL: ${api.defaults.baseURL}${url}`);
      console.log('Phương thức: PATCH');
      console.log('ID thông báo:', notificationId);
    }
    
    // Sử dụng tùy chọn API đầy đủ để debug
    const response = await api.request({
      method: 'PATCH',
      url: url,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      validateStatus: function (status) {
        // Chấp nhận tất cả mã trạng thái để xử lý lỗi theo cách thủ công
        return true;
      }
    });
    
    // Log chi tiết response
    if (__DEV__) {
      console.log('Status response:', response.status);
      console.log('Headers response:', JSON.stringify(response.headers));
      console.log('Data response:', JSON.stringify(response.data));
    }
    
    // Kiểm tra status
    if (response.status >= 200 && response.status < 300) {
      return {
        success: true,
        message: response.data?.message || "Đánh dấu đã đọc thành công"
      };
    } else {
      console.error(`Lỗi API với status: ${response.status}`);
      return {
        success: false,
        message: response.data?.message || `Lỗi API (${response.status})`
      };
    }
  } catch (error: any) {
    // Log chi tiết lỗi
    console.error("Lỗi ngoại lệ khi đánh dấu thông báo đã đọc:", error);
    
    if (error.response) {
      // Lỗi từ phản hồi server
      console.error("Chi tiết lỗi:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: JSON.stringify(error.response.data),
        url: error.config?.url
      });
    } else if (error.request) {
      // Lỗi không nhận được phản hồi
      console.error("Không nhận được phản hồi:", error.request);
    } else {
      // Lỗi khi thiết lập request
      console.error("Lỗi thiết lập request:", error.message);
    }
    
    // Trả về thông báo lỗi phù hợp
    return { 
      success: false, 
      message: error.message || "Không thể đánh dấu thông báo đã đọc"
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
  if (__DEV__) {
    console.log(`Bắt đầu đánh dấu tất cả thông báo đã đọc cho tài khoản: ${accountId}`);
  }
  
  try {
    // Kiểm tra ID tài khoản hợp lệ
    if (!accountId || accountId.trim() === '') {
      console.error("ID tài khoản không hợp lệ:", accountId);
      return {
        success: false,
        message: "ID tài khoản không hợp lệ"
      };
    }
    
    // Sử dụng endpoint đúng với phương thức PATCH
    const url = `/api/v1/notification/mark-as-read-all/${accountId}`;
    
    if (__DEV__) {
      console.log(`Gọi API với URL: ${api.defaults.baseURL}${url}`);
      console.log('Phương thức: PATCH');
      console.log('ID tài khoản:', accountId);
    }
    
    // Sử dụng tùy chọn API đầy đủ để debug
    const response = await api.request({
      method: 'PATCH',
      url: url,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      validateStatus: function (status) {
        // Chấp nhận tất cả mã trạng thái để xử lý lỗi theo cách thủ công
        return true;
      }
    });
    
    // Log chi tiết response
    if (__DEV__) {
      console.log('Status response:', response.status);
      console.log('Headers response:', JSON.stringify(response.headers));
      console.log('Data response:', JSON.stringify(response.data));
    }
    
    // Kiểm tra status
    if (response.status >= 200 && response.status < 300) {
      return {
        success: true,
        message: response.data?.message || "Đánh dấu tất cả đã đọc thành công"
      };
    } else {
      console.error(`Lỗi API với status: ${response.status}`);
      return {
        success: false,
        message: response.data?.message || `Lỗi API (${response.status})`
      };
    }
  } catch (error: any) {
    // Log chi tiết lỗi
    console.error("Lỗi ngoại lệ khi đánh dấu tất cả thông báo đã đọc:", error);
    
    if (error.response) {
      // Lỗi từ phản hồi server
      console.error("Chi tiết lỗi:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: JSON.stringify(error.response.data),
        url: error.config?.url
      });
    } else if (error.request) {
      // Lỗi không nhận được phản hồi
      console.error("Không nhận được phản hồi:", error.request);
    } else {
      // Lỗi khi thiết lập request
      console.error("Lỗi thiết lập request:", error.message);
    }
    
    // Trả về thông báo lỗi phù hợp
    return { 
      success: false, 
      message: error.message || "Không thể đánh dấu tất cả thông báo đã đọc"
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
  if (__DEV__) {
    console.log(`Bắt đầu xóa thông báo: ${notificationId}`);
  }
  
  try {
    // Kiểm tra ID thông báo hợp lệ
    if (!notificationId || notificationId.trim() === '') {
      console.error("ID thông báo không hợp lệ:", notificationId);
      return {
        success: false,
        message: "ID thông báo không hợp lệ"
      };
    }
    
    // Đúng định dạng API
    const url = `/api/v1/notification/${notificationId}`;
    
    if (__DEV__) {
      console.log(`Gọi API với URL: ${api.defaults.baseURL}${url}`);
      console.log('Phương thức: DELETE');
      console.log('ID thông báo:', notificationId);
    }
    
    // Sử dụng tùy chọn API đầy đủ để debug
    const response = await api.request({
      method: 'DELETE',
      url: url,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      validateStatus: function (status) {
        // Chấp nhận tất cả mã trạng thái để xử lý lỗi theo cách thủ công
        return true;
      }
    });
    
    // Log chi tiết response
    if (__DEV__) {
      console.log('Status response:', response.status);
      console.log('Headers response:', JSON.stringify(response.headers));
      console.log('Data response:', JSON.stringify(response.data));
    }
    
    // Kiểm tra status
    if (response.status >= 200 && response.status < 300) {
      return {
        success: true,
        message: response.data?.message || "Xóa thông báo thành công"
      };
    } else {
      console.error(`Lỗi API với status: ${response.status}`);
      return {
        success: false,
        message: response.data?.message || `Lỗi API (${response.status})`
      };
    }
  } catch (error: any) {
    // Log chi tiết lỗi
    console.error("Lỗi ngoại lệ khi xóa thông báo:", error);
    
    if (error.response) {
      // Lỗi từ phản hồi server
      console.error("Chi tiết lỗi:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: JSON.stringify(error.response.data),
        url: error.config?.url
      });
    } else if (error.request) {
      // Lỗi không nhận được phản hồi
      console.error("Không nhận được phản hồi:", error.request);
    } else {
      // Lỗi khi thiết lập request
      console.error("Lỗi thiết lập request:", error.message);
    }
    
    // Trả về thông báo lỗi phù hợp
    return { 
      success: false, 
      message: error.message || "Không thể xóa thông báo"
    };
  }
}; 