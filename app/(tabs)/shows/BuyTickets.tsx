import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
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
          setError("No tickets available for this event");
        }
      } catch (err) {
        console.error("Failed to fetch show details:", err);
        setError("Failed to load ticket information. Please try again.");
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

  const handleAction = useCallback(
    async (type: "cart" | "pay") => {
      try {
        setIsSubmitting(true);
        setError(null);

        const total = calculateTotal();
        if (total === 0) {
          Alert.alert("Error", "Please select at least one ticket");
          return;
        }

        if (type === "cart") {
          // Handle add to cart logic
          Alert.alert("Success", "Tickets added to cart successfully");
        } else if (type === "pay") {
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
            // Get user information for payment
            const { fullName, email } = await getUserPaymentInfo();

            // Create payment order using the service
            const response = await createTicketOrder({
              listOrder,
              fullName,
              email,
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
                    "Payment Session Expired",
                    "Your payment session has expired. Please try again."
                  );
                }
              }, 15 * 60 * 1000);

              // Store the timeout ID to clear it if component unmounts or payment completes
              setPaymentTimeoutId(paymentTimeout);
            } else {
              Alert.alert(
                "Error",
                "Payment processing failed. Please try again."
              );
            }
          } catch (error: any) {
            const errorMessage =
              error.response?.data?.message ||
              "Payment processing failed. Please try again.";

            // Handle 401 error specifically
            if (error.response?.status === 401) {
              Alert.alert(
                "Authentication Required",
                "Please sign in to purchase tickets.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Sign In",
                    onPress: () => router.push("/(auth)/signIn"),
                  },
                ]
              );
            } else {
              Alert.alert("Payment Error", errorMessage);
            }
          }
        }
      } catch (err: any) {
        console.error("Payment error:", err);
        setError(
          err?.response?.data?.message ||
            (type === "cart" ? "Failed to add to cart" : "Payment failed")
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [calculateTotal, selectedTickets]
  );

  // Ticket Item Component
  const TicketItem = ({ ticket }: { ticket: TicketType }) => (
    <TouchableOpacity
      style={styles.ticketItem}
      onPress={() => handleTicketSelect(ticket.id)}>
      <View style={styles.ticketInfo}>
        <Text style={styles.ticketTitle}>{ticket.name}</Text>
        <Text style={styles.ticketDescription}>
          Available: {ticket.availableQuantity}
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
      <Text style={styles.sectionTitle}>Selected Tickets</Text>
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
        Total: {calculateTotal().toLocaleString("vi-VN")} VNĐ
      </Text>
    </View>
  );

  // Header Component
  const Header = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.homeButton} onPress={() => router.back()}>
        <Text style={styles.homeText}>Back</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{showName}</Text>
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
          <Text style={styles.modalTitle}>Complete Payment</Text>
          <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
            <Text style={styles.closeButton}>Close</Text>
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
                if (navState.url.includes('ksms://app/')) {
                  setPaymentModalVisible(false);
                  
                  // Clear the payment timeout
                  if (paymentTimeoutId) {
                    clearTimeout(paymentTimeoutId);
                    setPaymentTimeoutId(null);
                  }
                  
                  // Parse status parameter from URL
                  const urlObj = new URL(navState.url);
                  const status = urlObj.searchParams.get('status') || '';
                  const isSuccess = navState.url.includes('/success');
                  
                  // Navigate to appropriate screen
                  if (isSuccess) {
                    router.push({
                      pathname: "/(payments)/PaymentSuccess",
                      params: { status }
                    });
                  } else {
                    router.push({
                      pathname: "/(payments)/PaymentFailed", 
                      params: { status }
                    });
                  }
                  
                  return false; // Prevent default navigation
                }
                
                // Handle web URLs (your current approach)
                if (navState.url.includes('ksms.news/app/') || 
                    navState.url.includes('localhost:5173/')) {
                  setPaymentModalVisible(false);
                  
                  // Clear the payment timeout
                  if (paymentTimeoutId) {
                    clearTimeout(paymentTimeoutId);
                    setPaymentTimeoutId(null);
                  }
                  
                  const isSuccess = navState.url.includes('/success');
                  
                  // Try to extract status from URL if present
                  let status = '';
                  try {
                    const urlObj = new URL(navState.url);
                    status = urlObj.searchParams.get('status') || '';
                  } catch (e) {
                    console.log("Error parsing URL parameters:", e);
                  }
                  
                  // Navigate based on success/failure path
                  if (isSuccess) {
                    router.push({
                      pathname: "/(payments)/PaymentSuccess",
                      params: { status }
                    });
                  } else {
                    router.push({
                      pathname: "/(payments)/PaymentFailed",
                      params: { status }
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
      <Header />
      <ScrollView style={styles.content}>
        <Text style={styles.pageTitle}>Select Your Ticket</Text>

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

            {Object.keys(selectedTickets).length > 0 && <SelectedTickets />}

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  (isSubmitting || Object.keys(selectedTickets).length === 0) &&
                    styles.disabledButton,
                ]}
                onPress={() => handleAction("cart")}
                disabled={
                  isSubmitting || Object.keys(selectedTickets).length === 0
                }>
                <Text style={styles.actionButtonText}>Add To Cart</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  (isSubmitting || Object.keys(selectedTickets).length === 0) &&
                    styles.disabledButton,
                ]}
                onPress={() => handleAction("pay")}
                disabled={
                  isSubmitting || Object.keys(selectedTickets).length === 0
                }>
                <Text style={styles.actionButtonText}>
                  {isSubmitting ? "Processing..." : "Pay Now"}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  homeButton: {
    padding: 8,
  },
  homeText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#030303",
    fontFamily: "Roboto",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#030303",
    flex: 1,
    textAlign: "center",
    marginRight: 40,
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
    justifyContent: "space-between",
    marginVertical: 20,
  },
  actionButton: {
    width: (width - 52) / 2,
    height: 48,
    backgroundColor: "#0A0A0A",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
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
});

export default BuyTickets;
