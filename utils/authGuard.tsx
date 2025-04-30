import { router } from "expo-router";
import React, { useEffect } from "react";
import { Alert } from "react-native";
import { useAuth } from "../context/AuthContext";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * A component that guards routes requiring authentication.
 * If the user is not authenticated, they will be redirected to the login screen.
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ children, fallback }) => {
  const { isAuthenticated, isGuest, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && (isGuest() || !isAuthenticated)) {
      Alert.alert(
        "Yêu cầu đăng nhập",
        "Bạn cần phải login để truy cập tính năng này.",
        [
          {
            text: "Đăng nhập",
            onPress: () => router.push("/(auth)/signIn"),
          },
          {
            text: "Quay lại",
            onPress: () => router.back(),
            style: "cancel",
          },
        ]
      );
    }
  }, [isAuthenticated, isGuest, isLoading]);

  if (isLoading) {
    // Return loading state or null
    return null;
  }

  if (isGuest() || !isAuthenticated) {
    // Return fallback component if provided
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

/**
 * A hook that checks if the current user has access to a protected feature.
 * Returns true if the user is authenticated and not a guest, false otherwise.
 */
export const useAuthCheck = () => {
  const { isAuthenticated, isGuest } = useAuth();

  const checkAccess = () => {
    if (isGuest() || !isAuthenticated) {
      Alert.alert(
        "Yêu cầu đăng nhập",
        "Bạn cần phải login để sử dụng tính năng này.",
        [
          {
            text: "Đăng nhập",
            onPress: () => router.push("/(auth)/signIn"),
          },
          {
            text: "Hủy",
            style: "cancel",
          },
        ]
      );
      return false;
    }
    return true;
  };

  return { checkAccess };
};
