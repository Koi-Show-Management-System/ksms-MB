// app/(tabs)/_layout.tsx
import { Stack } from "expo-router";
import React from "react";
import { Platform } from "react-native";

export default function TabLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: Platform.OS === "ios" ? "default" : "fade",
        gestureEnabled: true,
        gestureDirection: "horizontal",
      }}>
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="shows" options={{ headerShown: false }} />
    </Stack>
  );
}
