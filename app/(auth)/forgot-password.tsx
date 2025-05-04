import { Ionicons } from "@expo/vector-icons";
import { router, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { forgotPassword, resetPassword } from "../../services/authService";
import { validatePassword } from "../../utils/validationUtils";

export default function ForgotAndResetPasswordScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  async function handleSendOtp() {
    setIsLoading(true)
    setHasError('')
    setSuccessMsg('')
    try {
      await forgotPassword(email)
      setIsOtpSent(true)
      setSuccessMsg('Đã gửi mã OTP về email của bạn!')
    } catch (e: any) {
      setHasError(e?.message || 'Không gửi được mã OTP')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResetPassword() {
    setIsLoading(true)
    setHasError('')
    setSuccessMsg('')
    try {
      await resetPassword(email, otp, newPassword)
      setSuccessMsg('Đặt lại mật khẩu thành công!')
      setTimeout(() => router.replace('/signIn'), 1000)
    } catch (e: any) {
      setHasError(e?.message || 'Đặt lại mật khẩu thất bại')
    } finally {
      setIsLoading(false)
    }
  }

  function handleTogglePasswordVisibility() {
    setIsPasswordVisible((prev) => !prev)
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.title}>Quên mật khẩu</Text>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!isOtpSent}
        />
        {!isOtpSent ? (
          <TouchableOpacity
            style={styles.button}
            onPress={handleSendOtp}
            disabled={isLoading || !email}
            accessibilityRole="button"
          >
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Gửi mã OTP</Text>}
          </TouchableOpacity>
        ) : (
          <>
            <TextInput
              placeholder="Mã OTP"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              style={styles.input}
            />
            <View style={{ position: 'relative' }}>
              <TextInput
                placeholder="Mật khẩu mới"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!isPasswordVisible}
                style={styles.input}
                accessible accessibilityLabel="Mật khẩu mới"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={handleTogglePasswordVisibility}
                accessibilityLabel={isPasswordVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                <Feather name={isPasswordVisible ? 'eye' : 'eye-off'} size={20} color="#888" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.button}
              onPress={handleResetPassword}
              disabled={isLoading || !otp || !newPassword}
              accessibilityRole="button"
            >
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Đặt lại mật khẩu</Text>}
            </TouchableOpacity>
          </>
        )}
        {hasError ? <Text style={styles.errorText}>{hasError}</Text> : null}
        {successMsg ? <Text style={styles.successText}>{successMsg}</Text> : null}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    width: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    width: 280,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#1976d2',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
    width: 280,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 14,
    padding: 4,
  },
  errorText: {
    color: '#e53935',
    fontSize: 14,
    marginTop: 8,
  },
  successText: {
    color: '#43a047',
    fontSize: 14,
    marginTop: 8,
  },
})
