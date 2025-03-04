import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { register } from "../../services/authService";

interface FormData {
  fullName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

const Signup: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    username: "", // Added username field initialization
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    // Clear any previous error
    setErrorMessage("");

    // Form validation
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.username ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setErrorMessage("All fields are required");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match!");
      return;
    }

    setIsLoading(true);

    try {
      // Pass the fields in the order expected by the API and fixed function
      const result = await register(
        formData.email,
        formData.password,
        formData.username,
        formData.fullName
      );

      console.log("Registration result:", result);

      // Check if registration was successful
      if (result.statusCode === 201) {
        Alert.alert(
          "Registration Successful",
          "You can now sign in with your account",
          [{ text: "OK", onPress: () => router.push("/(auth)/signIn") }]
        );
      } else {
        setErrorMessage(result.message || "Registration failed");
      }
    } catch (error: any) {
      // Handle API errors
      const message =
        error.response?.data?.message ||
        "Registration failed. Please try again.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z5vae-xZjZ9DnB_f/group-2.png",
            }}
            style={styles.logo}
          />
          <Text style={styles.title}>KSMS</Text>
          <Text style={styles.subtitle}>
            Become a part of the Koi community!
          </Text>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {/* Full Name Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="John Smith"
              value={formData.fullName}
              onChangeText={(value) => handleInputChange("fullName", value)}
            />
          </View>

          {/* Email Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email address *</Text>
            <TextInput
              style={styles.input}
              placeholder="Email@email.com"
              value={formData.email}
              onChangeText={(value) => handleInputChange("email", value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Username Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username *</Text>
            <TextInput
              style={styles.input}
              placeholder="johndoe"
              value={formData.username}
              onChangeText={(value) => handleInputChange("username", value)}
              autoCapitalize="none"
            />
          </View>

          {/* Password Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="**********"
              value={formData.password}
              onChangeText={(value) => handleInputChange("password", value)}
              secureTextEntry
            />
          </View>

          {/* Confirm Password Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="**********"
              value={formData.confirmPassword}
              onChangeText={(value) =>
                handleInputChange("confirmPassword", value)
              }
              secureTextEntry
            />
          </View>
        </View>

        {/* Error Message */}
        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        {/* Sign Up Button */}
        <TouchableOpacity
          style={[styles.button, isLoading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        {/* Footer Section */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/signIn")}>
            <Text style={styles.footerLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontFamily: "Poppins",
    fontWeight: "700",
    fontSize: 34,
    marginVertical: 15,
    color: "#030303",
  },
  subtitle: {
    fontFamily: "Poppins",
    fontWeight: "400",
    fontSize: 16,
    color: "#030303",
  },
  form: {
    width: "100%",
    maxWidth: 334,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontFamily: "Poppins",
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 8,
    color: "#030303",
  },
  input: {
    width: "100%",
    height: 47,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#d2d2d7",
    padding: 10,
    backgroundColor: "#f9f9f9d6",
    fontFamily: "Poppins",
    fontSize: 14,
  },
  errorText: {
    color: "red",
    fontFamily: "Poppins",
    fontSize: 14,
    marginBottom: 10,
  },
  button: {
    width: "100%",
    maxWidth: 334,
    height: 48,
    backgroundColor: "#0a0a0a",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
    marginBottom: 20,
  },
  buttonText: {
    color: "#ffffff",
    fontFamily: "Poppins",
    fontWeight: "700",
    fontSize: 16,
  },
  footer: {
    alignItems: "center",
  },
  footerText: {
    fontFamily: "Poppins",
    fontWeight: "400",
    fontSize: 14,
    color: "#030303",
  },
  footerLink: {
    fontFamily: "Poppins",
    fontWeight: "700",
    fontSize: 14,
    color: "#030303",
    textDecorationLine: "underline",
  },
});

export default Signup;
