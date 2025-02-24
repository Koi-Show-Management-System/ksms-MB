// livestream.tsx
import React from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// --- Header Component ---
interface HeaderProps {
  title?: string;
  profileImageUrl?: string;
}

const Header: React.FC<HeaderProps> = ({
  title = "Home",
  profileImageUrl = "https://dashboard.codeparrot.ai/api/image/Z7yr-COoSyo_4k6R/group-11.png",
}) => {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.titleContainer}>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      <Image
        source={{ uri: profileImageUrl }}
        style={styles.profileIcon}
        resizeMode="contain"
      />
    </View>
  );
};

// --- Main LiveStream Component ---
const LiveStream: React.FC = () => {
  // State for managing chat button press (example)
  const [isChatActive, setIsChatActive] = React.useState(false);

  const handleWatchLivePress = () => {
    // Implement your logic for starting the live stream here.
    // This could involve navigating to a different screen,
    // connecting to a streaming service, etc.
    alert("Starting Live Stream (Placeholder)");
  };

  const handleChatPress = () => {
    // Toggle chat active state (for demonstration)
    setIsChatActive(!isChatActive);
    // In a real app, you'd likely navigate to a chat screen
    // or open a chat modal.
    alert(`Chat is now ${isChatActive ? "inactive" : "active"} (Placeholder)`);
  };

  return (
    <ScrollView style={styles.container}>
      <Header />
      <View style={styles.mainImageContainer}>
        <Image
          source={{
            uri: "https://dashboard.codeparrot.ai/api/image/Z7yr-COoSyo_4k6R/vector.png",
          }}
          style={styles.mainImage}
          resizeMode="cover" // Use cover for better image display
        />
      </View>
      <Text style={styles.mainTitle}>Live Koi Show</Text>
      <Text style={styles.description}>
        Join our live stream to witness the beauty and elegance of koi fish from
        around the world.
      </Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#4A90E2" }]}
          onPress={handleWatchLivePress}
          activeOpacity={0.7} // Add visual feedback on press
        >
          <Text style={[styles.buttonText, { color: "#FFFFFF" }]}>
            Watch Live
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#4A90E2",
            },
          ]} //Added border
          onPress={handleChatPress}
          activeOpacity={0.7}>
          <Text style={[styles.buttonText, { color: "#4A90E2" }]}>Chat</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Upcoming Shows</Text>
      <View style={styles.showContainer}>
        <Image
          source={{
            uri: "https://dashboard.codeparrot.ai/api/image/Z7yr-COoSyo_4k6R/group.png",
          }}
          style={styles.showImage}
          resizeMode="cover"
        />
        <View style={styles.showDetails}>
          <Text style={styles.showTitle}>Koi Breeders Showcase</Text>
          <Text style={styles.showTime}>Starts at 3 PM</Text>
        </View>
      </View>
      <View style={styles.showContainer}>
        <Image
          source={{
            uri: "https://dashboard.codeparrot.ai/api/image/Z7yr-COoSyo_4k6R/group-2.png",
          }}
          style={styles.showImage}
          resizeMode="cover"
        />
        <View style={styles.showDetails}>
          <Text style={styles.showTitle}>Rare Koi Exhibition</Text>
          <Text style={styles.showTime}>Starts at 5 PM</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Featured Koi</Text>
      <View style={styles.featuredContainer}>
        <Image
          source={{
            uri: "https://dashboard.codeparrot.ai/api/image/Z7yr-COoSyo_4k6R/group-3.png",
          }}
          style={styles.featuredImage}
          resizeMode="cover"
        />
        <Image
          source={{
            uri: "https://dashboard.codeparrot.ai/api/image/Z7yr-COoSyo_4k6R/group-4.png",
          }}
          style={styles.featuredImage}
          resizeMode="cover"
        />
      </View>
    </ScrollView>
  );
};

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height; // Get window height

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minWidth: Math.min(320, windowWidth),
    width: "100%",
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: "transparent",
    marginTop: 16, // Add top margin for spacing
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },
  headerTitle: {
    fontFamily: "Poppins", // Ensure Poppins font is available
    fontSize: 16,
    fontWeight: "700",
    color: "#030303",
    minWidth: 49,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  mainImageContainer: {
    width: "100%",
    height: windowHeight * 0.3, // Responsive height (30% of screen)
    borderRadius: 8,
    marginVertical: 16, // Add vertical margin
    overflow: "hidden", // Clip image to rounded corners
  },
  mainImage: {
    width: "100%",
    height: "100%",
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    paddingHorizontal: 16, // Consistent padding
  },
  description: {
    fontSize: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: "45%", // Ensure buttons don't overlap
    alignItems: "center", // Center text within button
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  showContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  showImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  showDetails: {
    flex: 1,
  },
  showTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  showTime: {
    fontSize: 14,
    color: "#666",
  },
  featuredContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16, // Add bottom margin
  },
  featuredImage: {
    width: "48%", // Use percentage for responsive layout
    aspectRatio: 1, // Maintain aspect ratio for square images
    borderRadius: 8,
  },
});

export default LiveStream;
