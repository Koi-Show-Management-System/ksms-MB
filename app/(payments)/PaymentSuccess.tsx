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

const PaymentSuccess = () => {
  // Get URL parameters from deep link
  const params = useLocalSearchParams();
  const status = params.status as string;
  const orderId = params.orderId as string;

  useEffect(() => {
    // Log the parameters received from the deep link
    console.log("Payment Success Parameters:", { status, orderId });

    // You could update order status in database or perform other actions here
  }, [status, orderId]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        <View style={styles.successIconContainer}>
          <Ionicons name="checkmark-circle" size={100} color="#4CAF50" />
        </View>

        <Text style={styles.title}>Thanh toán thành công!</Text>

        <Text style={styles.message}>
          Đơn hàng vé của bạn đã được xử lý thành công. Bạn sẽ nhận được email
          xác nhận trong thời gian ngắn.
        </Text>

        {orderId && (
          <Text style={styles.orderIdText}>Mã đơn hàng: {orderId}</Text>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => router.replace("/(user)/MyOrders")}>
            <Text style={styles.buttonText}>Xem đơn hàng của tôi</Text>
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
  successIconContainer: {
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
  orderIdText: {
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
    backgroundColor: "#4CAF50",
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButtonText: {
    color: "#4CAF50",
    fontWeight: "600",
  },
});

export default PaymentSuccess;
