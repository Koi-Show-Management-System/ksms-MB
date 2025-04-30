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
import { QueryProvider } from "../context/QueryProvider";
import { signalRService } from "../services/signalRService";
// import { navigationRef } from '@/utils/navigationService';
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
        console.log("User tapped on notification toast:", notification);
        router.push("/(user)/Notification");
      });
    } else {
      console.error(
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
          console.log("SignalR is already connected");
          return;
        }

        // Sử dụng try-catch riêng cho AsyncStorage để xác định lỗi chính xác
        let token = null;
        try {
          token = await AsyncStorage.getItem("userToken");
          console.log("Token retrieved successfully:", token ? "Yes" : "No");
        } catch (asyncStorageError) {
          console.error("AsyncStorage error:", asyncStorageError);
          return; // Thoát sớm nếu không thể lấy token
        }

        if (
          token &&
          signalRService &&
          typeof signalRService.ensureConnection === "function"
        ) {
          console.log("User is logged in, initializing SignalR connection");
          // Thiết lập kết nối SignalR
          await signalRService.ensureConnection();
        } else {
          console.log(
            "User is not logged in or signalRService not available, skipping SignalR initialization"
          );
        }
      } catch (error) {
        console.error("Error initializing SignalR:", error);
      }
    };

    // Khởi tạo SignalR sau một khoảng thời gian ngắn để đảm bảo ứng dụng đã khởi động hoàn toàn
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AndroidSafeAreaConfig />
        <QueryProvider>
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
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(user)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="(payments)"
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="+not-found"
                  options={{ headerShown: false }}
                />
                <Stack.Screen name="index" options={{ headerShown: false }} />
              </Stack>
              <StatusBar style="auto" />
              <Toast />
            </ThemeProvider>
          </OverlayProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
