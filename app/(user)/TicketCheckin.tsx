// app/(user)/TicketCheckin.tsx
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// --- Contestant Info ---
interface ContestantInfoProps {
  contestantName?: string;
  contestantId?: string;
}

const ContestantInfo: React.FC<ContestantInfoProps> = ({
  contestantName = "Contestant Name",
  contestantId = "12345",
}) => {
  return (
    <View style={styles.contestantInfoContainer}>
      <Text style={styles.contestantNameText}>{contestantName}</Text>
      <Text style={styles.contestantIdText}>Contestant ID: {contestantId}</Text>
    </View>
  );
};

// --- QR Code Section ---
const QRCodeSection: React.FC = () => {
  return (
    <View style={styles.qrCodeSectionContainer}>
      <View style={styles.qrCodeImageContainer}>
        <Image
          source={{
            uri: "https://dashboard.codeparrot.ai/api/image/Z79OFXnogYAtZdZe/group-7.png",
          }}
          style={styles.qrCodeImage}
          resizeMode="contain"
        />
      </View>
      <View style={styles.qrCodeTextContainer}>
        <Text style={styles.qrCodeMainText}>
          Please present this QR code to the staff
        </Text>
        <Text style={styles.qrCodeMainText}>for check-in.</Text>
      </View>
      <Text style={styles.qrCodeRegisteredText}>Registered 3 Koi fish</Text>
      <View style={styles.qrCodeDisclaimerContainer}>
        <Text style={styles.qrCodeDisclaimerText}>
          This QR code is for contestant check-in purposes
        </Text>
        <Text style={styles.qrCodeDisclaimerText}>only.</Text>
      </View>
    </View>
  );
};

// --- Registered Koi Fish ---
interface KoiFishData {
  image: string;
  name: string;
  age: string;
  owner: string;
}

interface TicketData {
  id: string;
  eventName: string;
  date: string;
  time: string;
  location: string;
  ticketType: string;
  price: string;
  image: string;
  contestantName: string;
  contestantId: string;
  koiFish: KoiFishData[];
}

// Mock ticket data - in a real app, this would come from an API
const ticketsData: Record<string, TicketData> = {
  "1": {
    id: "1",
    eventName: "Annual Koi Fish Competition",
    date: "June 15, 2023",
    time: "10:00 AM - 5:00 PM",
    location: "Koi Garden Park",
    ticketType: "VIP",
    price: "$50.00",
    image:
      "https://dashboard.codeparrot.ai/api/image/Z79OFXnogYAtZdZe/group-4.png",
    contestantName: "John Doe",
    contestantId: "98765",
    koiFish: [
      {
        image:
          "https://dashboard.codeparrot.ai/api/image/Z79OFXnogYAtZdZe/group-4.png",
        name: "Sakura",
        age: "2 years",
        owner: "Emily Tanaka",
      },
      {
        image:
          "https://dashboard.codeparrot.ai/api/image/Z79OFXnogYAtZdZe/group-5.png",
        name: "Midnight",
        age: "3 years",
        owner: "Alex Chen",
      },
      {
        image:
          "https://dashboard.codeparrot.ai/api/image/Z79OFXnogYAtZdZe/group-6.png",
        name: "Ruby",
        age: "1.5 years",
        owner: "Sarah Lee",
      },
    ],
  },
  "2": {
    id: "2",
    eventName: "Koi Fish Exhibition",
    date: "July 22, 2023",
    time: "9:00 AM - 4:00 PM",
    location: "Aquatic Center",
    ticketType: "Standard",
    price: "$25.00",
    image:
      "https://dashboard.codeparrot.ai/api/image/Z79OFXnogYAtZdZe/group-5.png",
    contestantName: "Jane Smith",
    contestantId: "54321",
    koiFish: [
      {
        image:
          "https://dashboard.codeparrot.ai/api/image/Z79OFXnogYAtZdZe/group-4.png",
        name: "Azure",
        age: "1 year",
        owner: "Jane Smith",
      },
      {
        image:
          "https://dashboard.codeparrot.ai/api/image/Z79OFXnogYAtZdZe/group-5.png",
        name: "Sunset",
        age: "2.5 years",
        owner: "Jane Smith",
      },
    ],
  },
  "3": {
    id: "3",
    eventName: "International Koi Show",
    date: "August 10, 2023",
    time: "11:00 AM - 6:00 PM",
    location: "Convention Center",
    ticketType: "Premium",
    price: "$40.00",
    image:
      "https://dashboard.codeparrot.ai/api/image/Z79OFXnogYAtZdZe/group-6.png",
    contestantName: "Robert Johnson",
    contestantId: "12345",
    koiFish: [
      {
        image:
          "https://dashboard.codeparrot.ai/api/image/Z79OFXnogYAtZdZe/group-6.png",
        name: "Diamond",
        age: "4 years",
        owner: "Robert Johnson",
      },
    ],
  },
};

