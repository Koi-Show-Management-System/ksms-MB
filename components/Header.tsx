// components/Header.tsx
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router"; // Import the router
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native"; // Added Image
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import NotificationBadge from "./NotificationBadge";

interface HeaderProps {
  title: string;
  // description: string; // Removed description
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  // Removed description
  const { userData, isGuest } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Lấy ảnh đại diện từ context hoặc AsyncStorage khi component mount
  useEffect(() => {

    // Lấy ảnh đại diện từ AsyncStorage hoặc từ API
    const getUserAvatar = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (userId) {
          // Nếu có userId, thử lấy thông tin avatar từ AsyncStorage
          const avatar = await AsyncStorage.getItem("userAvatar");
          if (avatar) {
            setProfileImage(avatar);
          } else {
            // Nếu không có trong AsyncStorage, thử lấy từ API
            try {
              const response = await api.get(`/api/v1/account/${userId}`);
              if (response.data.statusCode === 200 && response.data.data.avatar) {
                setProfileImage(response.data.data.avatar);
                // Lưu vào AsyncStorage để lần sau không cần gọi API
                await AsyncStorage.setItem("userAvatar", response.data.data.avatar);
              }
            } catch (apiError) {
              console.error("Lỗi khi lấy avatar từ API:", apiError);
            }
          }
        }
      } catch (error) {
        console.error("Lỗi khi lấy ảnh đại diện:", error);
      }
    };
    getUserAvatar();
  }, [userData]);

  // Function to handle user icon click
  const handleUserIconClick = () => {
    if (isGuest()) {
      // For guest users, navigate directly to sign in screen
      router.push("/(auth)/signIn");
    } else {
      // For authenticated users, navigate to user menu
      router.push("/(tabs)/home/UserMenu");
    }
  };

  // Function to navigate to Home screen
  const navigateToHome = () => {
    router.push("/(tabs)/home/homepage");
  };

  return (
    <View style={styles.header}>
      {/* Left side: Logo and Title */}
      <View style={styles.headerLeftContainer}>
        <TouchableOpacity onPress={navigateToHome}>
          <Image
            source={require("@/assets/images/logoMobile.png")} // Use require for static images
            style={styles.logoStyle}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.homeText}>{title}</Text>
      </View>

      {/* Right side: User greeting, notification and profile icon */}
      <View style={styles.headerRightContainer}>
        <Text style={styles.homeText}>
          {isGuest() ? "Chế độ khách" : ``}
        </Text>
        {!isGuest() && <NotificationBadge style={styles.notificationIcon} />}
        <TouchableOpacity onPress={handleUserIconClick}>
          <View style={styles.profileIconContainer}>
            {!isGuest() && profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.profileImage}
                resizeMode="cover"
              />
            ) : (
              <Feather
                name={isGuest() ? "log-in" : "user"}
                size={24}
                color="#666"
              />
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  homeText: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "700",
    color: "#030303",
  },
  headerLeftContainer: {
    // Style for logo and title group
    flexDirection: "row",
    alignItems: "center",
    gap: 8, // Adjust gap as needed
  },
  logoStyle: {
    // Style for the logo
    width: 30, // Adjust size as needed
    height: 30, // Adjust size as needed
  },
  headerRightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchButton: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  searchIcon: {
    width: 13,
    height: 13,
  },
  profileIconContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
    overflow: "hidden",
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  notificationIcon: {
    marginRight: 8,
  },
});

export default Header;
