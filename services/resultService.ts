import api from './api'; // Đảm bảo bạn đã cấu hình instance axios này

// Định nghĩa kiểu cho một media item trong kết quả
export interface ResultMedia { // Thêm export
  id: string;
  mediaUrl: string;
  mediaType: 'Image' | 'Video'; // Hoặc các loại khác nếu có
}

// Định nghĩa kiểu dữ liệu cho một kết quả giải thưởng dựa trên API response
export interface AwardResult {
  registrationId: string;
  registrationNumber: string | null;
  registerName: string | null;
  koiSize: number | null;
  rank: number | null;
  finalScore: number | null;
  status: string | null; // Ví dụ: "prizewinner"
  awardType: 'first' | 'second' | 'third' | 'honorable' | string | null; // Mở rộng để chấp nhận các giá trị khác nếu có
  awardName: string | null;
  prizeValue: number | null;
  koiName: string | null;
  bloodline: string | null;
  gender: string | null;
  variety: string | null;
  media: ResultMedia[] | null; // Mảng các media items
}

// Kiểu dữ liệu cho response từ API
interface ApiResponse {
  data: AwardResult[];
  statusCode: number;
  message: string;
}

// Hàm gọi API lấy kết quả của một hạng mục
// API mới chỉ cần categoryId: /api/v1/round-result/final-result/{categoryId}
export async function getCategoryResults(categoryId: string): Promise<ApiResponse | null> {
  if (!categoryId) {
    console.warn("getCategoryResults called with null or empty categoryId");
    return null; // Hoặc throw lỗi nếu categoryId là bắt buộc
  }
  try {
    // *** Sử dụng endpoint API thực tế của bạn và chuyển ID thành chữ hoa ***
    const response = await api.get<ApiResponse>(
      `/api/v1/round-result/final-result/${categoryId.toUpperCase()}` // Thêm lại /api/v1 và chuyển ID thành chữ hoa
    );
    // Kiểm tra cấu trúc response trước khi trả về
    if (response.data && Array.isArray(response.data.data)) {
        return response.data; // Trả về toàn bộ object { data: AwardResult[], statusCode, message }
    } else {
        console.error("Invalid API response structure:", response.data);
        // Trả về cấu trúc lỗi chuẩn hoặc throw lỗi
        return { data: [], statusCode: response.data?.statusCode || 500, message: response.data?.message || "Invalid response structure" };
    }
  } catch (error: any) {
    console.error(`Error fetching results for category ${categoryId}:`, error);
    // Ném lỗi hoặc trả về cấu trúc lỗi để component xử lý
    // Ví dụ trả về cấu trúc lỗi:
     return { data: [], statusCode: error.response?.status || 500, message: error.response?.data?.message || "Failed to fetch results" };
    // Hoặc throw lỗi:
    // throw error;
  }
}