const RegisteredKoiFish: React.FC<{ koiFish: KoiFishData[] }> = ({
  koiFish,
}) => {
  return (
    <View style={styles.registeredKoiFishContainer}>
      <Text style={styles.registeredKoiFishHeaderText}>
        Registered Koi Fish
      </Text>
      {koiFish.map((fish, index) => (
        <View key={index} style={styles.fishCard}>
          <Image source={{ uri: fish.image }} style={styles.fishImage} />
          <View style={styles.fishInfo}>
            <Text style={styles.fishName}>Koi Name: {fish.name}</Text>
            <Text style={styles.fishDetails}>Age: {fish.age}</Text>
            <Text style={styles.fishDetails}>Owner: {fish.owner}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

// --- Main Component ---
const TicketCheckin: React.FC = () => {
  const params = useLocalSearchParams();
  const { ticketId } = params;

  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to get ticket data
    setTimeout(() => {
      if (ticketId && typeof ticketId === "string" && ticketsData[ticketId]) {
        setTicket(ticketsData[ticketId]);
      }
      setLoading(false);
    }, 500);
  }, [ticketId]);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading ticket information...</Text>
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>Ticket not found</Text>
        <TouchableOpacity
          style={styles.backToTicketsButton}
          onPress={() => router.back()}>
          <Text style={styles.backToTicketsText}>Back to My Tickets</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>QR Code Check-in</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.eventInfoContainer}>
          <Text style={styles.eventName}>{ticket.eventName}</Text>
          <View style={styles.eventDetails}>
            <View style={styles.eventDetailRow}>
              <Text style={styles.eventDetailLabel}>Date:</Text>
              <Text style={styles.eventDetailValue}>{ticket.date}</Text>
            </View>
            <View style={styles.eventDetailRow}>
              <Text style={styles.eventDetailLabel}>Time:</Text>
              <Text style={styles.eventDetailValue}>{ticket.time}</Text>
            </View>
            <View style={styles.eventDetailRow}>
              <Text style={styles.eventDetailLabel}>Location:</Text>
              <Text style={styles.eventDetailValue}>{ticket.location}</Text>
            </View>
            <View style={styles.eventDetailRow}>
              <Text style={styles.eventDetailLabel}>Ticket Type:</Text>
              <Text style={styles.eventDetailValue}>{ticket.ticketType}</Text>
            </View>
          </View>
        </View>

        <ContestantInfo
          contestantName={ticket.contestantName}
          contestantId={ticket.contestantId}
        />
        <QRCodeSection />
        <RegisteredKoiFish koiFish={ticket.koiFish} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/(tabs)/home/homepage")}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z79OFXnogYAtZdZe/frame-2.png",
            }}
            style={styles.footerIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/(user)/Notification")}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z79OFXnogYAtZdZe/frame-4.png",
            }}
            style={styles.footerIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/(tabs)/home/UserMenu")}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z79OFXnogYAtZdZe/frame-3.png",
            }}
            style={styles.footerIcon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666666",
  },
  errorContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#E74C3C",
    marginBottom: 16,
  },
  backToTicketsButton: {
    backgroundColor: "#4A90E2",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  backToTicketsText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  // Header Styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 70,
    backgroundColor: "#FFFFFF",
    marginTop: 40,
    width: "100%",
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
    fontFamily: "Poppins",
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    flex: 1,
    textAlign: "center",
    marginRight: 44, // To center the title accounting for the back button
  },

  // ScrollView
  scrollViewContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingBottom: 20,
    width: "100%",
  },

  // Event Info Styles
  eventInfoContainer: {
    width: "100%",
    padding: 16,
    backgroundColor: "#F9F9F9",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  eventName: {
    fontFamily: "Poppins",
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 12,
  },
  eventDetails: {
    width: "100%",
  },
  eventDetailRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  eventDetailLabel: {
    fontFamily: "Poppins",
    fontSize: 14,
    fontWeight: "600",
    color: "#666666",
    width: 100,
  },
  eventDetailValue: {
    flex: 1,
    fontFamily: "Poppins",
    fontSize: 14,
    color: "#333333",
  },

  // Contestant Info Styles
  contestantInfoContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginVertical: 8,
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  contestantNameText: {
    fontFamily: "Poppins",
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
    textAlign: "center",
  },
  contestantIdText: {
    fontFamily: "Poppins",
    fontSize: 14,
    fontWeight: "400",
    color: "#4B5563",
    textAlign: "center",
  },

  // QR Code Section Styles
  qrCodeSectionContainer: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  qrCodeImageContainer: {
    width: 220,
    height: 220,
    marginBottom: 15,
  },
  qrCodeImage: {
    width: "100%",
    height: "100%",
  },
  qrCodeTextContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  qrCodeMainText: {
    fontFamily: "Poppins",
    fontSize: 16,
    color: "#030303",
    textAlign: "center",
  },
  qrCodeRegisteredText: {
    fontFamily: "Poppins",
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 15,
  },
  qrCodeDisclaimerContainer: {
    alignItems: "center",
  },
  qrCodeDisclaimerText: {
    fontFamily: "Poppins",
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },

  // Registered Koi Fish Styles
  registeredKoiFishContainer: {
    width: "100%",
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  registeredKoiFishHeaderText: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Roboto",
    color: "#000000",
    marginBottom: 20,
    textAlign: "center",
  },
  fishCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  fishImage: {
    width: 60,
    height: 60,
    marginRight: 16,
    borderRadius: 30,
  },
  fishInfo: {
    flex: 1,
  },
  fishName: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Roboto",
    color: "#000000",
    marginBottom: 4,
  },
  fishDetails: {
    fontSize: 14,
    fontFamily: "Roboto",
    color: "#4b5563",
    marginBottom: 4,
  },

  // Footer Styles
  footer: {
    width: "100%",
    height: 70,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  navItem: {
    padding: 10,
  },
  footerIcon: {
    width: 28,
    height: 28,
    resizeMode: "contain",
  },
});

export default TicketCheckin;
