import { router } from "expo-router";
import React from "react";
import {
  Image,
  ImageBackground,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Welcome = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.logoContainer}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z625UiMKRqR5xrL4/logo.png",
            }}
            style={styles.logo}
          />
          <Text style={styles.appName}>KSMS</Text>
        </View>

        <View style={styles.welcomeTextContainer}>
          <Text style={styles.welcomeTitle}>
            Welcome to{" "}
            <Text style={styles.highlightedText}>Koi Show Management System</Text>
          </Text>
          <Text style={styles.welcomeSubtitle}>
            The all-in-one platform for koi enthusiasts, breeders, and show
            organizers.
          </Text>
        </View>

        <View style={styles.imageContainer}>
          <ImageBackground
            source={{
              uri: "https://images.unsplash.com/photo-1520990644280-70de5f597c85?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80",
            }}
            style={styles.backgroundImage}
            imageStyle={{ borderRadius: 24 }}
          >
            <View style={styles.overlay} />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Discover & Participate</Text>
              <Text style={styles.featureSubtitle}>
                Find upcoming koi shows, register your prized koi, and connect with
                the community.
              </Text>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.signUpButton}
            onPress={() => router.push("/(auth)/signUp")}
          >
            <Text style={styles.signUpButtonText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => router.push("/(auth)/signIn")}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 20 : 0,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
    marginTop: 10,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 10,
  },
  appName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333333",
    fontFamily: "Poppins-Bold",
  },
  welcomeTextContainer: {
    marginBottom: 30,
  },
  welcomeTitle: {
    fontSize: 30,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 10,
    fontFamily: "Poppins-Bold",
  },
  highlightedText: {
    color: "#5664F5",
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#666666",
    lineHeight: 24,
    fontFamily: "Poppins",
  },
  imageContainer: {
    width: "100%",
    height: 220,
    marginBottom: 40,
    borderRadius: 24,
    overflow: "hidden",
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 24,
  },
  featureTextContainer: {
    padding: 20,
  },
  featureTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
    fontFamily: "Poppins-Bold",
  },
  featureSubtitle: {
    fontSize: 14,
    color: "#FFFFFF",
    lineHeight: 20,
    fontFamily: "Poppins",
  },
  buttonsContainer: {
    marginBottom: 30,
  },
  signUpButton: {
    backgroundColor: "#5664F5",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#5664F5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  signUpButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Poppins-Bold",
  },
  signInButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  signInButtonText: {
    color: "#333333",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Poppins-Bold",
  },
});

export default Welcome;
