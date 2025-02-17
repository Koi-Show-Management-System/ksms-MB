// TicketsPayment.tsx
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Types & Interfaces
interface PaymentInfo {
  cardNumber: string;
  nameOnCard: string;
  expiryDate: string;
  cvv: string;
}

interface TicketDetails {
  show: string;
  date: string;
  location: string;
  price: number;
  quantity: number;
}

type PaymentMethod = "credit" | "momo" | "bank";

// Constants
const PAYMENT_ICONS = {
  credit: require("../../assets/images/test_image.png"),
  momo: require("../../assets/images/test_image.png"),
  bank: require("../../assets/images/test_image.png"),
};

const PAYMENT_LABELS = {
  credit: "Credit Card",
  momo: "MoMo E-Wallet",
  bank: "Bank Transfer",
};

const PAYMENT_DESCRIPTIONS = {
  credit: "Pay with Visa, Mastercard, JCB",
  momo: "Pay with MoMo E-Wallet",
  bank: "Direct bank transfer",
};

// Utility functions
const formatCardNumber = (value: string): string =>
  value
    .replace(/\D/g, "")
    .replace(/(\d{4})/g, "$1 ")
    .trim()
    .substr(0, 19);

const formatExpiryDate = (value: string): string =>
  value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "$1/$2")
    .substr(0, 5);

const formatCVV = (value: string): string =>
  value.replace(/\D/g, "").substr(0, 4);

const validatePaymentInfo = (info: PaymentInfo): boolean => {
  const { cardNumber, nameOnCard, expiryDate, cvv } = info;
  return (
    /^[0-9]{16}$/.test(cardNumber.replace(/\s/g, "")) &&
    nameOnCard.length >= 3 &&
    /^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(expiryDate) &&
    /^[0-9]{3,4}$/.test(cvv)
  );
};

// Memoized Components
const Header = memo(() => (
  <View style={styles.header}>
    <Text style={styles.homeText}>Payment</Text>
    <TouchableOpacity style={styles.backButton}>
      <Image
        source={require("../../assets/images/test_image.png")}
        style={styles.backIcon}
      />
    </TouchableOpacity>
  </View>
));

const TicketDetailsCard = memo(({ details }: { details: TicketDetails }) => (
  <View style={styles.detailsCard}>
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>Show</Text>
      <Text style={styles.detailValue}>{details.show}</Text>
    </View>

    <View style={styles.separator} />

    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>Date</Text>
      <Text style={styles.detailValue}>{details.date}</Text>
    </View>

    <View style={styles.separator} />

    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>Location</Text>
      <Text style={styles.detailValue}>{details.location}</Text>
    </View>

    <View style={styles.separator} />

    <View style={styles.priceRow}>
      <View>
        <Text style={styles.priceLabel}>Price per ticket</Text>
        <Text style={styles.priceValue}>${details.price.toFixed(2)}</Text>
      </View>
      <View>
        <Text style={styles.totalLabel}>Total Amount</Text>
        <Text style={styles.totalValue}>
          ${(details.price * details.quantity).toFixed(2)}
        </Text>
      </View>
    </View>
  </View>
));

