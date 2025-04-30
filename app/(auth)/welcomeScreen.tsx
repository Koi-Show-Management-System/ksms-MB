import { router } from "expo-router"; // Import router
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../context/AuthContext";

const WelcomeScreen: React.FC = () => {
  const { loginAsGuest } = useAuth();

  const handleGuestLogin = async () => {
    try {
      await loginAsGuest();
    } catch (error) {
      console.error("Error logging in as guest:", error);
    }
  };

  return (
    <View style={styles.welcomeScreen}>
      <View style={styles.contentContainer}>
        <View style={styles.headerSection}>
          <Text style={styles.title}>Koi Show Hub</Text>
          <Text style={styles.description}>
            Register for events, purchase tickets, and view results.
          </Text>
        </View>
        <View style={styles.koiImageContainer}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/assets/Z4F9ZAIBBLnlud8N",
            }}
            alt="Koi fish illustration"
            style={styles.koiImage}
          />
        </View>
        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={() => router.push("/(auth)/signIn")} // Navigate to signIn screen
        >
          <Text style={styles.getStartedButtonText}>Đăng nhập</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.guestButton} onPress={handleGuestLogin}>
          <Text style={styles.guestButtonText}>Tiếp tục với tư cách khách</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  welcomeScreen: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    fontFamily: "Poppins-Regular", // You might need to adjust this based on your font setup
  },
  contentContainer: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 48,
  },
  headerSection: {
    textAlign: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    color: "#030303",
    margin: 0,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    fontWeight: "400",
    color: "#030303",
    margin: 0,
    maxWidth: 321,
    textAlign: "center",
    lineHeight: 21, // Equivalent to 1.5 with fontSize 14
  },
  koiImageContainer: {
    width: 258,
    height: 258,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  koiImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  getStartedButton: {
    width: 327,
    height: 56,
    backgroundColor: "#000000",
    borderRadius: 8,
    cursor: "pointer", // This won't have a visual effect in React Native
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
    marginBottom: 16,
  },
  getStartedButtonText: {
    color: "#ffffff",
    fontFamily: "Poppins-Regular", // You might need to adjust this based on your font setup
    fontSize: 16,
    fontWeight: "400",
  },
  guestButton: {
    width: 327,
    height: 56,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#000000",
    cursor: "pointer", // This won't have a visual effect in React Native
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
  },
  guestButtonText: {
    color: "#000000",
    fontFamily: "Poppins-Regular", // You might need to adjust this based on your font setup
    fontSize: 16,
    fontWeight: "400",
  },
});

export default WelcomeScreen;
