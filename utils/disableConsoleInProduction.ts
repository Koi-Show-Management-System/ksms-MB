/**
 * Vô hiệu hóa tất cả các lệnh console.log trong môi trường production
 * Điều này cải thiện hiệu suất đáng kể, đặc biệt trên thiết bị Android
 */
export function disableConsoleInProduction() {
  // Chỉ vô hiệu hóa console khi không ở chế độ development
  if (!__DEV__) {
    // Danh sách tất cả các phương thức console cần vô hiệu hóa
    const consoleMethods = [
      'assert',
      'clear',
      'count',
      'debug',
      'dir',
      'dirxml',
      'error',
      'exception',
      'group',
      'groupCollapsed',
      'groupEnd',
      'info',
      'log',
      'profile',
      'profileEnd',
      'table',
      'time',
      'timeEnd',
      'timeStamp',
      'trace',
      'warn',
    ] as const;

    // Ghi đè từng phương thức bằng hàm rỗng
    consoleMethods.forEach(methodName => {
      // Sử dụng type assertion để tránh lỗi TypeScript
      (console as any)[methodName] = () => {};
    });

    // Đảm bảo báo lỗi nghiêm trọng vẫn được ghi lại nếu cần thiết
    // Bạn có thể bỏ ghi chú dòng này nếu bạn vẫn muốn thấy lỗi nghiêm trọng
    // console.error = (message, ...optionalParams) => {
    //   // Thêm logic báo cáo lỗi ở đây nếu cần, ví dụ: gửi đến dịch vụ theo dõi lỗi
    // };
  }
} 