import React, { useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

// --- Event Card ---
interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  ticketType: string;
  status: "Checked-in" | "Ready" | "Upcoming" | "Past"; // More status options
  image: string;
}

interface EventCardProps {
  event: Event;
  onPress: (event: Event) => void;
}

const { width: screenWidth } = Dimensions.get("window");

const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => (
  <TouchableOpacity
    style={styles.eventCard}
    onPress={() => onPress(event)}
    activeOpacity={0.7}>
    <Image source={{ uri: event.image }} style={styles.eventImage} />
    <View style={styles.eventDetails}>
      <Text style={styles.eventTitle}>{event.title}</Text>
      <View style={styles.eventInfo}>
        <View style={styles.infoColumn}>
          <Text style={styles.infoText}>Date: {event.date}</Text>
          <Text style={styles.infoText}>{event.ticketType}</Text>
        </View>
        <View style={styles.infoColumn}>
          <Text style={styles.infoText}>Time: {event.time}</Text>
          <Text
            style={[
              styles.infoText,
              // Use a type assertion to tell TypeScript this is a valid key
              styles[
                event.status
                  .toLowerCase()
                  .replace("-", "") as keyof typeof styles
              ] || {},
            ]}>
            {event.status}
          </Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

// --- Main Component ---
const MyTickets: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const tabWidth = screenWidth / 2;
  const translateX = useSharedValue(0);

  const handleTabChange = (tab: "upcoming" | "past") => {
    setActiveTab(tab);
    translateX.value = withSpring(tab === "upcoming" ? 0 : tabWidth, {
      damping: 20,
      stiffness: 90,
      mass: 1,
    });
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: tabWidth,
  }));

  // Sample data (replace with data fetched from API)
  const allEvents: Event[] = [
    {
      id: "1",
      title: "Koi Championship 2022",
      date: "19/09/2022",
      time: "20:00",
      ticketType: "Regular Ticket",
      status: "Checked-in",
      image:
        "https://dashboard.codeparrot.ai/api/image/Z7_gZDHFtJnMrSZ1/group-3.png",
    },
    {
      id: "2",
      title: "Autumn Koi Fest 2025",
      date: "21/09/2025",
      time: "11:00",
      ticketType: "VIP Ticket",
      status: "Ready",
      image:
        "https://dashboard.codeparrot.ai/api/image/Z7_gZDHFtJnMrSZ1/group-7.png",
    },
    {
      id: "3",
      title: "Autumn Koi Fest 2025",
      date: "22/09/2025",
      time: "20:00",
      ticketType: "Regular Ticket",
      status: "Ready",
      image:
        "https://dashboard.codeparrot.ai/api/image/Z7_gZDHFtJnMrSZ1/group-8.png",
    },
    {
      id: "4",
      title: "Summer Koi Contest 2023",
      date: "23/09/2023",
      time: "20:00",
      ticketType: "VIP Ticket",
      status: "Checked-in",
      image:
        "https://dashboard.codeparrot.ai/api/image/Z7_gZDHFtJnMrSZ1/group-9.png",
    },
    {
      id: "5",
      title: "Spring Koi Show 2024",
      date: "2024-04-15",
      time: "10:00",
      ticketType: "General Admission",
      status: "Upcoming",
      image: "https://example.com/koi_show_spring.jpg",
    },
    {
      id: "6",
      title: "Koi Breeders Meeting",
      date: "2023-08-20",
      time: "14:00",
      ticketType: "Regular Ticket",
      status: "Past",
      image: "https://example.com/koi_breeders.jpg",
    },
  ];

  const upcomingEvents = allEvents.filter(
    (event) => event.status === "Upcoming" || event.status === "Ready"
  );
  const pastEvents = allEvents.filter(
    (event) => event.status === "Checked-in" || event.status === "Past"
  );
  const displayedEvents =
    activeTab === "upcoming" ? upcomingEvents : pastEvents;

  const handleEventPress = (event: Event) => {
    // Navigate to an event details screen
    // Example:
    // navigation.navigate('EventDetails', { event });
    console.log("Event pressed:", event); // Log for now
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            /* Navigate to Home */
          }}>
          <Text style={styles.homeText}>Home</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Tickets</Text>
        <View style={styles.headerRightSection}>
          <TouchableOpacity
            onPress={() => {
              /* Navigate to profile */
            }}
            style={styles.headerIconButton}>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z7_gZDHFtJnMrSZ1/group-12.png",
              }}
              style={styles.headerProfileIcon}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => handleTabChange("upcoming")}>
          <Text
            style={[
              styles.tabText,
              activeTab === "upcoming" && styles.activeTabText,
            ]}>
            Upcoming Event
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => handleTabChange("past")}>
          <Text
            style={[
              styles.tabText,
              activeTab === "past" && styles.activeTabText,
            ]}>
            Past Event
          </Text>
        </TouchableOpacity>
        <Animated.View style={[styles.indicator, indicatorStyle]} />
        <View style={styles.bottomBorder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        style={styles.eventList}>
        {displayedEvents.map((event) => (
          <EventCard key={event.id} event={event} onPress={handleEventPress} />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => {
            /* Navigate to Home */
          }}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z7_gZDHFtJnMrSZ1/frame.png",
            }}
            style={styles.footerIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => {
            /* Navigate to Notifications */
          }}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z7_gZDHFtJnMrSZ1/frame-2.png",
            }}
            style={styles.footerIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => {
            /* Navigate to Tickets (Current Screen) */
          }}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z7_gZDHFtJnMrSZ1/frame-3.png",
            }}
            style={styles.footerIcon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  // Header Styles
  header: {
    width: "100%",
    height: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: "transparent", // Or your desired background
    marginTop: 20,
  },
  homeText: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "700",
    color: "#030303",
  },
  headerTitle: {
    fontFamily: "Poppins",
    fontSize: 18,
    fontWeight: "700",
    color: "#030303",
    flex: 1, // Add this to center the title
    textAlign: "center", // Center the text
  },
  headerRightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16, // Consistent gap
  },
  headerIconButton: {
    padding: 4,
  },
  headerIcon: {
    width: 28, // Consistent size
    height: 28,
  },
  headerProfileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  // Tab Styles
  tabContainer: {
    flexDirection: "row",
    height: 50,
    position: "relative",
  },
  tab: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
  },
  tabText: {
    fontFamily: "Lexend Deca",
    fontSize: 16,
    fontWeight: "700",
    color: "#666",
    opacity: 0.5,
  },
  activeTabText: {
    color: "#000",
    opacity: 1,
  },
  indicator: {
    height: 2,
    backgroundColor: "#000000",
    position: "absolute",
    bottom: 0,
    left: 0,
    borderRadius: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  bottomBorder: {
    width: "100%",
    height: 1,
    backgroundColor: "#E5E5E5",
    position: "absolute",
    bottom: 0,
  },

  // ScrollView and Event List Styles
  eventList: {
    flex: 1,
    width: "100%",
  },
  scrollViewContent: {
    alignItems: "center",
    paddingBottom: 20,
  },

  // Event Card Styles
  eventCard: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    width: "90%", // Responsive width
    backgroundColor: "#fff", // White background
    marginVertical: 8, // Space between cards
    borderRadius: 8,
    shadowColor: "#000", // Shadow for a card-like appearance
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  eventImage: {
    width: 104,
    height: 104, // Increased height
    borderRadius: 8,
  },
  eventDetails: {
    flex: 1,
    marginLeft: 16,
  },
  eventTitle: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
  },
  eventInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoColumn: {
    flexDirection: "column",
    gap: 8,
  },
  infoText: {
    fontFamily: "Lexend Deca",
    fontSize: 12,
    color: "#000",
  },
  // Status styles
  checkedin: {
    color: "green",
  },
  ready: {
    color: "blue",
  },
  upcoming: {
    color: "orange",
  },
  past: {
    color: "grey",
  },
  // Footer styles
  footer: {
    height: 70,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    backgroundColor: "#FFFFFF",
  },
  footerItem: {
    padding: 12,
  },
  footerIcon: {
    width: 28,
    height: 28,
  },
});

export default MyTickets;
