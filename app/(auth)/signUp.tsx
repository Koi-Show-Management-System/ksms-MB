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
import { z } from "zod";
import { register } from "../../services/authService";
import { Ionicons } from '@expo/vector-icons';

// Define validation schema using zod
const signUpSchema = z.object({
  fullName: z.string()
    .min(1, "Họ tên không được để trống")
    .min(5, "Họ tên phải có ít nhất 5 ký tự")
    .max(50, "Họ tên không được vượt quá 50 ký tự")
    .regex(/^[\p{L}\s]+$/u, "Họ tên chỉ được chứa chữ cái và khoảng trắng"),
  
  email: z.string()
    .min(1, "Email không được để trống")
    .email("Email không hợp lệ")
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Email không đúng định dạng"),
  
  username: z.string()
    .min(1, "Tên đăng nhập không được để trống")
    .min(4, "Tên đăng nhập phải có ít nhất 4 ký tự")
    .max(20, "Tên đăng nhập không được vượt quá 20 ký tự")
    .regex(/^[a-zA-Z0-9_-]+$/, "Tên đăng nhập chỉ được chứa chữ cái, số, gạch ngang và gạch dưới"),
  
  password: z.string()
    .min(1, "Mật khẩu không được để trống")
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
    .max(32, "Mật khẩu không được vượt quá 32 ký tự")
    .regex(/[A-Z]/, "Mật khẩu phải chứa ít nhất 1 chữ in hoa")
    .regex(/[a-z]/, "Mật khẩu phải chứa ít nhất 1 chữ thường")
    .regex(/[0-9]/, "Mật khẩu phải chứa ít nhất 1 số")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt"),
  
  confirmPassword: z.string()
    .min(1, "Xác nhận mật khẩu không được để trống"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

// Type for validation errors state
interface ValidationErrors {
  fullName?: string[];
  email?: string[];
  username?: string[];
  password?: string[];
  confirmPassword?: string[];
}

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
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user types
    setValidationErrors((prev) => ({
      ...prev,
      [name]: undefined,
    }));
  };

  const handleSubmit = async () => {
    // Validate form data using zod schema
    const validationResult = signUpSchema.safeParse(formData);

    if (!validationResult.success) {
      // If validation fails, format errors and update state
      const formattedErrors = validationResult.error.flatten().fieldErrors;
      setValidationErrors(formattedErrors);
      return;
    }

    // Clear validation errors if validation passes
    setValidationErrors({});
    setIsLoading(true);

    try {
      const result = await register(
        formData.email,
        formData.password,
        formData.username,
        formData.fullName
      );

      if (result.statusCode === 201) {
        Alert.alert(
          "Đăng ký thành công",
          "Bạn có thể đăng nhập ngay bây giờ",
          [{ text: "OK", onPress: () => router.push("/(auth)/signIn") }]
        );
      }
    } catch (error: any) {
      console.error("Registration failed:", error);
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
            Trở thành thành viên của cộng đồng Koi!
          </Text>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {/* Full Name Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Họ tên *</Text>
            <TextInput
              style={[styles.input, styles.textInput]}
              placeholder="Nguyễn Văn A"
              value={formData.fullName}
              onChangeText={(value) => handleInputChange("fullName", value)}
            />
            {validationErrors.fullName && (
              <Text style={styles.fieldErrorText}>{validationErrors.fullName[0]}</Text>
            )}
          </View>

          {/* Email Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={[styles.input, styles.textInput]}
              placeholder="email@email.com"
              value={formData.email}
              onChangeText={(value) => handleInputChange("email", value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {validationErrors.email && (
              <Text style={styles.fieldErrorText}>{validationErrors.email[0]}</Text>
            )}
          </View>

          {/* Username Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tên đăng nhập *</Text>
            <TextInput
              style={[styles.input, styles.textInput]}
              placeholder="username"
              value={formData.username}
              onChangeText={(value) => handleInputChange("username", value)}
              autoCapitalize="none"
            />
            {validationErrors.username && (
              <Text style={styles.fieldErrorText}>{validationErrors.username[0]}</Text>
            )}
          </View>

          {/* Password Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mật khẩu *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="******"
                value={formData.password}
                onChangeText={(value) => handleInputChange("password", value)}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-outline" : "eye-off-outline"} 
                  size={24} 
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            {validationErrors.password && (
              <Text style={styles.fieldErrorText}>{validationErrors.password[0]}</Text>
            )}
            <Text style={styles.passwordHint}>
              Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt
            </Text>
          </View>

          {/* Confirm Password Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Xác nhận mật khẩu *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="******"
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange("confirmPassword", value)}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                  size={24} 
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            {validationErrors.confirmPassword && (
              <Text style={styles.fieldErrorText}>{validationErrors.confirmPassword[0]}</Text>
            )}
          </View>
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Đăng ký</Text>
          )}
        </TouchableOpacity>

        {/* Footer Section */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Đã có tài khoản?</Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/signIn")}>
            <Text style={styles.footerLink}>Đăng nhập</Text>
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
    backgroundColor: "#f9f9f9d6",
    fontFamily: "Poppins",
    fontSize: 14,
    color: "#1D1D1F",
  },
  textInput: {
    paddingHorizontal: 15,
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
  },
  passwordInput: {
    paddingHorizontal: 15,
    paddingRight: 50, // Space for the eye icon
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 11,
    padding: 5,
  },
  fieldErrorText: {
    color: "#FF3B30",
    fontFamily: "Poppins", 
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  passwordHint: {
    color: "#666666",
    fontFamily: "Poppins",
    fontSize: 11,
    marginTop: 5,
    marginLeft: 5,
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
  buttonDisabled: {
    backgroundColor: "#888888",
  },
  buttonText: {
    color: "#ffffff",
    fontFamily: "Poppins",
    fontWeight: "700",
    fontSize: 16,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
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
  },
});

export default Signup;
