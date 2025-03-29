import React, { useState } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const ConfirmRegister: React.FC = () => {
  // States
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvc, setCvc] = useState("");
  const [nameOnCard, setNameOnCard] = useState("");
  const [selectedBank, setSelectedBank] = useState("");

  // Bank data
  const banks = [
    {
      id: "bankA",
      name: "Bank A",
      icon: "https://dashboard.codeparrot.ai/api/image/Z6I6oavsm-LWpeaZ/group-5.png",
    },
    {
      id: "bankB",
      name: "Bank B",
      icon: "https://dashboard.codeparrot.ai/api/image/Z6I6oavsm-LWpeaZ/group-7.png",
    },
    {
      id: "bankC",
      name: "Bank C",
      icon: "https://dashboard.codeparrot.ai/api/image/Z6I6oavsm-LWpeaZ/group-9.png",
    },
  ];

  const handlePayment = () => {
    console.log("Payment processed", {
      cardNumber,
      expiryDate,
      cvc,
      nameOnCard,
      selectedBank,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Xác nhận đăng ký</Text>
          </View>

          {/* Form Content */}
          <View style={styles.formContainer}>
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Thông tin đăng ký</Text>
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>Tên cuộc thi:</Text>
                <Text style={styles.formValue}>{showName}</Text>
              </View>
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>Tên Koi:</Text>
                <Text style={styles.formValue}>{koiName}</Text>
              </View>
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>Giống:</Text>
                <Text style={styles.formValue}>{koiVariety}</Text>
              </View>
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>Kích thước:</Text>
                <Text style={styles.formValue}>{koiSize} cm</Text>
              </View>
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>Danh mục thi đấu:</Text>
                <Text style={styles.formValue}>{categoryName}</Text>
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Lệ phí đăng ký</Text>
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>Phí đăng ký:</Text>
                <Text style={styles.formValuePrice}>
                  {registrationFee.toLocaleString("vi-VN")} VNĐ
                </Text>
              </View>
              <View style={styles.formItem}>
                <Text style={styles.formLabel}>VAT (8%):</Text>
                <Text style={styles.formValuePrice}>
                  {vatAmount.toLocaleString("vi-VN")} VNĐ
                </Text>
              </View>
              <View style={styles.formItem}>
                <Text style={styles.formLabelTotal}>Tổng tiền:</Text>
                <Text style={styles.formValueTotal}>
                  {totalAmount.toLocaleString("vi-VN")} VNĐ
                </Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancelPress}
                disabled={isSubmitting}>
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.registerButton,
                  isSubmitting && styles.disabledButton,
                ]}
                onPress={handleSubmitPress}
                disabled={isSubmitting}>
                <Text style={styles.registerButtonText}>
                  {isSubmitting ? "Đang xử lý..." : "Xác nhận và thanh toán"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  titleSection: {
    padding: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  title: {
    fontFamily: "Lexend Deca",
    fontSize: 22,
    fontWeight: "700",
    color: "#000000",
    textAlign: "center",
  },
  formContainer: {
    padding: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: "Lexend Deca",
    fontSize: 24,
    fontWeight: "700",
    color: "#030303",
    marginBottom: 16,
  },
  formItem: {
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 13,
    fontFamily: "Lexend Deca",
    color: "#94A3B8",
    marginBottom: 4,
  },
  formValue: {
    fontSize: 14,
    fontFamily: "Lexend Deca",
    color: "#030303",
  },
  formValuePrice: {
    fontSize: 14,
    fontFamily: "Lexend Deca",
    color: "#4A90E2",
  },
  formValueTotal: {
    fontSize: 14,
    fontFamily: "Lexend Deca",
    color: "#4A90E2",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionButton: {
    width: "48%",
    height: 50,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: "#FFFFFF",
  },
  registerButton: {
    backgroundColor: "#4A90E2",
  },
  disabledButton: {
    backgroundColor: "#E5E5E5",
  },
  cancelButtonText: {
    fontFamily: "Lexend Deca",
    fontSize: 16,
    fontWeight: "700",
    color: "#030303",
  },
  registerButtonText: {
    fontFamily: "Lexend Deca",
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

export default ConfirmRegister;
