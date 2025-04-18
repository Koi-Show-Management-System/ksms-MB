import MainLayout from "@/components/MainLayout";
import { Stack } from "expo-router";
import React from "react";

export default function UserLayout() {
  return (
    <MainLayout
      title="Tài khoản"
      description="Thông tin cá nhân và cài đặt"
      showFooter={true}>
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          gestureDirection: "horizontal",
        }}>
        <Stack.Screen name="KoiRegister" options={{ headerShown: false }} />
        <Stack.Screen name="KoiList" options={{ headerShown: false }} />
        <Stack.Screen name="Notification" options={{ headerShown: false }} />
        <Stack.Screen name="TicketCheckin" options={{ headerShown: false }} />
        <Stack.Screen
          name="CompetitionTicket"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Transactions" options={{ headerShown: false }} />
        <Stack.Screen name="UserProfile" options={{ headerShown: false }} />
        <Stack.Screen name="MyOrders" options={{ headerShown: false }} />
        <Stack.Screen
          name="CompetitionJoined"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="OrderDetail" options={{ headerShown: false }} />
        <Stack.Screen name="TicketDetail" options={{ headerShown: false }} />
        <Stack.Screen name="KoiInformation" options={{ headerShown: false }} />
        <Stack.Screen name="KoiProfileEdit" options={{ headerShown: false }} />
      </Stack>
    </MainLayout>
  );
}
