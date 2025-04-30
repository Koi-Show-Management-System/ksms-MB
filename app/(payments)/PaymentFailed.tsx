import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PaymentFailed = () => {
  // Get URL parameters from deep link
  const params = useLocalSearchParams();
  const status = params.status as string;
  const orderId = params.orderId as string;
  const reason = params.reason as string;

  useEffect(() => {
    // Log the parameters received from the deep link
    console.log("Payment Failed Parameters:", { status, orderId, reason });

    // You could update order status in database or perform other actions here
  }, [status, orderId, reason]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        <View style={styles.failureIconContainer}>
          <Ionicons name="close-circle" size={100} color="#F44336" />
        </View>

        <Text style={styles.title}>Thanh toán thất bại</Text>

        <Text style={styles.message}>
          Chúng tôi không thể xử lý thanh toán của bạn vào lúc này. Vui lòng thử
          lại hoặc liên hệ với bộ phận hỗ trợ khách hàng.
        </Text>

        {reason && <Text style={styles.reasonText}>Lý do: {reason}</Text>}

        {orderId && (
          <Text style={styles.reasonText}>Mã đơn hàng: {orderId}</Text>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => router.back()}>
            <Text style={styles.buttonText}>Thử lại</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => router.replace("/(tabs)/")}>
            <Text style={styles.secondaryButtonText}>Trở về trang chủ</Text>
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
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  failureIconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 16,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  reasonText: {
    fontSize: 16,
    color: "#666666",
    marginBottom: 32,
  },
  buttonContainer: {
    width: "100%",
    marginTop: 16,
  },
  button: {
    borderRadius: 8,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: "#F44336",
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F44336",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButtonText: {
    color: "#F44336",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default PaymentFailed;
