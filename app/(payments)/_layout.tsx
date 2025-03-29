import { initURLHandling } from "@/services/urlHandlerService";
import { Stack } from "expo-router";
import React, { useEffect } from "react";
import MainLayout from "../../components/MainLayout";

export default function PaymentsLayout() {
  useEffect(() => {
    const cleanup = initURLHandling();
    return cleanup;
  }, []);

  return (
    <MainLayout title="KSMS" description="Payments">
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          gestureDirection: "horizontal",
        }}>
        {/* <Stack.Screen
          name="UserMenu"
          options={{
            headerShown: false,
            presentation: "card",
          }}
        /> */}
      </Stack>
    </MainLayout>
  );
}

