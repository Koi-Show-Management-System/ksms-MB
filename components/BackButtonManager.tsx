// components/BackButtonManager.tsx
import { usePathname, router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { BackHandler, Platform, ToastAndroid } from "react-native";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";

/**
 * Component để quản lý sự kiện nút back trên toàn ứng dụng
 * - Ở màn hình homepage: hiển thị thông báo "nhấn back 2 lần để thoát ứng dụng"
 * - Ở các màn hình khác: quay lại màn hình trước đó
 */
export function BackButtonManager() {
  const pathname = usePathname();
  const backPressedOnceRef = useRef(false);
  const [exitApp, setExitApp] = useState(false);

  // Kiểm tra nhiều dạng đường dẫn có thể là homepage
  // Sử dụng phương pháp kiểm tra chính xác hơn
  const isHomePage = pathname === "/" || // Root path
                    pathname === "/index" || // Index path
                    pathname === "/(tabs)" || // Tabs root
                    pathname === "/(tabs)/index" || // Tabs index
                    pathname === "/(tabs)/home" || // Home tab
                    pathname === "/(tabs)/home/index" || // Home index
                    pathname === "/(tabs)/home/homepage" || // Explicit homepage
                    pathname === "/home" || // Direct home
                    pathname === "/home/homepage" || // Direct homepage
                    pathname === "/home/index"; // Home index

  // Thêm kiểm tra bổ sung cho các trường hợp đặc biệt
  const isRootScreen = !router.canGoBack() || pathname === "/";

  console.log("BackButtonManager - Current pathname:", pathname, "isHomePage:", isHomePage);

  useEffect(() => {
    // Reset trạng thái khi đường dẫn thay đổi
    backPressedOnceRef.current = false;
    setExitApp(false);
  }, [pathname]);

  useEffect(() => {
    // Chỉ áp dụng cho Android vì iOS không có nút back vật lý
    if (Platform.OS === 'android') {
      const backAction = () => {
        console.log("Back button pressed, isHomePage:", isHomePage, "isRootScreen:", isRootScreen);

        // Nếu có thể quay lại và không phải màn hình homepage, quay lại màn hình trước đó
        if (!isHomePage && router.canGoBack()) {
          router.back();
          return true; // Ngăn chặn hành vi mặc định
        }

        // Nếu là màn hình homepage hoặc màn hình gốc, hiển thị thông báo "nhấn back 2 lần để thoát"
        if (isHomePage || isRootScreen) {
          if (backPressedOnceRef.current === false) {
            backPressedOnceRef.current = true;

            // Sử dụng ToastAndroid cho Android để đảm bảo thông báo hiển thị
            ToastAndroid.show('Nhấn back hai lần để thoát ứng dụng', ToastAndroid.SHORT);

            // Đồng thời hiển thị Toast từ thư viện để có giao diện đẹp hơn
            Toast.show({
              type: 'info',
              text1: 'Thông báo',
              text2: 'Nhấn back hai lần để thoát ứng dụng',
              position: 'bottom',
              visibilityTime: 2000,
            });

            // Tạo phản hồi haptic (rung nhẹ)
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            // Reset trạng thái sau 2 giây
            setTimeout(() => {
              backPressedOnceRef.current = false;
            }, 2000);

            return true; // Ngăn chặn hành vi mặc định
          }

          // Nếu đã nhấn back một lần trước đó, cho phép thoát ứng dụng
          return false;
        }

        // Mặc định cho phép hành vi mặc định
        return false;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

      return () => backHandler.remove();
    }
  }, [isHomePage, isRootScreen]);

  return null;
}

export default BackButtonManager;
