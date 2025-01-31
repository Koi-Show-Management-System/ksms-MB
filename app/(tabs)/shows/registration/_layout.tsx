import { Stack } from "expo-router";

export default function RegistrationLayout() {
  return (
    <Stack>
      <Stack.Screen name="KoiRegistration" options={{ headerShown: false }} />
    </Stack>
  );
}
