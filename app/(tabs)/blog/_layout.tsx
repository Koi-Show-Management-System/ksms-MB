import MainLayout from "@/components/MainLayout";
import { Stack } from "expo-router";
import React from "react";

export default function BlogLayout() {
  return (
    <MainLayout
      title="Tin tức & Bài viết"
      description="Tin tức và bài viết mới nhất"
      showFooter={true}>
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          gestureDirection: "horizontal",
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="[blogId]" options={{ headerShown: false }} />
        <Stack.Screen name="test" options={{ headerShown: false }} />
      </Stack>
    </MainLayout>
  );
}
