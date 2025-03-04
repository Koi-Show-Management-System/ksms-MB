// app/(user)/Notification.tsx
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Define notification types for better organization
enum NotificationType {
  EVENT = "event",
  REGISTRATION = "registration",
  PURCHASE = "purchase",
  RESULT = "result",
  OFFER = "offer",
  VOTE = "vote",
  LIVESTREAM = "livestream",
}

// Define valid routes for type checking
type ValidRoute =
  | "/(tabs)/shows/KoiShowsPage"
  | "/(tabs)/shows/koiRegistration"
  | "/(tabs)/shows/BuyTickets"
  | "/(tabs)/shows/AwardScreen"
  | "/(tabs)/shows/LiveStream"
  | "/(tabs)/home/homepage"
  | "/(tabs)/home/UserMenu";

// Interface for notification data
interface Notification {
  id: string;
  icon: string;
  title: string;
  description: string;
  type: NotificationType;
  date: string; // ISO date string
  isRead: boolean;
  actionUrl?: ValidRoute; // Optional URL or route to navigate to
}

interface NotificationItemProps {
  notification: Notification;
  onPress: (notification: Notification) => void;
  onMarkAsRead: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
  onMarkAsRead,
}) => {
  // Format the date to a more readable format
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();

    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    // If yesterday, show "Yesterday"
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    // Otherwise show date
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  // Get icon background color based on notification type
  const getBackgroundColor = (type: NotificationType): string => {
    switch (type) {
      case NotificationType.EVENT:
        return "#4A90E2";
      case NotificationType.REGISTRATION:
        return "#50C878";
      case NotificationType.PURCHASE:
        return "#F5A623";
      case NotificationType.RESULT:
        return "#9B59B6";
      case NotificationType.OFFER:
        return "#E74C3C";
      case NotificationType.VOTE:
        return "#3498DB";
      case NotificationType.LIVESTREAM:
        return "#E74C3C";
      default:
        return "#95A5A6";
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.itemContainer,
        notification.isRead ? styles.itemRead : null,
      ]}
      onPress={() => {
        onPress(notification);
        if (!notification.isRead) {
          onMarkAsRead(notification.id);
        }
      }}
      activeOpacity={0.7}>
      <View style={styles.itemContent}>
        <View
          style={[
            styles.iconBackground,
            { backgroundColor: getBackgroundColor(notification.type) },
          ]}>
          <Image
            source={{ uri: notification.icon }}
            style={styles.itemIcon}
            resizeMode="contain"
          />
        </View>
        <View style={styles.itemTextContainer}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {notification.title}
          </Text>
          {notification.description ? (
            <Text style={styles.itemDescription} numberOfLines={2}>
              {notification.description}
            </Text>
          ) : null}
          <Text style={styles.itemDate}>{formatDate(notification.date)}</Text>
        </View>
        {!notification.isRead && <View style={styles.unreadIndicator} />}
        <Image
          source={{
            uri: "https://dashboard.codeparrot.ai/api/image/Z79HGa7obB3a4bxe/frame.png",
          }}
          style={styles.itemChevron}
          resizeMode="contain"
        />
      </View>
    </TouchableOpacity>
  );
};

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<NotificationType | "all">("all");

  // Mock data - in a real app, this would come from an API
  const mockNotifications: Notification[] = [
    {
      id: "1",
      icon: "https://dashboard.codeparrot.ai/api/image/Z79HGa7obB3a4bxe/group.png",
      title: "Reminder: Koi fish competition tomorrow",
      description:
        "Don't forget to attend the annual Koi competition starting at 10 AM.",
      type: NotificationType.EVENT,
      date: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      isRead: false,
      actionUrl: "/(tabs)/shows/KoiShowsPage",
    },
    {
      id: "2",
      icon: "https://dashboard.codeparrot.ai/api/image/Z79HGa7obB3a4bxe/group-2.png",
      title: "Register for upcoming Koi fish exhibition",
      description:
        "Registration is now open for the Spring Koi Exhibition. Early bird discounts available!",
      type: NotificationType.REGISTRATION,
      date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      isRead: false,
      actionUrl: "/(tabs)/shows/koiRegistration",
    },
    {
      id: "3",
      icon: "https://dashboard.codeparrot.ai/api/image/Z79HGa7obB3a4bxe/group-3.png",
      title: "Purchase tickets for Koi fish showcase",
      description:
        "Limited tickets available for the International Koi Showcase next month.",
      type: NotificationType.PURCHASE,
      date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
      isRead: true,
      actionUrl: "/(tabs)/shows/BuyTickets",
    },
    {
      id: "4",
      icon: "https://dashboard.codeparrot.ai/api/image/Z79HGa7obB3a4bxe/group-4.png",
      title: "Your event registration is confirmed",
      description:
        "Thank you for registering for the Summer Koi Exhibition. Your registration #KE2023-456 is confirmed.",
      type: NotificationType.REGISTRATION,
      date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      isRead: true,
    },
    {
      id: "5",
      icon: "https://dashboard.codeparrot.ai/api/image/Z79HGa7obB3a4bxe/group-5.png",
      title: "Exclusive offer for Koi fish enthusiasts",
      description:
        "Get 20% off on premium Koi food and supplies this weekend only!",
      type: NotificationType.OFFER,
      date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
      isRead: false,
    },
    {
      id: "6",
      icon: "https://dashboard.codeparrot.ai/api/image/Z79HGa7obB3a4bxe/group-6.png",
      title: "Results of Koi fish competition are in!",
      description:
        "Check out the winners of this year's National Koi Competition.",
      type: NotificationType.RESULT,
      date: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
      isRead: false,
      actionUrl: "/(tabs)/shows/AwardScreen",
    },
    {
      id: "7",
      icon: "https://dashboard.codeparrot.ai/api/image/Z79HGa7obB3a4bxe/group-7.png",
      title: "Vote for your favorite Koi fish",
      description: "Public voting is now open for the People's Choice Award.",
      type: NotificationType.VOTE,
      date: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(), // 4 days ago
      isRead: true,
    },
    {
      id: "8",
      icon: "https://dashboard.codeparrot.ai/api/image/Z79HGa7obB3a4bxe/group-8.png",
      title: "Live stream of Koi fish judging starts soon",
      description:
        "Tune in at 2 PM for the live judging of the championship round.",
      type: NotificationType.LIVESTREAM,
      date: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(), // 5 days ago
      isRead: true,
      actionUrl: "/(tabs)/shows/LiveStream",
    },
  ];

  // Load notifications
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setNotifications(mockNotifications);
      setLoading(false);
    }, 1000);
  }, []);

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setNotifications(mockNotifications);
      setRefreshing(false);
    }, 1000);
  };

  // Handle notification press
  const handleNotificationPress = (notification: Notification) => {
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    } else {
      // Show notification details in an alert if no action URL
      Alert.alert(notification.title, notification.description, [
        { text: "OK", onPress: () => console.log("OK Pressed") },
      ]);
    }
  };

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(
      notifications.map((notification) => ({ ...notification, isRead: true }))
    );
  };

  // Filter notifications
  const filteredNotifications =
    filter === "all"
      ? notifications
      : notifications.filter((notification) => notification.type === filter);

  // Count unread notifications
  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  // Filter options
  const filterOptions = [
    { label: "All", value: "all" },
    { label: "Events", value: NotificationType.EVENT },
    { label: "Registration", value: NotificationType.REGISTRATION },
    { label: "Purchases", value: NotificationType.PURCHASE },
    { label: "Results", value: NotificationType.RESULT },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z79HGa7obB3a4bxe/frame-12.png",
            }}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={markAllAsRead}
            style={styles.markAllReadButton}>
            <Text style={styles.markAllReadText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}>
        {filterOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.filterTab,
              filter === option.value && styles.activeFilterTab,
            ]}
            onPress={() => setFilter(option.value as NotificationType | "all")}>
            <Text
              style={[
                styles.filterText,
                filter === option.value && styles.activeFilterText,
              ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Notifications list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
        </View>
      ) : filteredNotifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z79HGa7obB3a4bxe/empty-notifications.png",
            }}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyText}>No notifications</Text>
          <Text style={styles.emptySubtext}>
            You don't have any notifications at the moment
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.notificationsContainer}
          contentContainerStyle={styles.scrollViewContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          {filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onPress={handleNotificationPress}
              onMarkAsRead={markAsRead}
            />
          ))}
        </ScrollView>
      )}

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity
          style={styles.iconContainer}
          onPress={() => router.push("/(tabs)/home/homepage")}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z79HGa7obB3a4bxe/frame-14.png",
            }}
            style={styles.icon}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconContainer, styles.activeIconContainer]}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z79HGa7obB3a4bxe/frame-16.png",
            }}
            style={[styles.icon, styles.activeIcon]}
          />
          {unreadCount > 0 && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconContainer}
          onPress={() => router.push("/(tabs)/home/UserMenu")}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z79HGa7obB3a4bxe/frame-15.png",
            }}
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50, // Increased for better spacing on devices with notches
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  backIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  title: {
    flex: 1,
    fontFamily: "Poppins",
    fontSize: 24,
    fontWeight: "700",
    color: "#030303",
  },
  markAllReadButton: {
    padding: 8,
  },
  markAllReadText: {
    color: "#4A90E2",
    fontSize: 14,
    fontWeight: "500",
  },
  filterContainer: {
    maxHeight: 50,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    gap: 12,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
  },
  activeFilterTab: {
    backgroundColor: "#4A90E2",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666666",
  },
  activeFilterText: {
    color: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
  },
  notificationsContainer: {
    flex: 1,
    width: "100%",
  },
  scrollViewContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
  },
  // Notification Item Styles
  itemContainer: {
    width: "100%",
    marginVertical: 6,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemRead: {
    opacity: 0.7,
  },
  itemContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
  },
  iconBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  itemIcon: {
    width: 20,
    height: 20,
  },
  itemTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 12,
    color: "#999999",
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4A90E2",
    marginRight: 8,
  },
  itemChevron: {
    width: 16,
    height: 16,
    marginLeft: 8,
  },
  // Bottom Navigation Styles
  bottomNavigation: {
    width: "100%",
    height: 70,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingBottom: 20, // Extra padding for iPhone home indicator
  },
  iconContainer: {
    padding: 10,
    borderRadius: 8,
  },
  activeIconContainer: {
    backgroundColor: "#F5F5F5",
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  activeIcon: {
    tintColor: "#4A90E2",
  },
  badgeContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#E74C3C",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});

export default Notifications;
