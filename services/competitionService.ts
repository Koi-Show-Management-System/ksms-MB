import api from './api';

// Interface cho API response
export interface ApiResponse<T> {
  data: T;
  statusCode: number;
  message: string;
}

// Interface cho thông tin show
export interface KoiShow {
  id: string;
  name: string;
  status: "Pending" | "Published" | "Upcoming" | "InProgress" | "Finished";
}

// Interface cho thông tin profile cá
export interface KoiProfile {
  id: string;
  name: string;
  gender: string;
  bloodline: string;
  variety: {
    id: string;
    name: string;
    description: string;
  };
}

// Interface cho thông tin thanh toán
export interface RegistrationPayment {
  id: string;
  paidAmount: number;
  paymentDate: string;
  qrcodeData: string | null;
  paymentMethod: string;
  transactionCode: string;
  status: "pending" | "paid" | "cancelled";
}

// Interface cho mỗi item đăng ký
export interface RegistrationItem {
  id: string;
  koiShow: KoiShow;
  koiProfile: KoiProfile;
  koiSize: number;
  koiAge: number;
  competitionCategory: {
    id: string;
    name: string;
  };
  rank: string | null;
  status: "WaitToPaid" | "Cancelled" | "Pending" | "Confirmed" | "CheckIn" | "Rejected" | "Refunded";
  checkInExpiredDate: string | null;
  isCheckedIn: boolean;
  checkInTime: string | null;
  checkInLocation: string | null;
  checkedInBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  registrationPayment: RegistrationPayment | null;
}

// Interface cho phân trang
export interface PaginatedResponse<T> {
  size: number;
  page: number;
  total: number;
  totalPages: number;
  items: T[];
}

// Interface cho item phản hồi từ API mới
export interface HistoryRegisterShowItem {
  id: string;
  showName: string;
  imageUrl: string;
  location: string;
  startDate: string;
  endDate: string;
  status: "upcoming" | "ongoing" | "completed" | "pending" | "published" | "inprogress" | "finished";
}

// Interface cho phản hồi phân trang từ API mới
export interface HistoryRegisterShowResponse {
  size: number;
  page: number;
  total: number;
  totalPages: number;
  items: HistoryRegisterShowItem[];
}

// Interface cho media của registration
export interface RegistrationMedia {
  id: string;
  mediaUrl: string;
  mediaType: string;
}

// Interface cho payment của registration
export interface ShowDetailPayment {
  id: string;
  paidAmount: number;
  paymentDate: string;
  qrcodeData: string | null;
  paymentMethod: string;
  transactionCode: string;
  status: string;
}

// Interface cho registration item trong show detail
export interface ShowDetailRegistration {
  registrationId: string;
  registrationNumber: string | null;
  status: string;
  refundType: string | null;
  rejectedReason: string | null;
  koiProfileId: string;
  koiName: string;
  variety: string;
  size: number;
  age: number;
  gender: string;
  bloodLine: string;
  categoryId: string;
  categoryName: string;
  registrationFee: number;
  rank: number | null;
  award: string | null;
  currentRound: string | null;
  eliminatedAtRound: string | null;
  payment: ShowDetailPayment;
  media: RegistrationMedia[];
}

// Interface cho show detail
export interface ShowMemberDetail {
  showId: string;
  showName: string;
  showImageUrl: string;
  location: string;
  duration: string;
  description: string;
  status: string;
  totalRegisteredKoi: number;
  registrations: ShowDetailRegistration[];
}

/**
 * Lấy danh sách đăng ký tham gia cuộc thi theo phân trang sử dụng API mới
 * @param page Số trang (mặc định: 1)
 * @param size Số lượng mục mỗi trang (mặc định: 10)
 * @param showStatus Trạng thái cuộc thi (Pending, Published, Upcoming, InProgress, Finished, Cancelled)
 * @returns Promise với dữ liệu phân trang của đăng ký
 */
