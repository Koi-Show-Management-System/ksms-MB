import React from "react"; // Removed duplicate import and unused useEffect/useState
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native"; // Removed Dimensions
// Removed unused imports: LinearGradient, BlurView, StatusBar
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Dimensions không còn cần thiết ở đây

interface FooterProps {
  activeTab?:
    | "home"
    | "notifications"
    | "camera"
    | "profile"
    | "shows"
    | "blog";
  onHomePress?: () => void;
  onNotificationPress?: () => void;
  onCameraPress?: () => void;
  onProfilePress?: () => void;
  onShowsPress?: () => void;
  onBlogPress?: () => void;
}

const Footer: React.FC<FooterProps> = ({
  activeTab = "home",
  onHomePress,
  onNotificationPress,
  onCameraPress,
  onProfilePress,
  onShowsPress,
  onBlogPress,
}) => {
  const insets = useSafeAreaInsets();
  // screenHeight và useEffect không còn cần thiết

  // Xử lý các sự kiện nếu không được truyền vào
  const handleHomePress = () => {
    if (onHomePress) {
      onHomePress();
    } else {
      router.push("/(tabs)/home/homepage"); // Sử dụng đường dẫn đầy đủ
    }
  };

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      router.push("/Notification");
    }
  };

  const handleCameraPress = () => {
    if (onCameraPress) {
      onCameraPress();
    } else {
      // Mặc định hiển thị thông báo đang phát triển
      alert("Đang phát triển tính năng camera");
    }
  };

  const handleProfilePress = () => {
    if (onProfilePress) {
      onProfilePress();
    } else {
      router.push("/UserProfile");
    }
  };

  const handleShowsPress = () => {
    if (onShowsPress) {
      onShowsPress();
    } else {
      router.push("/shows/KoiShowsPage");
    }
  };

  const handleBlogPress = () => {
    if (onBlogPress) {
      onBlogPress();
    } else {
      router.push("/(tabs)/blog");
    }
  };

  return (
    // Loại bỏ paddingBottom khỏi footerWrapper
    <View style={styles.footerWrapper}>
      <View style={styles.footerBorder} />
      {/* Áp dụng paddingBottom cho footerContent */}
      <View style={[styles.footerContent, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity
          style={[
            styles.footerItem,
            activeTab === "home" && styles.activeFooterItem,
          ]}
          onPress={handleHomePress}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z79CVK7obB3a4bxY/frame-5.png",
            }}
            style={[
              styles.footerIcon,
              activeTab === "home" && styles.activeFooterIcon,
            ]}
          />
          <Text
            style={[
              styles.footerText,
              activeTab === "home" && styles.activeFooterText,
            ]}>
            Trang chủ
          </Text>
          {activeTab === "home" && <View style={styles.activeIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.footerItem,
            activeTab === "shows" && styles.activeFooterItem,
          ]}
          onPress={handleShowsPress}>
          <Image
            source={{
              uri: "https://img.icons8.com/material-rounded/24/000000/calendar.png",
            }}
            style={[
              styles.footerIcon,
              activeTab === "shows" && styles.activeFooterIcon,
            ]}
          />
          <Text
            style={[
              styles.footerText,
              activeTab === "shows" && styles.activeFooterText,
            ]}>
            Sự kiện
          </Text>
          {activeTab === "shows" && <View style={styles.activeIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.footerItem,
            activeTab === "blog" && styles.activeFooterItem,
          ]}
          onPress={handleBlogPress}>
          <Image
            source={{
              uri: "https://img.icons8.com/material-rounded/24/000000/news.png",
            }}
            style={[
              styles.footerIcon,
              activeTab === "blog" && styles.activeFooterIcon,
            ]}
          />
          <Text
            style={[
              styles.footerText,
              activeTab === "blog" && styles.activeFooterText,
            ]}>
            Tin tức
          </Text>
          {activeTab === "blog" && <View style={styles.activeIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.footerItem,
            activeTab === "notifications" && styles.activeFooterItem,
          ]}
          onPress={handleNotificationPress}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z79CVK7obB3a4bxY/frame-7.png",
            }}
            style={[
              styles.footerIcon,
              activeTab === "notifications" && styles.activeFooterIcon,
            ]}
          />
          <Text
            style={[
              styles.footerText,
              activeTab === "notifications" && styles.activeFooterText,
            ]}>
            Thông báo
          </Text>
          {activeTab === "notifications" && (
            <View style={styles.activeIndicator} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.footerItem,
            activeTab === "profile" && styles.activeFooterItem,
          ]}
          onPress={handleProfilePress}>
          <Image
            source={{
              uri: "https://img.icons8.com/material-rounded/24/000000/user.png",
            }}
            style={[
              styles.footerIcon,
              activeTab === "profile" && styles.activeFooterIcon,
            ]}
          />
          <Text
            style={[
              styles.footerText,
              activeTab === "profile" && styles.activeFooterText,
            ]}>
            Tài khoản
          </Text>
          {activeTab === "profile" && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footerWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    zIndex: 1000,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    // Không đặt chiều cao cố định ở đây để tự động điều chỉnh theo nội dung
  },
  footerBorder: {
    height: 1,
    width: "100%",
    backgroundColor: "#F5F5F5",
  },
  footerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    minHeight: 70, // Sử dụng minHeight thay vì height để đảm bảo có thể mở rộng nếu cần
    // paddingBottom được thêm động ở trên
  },
  footerItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  activeFooterItem: {
    backgroundColor: "rgba(229, 57, 53, 0.05)",
    borderRadius: 8,
  },
  footerIcon: {
    width: 24,
    height: 24,
    tintColor: "#64748b",
  },
  activeFooterIcon: {
    tintColor: "#E53935",
  },
  footerText: {
    fontFamily: "Lexend Deca",
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
  activeFooterText: {
    color: "#E53935",
    fontWeight: "500",
  },
  footerCameraButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  footerCameraCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#1A237E",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#1A237E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderWidth: 3,
    borderColor: "#FFC107",
  },
  footerCameraIcon: {
    width: 24,
    height: 24,
    tintColor: "#FFFFFF",
  },
  activeIndicator: {
    position: "absolute",
    bottom: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FFC107",
  },
});

export default Footer;
