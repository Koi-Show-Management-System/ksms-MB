import { useColorScheme } from "@/hooks/useColorScheme";
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

  // Thiết lập xử lý khi người dùng nhấn vào thông báo
  useEffect(() => {
    // Đặt callback cho SignalR service để xử lý khi người dùng nhấn vào thông báo
    signalRService.setOnToastPress((notification) => {
      console.log("User tapped on notification toast:", notification);
      router.push("/(user)/Notification");
    });

    return () => {
      // Xóa callback khi component unmount bằng cách đặt một hàm rỗng
      signalRService.setOnToastPress(() => {
        // Hàm rỗng để cleanup
      });
    };
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
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
