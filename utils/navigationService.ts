import { createNavigationContainerRef } from '@react-navigation/native';

// Khởi tạo ref cho navigation container
export const navigationRef = createNavigationContainerRef();

/**
 * Điều hướng đến một màn hình cụ thể.
 * @param name Tên màn hình (route name).
 * @param params Tham số truyền cho màn hình (tùy chọn).
 */
export function navigate(name: string, params?: object) {
  if (navigationRef.isReady()) {
    // @ts-ignore // Bỏ qua kiểm tra type vì name và params là động
    navigationRef.navigate(name, params);
  } else {
    // Có thể thêm xử lý chờ ref sẵn sàng hoặc log lỗi
    console.warn("Navigation ref is not ready yet.");
  }
}

/**
 * Điều hướng đến stack (auth) chứa màn hình đăng nhập/đăng ký.
 * Reset stack để người dùng không thể back lại màn hình trước đó.
 */
export function navigateToAuth() {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      routes: [{ name: '(auth)' }], // Điều hướng đến stack (auth)
    });
  } else {
    console.warn("Navigation ref is not ready yet.");
  }
}

// Có thể thêm các hàm tiện ích điều hướng khác ở đây