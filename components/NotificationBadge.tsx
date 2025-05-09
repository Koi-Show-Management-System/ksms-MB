// components/NotificationBadge.tsx
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useNotification } from "../context/NotificationContext";

interface NotificationBadgeProps {
  size?: number;
  color?: string;
  badgeColor?: string;
  style?: any;
  hasNotifications?: boolean;
  notificationCount?: number;
  onPress?: () => void;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  size = 24,
  color = "#333",
  badgeColor = "#FF3B30",
  style,
  hasNotifications = false,
  notificationCount,
  onPress,
}) => {
  // Get notification context if not provided via props
  const notificationContext = useNotification();
  const count = notificationCount ?? notificationContext.unreadCount;
  const showBadge = hasNotifications || count > 0;

  // Animation
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Xử lý animation khi có thông báo mới
  useEffect(() => {
    if (showBadge) {
      // Reset animation values
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0);

      // Start animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Fade out animation
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [showBadge, scaleAnim, opacityAnim]);

  // Xử lý khi nhấn vào biểu tượng thông báo
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push("/(user)/Notification");
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      activeOpacity={0.7}>
      <Ionicons name="notifications" size={size} color={color} />

      {/* Badge hiển thị khi có thông báo mới */}
      {showBadge && (
        <Animated.View
          style={[
            styles.badge,
            { backgroundColor: badgeColor },
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}>
          <Text style={styles.badgeText}>
            {count > 0 ? (count > 99 ? "99+" : count.toString()) : "!"}
          </Text>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    padding: 4,
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: "#FFF",
  },
  badgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default NotificationBadge;