export const getRegistrationHistory = async (
  page: number = 1,
  size: number = 10,
  showStatus?: string | null
): Promise<HistoryRegisterShowResponse> => {
  try {
    // Build query parameters
    let query = `?page=${page}&size=${size}`;
    if (showStatus) query += `&showStatus=${showStatus}`;

    const url = `/api/v1/koi-show/get-history-register-show${query}`;
    console.log(`[API Request] GET ${url}`);

    const response = await api.get<ApiResponse<HistoryRegisterShowResponse>>(url);
    
    if (response.data.statusCode === 200) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Không thể tải lịch sử đăng ký');
    }
  } catch (error: any) {
    // Ghi log chi tiết hơn
    const errorMessage = error.response 
      ? `Lỗi ${error.response.status}: ${error.response.data?.message || 'Không có thông báo lỗi'}`
      : `Lỗi kết nối: ${error.message}`;
    
    console.error('Lỗi khi tải danh sách đăng ký:', errorMessage);
    console.error('Tham số gọi API - Page:', page, 'Size:', size, 'ShowStatus:', showStatus);
    
    throw error;
  }
};

/**
 * Biến đổi trạng thái filter thành parameters cho API
 * @param filter Bộ lọc (all, upcoming, ongoing, completed, cancelled)
 * @returns Object chứa showStatus cho API
 */
export const getFilterParams = (
  filter: "all" | "upcoming" | "ongoing" | "completed" | "cancelled"
): { showStatus: string | undefined } => {
  switch (filter) {
    case 'upcoming':
      return {
        showStatus: 'Upcoming'
      };
    case 'ongoing':
      return {
        showStatus: 'InProgress'
      };
    case 'completed':
      return {
        showStatus: 'Finished'
      };
    case 'cancelled':
      return {
        showStatus: 'Cancelled'
      };
    case 'all':
    default:
      return {
        showStatus: undefined
      };
  }
};

/**
 * Chuẩn hóa trạng thái đăng ký để đảm bảo nhất quán
 * @param status Trạng thái từ API
 * @returns Trạng thái đã được chuẩn hóa
 */
export function normalizeRegistrationStatus(status: string): RegistrationItem['status'] {
  const statusMap: Record<string, RegistrationItem['status']> = {
    'waittopaid': 'WaitToPaid',
    'cancelled': 'Cancelled',
    'pending': 'Pending',
    'confirmed': 'Confirmed',
    'checkin': 'CheckIn',
    'rejected': 'Rejected',
    'refunded': 'Refunded',
    // Thêm các trường hợp với chữ hoa đầu để đảm bảo phù hợp nếu API trả về đúng định dạng
    'WaitToPaid': 'WaitToPaid',
    'Cancelled': 'Cancelled',
    'Pending': 'Pending',
    'Confirmed': 'Confirmed',
    'CheckIn': 'CheckIn',
    'Rejected': 'Rejected',
    'Refunded': 'Refunded'
  };
  
  return statusMap[status.toLowerCase()] || status as RegistrationItem['status'];
}

/**
 * Chuẩn hóa trạng thái show để đảm bảo nhất quán
 * @param status Trạng thái từ API
 * @returns Trạng thái đã được chuẩn hóa
 */
export function normalizeShowStatus(status: string): KoiShow['status'] {
  const statusMap: Record<string, KoiShow['status']> = {
    'pending': 'Pending',
    'published': 'Published',
    'upcoming': 'Upcoming',
    'inprogress': 'InProgress',
    'finished': 'Finished',
    // Thêm các trường hợp với chữ hoa đầu để đảm bảo phù hợp nếu API trả về đúng định dạng
    'Pending': 'Pending',
    'Published': 'Published',
    'Upcoming': 'Upcoming',
    'InProgress': 'InProgress',
    'Finished': 'Finished'
  };
  
  return statusMap[status.toLowerCase()] || status as KoiShow['status'];
}

