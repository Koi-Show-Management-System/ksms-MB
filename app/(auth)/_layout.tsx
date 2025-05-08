import { Stack } from "expo-router";
import React from "react";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="signIn" />
      <Stack.Screen name="signUp" />
      <Stack.Screen name="welcomeScreen" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
