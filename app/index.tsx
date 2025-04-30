import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { isAuthenticated, shouldRememberUser } from "../services/authService";

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [redirectTo, setRedirectTo] = useState<string>("/(auth)/welcomeScreen");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is authenticated
        const authenticated = await isAuthenticated();

        if (authenticated) {
          // Check if "Remember Me" was enabled
          const rememberUser = await shouldRememberUser();

          if (rememberUser) {
            // User is authenticated and should be remembered, redirect to home
            setRedirectTo("/(tabs)/home/homepage");
          } else {
            // User is authenticated but shouldn't be remembered, redirect to welcome screen
            setRedirectTo("/(auth)/welcomeScreen");
          }
        } else {
          // User is not authenticated, redirect to welcome screen
          setRedirectTo("/(auth)/welcomeScreen");
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        // In case of error, redirect to welcome screen
        setRedirectTo("/(auth)/welcomeScreen");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0A0A0A" />
      </View>
    );
  }

  return <Redirect href={redirectTo} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
});
