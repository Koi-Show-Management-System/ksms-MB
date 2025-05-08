import { useColorScheme } from "@/hooks/useColorScheme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { enableScreens } from "react-native-screens";
import Toast from "react-native-toast-message";
import { OverlayProvider } from "stream-chat-expo";
import AndroidSafeAreaConfig from "../components/AndroidSafeAreaConfig";
import { AuthProvider } from "../context/AuthContext";
import { QueryProvider } from "../context/QueryProvider";
import { signalRService } from "../services/signalRService";
import { disableConsoleInProduction } from "../utils/disableConsoleInProduction";
import { logger } from "../utils/logger";
import ErrorBoundary from "../components/ErrorBoundary";
import { setupGlobalErrorHandlers } from "../utils/ErrorUtils";
import BackButtonManager from "../components/BackButtonManager";
// import { navigationRef } from '@/utils/navigationService';

// Vô hiệu hóa console.log trong môi trường production
disableConsoleInProduction();

// Cấu hình xử lý lỗi toàn cục
setupGlobalErrorHandlers();

enableScreens(true);
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("@/assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Thiết lập xử lý khi người dùng nhấn vào thông báo và khởi tạo SignalR
  useEffect(() => {
    // Đặt callback cho SignalR service để xử lý khi người dùng nhấn vào thông báo
    if (
      signalRService &&
      typeof signalRService.setOnToastPress === "function"
    ) {
      signalRService.setOnToastPress((notification) => {
        logger.info("User tapped on notification toast:", notification);
        router.push("/(user)/Notification");
      });
    } else {
      logger.error(
        "signalRService or setOnToastPress method is not available"
      );
    }

    // Kiểm tra xem người dùng đã đăng nhập chưa và khởi tạo SignalR nếu đã đăng nhập
    const initializeSignalR = async () => {
      try {
        // Kiểm tra xem SignalR đã kết nối chưa
        if (
          signalRService &&
          typeof signalRService.isConnected === "function" &&
          signalRService.isConnected()
        ) {
          logger.info("SignalR is already connected");
          return;
        }

        // Sử dụng try-catch riêng cho AsyncStorage để xác định lỗi chính xác
        let token = null;
        try {
          token = await AsyncStorage.getItem("userToken");
          logger.debug("Token retrieved successfully:", token ? "Yes" : "No");
        } catch (asyncStorageError) {
          logger.error("AsyncStorage error:", asyncStorageError);
          return; // Thoát sớm nếu không thể lấy token
        }

        // Skip SignalR initialization if no token
        if (!token) {
          logger.info("No user token found, skipping SignalR initialization");
          return;
        }

        // Check if signalRService is available
        if (!signalRService || typeof signalRService.ensureConnection !== "function") {
          logger.error("SignalR service not available or missing ensureConnection method");
          return;
        }

        logger.info("User is logged in, initializing SignalR connection");

        // Use a shorter timeout (5 seconds) to avoid blocking the UI thread for too long
        const connectionPromise = signalRService.ensureConnection();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("SignalR connection setup timed out")), 5000);
        });

        try {
          await Promise.race([connectionPromise, timeoutPromise]);
          logger.info("SignalR connection established successfully");
        } catch (connectionError) {
          logger.error("SignalR connection timed out or failed:", connectionError);
          // Don't stop the app, allow it to continue even if SignalR fails to connect
        }
      } catch (error) {
        logger.error("Error initializing SignalR:", error);
        // Still allow the app to function even if SignalR initialization fails
      }
    };

    // Khởi tạo SignalR sau khi ứng dụng đã khởi động hoàn toàn
    // Sử dụng thời gian đủ dài (1000ms) để đảm bảo ứng dụng đã khởi động hoàn toàn
    // trước khi thiết lập kết nối SignalR
    const timer = setTimeout(() => {
      initializeSignalR();
    }, 1000);

    return () => {
      clearTimeout(timer);
      // Xóa callback khi component unmount bằng cách đặt một hàm rỗng
      if (
        signalRService &&
        typeof signalRService.setOnToastPress === "function"
      ) {
        signalRService.setOnToastPress(() => {
          // Hàm rỗng để cleanup
        });
      }
    };
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AndroidSafeAreaConfig />
          <QueryProvider>
            <AuthProvider>
              <OverlayProvider>
                <ThemeProvider
                  value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
                  <Stack
                    // ref={navigationRef}
                    screenOptions={{
                      headerShown: false,
                      animation: "fade",
                      contentStyle: {
                        backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
                      },
                    }}>
                    <Stack.Screen
                      name="(tabs)"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="(auth)"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="(user)"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="(payments)"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="+not-found"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    <Stack.Screen name="Rules" options={{ headerShown: false }} />
                  </Stack>
                  <StatusBar style="auto" />
                  <Toast />
                  <BackButtonManager />
                </ThemeProvider>
              </OverlayProvider>
            </AuthProvider>
          </QueryProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
