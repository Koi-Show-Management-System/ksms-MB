import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getKoiShows, KoiShow } from "../../../services/showService";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.8;

const Homepage: React.FC = () => {
  const [shows, setShows] = useState<KoiShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState("");
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const viewabilityConfig = { itemVisiblePercentThreshold: 50 };

  // Group shows by status
  const activeShows = shows.filter((show) => show.status === "active");
  const upcomingShows = shows.filter((show) => show.status === "upcoming");
  const plannedShows = shows.filter((show) => show.status === "planned");
  const completedShows = shows.filter((show) => show.status === "completed");

  useEffect(() => {
    fetchShows();
  }, []);

  const fetchShows = async () => {
    try {
      setLoading(true);
      const data = await getKoiShows(page, 10);
      setShows(data.items || []);
      setTotalPages(data.totalPages || 1);
      setError("");
    } catch (err) {
      console.error("Failed to fetch shows:", err);
      setError("Failed to load shows. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleShowPress = (show: KoiShow) => {
    // Navigate to show details
    router.push({
      pathname: "/(tabs)/shows/KoiShowInformation",
      params: { id: show.id },
    });
  };

  // Format date function to avoid errors
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      console.error("Invalid date format:", dateString);
      return "N/A";
    }
  };

  // Add viewability change handler
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentHeroIndex(viewableItems[0].index);
    }
  }).current;

  // Render a carousel for shows
  const renderShowCarousel = (statusShows: KoiShow[], title: string) => {
    if (statusShows.length === 0 && !loading) return null;

    return (
      <View style={styles.featuredShows}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20, paddingLeft: 5 }}>
            {statusShows.map((show) => (
              <TouchableOpacity
                key={show.id}
                style={styles.showCard}
                onPress={() => handleShowPress(show)}>
                <View style={styles.imageContainer}>
                  <Image
                    source={{
                      uri:
                        show.imgUrl && show.imgUrl.startsWith("http")
                          ? show.imgUrl
                          : show.imgUrl
                          ? `https://api.ksms.news/${show.imgUrl}`
                          : "https://images.unsplash.com/photo-1583130879269-ab3b9c83538e?q=80&w=1170",
                    }}
                    style={styles.showImage}
                    defaultSource={require("../../../assets/images/test_image.png")}
                  />
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{show.status}</Text>
                  </View>
                </View>
                <View style={styles.showDetails}>
                  <Text style={styles.showName} numberOfLines={1}>
                    {show.name || "Unnamed Show"}
                  </Text>
                  <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={14} color="#666" />
                    <Text style={styles.showDate}>
                      {formatDate(show.startDate)} - {formatDate(show.endDate)}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={14} color="#666" />
                    <Text style={styles.showLocation} numberOfLines={1}>
                      {show.location || "TBA"}
                    </Text>
                  </View>
                  <View style={styles.cardFooter}>
                    <Text style={styles.registrationFee}>
                      {show.registrationFee.toLocaleString()} VND
                    </Text>
                    <View style={styles.participantInfo}>
                      <Ionicons name="people-outline" size={14} color="#666" />
                      <Text style={styles.participantText}>
                        {show.minParticipants}-{show.maxParticipants}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Dynamic Hero Section with Show Data */}
        <View style={styles.heroSection}>
          {loading ? (
            <View style={styles.loadingHero}>
              <ActivityIndicator size="large" color="#FFF" />
            </View>
          ) : shows.length > 0 ? (
            <>
              <FlatList
                ref={flatListRef}
                data={shows}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                renderItem={({ item: show }) => (
                  <View style={[styles.heroSlide, { width }]}>
                    <Image
                      source={{
                        uri:
                          show.imgUrl && show.imgUrl.startsWith("http")
                            ? show.imgUrl
                            : show.imgUrl
                            ? `https://api.ksms.news/${show.imgUrl}`
                            : "https://images.unsplash.com/photo-1583130879269-ab3b9c83538e?q=80&w=2070&auto=format&fit=crop",
                      }}
                      style={styles.heroImage}
                      defaultSource={require("../../../assets/images/test_image.png")}
                    />
                    <View style={styles.heroContent}>
                      <Text style={styles.heroTitle}>{show.name}</Text>
                      <Text style={styles.heroDescription} numberOfLines={2}>
                        {show.description}
                      </Text>
                      <View style={styles.heroButtonContainer}>
                        <TouchableOpacity
                          style={styles.heroButton}
                          onPress={() => handleShowPress(show)}>
                          <Text style={styles.heroButtonText}>Details</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.heroButton}
                          onPress={() =>
                            router.push({
                              pathname: "/(tabs)/shows/Registration",
                              params: { id: show.id },
                            })
                          }>
                          <Text style={styles.heroButtonText}>Register</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
                keyExtractor={(item) => item.id}
              />

              {/* Pagination Dots */}
              <View style={styles.paginationContainer}>
                {shows.slice(0, 5).map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.paginationDot,
                      index === currentHeroIndex && styles.paginationDotActive,
                    ]}
                    onPress={() => {
                      flatListRef.current?.scrollToIndex({
                        index,
                        animated: true,
                      });
                    }}
                  />
                ))}
              </View>
            </>
          ) : (
            <View style={styles.noShowsContainer}>
              <Text style={styles.noShowsText}>No shows available</Text>
            </View>
          )}
        </View>

        {/* Quick Access Section */}
        <View style={styles.quickAccess}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickAccessButtons}>
            {[
              {
                text: "Shows",
                icon: "Z4FRHgIBBLnlud6X",
                route: "/(tabs)/shows/KoiShowsPage",
              },
              {
                text: "Register",
                icon: "Z4FRHgIBBLnlud6Y",
                route: "/(tabs)/shows/Registration",
              },
              {
                text: "Judge",
                icon: "Z4FRHgIBBLnlud6Z",
                route: "/(tabs)/judges",
              },
              {
                text: "Profile",
                icon: "Z4FRHgIBBLnlud6Z",
                route: "/(tabs)/user/UserProfile",
              },
            ].map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickAccessButton}
                onPress={() => router.push(item.route)}>
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

        {/* Error message display */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Featured Shows - All Shows */}
        {renderShowCarousel(shows, "Featured Shows")}

        {/* Active Shows */}
        {renderShowCarousel(activeShows, "Active Shows")}

        {/* Upcoming Shows */}
        {renderShowCarousel(upcomingShows, "Upcoming Shows")}

        {/* Planned Shows */}
        {renderShowCarousel(plannedShows, "Planned Shows")}

        {/* Completed Shows */}
        {renderShowCarousel(completedShows, "Past Shows")}

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
  },
  heroButton: {
    width: 84,
    height: 36,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  heroButtonText: {
    fontFamily: "Roboto",
    fontSize: 14,
    color: "#000000",
  },

  // Quick Access styles
  quickAccess: {
    padding: 16,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: "Roboto",
    color: "#030303",
    marginBottom: 16,
    fontWeight: "400",
    alignSelf: "flex-start",
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

  // News and Blog styles
  newsAndBlogs: {
    padding: 16,
    backgroundColor: "#000000",
  },
  sectionTitleWhite: {
    fontSize: 24,
    fontFamily: "Roboto",
    color: "#FFFFFF",
    marginBottom: 16,
    fontWeight: "400",
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

  // Existing show carousel styles
  featuredShows: {
    marginTop: 20,
    marginBottom: 10,
    paddingLeft: 10,
  },
  showCard: {
    width: CARD_WIDTH,
    marginRight: 15,
    marginLeft: 5,
    marginVertical: 8,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 5,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "#eeeeee",
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 160,
  },
  showImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  statusBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
  },
  statusText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  showDetails: {
    padding: 14,
  },
  showName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#222",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  showDate: {
    fontSize: 12,
    color: "#666",
    marginLeft: 6,
  },
  showLocation: {
    fontSize: 12,
    color: "#666",
    marginLeft: 6,
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: "#eee",
  },
  registrationFee: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FF9500",
  },
  participantInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  participantText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  loadingContainer: {
    height: 220,
    justifyContent: "center",
    alignItems: "center",
    width: CARD_WIDTH,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 15,
    padding: 10,
  },
  loadingHero: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  heroSlide: {
    justifyContent: "center",
    alignItems: "center",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFF",
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: "#FFA500",
  },
  noShowsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noShowsText: {
    color: "#FFF",
    fontSize: 16,
  },
});

export default Homepage;
