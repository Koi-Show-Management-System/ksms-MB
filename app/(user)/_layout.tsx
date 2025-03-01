import { Stack } from "expo-router";
import React from "react";

export default function userLayout() {
  return (
    <Stack>
      <Stack.Screen name="KoiRegister" options={{ headerShown: false }} />
      <Stack.Screen name="KoiList" options={{ headerShown: false }} />
      <Stack.Screen name="Notification" options={{ headerShown: false }} />
    </Stack>
  );
}
