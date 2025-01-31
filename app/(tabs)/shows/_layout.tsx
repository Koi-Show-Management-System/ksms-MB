import { Stack } from "expo-router";

export default function ShowLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="KoiShowInformation"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="registration" options={{ headerShown: false }} />
    </Stack>
  );
}
