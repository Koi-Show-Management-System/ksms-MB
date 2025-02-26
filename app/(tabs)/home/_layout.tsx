import { Stack } from "expo-router";
import React from "react";

export default function HomeLayout() {
  return (
    <Stack>
      <Stack.Screen name="homepage" options={{ headerShown: false }} />
      <Stack.Screen name="UserMenu" options={{ headerShown: false }} />
    </Stack>
  );
}
