// components/NotificationBadge.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSocket } from '../context/SocketContext';
import { router } from 'expo-router';

interface NotificationBadgeProps {
  size?: number;
  color?: string;
  badgeColor?: string;
  style?: any;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  size = 24,
  color = '#333',
  badgeColor = '#FF3B30',
  style,
}) => {
  // Sử dụng socket context
  const { hasNewNotifications, markNotificationsAsSeen } = useSocket();
  
  // Animation
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  // Xử lý animation khi có thông báo mới
  useEffect(() => {
    if (hasNewNotifications) {
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
  }, [hasNewNotifications, scaleAnim, opacityAnim]);
  
  // Xử lý khi nhấn vào biểu tượng thông báo
  const handlePress = () => {
    markNotificationsAsSeen();
    router.push('/(user)/Notification');
  };
  
  return (
    <TouchableOpacity 
      style={[styles.container, style]} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Ionicons name="notifications" size={size} color={color} />
      
      {/* Badge hiển thị khi có thông báo mới */}
      {hasNewNotifications && (
        <Animated.View 
          style={[
            styles.badge, 
            { backgroundColor: badgeColor },
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            }
          ]}
        >
          <Text style={styles.badgeText}>!</Text>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default NotificationBadge;