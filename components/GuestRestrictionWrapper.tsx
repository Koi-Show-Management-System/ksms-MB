import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../context/AuthContext";

interface GuestRestrictionWrapperProps {
  children: React.ReactNode;
  message?: string;
  showLoginButton?: boolean;
  style?: any;
}

/**
 * A component that shows a login prompt for guest users
 * and renders children for authenticated users
 */
const GuestRestrictionWrapper: React.FC<GuestRestrictionWrapperProps> = ({
  children,
  message = "Bạn cần phải login để sử dụng tính năng này",
  showLoginButton = true,
  style,
}) => {
  const { isGuest } = useAuth();

  if (isGuest()) {
    return (
      <View style={[styles.container, style]}>
        <MaterialIcons name="lock-outline" size={64} color="#6c757d" />
        <Text style={styles.message}>{message}</Text>

        {showLoginButton && (
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push("/(auth)/signIn")}>
            <Text style={styles.loginButtonText}>Đăng nhập</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return <>{children}</>;
};

/**
 * A higher-order function that creates a button that shows a login prompt for guest users
 * and performs the specified action for authenticated users
 */
export const createRestrictedButton = (
  ButtonComponent: React.ComponentType<any>,
  onPressForAuth: () => void,
  buttonProps: any = {}
) => {
  return (props: any) => {
    const { isGuest } = useAuth();

    const handlePress = () => {
      if (isGuest()) {
        Alert.alert(
          "Yêu cầu đăng nhập",
          "Bạn cần phải login để sử dụng tính năng này",
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
      } else {
        onPressForAuth();
      }
    };

    return (
      <ButtonComponent {...props} {...buttonProps} onPress={handlePress} />
    );
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
    color: "#343a40",
  },
  loginButton: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default GuestRestrictionWrapper;