const PaymentMethodCard = memo(
  ({
    method,
    selected,
    onSelect,
  }: {
    method: PaymentMethod;
    selected: boolean;
    onSelect: (method: PaymentMethod) => void;
  }) => (
    <TouchableOpacity
      style={[styles.methodCard, selected && styles.methodCardSelected]}
      onPress={() => onSelect(method)}>
      <Image source={PAYMENT_ICONS[method]} style={styles.methodIcon} />
      <View style={styles.methodInfo}>
        <Text style={styles.methodTitle}>{PAYMENT_LABELS[method]}</Text>
        <Text style={styles.methodSubtitle}>
          {PAYMENT_DESCRIPTIONS[method]}
        </Text>
      </View>
      <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
        <View
          style={[styles.radioInner, selected && styles.radioInnerSelected]}
        />
      </View>
    </TouchableOpacity>
  )
);
const TicketsPayment: React.FC = () => {
  // States
  const [ticketDetails] = useState<TicketDetails>({
    show: "2023 Koi Extravaganza",
    date: "October 25, 2023",
    location: "Tokyo Exhibition Center",
    price: 45.0,
    quantity: 1,
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("credit");
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    cardNumber: "",
    nameOnCard: "",
    expiryDate: "",
    cvv: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Memoized values
  const totalAmount = useMemo(
    () => ticketDetails.price * ticketDetails.quantity,
    [ticketDetails.price, ticketDetails.quantity]
  );

  const isFormValid = useMemo(
    () =>
      paymentMethod === "credit" ? validatePaymentInfo(paymentInfo) : true,
    [paymentMethod, paymentInfo]
  );

  // Handlers
  const handleInputChange = useCallback(
    (field: keyof PaymentInfo, value: string) => {
      let formattedValue = value;
      switch (field) {
        case "cardNumber":
          formattedValue = formatCardNumber(value);
          break;
        case "expiryDate":
          formattedValue = formatExpiryDate(value);
          break;
        case "cvv":
          formattedValue = formatCVV(value);
          break;
        case "nameOnCard":
          formattedValue = value.toUpperCase();
          break;
      }

      setPaymentInfo((prev) => ({
        ...prev,
        [field]: formattedValue,
      }));
    },
    []
  );

  const handlePayment = useCallback(async () => {
    if (isProcessing) return;

    if (paymentMethod === "credit" && !isFormValid) {
      Alert.alert("Error", "Please check your payment information");
      return;
    }

    try {
      setIsProcessing(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      Alert.alert(
        "Success",
        `Payment of $${totalAmount.toFixed(2)} processed successfully`,
        [
          { text: "View Receipt", onPress: () => {} },
          { text: "Done", style: "cancel" },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, paymentMethod, isFormValid, totalAmount]);

  // Cleanup
  useEffect(() => {
    return () => setIsProcessing(false);
  }, []);

  // Render
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}>
        <Header />

        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.ticketDetails}>
            <View style={styles.ticketHeader}>
              <Text style={styles.sectionTitle}>Ticket Details</Text>
              <TouchableOpacity style={styles.editButton}>
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
            </View>
            <TicketDetailsCard details={ticketDetails} />
          </View>

          <View style={styles.paymentMethod}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((method) => (
              <PaymentMethodCard
                key={method}
                method={method}
                selected={paymentMethod === method}
                onSelect={setPaymentMethod}
              />
            ))}
          </View>

          {paymentMethod === "credit" && (
            <View style={styles.billingInfo}>
              <Text style={styles.sectionTitle}>Billing Information</Text>

              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  value={paymentInfo.cardNumber}
                  onChangeText={(value) =>
                    handleInputChange("cardNumber", value)
                  }
                  placeholder="Card Number"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  maxLength={19}
                />
              </View>

              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  value={paymentInfo.nameOnCard}
                  onChangeText={(value) =>
                    handleInputChange("nameOnCard", value)
                  }
                  placeholder="Name on Card"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.rowContainer}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <TextInput
                    style={styles.input}
                    value={paymentInfo.expiryDate}
                    onChangeText={(value) =>
                      handleInputChange("expiryDate", value)
                    }
                    placeholder="MM/YY"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>

                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <TextInput
                    style={styles.input}
                    value={paymentInfo.cvv}
                    onChangeText={(value) => handleInputChange("cvv", value)}
                    placeholder="CVV"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                  />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.confirmButtonContainer}>
          {isProcessing ? (
            <ActivityIndicator size="large" color="#0000FF" />
          ) : (
            <TouchableOpacity
              style={[
                styles.confirmButton,
                !isFormValid && styles.confirmButtonDisabled,
              ]}
              onPress={handlePayment}
              disabled={!isFormValid || isProcessing}>
              <Text style={styles.confirmButtonText}>
                Pay ${totalAmount.toFixed(2)}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  homeText: {
    fontSize: 18,
    fontFamily: "Poppins-Bold",
    color: "#030303",
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  ticketDetails: {
    marginBottom: 24,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Poppins-Bold",
    color: "#030303",
  },
  editButton: {
    padding: 8,
  },
  editText: {
    color: "#0000FF",
    fontSize: 14,
    fontFamily: "Poppins-Medium",
  },
  detailsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Poppins-Regular",
  },
  detailValue: {
    fontSize: 14,
    color: "#030303",
    fontFamily: "Poppins-Medium",
  },
  separator: {
    height: 1,
    backgroundColor: "#E5E5E5",
    marginVertical: 8,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
  },
  priceLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Poppins-Regular",
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 16,
    color: "#030303",
    fontFamily: "Poppins-Bold",
  },
  totalLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Poppins-Regular",
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 18,
    color: "#0000FF",
    fontFamily: "Poppins-Bold",
  },
  paymentMethod: {
    marginBottom: 24,
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  methodCardSelected: {
    borderColor: "#0000FF",
    borderWidth: 2,
  },
  methodIcon: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    color: "#030303",
    fontFamily: "Poppins-Medium",
    marginBottom: 4,
  },
  methodSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Poppins-Regular",
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#E5E5E5",
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterSelected: {
    borderColor: "#0000FF",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "transparent",
  },
  radioInnerSelected: {
    backgroundColor: "#0000FF",
  },
  billingInfo: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    color: "#1F2937",
    fontFamily: "Poppins-Regular",
  },
  inputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontFamily: "Poppins-Regular",
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfWidth: {
    width: "48%",
  },
  cardTypeIcon: {
    position: "absolute",
    right: 16,
    top: 12,
    width: 32,
    height: 24,
  },
  confirmButtonContainer: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  confirmButton: {
    backgroundColor: "#0000FF",
    borderRadius: 8,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0000FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonDisabled: {
    backgroundColor: "#D1D5DB",
    shadowOpacity: 0,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Poppins-Bold",
  },
});

export default TicketsPayment;
