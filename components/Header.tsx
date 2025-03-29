// components/Header.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router"; // Import the router
import React, { useState, useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from '@expo/vector-icons';

interface HeaderProps {
  title: string;
  description: string;
}

const Header: React.FC<HeaderProps> = ({ title, description }) => {
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

  return (
    <View style={styles.header}>
      <TouchableOpacity>
        <Text style={styles.homeText}>{title}</Text>
      </TouchableOpacity>
      <TouchableOpacity>
        <Text style={styles.homeText}>{description || ""}</Text>
      </TouchableOpacity>
      <View style={styles.headerRightContainer}>
        <Text style={styles.homeText}>Xin Chào {userFullName}</Text>
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
});

export default Header;
