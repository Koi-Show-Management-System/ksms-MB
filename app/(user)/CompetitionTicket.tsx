// app/(user)/MyOrders.tsx
import { router } from "expo-router";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface TicketProps {
  id: string;
  eventName: string;
  date: string;
  time: string;
  location: string;
  ticketType: string;
  price: string;
  image: string;
}

const tickets: TicketProps[] = [
  {
    id: "1",
    eventName: "Annual Koi Fish Competition",
    date: "June 15, 2023",
    time: "10:00 AM - 5:00 PM",
    location: "Koi Garden Park",
    ticketType: "VIP",
    price: "$50.00",
    image:
      "https://dashboard.codeparrot.ai/api/image/Z79OFXnogYAtZdZe/group-4.png",
  },
  {
    id: "2",
    eventName: "Koi Fish Exhibition",
    date: "July 22, 2023",
    time: "9:00 AM - 4:00 PM",
    location: "Aquatic Center",
    ticketType: "Standard",
    price: "$25.00",
    image:
      "https://dashboard.codeparrot.ai/api/image/Z79OFXnogYAtZdZe/group-5.png",
  },
  {
    id: "3",
    eventName: "International Koi Show",
    date: "August 10, 2023",
    time: "11:00 AM - 6:00 PM",
    location: "Convention Center",
    ticketType: "Premium",
    price: "$40.00",
    image:
      "https://dashboard.codeparrot.ai/api/image/Z79OFXnogYAtZdZe/group-6.png",
  },
];

const TicketCard: React.FC<{ ticket: TicketProps }> = ({ ticket }) => {
  return (
    <TouchableOpacity
      style={styles.ticketCard}
      onPress={() => {
        // Navigate to TicketCheckin screen with ticket data
        router.push({
          pathname: "/(user)/TicketCheckin",
          params: { ticketId: ticket.id },
        });
      }}>
      <View style={styles.ticketImageContainer}>
        <Image source={{ uri: ticket.image }} style={styles.ticketImage} />
      </View>
      <View style={styles.ticketContent}>
        <Text style={styles.eventName}>{ticket.eventName}</Text>
        <View style={styles.ticketDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{ticket.date}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time:</Text>
            <Text style={styles.detailValue}>{ticket.time}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location:</Text>
            <Text style={styles.detailValue}>{ticket.location}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type:</Text>
            <Text style={styles.detailValue}>{ticket.ticketType}</Text>
          </View>
        </View>
        <View style={styles.ticketFooter}>
          <Text style={styles.ticketPrice}>{ticket.price}</Text>
          <View style={styles.viewTicketButton}>
            <Text style={styles.viewTicketText}>View Ticket</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const CompetitionTicket: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z79OFXnogYAtZdZe/frame.png",
            }}
            style={styles.backIcon}
          />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}>
        {tickets.length > 0 ? (
          tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z79OFXnogYAtZdZe/empty-tickets.png",
              }}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyText}>No Tickets Found</Text>
            <Text style={styles.emptySubtext}>
              You haven't purchased any tickets yet
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push("/(tabs)/shows/KoiShowsPage")}>
              <Text style={styles.browseButtonText}>Browse Events</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 70,
    backgroundColor: "#FFFFFF",
    marginTop: 40,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  backText: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "400",
    color: "#000000",
  },
  headerTitle: {
    flex: 1,
    fontFamily: "Poppins",
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
    textAlign: "center",
    marginRight: 44, // To center the title accounting for the back button
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 80, // Add padding to prevent footer overlap
    paddingHorizontal: 16,
  },
  ticketCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  ticketImageContainer: {
    height: 120,
    width: "100%",
    backgroundColor: "#f0f0f0",
  },
  ticketImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  ticketContent: {
    padding: 16,
  },
  eventName: {
    fontFamily: "Poppins",
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 8,
  },
  ticketDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  detailLabel: {
    fontFamily: "Poppins",
    fontSize: 14,
    fontWeight: "600",
    color: "#666666",
    width: 80,
  },
  detailValue: {
    flex: 1,
    fontFamily: "Poppins",
    fontSize: 14,
    color: "#333333",
  },
  ticketFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
  },
  ticketPrice: {
    fontFamily: "Poppins",
    fontSize: 18,
    fontWeight: "700",
    color: "#4A90E2",
  },
  viewTicketButton: {
    backgroundColor: "#4A90E2",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  viewTicketText: {
    fontFamily: "Poppins",
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    marginTop: 80,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    marginBottom: 24,
  },
  emptyText: {
    fontFamily: "Poppins",
    fontSize: 20,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 8,
  },
  emptySubtext: {
    fontFamily: "Poppins",
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: "#4A90E2",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  browseButtonText: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default CompetitionTicket;
