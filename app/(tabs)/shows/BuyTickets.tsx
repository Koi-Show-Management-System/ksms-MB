import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Interfaces
interface Ticket {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
}

// Constants
const TICKET_OPTIONS: Ticket[] = [
  {
    id: "basic",
    title: "Basic Pass",
    description: "Access to basic areas",
    price: 45,
    image:
      "https://dashboard.codeparrot.ai/api/image/Z7OvhKWN819FoZi3/group.png",
  },
  {
    id: "vip",
    title: "VIP Pass",
    description: "Access to VIP areas",
    price: 75,
    image:
      "https://dashboard.codeparrot.ai/api/image/Z7OvhKWN819FoZi3/group-3.png",
  },
  {
    id: "exhibition",
    title: "Exhibition Pass",
    description: "Access to exhibition areas",
    price: 15,
    image:
      "https://dashboard.codeparrot.ai/api/image/Z7OvhKWN819FoZi3/group-5.png",
  },
];

const { width } = Dimensions.get("window");

const BuyTickets: React.FC = () => {
  // State
  const [selectedTickets, setSelectedTickets] = useState<
    Record<string, number>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    return TICKET_OPTIONS.reduce((total, ticket) => {
      return total + (selectedTickets[ticket.id] || 0) * ticket.price;
    }, 0);
  }, [selectedTickets]);

  const handleAction = useCallback(
    async (type: "cart" | "pay") => {
      try {
        setIsLoading(true);
        setError(null);

        const total = calculateTotal();
        if (total === 0) {
          Alert.alert("Error", "Please select at least one ticket");
          return;
        }

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        Alert.alert(
          "Success",
          type === "cart"
            ? "Tickets added to cart successfully"
            : `Payment processed successfully. Total: $${total}`
        );

        if (type === "pay") {
          router.push("../../../(payments)/ticketsPayment");
        }
      } catch (err) {
        setError(type === "cart" ? "Failed to add to cart" : "Payment failed");
      } finally {
        setIsLoading(false);
      }
    },
    [calculateTotal]
  );

  // Header Component
  const Header = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.homeButton}>
        <Text style={styles.homeText}>Home</Text>
      </TouchableOpacity>
      <View style={styles.headerIcons}>
        <TouchableOpacity style={styles.iconButton}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z7OvhKWN819FoZi3/frame.png",
            }}
            style={styles.searchIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z7OvhKWN819FoZi3/group-4.png",
            }}
            style={styles.profileIcon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Ticket Item Component
  const TicketItem = ({ ticket }: { ticket: Ticket }) => (
    <TouchableOpacity
      style={styles.ticketItem}
      onPress={() => handleTicketSelect(ticket.id)}>
      <Image source={{ uri: ticket.image }} style={styles.ticketImage} />
      <View style={styles.ticketInfo}>
        <Text style={styles.ticketTitle}>{ticket.title}</Text>
        <Text style={styles.ticketDescription}>{ticket.description}</Text>
      </View>
      <Text style={styles.ticketPrice}>${ticket.price}</Text>
    </TouchableOpacity>
  );

  // Court Diagram Component
  const CourtDiagram = () => (
    <View style={styles.courtContainer}>
      <Text style={styles.sectionTitle}>Court Diagram</Text>
      <Image
        source={{
          uri: "https://dashboard.codeparrot.ai/api/image/Z7OvhKWN819FoZi3/group-2.png",
        }}
        style={styles.courtImage}
        resizeMode="contain"
      />
    </View>
  );

  // Selected Tickets Component
  const SelectedTickets = () => (
    <View style={styles.selectedContainer}>
      <Text style={styles.sectionTitle}>Selected Tickets</Text>
      {TICKET_OPTIONS.map((ticket) =>
        selectedTickets[ticket.id] ? (
          <View key={ticket.id} style={styles.selectedRow}>
            <Text style={styles.selectedText}>
              {ticket.title} - ${ticket.price}
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
      <Text style={styles.totalText}>Total: ${calculateTotal()}</Text>
    </View>
  );

  // Action Buttons Component
  const ActionButtons = () => (
    <View style={styles.actionButtons}>
      <TouchableOpacity
        style={[styles.actionButton, isLoading && styles.disabledButton]}
        onPress={() => handleAction("cart")}
        disabled={isLoading}>
        <Text style={styles.actionButtonText}>Add To Cart</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionButton, isLoading && styles.disabledButton]}
        onPress={() => handleAction("pay")}
        disabled={isLoading}>
        <Text style={styles.actionButtonText}>Pay</Text>
      </TouchableOpacity>
    </View>
  );

  // Footer Component
  const Footer = () => (
    <View style={styles.footer}>
      {["frame-6", "frame-8", "frame-7"].map((frame, index) => (
        <TouchableOpacity key={index} style={styles.footerButton}>
          <Image
            source={{
              uri: `https://dashboard.codeparrot.ai/api/image/Z7OvhKWN819FoZi3/${frame}.png`,
            }}
            style={styles.footerIcon}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView style={styles.content}>
        <Text style={styles.pageTitle}>Select Your Ticket</Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        {TICKET_OPTIONS.map((ticket) => (
          <TicketItem key={ticket.id} ticket={ticket} />
        ))}

        <CourtDiagram />
        <SelectedTickets />

        {isLoading ? (
          <ActivityIndicator
            size="large"
            color="#0000ff"
            style={styles.loader}
          />
        ) : (
          <ActionButtons />
        )}
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#030303",
    marginVertical: 20,
    fontFamily: "Roboto",
  },
  errorText: {
    color: "red",
    marginBottom: 16,
    textAlign: "center",
    fontSize: 14,
  },
  loader: {
    marginVertical: 20,
  },

  // Header styles
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
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    padding: 8,
    marginLeft: 16,
  },
  searchIcon: {
    width: 13,
    height: 13,
    resizeMode: "contain",
  },
  profileIcon: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },

  // Ticket styles
  ticketItem: {
    flexDirection: "row",
    alignItems: "center",
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
  ticketImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#030303",
    marginBottom: 4,
    fontFamily: "Roboto",
  },
  ticketDescription: {
    fontSize: 14,
    color: "#858585",
    fontFamily: "Roboto",
  },
  ticketPrice: {
    fontSize: 20,
    fontWeight: "700",
    color: "#030303",
    fontFamily: "Roboto",
  },

  // Court diagram styles
  courtContainer: {
    alignItems: "center",
    marginVertical: 20,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courtImage: {
    width: width - 64,
    height: 166,
  },

  // Selected tickets styles
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
    fontFamily: "Roboto",
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
    fontFamily: "Roboto",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#030303",
    marginBottom: 16,
    fontFamily: "Roboto",
  },
  totalText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#030303",
    marginTop: 16,
    textAlign: "right",
    fontFamily: "Roboto",
  },

  // Action buttons styles
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    marginBottom: 20,
  },
  actionButton: {
    width: (width - 52) / 2,
    height: 36,
    backgroundColor: "#0A0A0A",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#858585",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Roboto",
    fontWeight: "400",
  },

  // Footer styles
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 70,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    paddingHorizontal: 20,
  },
  footerButton: {
    padding: 12,
  },
  footerIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
});

export default BuyTickets;
