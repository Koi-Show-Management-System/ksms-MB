import { Stack } from "expo-router";
import React from "react";
import MainLayout from '@/components/MainLayout';

export default function HomeLayout() {
  return (
    <MainLayout title="Trang chủ" description="" showFooter={true}>
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          gestureDirection: "horizontal",
        }}>
        <Stack.Screen name="homepage" options={{ headerShown: false }} />
        <Stack.Screen
          name="UserMenu"
          options={{
            headerShown: false,
            presentation: "card",
          }}
        />
      </Stack>
    </MainLayout>
  );
}
