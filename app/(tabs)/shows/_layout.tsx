import { Stack } from "expo-router";
import React from "react";

export default function ShowLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="KoiShowInformation"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="koiRegistration" options={{ headerShown: false }} />
      <Stack.Screen name="BuyTickets" options={{ headerShown: false }} />
      <Stack.Screen name="ConfirmRegister" options={{ headerShown: false }} />
      <Stack.Screen name="KoiShows" options={{ headerShown: false }} />
      <Stack.Screen name="AwardScreen" options={{ headerShown: false }} />
      <Stack.Screen name="LiveStream" options={{ headerShown: false }} />
      <Stack.Screen name="StreamingShow" options={{ headerShown: false }} />
    </Stack>
  );
}
