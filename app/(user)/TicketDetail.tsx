import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// --- Event Details Component ---
interface EventDetailsProps {
  showName: string;
  dateTime: string;
  venue: string;
}

const EventDetails: React.FC<EventDetailsProps> = ({
  showName,
  dateTime,
  venue,
}) => (
  <View style={styles.eventDetailsContainer}>
    <Text style={styles.eventTitle}>{showName}</Text>
    <View style={styles.eventInfoRow}>
      <Image
        source={{
          uri: "https://dashboard.codeparrot.ai/api/image/Z7_lKMjn7nbGWzhY/calendar-2.png",
        }}
        style={styles.eventIcon}
      />
      <Text style={styles.eventInfoText}>{dateTime}</Text>
    </View>
    <View style={styles.eventInfoRow}>
      <Image
        source={{
          uri: "https://dashboard.codeparrot.ai/api/image/Z7_lKMjn7nbGWzhY/map-pin.png",
        }}
        style={styles.eventIcon}
      />
      <Text style={styles.eventInfoText}>{venue}</Text>
    </View>
  </View>
);

// --- QR Code Section Component ---
interface QRCodeSectionProps {
  qrCodeUrl: string;
}

const QRCodeSection: React.FC<QRCodeSectionProps> = ({ qrCodeUrl }) => (
  <View style={styles.qrCodeContainer}>
    <Text style={styles.sectionTitle}>Show this at the entrance</Text>
    <View style={styles.qrImageContainer}>
      <Image source={{ uri: qrCodeUrl }} style={styles.qrImage} />
    </View>
  </View>
);

// --- Ticket Info Component ---
interface TicketInfoProps {
  ticketType: string;
  ticketNumber: string;
  buyerName: string;
}

const TicketInfo: React.FC<TicketInfoProps> = ({
  ticketType,
  ticketNumber,
  buyerName,
}) => (
  <View style={styles.ticketInfoContainer}>
    <View style={styles.ticketInfoRow}>
      <Text style={styles.ticketLabel}>Ticket Type</Text>
      <Text style={styles.ticketValue}>{ticketType}</Text>
    </View>
    <View style={styles.infoSeparator} />
    <View style={styles.ticketInfoRow}>
      <Text style={styles.ticketLabel}>Ticket Number</Text>
      <Text style={styles.ticketValue}>{ticketNumber}</Text>
    </View>
    <View style={styles.infoSeparator} />
    <View style={styles.ticketInfoRow}>
      <Text style={styles.ticketLabel}>Buyer</Text>
      <Text style={styles.ticketValue}>{buyerName}</Text>
    </View>
  </View>
);

// --- Important Notes Component ---
const ImportantNotes: React.FC = () => (
  <View style={styles.notesContainer}>
    <Text style={styles.sectionTitle}>Important Notes</Text>
    <View style={styles.notesBox}>
      <Text style={styles.notesText}>
        • Please show this ticket at the entrance{"\n"}• Each ticket is valid
        for one person only{"\n"}• No entry after event start time{"\n"}• Lost
        tickets cannot be replaced{"\n"}• No refunds or exchanges
      </Text>
    </View>
  </View>
);

// --- Main Component ---
const TicketDetail: React.FC = () => {
  // Get params from URL
  const params = useLocalSearchParams();

  // Use params or default values
  const eventData = {
    showName: (params.showName as string) || "Koi Fish Competition",
    dateTime: (params.dateTime as string) || "10th Oct 2023, 10:00 AM",
    venue: (params.venue as string) || "Tokyo Dome",
    qrCodeUrl:
      (params.qrCodeUrl as string) ||
      "https://dashboard.codeparrot.ai/api/image/Z7_lKMjn7nbGWzhY/group-2.png",
    ticketType: (params.ticketType as string) || "VIP",
    ticketNumber: (params.ticketNumber as string) || "1234567890",
    buyerName: (params.buyerName as string) || "Akira Yamamoto",
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z7_lKMjn7nbGWzhY/chevron-left.png",
            }}
            style={styles.backIcon}
          />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ticket Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}>
        <EventDetails
          showName={eventData.showName}
          dateTime={eventData.dateTime}
          venue={eventData.venue}
        />

        <QRCodeSection qrCodeUrl={eventData.qrCodeUrl} />

        <TicketInfo
          ticketType={eventData.ticketType}
          ticketNumber={eventData.ticketNumber}
          buyerName={eventData.buyerName}
        />

        <ImportantNotes />

        {/* Add Cancel Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => console.log("Cancel ticket")}>
            <Text style={styles.cancelButtonText}>Cancel Ticket</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  backText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    fontFamily: "Poppins",
  },
  placeholder: {
    width: 60, // To balance the back button width
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 40, // Add bottom padding to ensure content isn't cut off
  },
  eventDetailsContainer: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 12,
    fontFamily: "Poppins",
  },
  eventInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
  },
  eventIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
  },
  eventInfoText: {
    fontSize: 14,
    color: "#4A4A4A",
    fontFamily: "Lexend Deca",
  },
  qrCodeContainer: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 16,
    fontFamily: "Poppins",
  },
  qrImageContainer: {
    width: 200,
    height: 200,
    padding: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  qrImage: {
    width: "100%",
    height: "100%",
    borderRadius: 4,
  },
  ticketInfoContainer: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ticketInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  ticketLabel: {
    fontSize: 14,
    color: "#757575",
    fontFamily: "Lexend Deca",
  },
  ticketValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
    fontFamily: "Lexend Deca",
  },
  infoSeparator: {
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  notesContainer: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  notesBox: {
    padding: 12,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#4A4A4A",
    fontFamily: "Lexend Deca",
  },
  footer: {
    padding: 16,
    marginVertical: 16,
    alignItems: "center",
  },
  cancelButton: {
    width: "90%", // Slightly narrower width for better appearance
    backgroundColor: "#FF3B30",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Poppins",
  },
});

export default TicketDetail;
