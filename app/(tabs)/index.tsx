import { Redirect } from "expo-router";

export default function TabsIndex() {
  // Redirect to the home tab by default
  return <Redirect href="/(tabs)/home/homepage" />;
}
