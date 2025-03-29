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
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.8;

// Skeleton components for loading states
const SkeletonBox = ({ width, height, style }: { width: string | number; height: string | number; style?: any }) => (
  <View
    style={[
      {
        width,
        height,
        backgroundColor: "#E0E0E0",
        borderRadius: 8,
        overflow: "hidden",
      },
      style,
    ]}
  >
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#F5F5F5",
        transform: [{ translateX: -width }],
        opacity: 0.5,
      }}
    />
  </View>
);

const HeroSkeleton = () => (
  <View style={styles.heroSection}>
    <SkeletonBox width="100%" height={253} />
  </View>
);

const ShowCardSkeleton = () => (
  <View style={[styles.showCard, { backgroundColor: "#F8F8F8" }]}>
    <SkeletonBox width="100%" height={160} style={{ marginBottom: 12 }} />
    <View style={{ padding: 14 }}>
      <SkeletonBox width="80%" height={20} style={{ marginBottom: 12 }} />
      <SkeletonBox width="60%" height={16} style={{ marginBottom: 8 }} />
      <SkeletonBox width="70%" height={16} style={{ marginBottom: 12 }} />
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 8,
        }}
      >
        <SkeletonBox width="40%" height={16} />
        <SkeletonBox width="30%" height={16} />
      </View>
    </View>
  </View>
);

