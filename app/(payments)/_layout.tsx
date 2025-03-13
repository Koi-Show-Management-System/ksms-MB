import { initURLHandling } from "@/services/urlHandlerService";
import { Stack } from "expo-router";
import React, { useEffect } from "react";

export default function PaymentsLayout() {
  useEffect(() => {
    const cleanup = initURLHandling();
    return cleanup;
  }, []);

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

