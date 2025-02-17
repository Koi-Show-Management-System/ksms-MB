import { Stack } from "expo-router";

export default function RegistrationLayout() {
  return (
    <Stack>
      <Stack.Screen name="koiRegistration" options={{ headerShown: false }} />
      <Stack.Screen
        name="KoiParticipationScreen"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