const CarouselSkeleton = ({ title }: { title: string }) => (
  <View style={styles.featuredShows}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingRight: 20, paddingLeft: 5 }}
    >
      {[1, 2, 3].map((item) => (
        <ShowCardSkeleton key={item} />
      ))}
    </ScrollView>
  </View>
);

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
  const publishedShows = shows.filter((show) => show.status === "published");
  const upcomingShows = shows.filter((show) => show.status === "upcoming");
  const completedShows = shows.filter((show) => show.status === "completed");

  useEffect(() => {
    fetchShows();
  }, []);

  const fetchShows = async () => {
    try {
      setLoading(true);
      const data = await getKoiShows(page, 10);
      setShows(data.items);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Failed to fetch koi shows:", error);
      setError("Không thể tải danh sách cuộc thi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleShowPress = (show: KoiShow) => {
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
  const onViewableItemsChanged = useRef(({ 
    viewableItems 
  }: {
    viewableItems: Array<{
      index: number | null;
      item: KoiShow;
      key: string;
      isViewable: boolean;
    }>;
  }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentHeroIndex(viewableItems[0].index);
    }
  }).current;

  // Quick access routes
  const quickAccessRoutes = [
    {
      text: "Shows",
      icon: "trophy-outline" as const,
      route: "/(tabs)/shows/KoiShowsPage"
    },
    {
      text: "Register",
      icon: "create-outline" as const,
      route: "/(tabs)/shows/KoiRegistration"
    },
    {
      text: "Judge",
      icon: "star-outline" as const,
      route: "/(tabs)/judges"
    },
    {
      text: "Profile",
      icon: "person-outline" as const,
      route: "/(tabs)/user/UserProfile"
    }
  ];

  // Update the registration button press handler
  const handleRegistrationPress = (show: KoiShow) => {
    router.push({
      pathname: "/(tabs)/shows/KoiRegistration" as const,
      params: { id: show.id }
    });
  };

  // Update the quick access button rendering
  const renderQuickAccessButtons = () => (
    <View style={styles.quickAccessButtons}>
      {quickAccessRoutes.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.quickAccessButton}
          onPress={() => router.push(item.route as any)}>
          <Ionicons name={item.icon} size={22} color="#FFFFFF" />
          <Text style={styles.quickAccessText}>{item.text}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Update the registration fee display
  const renderRegistrationFee = (show: KoiShow) => {
    const fee = show.registrationFee || 0;
    return (
      <Text style={styles.registrationFee}>
        {fee.toLocaleString()} VND
      </Text>
    );
  };

  // Render a carousel for shows
  const renderShowCarousel = (statusShows: KoiShow[], title: string) => {
    if (statusShows.length === 0 && !loading) return null;

    return (
      <>
        <View style={styles.featuredShows}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {loading ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 20, paddingLeft: 5 }}>
              {[1, 2, 3].map((item) => (
                <ShowCardSkeleton key={item} />
              ))}
            </ScrollView>
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
                            : "https://ugc.futurelearn.com/uploads/images/d5/6d/d56d20b4-1072-48c0-b832-deecf6641d49.jpg",
                      }}
                      style={styles.showImage}
                      defaultSource={require("../../../assets/images/test_image.png")}
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.7)']}
                      style={styles.imageGradient}
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
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color="#666"
                      />
                      <Text style={styles.showDate}>
                        {formatDate(show.startDate)} -{" "}
                        {formatDate(show.endDate)}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons
                        name="location-outline"
                        size={14}
                        color="#666"
                      />
                      <Text style={styles.showLocation} numberOfLines={1}>
                        {show.location || "TBA"}
                      </Text>
                    </View>
                    <View style={styles.cardFooter}>
                      {renderRegistrationFee(show)}
                      <View style={styles.participantInfo}>
                        <Ionicons
                          name="people-outline"
                          size={14}
                          color="#666"
                        />
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
      </>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <ScrollView style={[styles.scrollView, { backgroundColor: "#FFFFFF" }]}>
        {/* Dynamic Hero Section with Show Data */}
        <View style={styles.heroSection}>
          {loading ? (
            <HeroSkeleton />
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
                            : "https://images.unsplash.com/photo-1616989161881-6c788f319bd7?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                      }}
                      style={styles.heroImage}
                      defaultSource={require("../../../assets/images/test_image.png")}
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.8)']}
                      style={styles.heroGradient}
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
                          <Text style={styles.heroButtonText}>Chi tiết</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.heroButton, styles.registerButton]}
                          onPress={() => handleRegistrationPress(show)}>
                          <Text style={styles.registerButtonText}>Đăng ký</Text>
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
              <Text style={styles.noShowsText}>Không có cuộc thi nào</Text>
            </View>
          )}
        </View>

        {/* Quick Access Section */}
        <View style={styles.quickAccess}>
          <Text style={styles.sectionTitle}>Truy cập nhanh</Text>
          {renderQuickAccessButtons()}
        </View>

        {/* Error message display */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Featured Shows - All Shows */}
        {loading ? (
          <CarouselSkeleton title="Cuộc thi nổi bật" />
        ) : (
          renderShowCarousel(shows, "Cuộc thi nổi bật")
        )}

        {/* Published Shows */}
        {loading ? (
          <CarouselSkeleton title="Cuộc thi đã đăng ký" />
        ) : (
          renderShowCarousel(publishedShows, "Cuộc thi đã đăng ký")
        )}

        {/* Upcoming Shows */}
        {loading ? (
          <CarouselSkeleton title="Cuộc thi sắp tới" />
        ) : (
          renderShowCarousel(upcomingShows, "Cuộc thi sắp tới")
        )}

        {/* News and Blogs */}
        <View style={styles.newsAndBlogs}>
          <Text style={styles.sectionTitleWhite}>Tin tức & Bài viết</Text>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm bài viết"
              placeholderTextColor="#E1E1E1"
            />
            <Ionicons name="search-outline" size={18} color="#E1E1E1" />
          </View>
          <View style={styles.articles}>
            {loading ? (
              // Skeleton for articles
              [1, 2].map((index) => (
                <View key={index} style={styles.articleCard}>
                  <SkeletonBox width="100%" height={120} />
                  <View style={{ padding: 10 }}>
                    <SkeletonBox width="90%" height={18} style={{ marginBottom: 8 }} />
                    <SkeletonBox width="100%" height={12} style={{ marginBottom: 4 }} />
                    <SkeletonBox width="80%" height={12} />
                  </View>
                </View>
              ))
            ) : (
              [
                {
                  image:
                    "https://plus.unsplash.com/premium_photo-1723351183913-f1015b61b230?q=80&w=2070&auto=format&fit=crop",
                  title: "Cách nuôi cá Koi",
                  description:
                    "Những mẹo hữu ích giúp bạn nuôi cá Koi khỏe mạnh và phát triển tốt...",
                },
                {
                  image:
                    "https://plus.unsplash.com/premium_photo-1723351183913-f1015b61b230?q=80&w=2070&auto=format&fit=crop",
                  title: "Mẹo chăm sóc cá Koi",
                  description:
                    "Các phương pháp chăm sóc cá Koi đúng cách để cá luôn đẹp và khỏe mạnh...",
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
              ))
            )}
          </View>
        </View>
        
        {/* Add bottom padding to avoid content being hidden by footer */}
        <View style={{ height: 80 }} />
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
    backgroundColor: "#FFFFFF",
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
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 160,
  },
  heroContent: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  heroTitle: {
    fontFamily: "Red Hat Display",
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3
  },
  heroDescription: {
    fontFamily: "Poppins",
    fontSize: 14,
    color: "#F5F5F5",
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2
  },
  heroButtonContainer: {
    flexDirection: "row",
  },
  heroButton: {
    width: 100,
    height: 40,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  registerButton: {
    backgroundColor: "#FFA500",
  },
  heroButtonText: {
    fontFamily: "Roboto",
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  registerButtonText: {
    fontFamily: "Roboto",
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // Quick Access styles
  quickAccess: {
    padding: 16,
    alignItems: "center",
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: "Roboto",
    color: "#030303",
    marginBottom: 16,
    fontWeight: "600",
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
    borderRadius: 12,
    padding: 14,
    paddingVertical: 16,
    flex: 1,
    marginHorizontal: 5,
    shadowColor: "#FFA50070",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  quickAccessIcon: {
    width: 24,
    height: 24,
    marginBottom: 8,
  },
  quickAccessText: {
    fontSize: 13,
    fontFamily: "Roboto",
    fontWeight: "500",
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 6,
  },

  // News and Blog styles
  newsAndBlogs: {
    padding: 16,
    backgroundColor: "#333333",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 20,
  },
  sectionTitleWhite: {
    fontSize: 22,
    fontFamily: "Roboto",
    color: "#FFFFFF",
    marginBottom: 16,
    fontWeight: "600",
  },
  searchContainer: {
    marginBottom: 16,
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E1E1E1",
    borderRadius: 8,
    backgroundColor: "#444444",
    paddingHorizontal: 12,
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
    backgroundColor: "#444444",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  articleImage: {
    width: "100%",
    height: 120,
  },
  articleContent: {
    padding: 12,
  },
  articleTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 15,
    color: "#FFFFFF",
    marginBottom: 8,
    fontWeight: "600",
  },
  articleDescription: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: "#E5E5E5",
    lineHeight: 18,
  },

  // Enhanced show carousel styles
  featuredShows: {
    marginTop: 16,
    marginBottom: 16,
    paddingLeft: 16,
  },
  showCard: {
    width: CARD_WIDTH,
    marginRight: 15,
    marginLeft: 5,
    marginVertical: 8,
    borderRadius: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
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
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
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
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: "#FFA500",
    borderRadius: 20,
  },
  statusText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  showDetails: {
    padding: 16,
  },
  showName: {
    fontSize: 17,
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
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: "#eee",
  },
  registrationFee: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#FFA500",
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
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: "#FFA500",
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  noShowsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  noShowsText: {
    color: "#FFF",
    fontSize: 16,
  },
});

export default Homepage;
