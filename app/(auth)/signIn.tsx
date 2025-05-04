import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { z } from "zod";
import { useAuth } from "../../context/AuthContext";
import { passwordValidator } from "../../utils/validationUtils";

// Define validation schema using zod
const signInSchema = z.object({
  email: z
    .string()
    .min(1, "Email không được để trống")
    .email("Email không hợp lệ")
    .regex(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      "Email không đúng định dạng"
    ),
  password: z.string().min(1, "Mật khẩu không được để trống"),
});

// Type for validation errors state
interface ValidationErrors {
  email?: string[];
  password?: string[];
}

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
  const { login, loginAsGuest } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );

  const handleSignIn = async () => {
    // Validate form data using zod schema
    const validationResult = signInSchema.safeParse({ email, password });

    if (!validationResult.success) {
      // If validation fails, format errors and update state
      const formattedErrors = validationResult.error.flatten().fieldErrors;
      setValidationErrors(formattedErrors);
      setIsLoading(false);
      return;
    }

    // Clear previous errors if validation passes
    setValidationErrors({});
    setIsLoading(true);

    try {
      // Call login function from AuthContext
      await login(validationResult.data.email, validationResult.data.password);
      console.log("Login successful");
      // Navigate on success (interceptor handles success toast if API returns message)
      router.push("/(tabs)/home/homepage");
    } catch (error: any) {
      // Interceptor handles API error toasts.
      console.error("Login failed in component catch:", error);
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
      <Text style={styles.subtitle}>Chào mừng bạn trở lại!</Text>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Email *</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="email@email.com"
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
        {/* Display email validation error */}
        {validationErrors.email && (
          <Text style={styles.fieldErrorText}>{validationErrors.email[0]}</Text>
        )}

        <Text style={styles.label}>Mật khẩu *</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="******"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-outline" : "eye-off-outline"}
              size={24}
              color="#666"
            />
          </TouchableOpacity>
        </View>
        {/* Display password validation error */}
        {validationErrors.password && (
          <Text style={styles.fieldErrorText}>
            {validationErrors.password[0]}
          </Text>
        )}

        {/* Remember Me checkbox */}
        <View style={styles.rememberMeContainer}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setRememberMe(!rememberMe)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: rememberMe }}>
            <View
              style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe && (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              )}
            </View>
            <Text style={styles.rememberMeText}>Ghi nhớ đăng nhập</Text>
          </TouchableOpacity>

          {/* Forgot password link */}
          <TouchableOpacity
            onPress={() => router.push("/(auth)/forgot-password")}
            accessibilityRole="button"
            accessibilityLabel="Quên mật khẩu">
            <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.joinButton, isLoading && styles.joinButtonDisabled]}
          onPress={handleSignIn}
          disabled={isLoading}
          activeOpacity={0.8}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.joinButtonText}>Đăng nhập</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.guestButton}
          onPress={async () => {
            try {
              setIsLoading(true);
              await loginAsGuest();
              router.push("/(tabs)/home/homepage");
            } catch (error) {
              console.error("Guest login failed:", error);
            } finally {
              setIsLoading(false);
            }
          }}
          disabled={isLoading}>
          <Text style={styles.guestButtonText}>Tiếp tục với tư cách khách</Text>
        </TouchableOpacity>

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Chưa có tài khoản?</Text>
          <TouchableOpacity onPress={onSignUp}>
            <Text style={styles.signupLink}>Đăng ký</Text>
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
    position: "relative",
  },
  input: {
    flex: 1,
    fontFamily: "Poppins",
    fontSize: 14,
    fontWeight: "400",
    color: "#1D1D1F",
    paddingHorizontal: 15,
  },
  passwordInput: {
    paddingRight: 50, // Space for the eye icon
  },
  inputIcon: {
    width: 16,
    height: 16,
    marginRight: 15,
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    padding: 5,
  },
  joinButton: {
    width: "100%",
    height: 48,
    backgroundColor: "#0A0A0A",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  joinButtonText: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  guestButton: {
    width: "100%",
    height: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#0A0A0A",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  guestButtonText: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "500",
    color: "#0A0A0A",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    gap: 5,
  },
  signupText: {
    fontFamily: "Poppins",
    fontSize: 14,
    fontWeight: "400",
    color: "#030303",
  },
  signupLink: {
    fontFamily: "Poppins",
    fontSize: 14,
    fontWeight: "700",
    color: "#030303",
  },
  fieldErrorText: {
    color: "#FF3B30",
    fontFamily: "Poppins",
    fontSize: 12,
    marginBottom: 15,
    alignSelf: "flex-start",
    marginLeft: 5,
  },
  joinButtonDisabled: {
    backgroundColor: "#888888",
  },
  rememberMeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 15,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#D2D2D7",
    borderRadius: 4,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#0A0A0A",
    borderColor: "#0A0A0A",
  },
  rememberMeText: {
    fontFamily: "Poppins",
    fontSize: 14,
    fontWeight: "400",
    color: "#030303",
  },
  forgotPasswordText: {
    color: "#1976d2",
    fontWeight: "600",
    fontSize: 14,
  },
});

export default SignIn;
