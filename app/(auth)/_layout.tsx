import { Stack } from "expo-router";
import React from "react";
import MainLayout from '@/components/MainLayout';

export default function AuthLayout() {
  return (
    <MainLayout title="Đăng nhập / Đăng ký" description="Chào mừng đến với KSMS" showFooter={false}>
      <Stack>
        <Stack.Screen name="signIn" options={{ headerShown: false }} />
        <Stack.Screen name="signUp" options={{ headerShown: false }} />
        <Stack.Screen name="welcomeScreen" options={{ headerShown: false }} />
      </Stack>
    </MainLayout>
  );
}
