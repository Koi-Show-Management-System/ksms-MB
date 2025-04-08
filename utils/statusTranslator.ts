// utils/statusTranslator.ts

/**
 * Ánh xạ các trạng thái từ tiếng Anh sang tiếng Việt.
 * Lưu ý: Trạng thái 'active' sẽ được xử lý sau theo yêu cầu.
 */
const statusMap: Record<string, string> = {
  waittopaid: "Chờ Thanh Toán",
  pendingrefund: "Chờ Hoàn Tiền",
  cancelled: "Huỷ Bỏ",
  pending: "Đang chờ",
  confirmed: "Đã Duyệt",
  checkin: "Đã Check-in",
  rejected: "Đã Từ Chối",
  refunded: "Đã Hoàn Tiền",
  prizewinner: "Đã Đạt Giải",
  eliminated: "Đã Bị Loại",
  competition: "Đang Thi Đấu",
  paid: "Đã Thanh Toán",
  sold: "Chưa Sử Dụng", // Theo yêu cầu của bạn
  completed: "Đã Hoàn Thành",
  upcoming: "Sắp Diễn Ra",
  inprogress: "Đang Diễn Ra",
  finished: "Kết Thúc", // Sử dụng bản dịch từ danh sách đầu tiên
  published: "Đã Công Bố",
  Pass: "Đạt",
  Fail: "Không Đạt",
  // 'active': '...' // Sẽ được xử lý sau
  notqualified: "Không đủ điều kiện", // Thêm từ FishStatus.tsx
  cancelledbyuser: "Hủy bởi người dùng", // Thêm từ FishStatus.tsx
  cancelledbysystem: "Hủy bởi hệ thống", // Thêm từ FishStatus.tsx
};

/**
 * Dịch một chuỗi trạng thái từ tiếng Anh sang tiếng Việt.
 * Nếu không tìm thấy bản dịch, trả về chuỗi trạng thái gốc (đã chuyển sang chữ thường).
 * @param status Chuỗi trạng thái tiếng Anh cần dịch.
 * @returns Chuỗi trạng thái tiếng Việt tương ứng hoặc chuỗi gốc nếu không có bản dịch.
 */
export function translateStatus(status?: string | null): string {
  if (!status) {
    return "Không xác định"; // Hoặc một giá trị mặc định khác nếu cần
  }
  const lowerCaseStatus = status.toLowerCase();
  return statusMap[lowerCaseStatus] || status; // Trả về status gốc nếu không tìm thấy
}