import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Import AsyncStorage
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput, // Import TextInput
  TouchableOpacity,
  View,
} from "react-native";
import WebView from "react-native-webview";
import {
  createTicketOrder,
  getUserPaymentInfo,
  OrderItem as PaymentOrderItem,
} from "../../../services/paymentService";
import { getKoiShowById } from "../../../services/showService";

// Interfaces
interface TicketType {
  id: string;
  name: string;
  price: number;
  availableQuantity: number;
}

interface OrderItem {
  ticketTypeId: string;
  quantity: number;
}

const { width } = Dimensions.get("window");

const BuyTickets: React.FC = () => {
  // Get the show ID from route params
  const params = useLocalSearchParams();
  const showId = params.showId as string;

  // States
  const [ticketOptions, setTicketOptions] = useState<TicketType[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<
    Record<string, number>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showName, setShowName] = useState("");
  const [emailInput, setEmailInput] = useState(""); // State for email input

  // Payment modal states
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentTimeoutId, setPaymentTimeoutId] =
    useState<NodeJS.Timeout | null>(null);

  // Fetch ticket types for this show
  useEffect(() => {
    const fetchShowDetails = async () => {
      try {
        setIsLoading(true);
        const showData = await getKoiShowById(showId);
        setShowName(showData.name);

        if (showData.ticketTypes) {
          setTicketOptions(showData.ticketTypes);
        } else {
          setError("Không có vé nào cho sự kiện này");
        }
      } catch (err) {
        console.error("Lỗi khi lấy chi tiết show:", err);
        setError("Không thể tải thông tin vé. Vui lòng thử lại.");
      } finally {
        setIsLoading(false);
      }
    };

    if (showId) {
      fetchShowDetails();
    }
  }, [showId]);

  useEffect(() => {
    return () => {
      if (paymentTimeoutId) {
        clearTimeout(paymentTimeoutId);
      }
    };
  }, [paymentTimeoutId]);

  // Fetch user email from AsyncStorage on mount to pre-fill the input
  useEffect(() => {
    const fetchUserEmailFromStorage = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem("userEmail"); // Assuming 'userEmail' is the key
        if (storedEmail) {
          setEmailInput(storedEmail);
        }
      } catch (error) {
        console.error("Lỗi khi lấy email từ AsyncStorage:", error);
        // Optional: Show a non-blocking message or handle silently
      }
    };
    fetchUserEmailFromStorage();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Handlers
  const handleTicketSelect = useCallback((ticketId: string) => {
    setSelectedTickets((prev) => ({
      ...prev,
      [ticketId]: (prev[ticketId] || 0) + 1,
    }));
  }, []);

  const handleQuantityChange = useCallback(
    (ticketId: string, quantity: number) => {
      setSelectedTickets((prev) => {
        if (quantity <= 0) {
          const { [ticketId]: removed, ...rest } = prev;
          return rest;
        }
        return { ...prev, [ticketId]: quantity };
      });
    },
    []
  );

  const calculateTotal = useCallback(() => {
    return ticketOptions.reduce((total, ticket) => {
      return total + (selectedTickets[ticket.id] || 0) * ticket.price;
    }, 0);
  }, [selectedTickets, ticketOptions]);

  // Helper function to check if any selected ticket is unavailable
  const isAnySelectedTicketUnavailable = useCallback(() => {
    return Object.keys(selectedTickets).some((ticketId) => {
      const ticket = ticketOptions.find((opt) => opt.id === ticketId);
      // Check if ticket exists and its available quantity is 0,
      // and the user has selected at least one of this ticket type.
      return (
        ticket &&
        ticket.availableQuantity === 0 &&
        selectedTickets[ticketId] > 0
      );
    });
  }, [selectedTickets, ticketOptions]);

  const handlePayment = useCallback(async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      const total = calculateTotal();
      if (total === 0) {
        Alert.alert("Lỗi", "Vui lòng chọn ít nhất một vé");
        return;
      }

      // Check availability before proceeding
      if (isAnySelectedTicketUnavailable()) {
        Alert.alert("Lỗi", "Một hoặc nhiều loại vé bạn chọn đã hết hàng.");
        return;
      }

      // Prepare order items for API
      const listOrder: PaymentOrderItem[] = [];
      Object.keys(selectedTickets).forEach((ticketId) => {
        if (selectedTickets[ticketId] > 0) {
          listOrder.push({
            ticketTypeId: ticketId,
            quantity: selectedTickets[ticketId],
          });
        }
      });

      try {
        // Validate email input
        if (!emailInput.trim()) {
          Alert.alert("Lỗi", "Vui lòng nhập địa chỉ email của bạn.");
          return;
        }
        // Basic email format check (optional but recommended)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput)) {
          Alert.alert("Lỗi", "Vui lòng nhập địa chỉ email hợp lệ.");
          return;
        }

        // Get only fullName from user info (assuming email is now from input)
        const { fullName } = await getUserPaymentInfo();

        // Create payment order using the service with the entered email
        const response = await createTicketOrder({
          listOrder,
          fullName, // Keep fullName from user profile
          email: emailInput, // Use email from input state
        });

        // Handle successful response
        if (response?.data?.url) {
          setPaymentUrl(response.data.url);
          setPaymentModalVisible(true);

          // Set payment timeout (15 minutes)
          const paymentTimeout = setTimeout(() => {
            if (paymentModalVisible) {
              setPaymentModalVisible(false);
              Alert.alert(
                "Phiên thanh toán hết hạn",
                "Phiên thanh toán của bạn đã hết hạn. Vui lòng thử lại."
              );
            }
          }, 15 * 60 * 1000);

          // Store the timeout ID (cast via unknown to satisfy TypeScript)
          setPaymentTimeoutId(paymentTimeout as unknown as NodeJS.Timeout);
        } else {
          Alert.alert("Lỗi", "Xử lý thanh toán thất bại. Vui lòng thử lại.");
        }
      } catch (error: any) {
        let errorMessage = "Xử lý thanh toán thất bại. Vui lòng thử lại.";

        // Trích xuất thông báo lỗi từ API response
        if (error.response?.data) {
          try {
            // Kiểm tra nếu data là chuỗi JSON
            if (typeof error.response.data === "string") {
              const parsedData = JSON.parse(error.response.data);
              errorMessage =
                parsedData.Error || parsedData.message || errorMessage;
            }
            // Kiểm tra nếu data là object có trường data là chuỗi JSON
            else if (typeof error.response.data.data === "string") {
              const parsedData = JSON.parse(error.response.data.data);
              errorMessage =
                parsedData.Error || parsedData.message || errorMessage;
            }
            // Kiểm tra nếu data là object có trường Error hoặc message
            else {
              errorMessage =
                error.response.data.Error ||
                error.response.data.message ||
                errorMessage;
            }
          } catch (parseError) {
            console.error("Lỗi khi phân tích dữ liệu lỗi:", parseError);
          }
        }

        // Handle 401 error specifically
        if (error.response?.status === 401) {
          Alert.alert("Yêu cầu đăng nhập", "Vui lòng đăng nhập để mua vé.", [
            { text: "Hủy", style: "cancel" },
            {
              text: "Đăng nhập",
              onPress: () => router.push("/(auth)/signIn"),
            },
          ]);
        } else {
          Alert.alert("Lỗi thanh toán", errorMessage);
        }
      }
    } catch (err: any) {
      console.error("Lỗi thanh toán:", err);

      let errorMessage = "Thanh toán thất bại";

      // Trích xuất thông báo lỗi từ API response
      if (err?.response?.data) {
        try {
          // Kiểm tra nếu data là chuỗi JSON
          if (typeof err.response.data === "string") {
            const parsedData = JSON.parse(err.response.data);
            errorMessage =
              parsedData.Error || parsedData.message || errorMessage;
          }
          // Kiểm tra nếu data là object có trường data là chuỗi JSON
          else if (typeof err.response.data.data === "string") {
            const parsedData = JSON.parse(err.response.data.data);
            errorMessage =
              parsedData.Error || parsedData.message || errorMessage;
          }
          // Kiểm tra nếu data là object có trường Error hoặc message
          else {
            errorMessage =
              err.response.data.Error ||
              err.response.data.message ||
              errorMessage;
          }
        } catch (parseError) {
          console.error("Lỗi khi phân tích dữ liệu lỗi:", parseError);
        }
      }

      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    calculateTotal,
    selectedTickets,
    ticketOptions,
    isAnySelectedTicketUnavailable,
    emailInput,
  ]); // Add emailInput dependency

  // Ticket Item Component
  const TicketItem = ({ ticket }: { ticket: TicketType }) => (
    <TouchableOpacity
      style={styles.ticketItem}
      onPress={() => handleTicketSelect(ticket.id)}>
      <View style={styles.ticketInfo}>
        <Text style={styles.ticketTitle}>{ticket.name}</Text>
        <Text style={styles.ticketDescription}>
          Còn lại: {ticket.availableQuantity}
        </Text>
      </View>
      <Text style={styles.ticketPrice}>
        {ticket.price.toLocaleString("vi-VN")} VNĐ
      </Text>
    </TouchableOpacity>
  );

  // Selected Tickets Component
  const SelectedTickets = () => (
    <View style={styles.selectedContainer}>
      <Text style={styles.sectionTitle}>Vé đã chọn</Text>
      {ticketOptions.map((ticket) =>
        selectedTickets[ticket.id] ? (
          <View key={ticket.id} style={styles.selectedRow}>
            <Text style={styles.selectedText}>
              {ticket.name} - {ticket.price.toLocaleString("vi-VN")} VNĐ
            </Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() =>
                  handleQuantityChange(
                    ticket.id,
                    (selectedTickets[ticket.id] || 0) - 1
                  )
                }>
                <Text>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantity}>{selectedTickets[ticket.id]}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() =>
                  handleQuantityChange(
                    ticket.id,
                    (selectedTickets[ticket.id] || 0) + 1
                  )
                }>
                <Text>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null
      )}
      <Text style={styles.totalText}>
        Tổng cộng: {calculateTotal().toLocaleString("vi-VN")} VNĐ
      </Text>
    </View>
  );

  // Payment Method Card Component
  const PaymentMethodCard = () => (
    <View style={styles.paymentMethodCard}>
      <View style={styles.paymentMethodContent}>
        <View style={styles.paymentMethodTextContainer}>
          <Text style={styles.paymentMethodTitle}>
            Thanh toán với phương thức:
          </Text>
          <Text style={styles.paymentMethodAmount}>Payos</Text>
          <View style={styles.paymentMethodStats}>
            <Ionicons
              name="checkmark-circle-outline"
              size={16}
              color="#FFFFFF"
            />
            <Text style={styles.paymentMethodStatsText}>
              Thanh toán an toàn
            </Text>
          </View>
        </View>
        <View style={styles.paymentMethodLogoContainer}>
          <View style={styles.paymentMethodLogoFrame}>
            <Image
              source={require("../../../assets/images/payos_logo.jpg")}
              style={styles.paymentMethodLogo}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>
    </View>
  );

  // Payment Modal Component
  const PaymentModal = () => (
    <Modal
      animationType="slide"
      transparent={false}
      visible={paymentModalVisible}
      onRequestClose={() => setPaymentModalVisible(false)}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Hoàn tất thanh toán</Text>
          <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
            <Text style={styles.closeButton}>Đóng</Text>
          </TouchableOpacity>
        </View>
        {paymentUrl ? (
          <WebView
            source={{ uri: paymentUrl }}
            style={styles.webView}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingWebView}>
                <ActivityIndicator size="large" color="#0000ff" />
              </View>
            )}
            onNavigationStateChange={(navState) => {
              console.log("Navigation URL:", navState.url);

              try {
                // Check if this is our custom scheme deep link
                if (navState.url.includes("ksms://app/")) {
                  setPaymentModalVisible(false);

                  // Clear the payment timeout
                  if (paymentTimeoutId) {
                    clearTimeout(paymentTimeoutId);
                    setPaymentTimeoutId(null);
                  }

                  // Parse status parameter from URL
                  const urlObj = new URL(navState.url);
                  const status = urlObj.searchParams.get("status") || "";
                  const isSuccess = navState.url.includes("/success");

                  // Navigate to appropriate screen and clear navigation stack
                  if (isSuccess) {
                    router.replace({
                      pathname: "/(payments)/PaymentSuccess",
                      params: { status },
                    });
                  } else {
                    router.replace({
                      pathname: "/(payments)/PaymentFailed",
                      params: { status },
                    });
                  }

                  return false; // Prevent default navigation
                }

                // Handle web URLs (your current approach)
                if (
                  navState.url.includes("ksms.news/app/") ||
                  navState.url.includes("localhost:5173/")
                ) {
                  setPaymentModalVisible(false);

                  // Clear the payment timeout
                  if (paymentTimeoutId) {
                    clearTimeout(paymentTimeoutId);
                    setPaymentTimeoutId(null);
                  }

                  const isSuccess = navState.url.includes("/success");

                  // Try to extract status from URL if present
                  let status = "";
                  try {
                    const urlObj = new URL(navState.url);
                    status = urlObj.searchParams.get("status") || "";
                  } catch (e) {
                    console.log("Error parsing URL parameters:", e);
                  }

                  // Navigate based on success/failure path and clear navigation stack
                  if (isSuccess) {
                    router.replace({
                      pathname: "/(payments)/PaymentSuccess",
                      params: { status },
                    });
                  } else {
                    router.replace({
                      pathname: "/(payments)/PaymentFailed",
                      params: { status },
                    });
                  }

                  return false;
                }
              } catch (e) {
                console.error("Error handling navigation:", e);
              }
            }}
          />
        ) : (
          <View style={styles.loadingWebView}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}>
        <Text style={styles.pageTitle}>Chọn loại vé của bạn</Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        {isLoading ? (
          <ActivityIndicator
            size="large"
            color="#0000ff"
            style={styles.loader}
          />
        ) : (
          <>
            {ticketOptions.map((ticket) => (
              <TicketItem key={ticket.id} ticket={ticket} />
            ))}

            {/* Email Input Section */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email nhận vé:</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Nhập địa chỉ email của bạn"
                value={emailInput}
                onChangeText={setEmailInput}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            {/* Payment Method Card */}
            <PaymentMethodCard />

            {Object.keys(selectedTickets).length > 0 && <SelectedTickets />}

            {/* Payment Button */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.actionButton, // Keep base style
                  styles.payButton, // Add specific style if needed
                  (isSubmitting ||
                    Object.keys(selectedTickets).length === 0 ||
                    isAnySelectedTicketUnavailable()) &&
                    styles.disabledButton,
                ]}
                onPress={handlePayment} // Use the dedicated payment handler
                disabled={
                  isSubmitting ||
                  Object.keys(selectedTickets).length === 0 ||
                  isAnySelectedTicketUnavailable()
                }>
                <Text style={styles.actionButtonText}>
                  {isSubmitting ? "Đang xử lý..." : "Thanh toán ngay"}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Payment Modal */}
      <PaymentModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  contentContainer: {
    paddingBottom: 80, // Thêm padding để tránh bị footer che phủ
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#030303",
    marginVertical: 20,
    fontFamily: "Roboto",
  },
  ticketItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#030303",
    marginBottom: 4,
  },
  ticketDescription: {
    fontSize: 14,
    color: "#858585",
  },
  ticketPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#e74c3c",
  },
  selectedContainer: {
    padding: 16,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    marginVertical: 20,
  },
  selectedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  selectedText: {
    fontSize: 14,
    color: "#030303",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e0e0e0",
    borderRadius: 5,
    marginHorizontal: 8,
  },
  quantity: {
    fontSize: 14,
    color: "#030303",
    minWidth: 20,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#030303",
    marginBottom: 16,
  },
  totalText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#030303",
    marginTop: 16,
    textAlign: "right",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "center", // Center the single button
    marginVertical: 20,
  },
  actionButton: {
    // width: (width - 52) / 2, // Remove fixed width
    width: "100%", // Make button full width
    height: 48,
    backgroundColor: "#0A0A0A",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  payButton: {
    // Optional: Add specific style for pay button if needed
    // e.g., backgroundColor: '#e74c3c',
  },
  disabledButton: {
    backgroundColor: "#858585",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: "red",
    marginBottom: 16,
    textAlign: "center",
    fontSize: 14,
  },
  loader: {
    marginVertical: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#fff",
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    backgroundColor: "#FFFFFF",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#030303",
  },
  closeButton: {
    fontSize: 16,
    color: "#3498db",
    fontWeight: "600",
  },
  webView: {
    flex: 1,
  },
  loadingWebView: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  // Payment Method Card styles
  paymentMethodCard: {
    borderRadius: 12,
    marginBottom: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: "#6C5CE7", // Purple background color
    borderWidth: 1,
    borderColor: "#8E44AD",
  },
  paymentMethodContent: {
    padding: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentMethodTextContainer: {
    flex: 1,
  },
  paymentMethodTitle: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
    marginBottom: 8,
  },
  paymentMethodAmount: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  paymentMethodStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentMethodStatsText: {
    fontSize: 14,
    color: "#FFFFFF",
    marginLeft: 6,
  },
  paymentMethodLogoContainer: {
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  paymentMethodLogoFrame: {
    width: 50,
    height: 50,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  paymentMethodLogo: {
    width: 40,
    height: 40,
  },
});

export default BuyTickets;
