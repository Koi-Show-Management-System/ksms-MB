import { Stack } from "expo-router";
import React from "react";

export default function PaymentsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: "horizontal",
      }}>
      <Stack.Screen name="ticketsPayment" options={{ headerShown: false }} />
      {/* <Stack.Screen
        name="UserMenu"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      /> */}
    </Stack>
  );
}
