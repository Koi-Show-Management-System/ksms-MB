// components/Header.tsx
import { router } from "expo-router"; // Import the router
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface HeaderProps {
  title: string;
  description: string;
}

const Header: React.FC<HeaderProps> = ({ title, description }) => {
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
        <TouchableOpacity style={styles.searchButton}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/assets/Z4FRFQIBBLnlud6Q",
            }}
            style={styles.searchIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={navigateToUserMenu}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/assets/Z4FRFQIBBLnlud6R",
            }}
            style={styles.profileImage}
          />
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
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});

export default Header;
