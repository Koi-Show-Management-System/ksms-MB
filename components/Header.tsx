// components/Header.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router"; // Import the router
import React, { useState, useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Image } from "react-native"; // Added Image
import { Feather } from '@expo/vector-icons';
import NotificationBadge from './NotificationBadge';

interface HeaderProps {
  title: string;
  // description: string; // Removed description
}

const Header: React.FC<HeaderProps> = ({ title }) => { // Removed description
  const [userFullName, setUserFullName] = useState<string>("");

  // Lấy tên người dùng từ AsyncStorage khi component mount
  useEffect(() => {
    const getUserName = async () => {
      try {
        const fullName = await AsyncStorage.getItem("userFullName");
        if (fullName) {
          setUserFullName(fullName);
        }
      } catch (error) {
        console.error("Lỗi khi lấy tên người dùng:", error);
      }
    };

    getUserName();
  }, []);

  // Function to navigate to UserMenu screen
  const navigateToUserMenu = () => {
    router.push("/(tabs)/home/UserMenu");
  };

  // Function to navigate to Home screen
  const navigateToHome = () => {
    router.push("/(tabs)/home/homepage");
  };
  
  // Function to navigate to Notification screen
  const navigateToNotification = () => {
    router.push("/(user)/Notification");
  };

  return (
    <View style={styles.header}>
      {/* Left side: Logo and Title */}
      <View style={styles.headerLeftContainer}>
        <TouchableOpacity onPress={navigateToHome}>
          <Image
            source={require('@/assets/images/logoMobile.png')} // Use require for static images
            style={styles.logoStyle}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.homeText}>{title}</Text>
      </View>

      {/* Right side: User greeting, notification and profile icon */}
      <View style={styles.headerRightContainer}>
        <Text style={styles.homeText}>Xin Chào {userFullName}</Text>
        <NotificationBadge style={styles.notificationIcon} />
        <TouchableOpacity onPress={navigateToUserMenu}>
          <View style={styles.profileIconContainer}>
            <Feather name="user" size={24} color="#666" />
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
  headerLeftContainer: { // Style for logo and title group
    flexDirection: "row",
    alignItems: "center",
    gap: 8, // Adjust gap as needed
  },
  logoStyle: { // Style for the logo
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
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  notificationIcon: {
    marginRight: 8,
  },
});

export default Header;
