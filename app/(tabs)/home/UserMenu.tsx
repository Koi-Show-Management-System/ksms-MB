// app/(tabs)/home/UserMenu.tsx
import { router } from "expo-router"; // Import router from expo-router
import React, { useEffect } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../../context/AuthContext";

interface UserMenuProps {
  onNavigate?: (route: string) => void;
  activeRoute?: string;
}

const UserMenu: React.FC<UserMenuProps> = ({
  onNavigate = () => {},
  activeRoute = "mykoi",
}) => {
  const { isGuest, logout } = useAuth();

  // Check if user is in guest mode and redirect if necessary
  useEffect(() => {
    if (isGuest()) {
      // Redirect to sign in screen directly without showing alert
      router.replace("/(auth)/signIn");
    }
  }, [isGuest]);

  const menuItems = [
    {
      id: "koilist",
      label: "Koi Của Tôi",
      icon: "https://dashboard.codeparrot.ai/api/image/Z7z3sKxVDdhgd23o/frame.png",
      requiresAuth: true,
    },
    {
      id: "notification",
      label: "Thông Báo",
      icon: "https://dashboard.codeparrot.ai/api/image/Z7z3sKxVDdhgd23o/frame-3.png",
      requiresAuth: true,
    },
    {
      id: "myorders",
      label: "Đơn Hàng",
      icon: "https://dashboard.codeparrot.ai/api/image/Z7z3sKxVDdhgd23o/frame-5.png",
      requiresAuth: true,
    },
    {
      id: "profile",
      label: "Hồ Sơ Cá Nhân",
      icon: "https://dashboard.codeparrot.ai/api/image/Z7z3sKxVDdhgd23o/frame-5.png",
      requiresAuth: true,
    },
    {
      id: "competitionsjoined",
      label: "Cuộc Thi Đã Tham Gia",
      icon: "https://dashboard.codeparrot.ai/api/image/Z7z3sKxVDdhgd23o/frame-5.png",
      requiresAuth: true,
    },
    {
      id: "login",
      label: "Đăng nhập",
      icon: "https://dashboard.codeparrot.ai/api/image/Z7z3sKxVDdhgd23o/frame-5.png",
      requiresAuth: false,
      guestOnly: true,
    },
  ];

  // Function to handle navigation
  const handleNavigation = (
    routeId: string,
    requiresAuth: boolean,
    guestOnly: boolean = false
  ) => {
    // Call the onNavigate prop for backward compatibility
    onNavigate(routeId);

    // If this is a guest-only option and user is not a guest, do nothing
    if (guestOnly && !isGuest()) {
      return;
    }

    // If this requires auth and user is a guest, redirect to login
    if (requiresAuth && isGuest()) {
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
      return;
    }

    // Handle navigation based on route ID
    switch (routeId) {
      case "koilist":
        router.push("/(user)/KoiList");
        break;
      case "notification":
        router.push("/(user)/Notification");
        break;
      case "profile":
        router.push("/(user)/UserProfile");
        break;
      case "transactions":
        router.push("/(user)/Transactions");
        break;
      case "myorders":
        router.push("/(user)/MyOrders");
        break;
      case "competitionsjoined":
        router.push("/(user)/CompetitionJoined");
        break;
      case "login":
        router.push("/(auth)/signIn");
        break;
    }
  };

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter((item) => {
    if (isGuest()) {
      // For guests, only show items that don't require auth or are guest-only
      return !item.requiresAuth || item.guestOnly;
    } else {
      // For authenticated users, don't show guest-only items
      return !item.guestOnly;
    }
  });

  return (
    <View style={styles.container}>
      <View style={styles.menuContainer}>
        {filteredMenuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.menuItem,
              activeRoute === item.id && styles.activeMenuItem,
            ]}
            onPress={() =>
              handleNavigation(
                item.id,
                item.requiresAuth || false,
                item.guestOnly || false
              )
            }>
            <Image source={{ uri: item.icon }} style={styles.menuIcon} />
            <Text
              style={[
                styles.menuText,
                activeRoute === item.id && styles.activeMenuText,
              ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}

        {!isGuest() && (
          <TouchableOpacity
            style={[styles.menuItem, styles.logoutButton]}
            onPress={() => {
              Alert.alert(
                "Đăng xuất",
                "Bạn có chắc chắn muốn đăng xuất không?",
                [
                  {
                    text: "Hủy",
                    style: "cancel",
                  },
                  {
                    text: "Đăng xuất",
                    onPress: async () => {
                      try {
                        await logout();
                      } catch (error) {
                        console.error("Lỗi khi đăng xuất:", error);
                      }
                    },
                    style: "destructive",
                  },
                ]
              );
            }}>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z7z3sKxVDdhgd23o/frame-5.png",
              }}
              style={styles.menuIcon}
            />
            <Text style={[styles.menuText, styles.logoutText]}>Đăng xuất</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  menuContainer: {
    paddingHorizontal: 16,
    marginTop: 20,
    gap: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F2",
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  activeMenuItem: {
    backgroundColor: "#e0e0e0",
    borderWidth: 1,
    borderColor: "#bdbdbd",
  },
  menuIcon: {
    width: 20,
    height: 20,
  },
  menuText: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Roboto",
    color: "#030303",
  },
  activeMenuText: {
    color: "#0056b3",
  },
  logoutButton: {
    backgroundColor: "#FFF0F0",
    borderWidth: 1,
    borderColor: "#FFD0D0",
    marginTop: 20,
  },
  logoutText: {
    color: "#D32F2F",
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E6E6E6",
  },
  bottomNavItem: {
    padding: 8,
  },
  bottomNavIcon: {
    width: 28,
    height: 28,
  },
});

export default UserMenu;
