import * as Linking from "expo-linking";
import { router } from "expo-router";

// Configure URL scheme handling
export const initURLHandling = () => {
  // Handle URLs when app is already running
  const subscription = Linking.addEventListener("url", handleURL);

  // Handle URLs when app is opened from URL
  Linking.getInitialURL().then((url) => {
    if (url) {
      handleURL({ url });
    }
  });

  return () => {
    subscription.remove();
  };
};

// Process deep link URLs
export const handleURL = ({ url }: { url: string }) => {
  if (!url) return;

  console.log("Handling URL:", url);

  // Parse the URL
  const parsedUrl = Linking.parse(url);

  // Check if it's a payment callback
  if (parsedUrl.hostname === "app") {
    const path = parsedUrl.path;

    if (path === "success") {
      router.replace({
        pathname: "/(payments)/PaymentSuccess",
        params: parsedUrl.queryParams ?? undefined,
      });
    } else if (path === "fail") {
      router.replace({
        pathname: "/(payments)/PaymentFailed",
        params: parsedUrl.queryParams ?? undefined,
      });
    }
  }
};
