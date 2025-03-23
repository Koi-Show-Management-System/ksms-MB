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

/**
 * Lấy danh sách đăng ký tham gia cuộc thi theo phân trang
 * @param page Số trang (mặc định: 1)
 * @param size Số lượng mục mỗi trang (mặc định: 10)
 * @param registrationStatus Trạng thái đăng ký (có thể là danh sách các trạng thái phân tách bằng dấu phẩy)
 * @param showStatus Trạng thái cuộc thi (có thể là danh sách các trạng thái phân tách bằng dấu phẩy)
 * @returns Promise với dữ liệu phân trang của đăng ký
 */
export const getRegistrationHistory = async (
  page: number = 1,
  size: number = 10,
  registrationStatus?: string | null,
  showStatus?: string | null
): Promise<PaginatedResponse<RegistrationItem>> => {
  try {
    // Build query parameters
    let query = `?page=${page}&size=${size}`;
    if (showStatus) query += `&showStatus=${showStatus}`;
    if (registrationStatus) query += `&registrationStatus=${registrationStatus}`;

    const url = `/api/v1/registration/get-page-history-registration${query}`;
    console.log(`[API Request] GET ${url}`);

    const response = await api.get<ApiResponse<PaginatedResponse<RegistrationItem>>>(url);
    
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
    console.error('Tham số gọi API - Page:', page, 'Size:', size, 'RegStatus:', registrationStatus, 'ShowStatus:', showStatus);
    
    // Trả về một đối tượng trống nếu có lỗi xảy ra
    return {
      size: size,
      page: page,
      total: 0,
      totalPages: 0,
      items: []
    };
  }
};

/**
 * Biến đổi trạng thái filter thành parameters cho API
 * @param filter Bộ lọc (all, upcoming, ongoing, completed)
 * @returns Object chứa showStatus cho API, với registrationStatus luôn là null
 */
export const getFilterParams = (
  filter: "all" | "upcoming" | "ongoing" | "completed"
): { registrationStatus: string | null; showStatus: string | null } => {
  switch (filter) {
    case 'upcoming':
      return {
        registrationStatus: null,
        showStatus: 'Upcoming,Pending,Published'
      };
    case 'ongoing':
      return {
        registrationStatus: null,
        showStatus: 'InProgress'
      };
    case 'completed':
      return {
        registrationStatus: null,
        showStatus: 'Finished'
      };
    case 'all':
    default:
      return {
        registrationStatus: null,
        showStatus: null
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
 * Biến đổi Registration Data thành Competition Data cho component hiển thị
 * @param registration Thông tin đăng ký từ API
 * @returns Dữ liệu được định dạng cho hiển thị
 */
export const mapToCompetitionData = (registration: RegistrationItem) => {
  // Chuẩn hóa các trạng thái để đảm bảo tính nhất quán
  const showStatus = normalizeShowStatus(registration.koiShow.status);
  const regStatus = normalizeRegistrationStatus(registration.status);
  
  // Quyết định status hiển thị từ status của registration và show
  let displayStatus: "upcoming" | "ongoing" | "completed" = "upcoming";
  
  // Ưu tiên kiểm tra trạng thái show trước
  if (showStatus === "Finished") {
    displayStatus = "completed";
  } else if (showStatus === "InProgress") {
    displayStatus = "ongoing";
  } else if (["Upcoming", "Pending", "Published"].includes(showStatus)) {
    // Sau đó mới kiểm tra trạng thái đăng ký
    if (["Rejected", "Refunded", "Cancelled"].includes(regStatus)) {
      displayStatus = "completed";
    } else if (regStatus === "CheckIn") {
      displayStatus = "ongoing";
    } else {
      displayStatus = "upcoming";
    }
  }

  // Format ngày từ createdAt
  const date = new Date(registration.createdAt);
  const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

  return {
    id: registration.id,
    name: registration.koiShow.name,
    date: formattedDate,
    location: "Đang cập nhật", // API chưa trả về location
    status: displayStatus,
    image: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/group-4.png", // Default image
    participantCount: 0, // Thông tin này không có trong API
    fishCount: 0, // Thông tin này không có trong API
    result: displayStatus === "completed" ? {
      rank: registration.rank || "N/A",
      awarded: false,
      awardTitle: "",
    } : undefined,
    registrationStatus: regStatus,
    koiProfile: registration.koiProfile,
    koiSize: registration.koiSize,
    koiAge: registration.koiAge,
    categoryName: registration.competitionCategory.name,
    payment: registration.registrationPayment
  };
};

/**
 * Lấy màu trạng thái dựa trên status và registration status
 * @param status Trạng thái hiển thị (upcoming, ongoing, completed)
 * @param registrationStatus Trạng thái đăng ký
 * @returns Mã màu cho trạng thái
 */
export const getStatusColorWithRegistration = (status: string, registrationStatus?: string) => {
  // Chuẩn hóa trạng thái đăng ký nếu có
  const normalizedRegStatus = registrationStatus ? normalizeRegistrationStatus(registrationStatus) : undefined;
  
  // Nếu registration status là cancelled hoặc rejected, luôn hiển thị màu đỏ
  if (normalizedRegStatus && ["Cancelled", "Rejected", "Refunded"].includes(normalizedRegStatus)) {
    return "#E74C3C"; // Đỏ
  }

  // Xử lý trạng thái chờ thanh toán
  if (normalizedRegStatus === "WaitToPaid") {
    return "#FF9500"; // Cam
  }

  // Các trạng thái show thông thường
  switch (status) {
    case "upcoming":
      return "#4A90E2"; // Xanh dương
    case "ongoing":
      return "#50C878"; // Xanh lá
    case "completed":
      return "#E74C3C"; // Đỏ
    default:
      return "#95A5A6"; // Xám
  }
};

/**
 * Lấy text trạng thái hiển thị
 * @param status Trạng thái hiển thị (upcoming, ongoing, completed)
 * @param registrationStatus Trạng thái đăng ký
 * @returns Text hiển thị cho trạng thái
 */
export const getStatusTextWithRegistration = (status: string, registrationStatus?: string) => {
  // Chuẩn hóa trạng thái đăng ký nếu có
  const normalizedRegStatus = registrationStatus ? normalizeRegistrationStatus(registrationStatus) : undefined;
  
  // Nếu registration status có giá trị, hiển thị text tương ứng
  if (normalizedRegStatus) {
    switch (normalizedRegStatus) {
      case "WaitToPaid":
        return "Chờ thanh toán";
      case "Pending":
        return "Chờ xác nhận";
      case "Confirmed":
        return "Đã xác nhận";
      case "CheckIn":
        return "Đã check in";
      case "Cancelled":
        return "Đã hủy";
      case "Rejected":
        return "Bị từ chối";
      case "Refunded":
        return "Đã hoàn tiền";
    }
  }

  // Các trạng thái show thông thường
  switch (status) {
    case "upcoming":
      return "Sắp diễn ra";
    case "ongoing":
      return "Đang diễn ra";
    case "completed":
      return "Đã kết thúc";
    default:
      return "Không xác định";
  }
}; 