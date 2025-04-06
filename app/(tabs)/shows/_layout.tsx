import { Stack } from "expo-router";
import React from "react";
import MainLayout from '@/components/MainLayout';

export default function ShowsLayout() {
  return (
    <MainLayout title="Sự kiện" description="Khám phá các cuộc thi và triển lãm" showFooter={true}>
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          gestureDirection: "horizontal",
        }}>
        <Stack.Screen name="KoiShowsPage" options={{ headerShown: false }} />
        <Stack.Screen
          name="KoiShowInformation"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="StreamingShow" options={{ headerShown: false }} />
        <Stack.Screen name="LiveStream" options={{ headerShown: false }} />
        <Stack.Screen name="BuyTickets" options={{ headerShown: false }} />
        <Stack.Screen name="KoiRegistration" options={{ headerShown: false }} />
        <Stack.Screen name="ConfirmRegister" options={{ headerShown: false }} />
        <Stack.Screen name="AwardScreen" options={{ headerShown: false }} />
        <Stack.Screen name="Rule&FAQ" options={{ headerShown: false }} />
        {/* Add other show-related screens here */}
      </Stack>
    </MainLayout>
  );
}