/**
 * Biến đổi HistoryRegisterShowItem thành dữ liệu Competition Data cho component hiển thị
 * @param item Thông tin đăng ký từ API mới
 * @returns Dữ liệu được định dạng cho hiển thị
 */
export const mapToCompetitionData = (item: HistoryRegisterShowItem) => {
  // Format ngày từ startDate
  const startDate = new Date(item.startDate);
  const formattedDate = `${startDate.getDate()}/${startDate.getMonth() + 1}/${startDate.getFullYear()}`;

  // Chuẩn hóa status để phù hợp với logic hiển thị
  let displayStatus: "upcoming" | "ongoing" | "completed" | "cancelled" = "upcoming";
  let normalizedStatus = item.status.toLowerCase();
  
  if (normalizedStatus === "finished") {
    displayStatus = "completed";
  } else if (normalizedStatus === "inprogress") {
    displayStatus = "ongoing";
  } else if (normalizedStatus === "cancelled") {
    displayStatus = "cancelled";
  } else {
    displayStatus = "upcoming";
  }

  return {
    id: item.id,
    name: item.showName,
    date: formattedDate,
    location: item.location || "Đang cập nhật",
    status: displayStatus,
    image: item.imageUrl || "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/group-4.png",
    participantCount: 0,
    fishCount: 0,
    result: displayStatus === "completed" ? {
      rank: "N/A",
      awarded: false,
      awardTitle: "",
    } : undefined,
    koiProfile: {
      name: "Không có thông tin",
      variety: {
        name: ""
      }
    },
    koiSize: 0,
    koiAge: 0,
    categoryName: "",
    payment: null,
    registrationStatus: null
  };
};

/**
 * Lấy màu trạng thái dựa trên status
 * @param status Trạng thái hiển thị (upcoming, ongoing, completed, cancelled)
 * @returns Mã màu cho trạng thái
 */
export const getStatusColorWithRegistration = (status: string) => {
  // Các trạng thái show thông thường
  switch (status) {
    case "upcoming":
      return "#4A90E2"; // Xanh dương
    case "ongoing":
      return "#50C878"; // Xanh lá
    case "completed":
      return "#E74C3C"; // Đỏ
    case "cancelled":
      return "#FF9800"; // Cam
    default:
      return "#95A5A6"; // Xám
  }
};

/**
 * Lấy text trạng thái hiển thị
 * @param status Trạng thái hiển thị (upcoming, ongoing, completed, cancelled)
 * @returns Text hiển thị cho trạng thái
 */
export const getStatusTextWithRegistration = (status: string) => {
  // Các trạng thái show thông thường
  switch (status) {
    case "upcoming":
      return "Sắp diễn ra";
    case "ongoing":
      return "Đang diễn ra";
    case "completed":
      return "Đã kết thúc";
    case "cancelled":
      return "Bị huỷ bỏ";
    default:
      return "Không xác định";
  }
};

/**
 * Lấy thông tin chi tiết của một show và danh sách cá đã đăng ký
 * @param showId ID của show cần lấy thông tin
 * @returns Promise với dữ liệu chi tiết của show
 */
export const getShowMemberDetail = async (showId: string): Promise<ShowMemberDetail> => {
  try {
    const url = `/api/v1/registration/get-show-member-detail/${showId}`;
    console.log(`[API Request] GET ${url}`);

    const response = await api.get<ApiResponse<ShowMemberDetail>>(url);
    
    if (response.data.statusCode === 200) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Không thể lấy thông tin chi tiết của show');
    }
  } catch (error: any) {
    // Ghi log chi tiết hơn
    const errorMessage = error.response 
      ? `Lỗi ${error.response.status}: ${error.response.data?.message || 'Không có thông báo lỗi'}`
      : `Lỗi kết nối: ${error.message}`;
    
    console.error('Lỗi khi lấy thông tin chi tiết của show:', errorMessage);
    console.error('Tham số gọi API - ShowId:', showId);
    
    throw error;
  }
}; 