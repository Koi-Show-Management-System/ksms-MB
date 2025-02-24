import { router } from "expo-router"; // Import the router
import React from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Header from "../../../components/Header";

const HomePage: React.FC = () => {
  const handleShowPress = () => {
    router.push("/(tabs)/shows/KoiShowInformation");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header title="Koi Show Hub" description="" />

      <ScrollView style={styles.scrollView}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/assets/Z4FqGAIBBLnlud7h",
            }}
            style={styles.heroImage}
          />
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Title goes here</Text>
            <Text style={styles.heroDescription}>
              This is a sample description text about the event or topic. It
              provides a brief overview and entices the reader to learn more.
            </Text>
            <View style={styles.heroButtonContainer}>
              <TouchableOpacity style={styles.heroButton}>
                <Text style={styles.heroButtonText}>Register</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroButton}>
                <Text style={styles.heroButtonText}>Buy Ticket</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Featured Shows */}
        <View style={styles.featuredShows}>
          <Text style={styles.sectionTitle}>Featured Shows</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {["1", "2", "3", "4"].map((id) => (
              <TouchableOpacity
                key={id}
                style={styles.showCard}
                onPress={handleShowPress}>
                <Image
                  source={{
                    uri: `https://images.unsplash.com/photo-1627223330558-8fc1d94595b0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D`,
                  }}
                  style={styles.showImage}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Quick Access */}
        <View style={styles.quickAccess}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickAccessButtons}>
            {[
              { text: "Mua vé", icon: "Z4FRHgIBBLnlud6X" },
              { text: "Lịch thi đấu", icon: "Z4FRHgIBBLnlud6Y" },
              { text: "Bình chọn", icon: "Z4FRHgIBBLnlud6Z" },
              { text: "More Shows", icon: "Z4FRHgIBBLnlud6Z" }, // This is the button we'll modify
            ].map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickAccessButton}
                // Add onPress to the "More Shows" button
                onPress={
                  item.text === "More Shows"
                    ? () => router.push("/(tabs)/shows/KoiShows")
                    : undefined
                }>
                <Image
                  source={{
                    uri: `https://dashboard.codeparrot.ai/api/assets/${item.icon}`,
                  }}
                  style={styles.quickAccessIcon}
                />
                <Text style={styles.quickAccessText}>{item.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Upcoming Livestream */}
        <View style={styles.quickAccess}>
          <Text style={styles.sectionTitle}>Upcoming Livestream</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.streamContainer}>
              {[
                {
                  image:
                    "https://images.unsplash.com/photo-1627223330558-8fc1d94595b0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                  title: "Golden Koi Show",
                  time: "Now Streaming",
                },
                {
                  image:
                    "https://images.unsplash.com/photo-1627223330558-8fc1d94595b0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                  title: "Rainbow Koi Pavilion",
                  time: "Upcoming",
                },
                {
                  image:
                    "https://images.unsplash.com/photo-1627223330558-8fc1d94595b0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                  title: "Rainbow Koi Pavilion",
                  time: "Upcoming",
                },
                {
                  image:
                    "https://images.unsplash.com/photo-1627223330558-8fc1d94595b0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                  title: "Rainbow Koi Pavilion",
                  time: "Upcoming",
                },
              ].map((stream, index) => (
                <View key={index} style={styles.streamCard}>
                  <Image
                    source={{
                      uri: `${stream.image}`,
                    }}
                    style={styles.streamImage}
                  />
                  <View style={styles.streamTextContainer}>
                    <Text style={styles.streamTitle}>{stream.title}</Text>
                    <Text style={styles.streamTime}>{stream.time}</Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* News and Blogs */}
        <View style={styles.newsAndBlogs}>
          <Text style={styles.sectionTitleWhite}>News & Blogs</Text>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a show"
              placeholderTextColor="#E1E1E1"
            />
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/assets/Z4FRJgIBBLnlud6d",
              }}
              style={styles.searchIcon}
            />
          </View>
          <View style={styles.articles}>
            {[
              {
                image:
                  "https://plus.unsplash.com/premium_photo-1723351183913-f1015b61b230?q=80&w=2070&auto=format&fit=crop",
                title: "How to breed Koi",
                description:
                  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris convallis libero nibh...",
              },
              {
                image:
                  "https://plus.unsplash.com/premium_photo-1723351183913-f1015b61b230?q=80&w=2070&auto=format&fit=crop",
                title: "Koi Fish Care Tips",
                description:
                  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris convallis libero nibh...",
              },
              {
                image:
                  "https://plus.unsplash.com/premium_photo-1723351183913-f1015b61b230?q=80&w=2070&auto=format&fit=crop",
                title: "Koi Pond Maintenance",
                description:
                  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris convallis libero nibh...",
              },
            ].map((article, index) => (
              <View key={index} style={styles.articleCard}>
                <Image
                  source={{
                    uri: article.image,
                  }}
                  style={styles.articleImage}
                />
                <View style={styles.articleContent}>
                  <Text style={styles.articleTitle}>{article.title}</Text>
                  <Text style={styles.articleDescription}>
                    {article.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flexGrow: 1,
  },
  heroSection: {
    width: "100%",
    height: 253,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  heroContent: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  heroTitle: {
    fontFamily: "Red Hat Display",
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 10,
  },
  heroDescription: {
    fontFamily: "Poppins",
    fontSize: 14,
    color: "#E5E5E5",
    marginBottom: 20,
  },
  heroButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heroButton: {
    width: 84,
    height: 36,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  heroButtonText: {
    fontFamily: "Roboto",
    fontSize: 14,
    color: "#000000",
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: "Roboto",
    color: "#030303",
    marginBottom: 16,
    fontWeight: "400",
  },
  sectionTitleWhite: {
    fontSize: 24,
    fontFamily: "Roboto",
    color: "#FFFFFF",
    marginBottom: 16,
    fontWeight: "400",
  },
  featuredShows: {
    marginVertical: 20,
    alignItems: "center",
  },
  showCard: {
    marginHorizontal: 8,
    borderRadius: 8,
    overflow: "hidden",
  },
  showImage: {
    width: 172,
    height: 172,
    backgroundColor: "#f0f0f0",
  },
  quickAccess: {
    padding: 16,
    alignItems: "center",
  },
  quickAccessButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  quickAccessButton: {
    alignItems: "center",
    backgroundColor: "#FFA500",
    borderRadius: 10,
    padding: 10,
    flex: 1,
    marginHorizontal: 5,
  },
  quickAccessIcon: {
    width: 20,
    height: 20,
    marginBottom: 4,
  },
  quickAccessText: {
    fontSize: 12,
    fontFamily: "Roboto",
    color: "#FFFFFF",
    textAlign: "center",
  },
  upcomingLivestream: {
    padding: 16,
  },
  streamContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  streamCard: {
    width: 150,
    height: 162,
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 8,
  },
  streamImage: {
    width: "100%",
    height: 104,
    resizeMode: "cover",
  },
  streamTextContainer: {
    padding: 8,
  },
  streamTitle: {
    fontFamily: "Poppins",
    fontSize: 14,
    fontWeight: "600",
    color: "#030303",
  },
  streamTime: {
    fontFamily: "Poppins",
    fontSize: 12,
    color: "#666666",
    marginTop: 2,
  },
  newsAndBlogs: {
    padding: 16,
    backgroundColor: "#000000",
  },
  searchContainer: {
    marginBottom: 16,
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E1E1E1",
    borderRadius: 4,
    backgroundColor: "#333333",
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontFamily: "Poppins",
    fontSize: 14,
    color: "#E1E1E1",
  },
  searchIcon: {
    width: 20,
    height: 20,
  },
  articles: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  articleCard: {
    width: "48%",
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    marginBottom: 16,
    overflow: "hidden",
  },
  articleImage: {
    width: "100%",
    height: 120,
  },
  articleContent: {
    padding: 10,
  },
  articleTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 8,
  },
  articleDescription: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: "#E5E5E5",
    lineHeight: 21,
  },
  footer: {
    width: "100%",
    height: 70,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  footerNavigation: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    flex: 1,
  },
  footerIconContainer: {
    padding: 10,
  },
  footerIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
});

export default HomePage;
