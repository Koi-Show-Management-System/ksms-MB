import { router } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { login } from "../../services/authService";

interface SignInProps {
  onSignIn?: () => void;
  onSignUp?: () => void;
}

const SignIn: React.FC<SignInProps> = ({
  onSignIn = () => {
    router.push("/(tabs)/home/homepage");
  },
  onSignUp = () => {
    router.push("/(auth)/signUp");
  },
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSignIn = async () => {
    if (!email || !password) {
      setErrorMessage("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      await login(email, password);

      console.log("Login successful");

      // Navigate to home page
      router.push("/(tabs)/home/homepage");
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        "Login failed. Please check your credentials.";
      setErrorMessage(message);
      console.error("Login failed:", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={{
          uri: "https://dashboard.codeparrot.ai/api/image/Z5ve2-xZjZ9DnB_k/group-2.png",
        }}
        style={styles.logo}
      />

      <Text style={styles.title}>KSMS</Text>
      <Text style={styles.subtitle}>Join the Koi community today!</Text>

      <View style={styles.formContainer}>
        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        <Text style={styles.label}>Email address *</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z5ve2-xZjZ9DnB_k/frame.png",
            }}
            style={styles.inputIcon}
          />
        </View>

        <Text style={styles.label}>Password *</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="************"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z5ve2-xZjZ9DnB_k/frame-2.png",
            }}
            style={styles.inputIcon}
          />
        </View>

        <TouchableOpacity
          style={[styles.joinButton, isLoading && styles.joinButtonDisabled]}
          onPress={handleSignIn}
          disabled={isLoading}
          activeOpacity={0.8}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.joinButtonText}>Join now</Text>
          )}
        </TouchableOpacity>

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>New to KSMS?</Text>
          <TouchableOpacity onPress={onSignUp}>
            <Text style={styles.signupLink}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 20,
    alignItems: "center",
  },
  logo: {
    width: 120,
    height: 120,
    marginTop: 40,
  },
  title: {
    fontFamily: "Poppins",
    fontSize: 34,
    fontWeight: "700",
    color: "#030303",
    marginTop: 20,
  },
  subtitle: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "400",
    color: "#030303",
    marginTop: 10,
  },
  formContainer: {
    width: "100%",
    marginTop: 30,
  },
  label: {
    fontFamily: "Poppins",
    fontSize: 14,
    fontWeight: "700",
    color: "#030303",
    marginBottom: 8,
  },
  inputContainer: {
    width: "100%",
    height: 47,
    backgroundColor: "#F9F9F9D6",
    borderWidth: 1,
    borderColor: "#D2D2D7",
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  input: {
    flex: 1,
    fontFamily: "Poppins",
    fontSize: 14,
    fontWeight: "400",
    color: "#1D1D1F",
    paddingHorizontal: 15,
  },
  inputIcon: {
    width: 16,
    height: 16,
    marginRight: 15,
  },
  joinButton: {
    width: "100%",
    height: 48,
    backgroundColor: "#0A0A0A",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  joinButtonText: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  signupText: {
    fontFamily: "Poppins",
    fontSize: 14,
    fontWeight: "400",
    color: "#030303",
    marginRight: 5,
  },
  signupLink: {
    fontFamily: "Poppins",
    fontSize: 14,
    fontWeight: "700",
    color: "#030303",
  },
  errorText: {
    color: "#FF3B30",
    fontFamily: "Poppins",
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
  },
  joinButtonDisabled: {
    backgroundColor: "#888888",
  },
});

export default SignIn;
