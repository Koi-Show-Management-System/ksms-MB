// livestream.tsx
import { router } from "expo-router";
import React from "react";
import {
  Dimensions,
  FlatList,
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

// --- Data for Upcoming Shows ---
const upcomingShowsData = [
  {
    id: "1",
    title: "Koi Breeders Showcase",
    time: "Starts at 3 PM",
    imageUrl:
      "https://dashboard.codeparrot.ai/api/image/Z7yr-COoSyo_4k6R/group.png",
  },
  {
    id: "2",
    title: "Rare Koi Exhibition",
    time: "Starts at 5 PM",
    imageUrl:
      "https://dashboard.codeparrot.ai/api/image/Z7yr-COoSyo_4k6R/group-2.png",
  },
  {
    id: "3",
    title: "Another Koi Show",
    time: "Starts at 7 PM",
    imageUrl:
      "https://dashboard.codeparrot.ai/api/image/Z7yr-COoSyo_4k6R/group.png",
  },
];

// --- Data for Featured Koi ---
const featuredKoiData = [
  {
    id: "1",
    imageUrl:
      "https://dashboard.codeparrot.ai/api/image/Z7yr-COoSyo_4k6R/group-4.png",
    name: "Kohaku", // Added name
    description: "Classic white and red koi.", // Added description
  },
  {
    id: "2",
    imageUrl:
      "https://dashboard.codeparrot.ai/api/image/Z7yr-COoSyo_4k6R/group-4.png",
    name: "Showa", // Added name
    description: "Black, white, and red koi.", // Added description
  },
  {
    id: "3",
    imageUrl:
      "https://dashboard.codeparrot.ai/api/image/Z7yr-COoSyo_4k6R/group-4.png",
    name: "Kohaku",
    description: "Classic white and red koi.",
  },
];

// --- Upcoming Show Item Component ---
const UpcomingShowItem: React.FC<{ item: (typeof upcomingShowsData)[0] }> = ({
  item,
}) => (
  <View style={styles.showItemContainer}>
    <Image
      source={{ uri: item.imageUrl }}
      style={styles.showImage}
      resizeMode="cover"
    />
    <View style={styles.showDetails}>
      <Text style={styles.showTitle}>{item.title}</Text>
      <Text style={styles.showTime}>{item.time}</Text>
    </View>
  </View>
);

// --- Featured Koi Item Component ---
const FeaturedKoiItem: React.FC<{ item: (typeof featuredKoiData)[0] }> = ({
  item,
}) => (
  <View style={styles.featuredKoiItemContainer}>
    <Image
      source={{ uri: item.imageUrl }}
      style={styles.featuredKoiImage}
      resizeMode="cover"
    />
    <Text style={styles.featuredKoiName}>{item.name}</Text>
    <Text style={styles.featuredKoiDescription}>{item.description}</Text>
  </View>
);

// --- Main App Component ---
const App: React.FC = () => {
  const [isChatActive, setIsChatActive] = React.useState(false);

  const handleWatchLivePress = () => {
    router.push("/(tabs)/shows/StreamingShow");
  };

  const handleChatPress = () => {
    setIsChatActive(!isChatActive);
    alert(`Chat is now ${isChatActive ? "inactive" : "active"} (Placeholder)`);
  };

  return (
    <ScrollView style={styles.container}>
      <Header />
      {/* ... (Rest of the code remains the same until the Featured Koi section) ... */}
      <View style={styles.mainImageContainer}>
        <Image
          source={{
            uri: "https://dashboard.codeparrot.ai/api/image/Z7yr-COoSyo_4k6R/vector.png",
          }}
          style={styles.mainImage}
          resizeMode="cover"
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
          activeOpacity={0.7}>
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
          ]}
          onPress={handleChatPress}
          activeOpacity={0.7}>
          <Text style={[styles.buttonText, { color: "#4A90E2" }]}>Chat</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Upcoming Shows</Text>
      <FlatList
        data={upcomingShowsData}
        renderItem={({ item }) => <UpcomingShowItem item={item} />}
        keyExtractor={(item) => item.id}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.showsCarouselContainer}
      />

      <Text style={styles.sectionTitle}>Featured Koi</Text>
      {/* --- Featured Koi Carousel --- */}
      <FlatList
        data={featuredKoiData}
        renderItem={({ item }) => <FeaturedKoiItem item={item} />}
        keyExtractor={(item) => item.id}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.featuredCarouselContainer}
      />
    </ScrollView>
  );
};

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;

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
    marginTop: 16,
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },
  headerTitle: {
    fontFamily: "Poppins",
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
    height: windowHeight * 0.3,
    borderRadius: 8,
    marginVertical: 16,
    overflow: "hidden",
  },
  mainImage: {
    width: "100%",
    height: "100%",
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    paddingHorizontal: 16,
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
    minWidth: "45%",
    alignItems: "center",
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
  showsCarouselContainer: {
    paddingLeft: 16,
    paddingBottom: 16,
  },
  showItemContainer: {
    width: windowWidth * 0.6,
    marginRight: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    overflow: "hidden",
    padding: 10,
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
  // --- Featured Koi Styles ---
  featuredCarouselContainer: {
    paddingLeft: 16,
    paddingBottom: 16,
  },
  featuredKoiItemContainer: {
    width: windowWidth * 0.4, // Adjust width as needed
    marginRight: 16,
    alignItems: "center", // Center content vertically
  },
  featuredKoiImage: {
    width: "30%",
    aspectRatio: 1, // Square image
    borderRadius: 4,
    marginBottom: 8, // Space between image and text
  },
  featuredKoiName: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center", // Center the name
    marginBottom: 4, // Space between name and description
  },
  featuredKoiDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center", // Center the description
  },
});

export default App;
