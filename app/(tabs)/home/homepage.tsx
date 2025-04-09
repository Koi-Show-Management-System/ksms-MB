import Ionicons from "@expo/vector-icons/Ionicons";
import { translateStatus } from "../../../utils/statusTranslator";
import { router } from "expo-router";
import React, { useEffect, useRef, useState, useCallback, useMemo, memo } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  RefreshControl,
} from "react-native";
import { getKoiShows, KoiShow } from "../../../services/showService";
import { LinearGradient } from "expo-linear-gradient";
import Carousel3DLandscape from "../../../components/Carousel3DLandscape";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  Easing,
} from "react-native-reanimated";
import ShimmerEffect from "../../../components/animations/ShimmerEffect";
import FadeInView from "../../../components/animations/FadeInView";
import ParallaxHeroSection from "../../../components/animations/ParallaxHeroSection";
import ParallaxSection from "../../../components/animations/ParallaxSection";
import ParallaxItem from "../../../components/animations/ParallaxItem";
import MicroInteraction from "../../../components/animations/MicroInteraction";
import { BlurView } from "expo-blur";
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.8;

// Định nghĩa bảng màu gradient cho ứng dụng
const COLORS = {
  primary: '#FF8C00' as const, // Cam đậm
  primaryLight: '#FFA500' as const, // Cam nhạt
  primaryGradient: ['#FF8C00', '#FFA500', '#FFD700'] as const, // Gradient cam đến vàng
  secondary: '#1E88E5' as const, // Xanh dương
  secondaryLight: '#64B5F6' as const, // Xanh dương nhạt
  secondaryGradient: ['#1E88E5', '#64B5F6', '#90CAF9'] as const, // Gradient xanh dương
  dark: '#222222' as const, // Đen đậm
  darkGradient: ['#222222', '#333333', '#444444'] as const, // Gradient đen
  light: '#FFFFFF' as const, // Trắng
  lightGradient: ['#FFFFFF', '#F5F5F5', '#EEEEEE'] as const, // Gradient trắng
  background: '#F8F9FA', // Nền chính
  card: '#FFFFFF', // Nền thẻ
  text: {
    primary: '#212121', // Chữ chính
    secondary: '#757575', // Chữ phụ
    light: '#FFFFFF', // Chữ trên nền tối
    accent: '#FF8C00', // Chữ nhấn mạnh
  },
  border: '#E0E0E0', // Viền
  shadow: 'rgba(0, 0, 0, 0.1)', // Bóng đổ
};

// Skeleton components for loading states with shimmer effect
const SkeletonBox = memo(({ width, height, style }: { width: string | number; height: string | number; style?: any }) => (
  <ShimmerEffect
    width={width}
    height={height}
    style={{ borderRadius: 8, ...(style as object) }}
    shimmerColors={['#E8E8E8', '#F5F5F5', '#E0E0E0'] as const}
    shimmerDuration={1800}
  />
));

const HeroSkeleton = memo(() => (
  <View style={styles.heroSection}>
    <View style={styles.carouselWrapper}>
      <SkeletonBox width="80%" height={30} style={{ marginBottom: 20, marginTop: 12, alignSelf: 'center' }} />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <SkeletonBox width={200} height={320} style={{ borderRadius: 12 }} />
      </View>
    </View>
  </View>
));

const ShowCardSkeleton = memo(() => (
  <View style={[styles.showCard, { backgroundColor: COLORS.background }]}>
    <SkeletonBox width="100%" height={160} style={{ marginBottom: 12, borderRadius: 12 }} />
    <View style={{ padding: 16 }}>
      <SkeletonBox width="80%" height={22} style={{ marginBottom: 14, borderRadius: 6 }} />
      <SkeletonBox width="60%" height={16} style={{ marginBottom: 10, borderRadius: 4 }} />
      <SkeletonBox width="70%" height={16} style={{ marginBottom: 14, borderRadius: 4 }} />
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 10,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
        }}
      >
        <SkeletonBox width="40%" height={18} style={{ borderRadius: 4 }} />
        <SkeletonBox width="30%" height={18} style={{ borderRadius: 4 }} />
      </View>
    </View>
  </View>
));

const CarouselSkeleton = memo(({ title }: { title: string }) => (
  <FadeInView delay={300} duration={600}>
    <View style={styles.featuredShows}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 20, paddingLeft: 5 }}
      >
        {[1, 2, 3].map((item) => (
          <FadeInView key={item} delay={item * 150} duration={500} from={{ opacity: 0, translateX: 50 }}>
            <ShowCardSkeleton />
          </FadeInView>
        ))}
      </ScrollView>
    </View>
  </FadeInView>
));

const Homepage: React.FC = () => {
  const [shows, setShows] = useState<KoiShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState("");
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const searchInputRef = useRef<TextInput>(null);
  const viewabilityConfig = { itemVisiblePercentThreshold: 50 };

  // Animation values
  const scrollY = useSharedValue(0);
  const heroScale = useSharedValue(1);
  const heroOpacity = useSharedValue(1);

  // Handle scroll events
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Filtered shows based on search query - memoized để tránh tính toán lại khi component re-render
  const filteredShows = useMemo(() =>
    shows.filter(show =>
      show.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      show.location?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [shows, searchQuery]
  );

  // Group shows by status - memoized để tránh tính toán lại khi component re-render
  const publishedShows = useMemo(() =>
    filteredShows.filter((show) => show.status && show.status.toLowerCase() === "published"),
    [filteredShows]
  );

  const upcomingShows = useMemo(() =>
    filteredShows.filter((show) => show.status && show.status.toLowerCase() === "upcoming"),
    [filteredShows]
  );

  const completedShows = useMemo(() =>
    filteredShows.filter((show) => show.status && show.status.toLowerCase() === "finished"),
    [filteredShows]
  );

  useEffect(() => {
    fetchShows();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await fetchShows();
    } finally {
      setRefreshing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  const fetchShows = async () => {
    try {
      setLoading(true);
      const data = await getKoiShows(page, 10);
      setShows(data.items);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Không thể tải danh sách cuộc thi:", error);
      setError("Không thể tải danh sách cuộc thi. Vui lòng tải lại trang.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    if (text.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    searchInputRef.current?.blur();
  }, []);

  // Format date function to avoid errors - memoized để tránh tạo lại hàm khi component re-render
  const formatDate = useCallback((dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      console.error("Ngày tháng không hợp lệ:", dateString);
      return "Chưa cập nhật ngày";
    }
  }, []);

  // Prepare carousel data from shows - memoized để tránh tính toán lại khi component re-render
  const getCarouselItems = useMemo(() => {
    if (!shows || shows.length === 0) return [];

    // Tạo danh sách các items từ shows hiện có
    const carouselItems = shows.map(show => {
      // Tạo mô tả ngắn gọn và hấp dẫn hơn cho carousel theo chiều ngang
      let shortDescription = '';

      // Kết hợp ngày và địa điểm vào mô tả
      if (show.location) {
        shortDescription = `Tại: ${show.location} • `;
      }

      shortDescription += `${formatDate(show.startDate)} - ${formatDate(show.endDate)}`;

      // Thêm phí đăng ký nếu có
      if (show.registrationFee) {
        shortDescription += ` • ${show.registrationFee.toLocaleString()} VND`;
      }

      return {
        uri: show.imgUrl && show.imgUrl.startsWith("http")
          ? show.imgUrl
          : "https://images.unsplash.com/photo-1616989161881-6c788f319bd7?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        title: show.name || "Chưa cập nhật tên cuộc thi",
        description: shortDescription,
        showData: show // Lưu trữ dữ liệu show đầy đủ để sử dụng khi click
      };
    });

    // Nếu số lượng show quá ít (dưới 5), hãy duplicate các item để có hiệu ứng carousel đẹp hơn
    if (carouselItems.length < 5) {
      // Lặp lại các item để đảm bảo có ít nhất 5 items
      const duplicatedItems = [...carouselItems];
      while (duplicatedItems.length < 5) {
        duplicatedItems.push(...carouselItems);
      }
      // Giới hạn số lượng item tối đa là 8
      return duplicatedItems.slice(0, 8);
    }

    return carouselItems;
  }, [shows, formatDate]);

  const handleShowPress = useCallback((show: KoiShow) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/(tabs)/shows/KoiShowInformation",
      params: { id: show.id },
    });
  }, []);

  const handleCardPress = useCallback((item: any, index: number) => {
    if (item && item.showData) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      handleShowPress(item.showData);
    }
  }, [handleShowPress]);

  // Cập nhật handler cho registration
  const handleRegistrationPress = useCallback((show: KoiShow) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/(tabs)/shows/KoiRegistration" as const,
      params: { id: show.id }
    });
  }, []);

  // Quick access routes
  const quickAccessRoutes = [
    {
      text: "Shows",
      icon: "trophy-outline" as const,
      route: "/(tabs)/shows/KoiShowsPage"
    },
    {
      text: "Đăng ký ngay",
      icon: "create-outline" as const,
      route: "/(tabs)/shows/KoiRegistration"
    },
    {
      text: "Ban giám khảo",
      icon: "star-outline" as const,
      route: "/(tabs)/judges"
    },
    {
      text: "Tài khoản",
      icon: "person-outline" as const,
      route: "/(tabs)/user/UserProfile"
    }
  ];

  // Update the quick access button rendering with micro-interactions and gradients
  const renderQuickAccessButtons = useCallback(() => {
    return (
      <View style={styles.quickAccessButtons}>
        {quickAccessRoutes.map((item, index) => {
          // Chọn gradient khác nhau cho mỗi nút
          const gradientColors = index % 2 === 0
            ? COLORS.primaryGradient
            : COLORS.secondaryGradient;

          return (
            <MicroInteraction
              key={index}
              scaleOnPress={true}
              pulseOnMount={true}
              springConfig={{ damping: 8, stiffness: 100 }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push(item.route as any);
              }}
              style={styles.quickAccessButtonContainer}
            >
              <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quickAccessButton}
              >
                <View style={styles.quickAccessIconContainer}>
                  <Ionicons name={item.icon} size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.quickAccessText}>{item.text}</Text>
              </LinearGradient>
            </MicroInteraction>
          );
        })}
      </View>
    );
  }, [quickAccessRoutes]);

  // Update the registration fee display with improved styling
  const renderRegistrationFee = useCallback((show: KoiShow) => {
    const fee = show.registrationFee || 0;
    return (
      <Text style={styles.registrationFee}>
        {fee.toLocaleString()} <Text style={styles.currencyText}>VND</Text>
      </Text>
    );
  }, []);

  // Render a carousel for shows with parallax effect
  const renderShowCarousel = useCallback((statusShows: KoiShow[], title: string, sectionPosition = 600, showSearch = false) => {
    // Luôn hiển thị section, ngay cả khi không có shows
    return (
      <>
        <View style={styles.featuredShows}>
          <ParallaxItem
            scrollY={scrollY}
            startPosition={sectionPosition - 200}
            endPosition={sectionPosition + 200}
            parallaxFactor={0.2}
          >
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>{title}</Text>
              {showSearch && (
                <TouchableOpacity
                  style={styles.searchButton}
                  onPress={() => {
                    setIsSearchFocused(!isSearchFocused);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }}
                >
                  <Ionicons
                    name={isSearchFocused ? "close-outline" : "search-outline"}
                    size={22}
                    color={COLORS.text.primary}
                  />
                </TouchableOpacity>
              )}
            </View>
          </ParallaxItem>

          {showSearch && isSearchFocused && renderShowSearchBar()}

          {loading ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 20, paddingLeft: 5 }}>
              {[1, 2, 3].map((item) => (
                <ShowCardSkeleton key={item} />
              ))}
            </ScrollView>
          ) : statusShows.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 20, paddingLeft: 5 }}>
              {statusShows.map((show, index) => (
                <ParallaxItem
                  key={show.id}
                  scrollY={scrollY}
                  startPosition={sectionPosition - 100}
                  endPosition={sectionPosition + 300}
                  parallaxFactor={0.1 + (index * 0.05)}
                  direction="horizontal"
                >
                  <FadeInView
                    delay={index * 100}
                    duration={600}
                    from={{ opacity: 0, translateX: 50 }}
                  >
                    <MicroInteraction
                      scaleOnPress={true}
                      springConfig={{ damping: 10, stiffness: 100 }}
                      onPress={() => handleShowPress(show)}
                      style={styles.showCard}
                    >
                      <View style={styles.imageContainer}>
                        <Image
                          source={{
                            uri:
                              show.imgUrl && show.imgUrl.startsWith("http")
                                ? show.imgUrl
                                : "https://ugc.futurelearn.com/uploads/images/d5/6d/d56d20b4-1072-48c0-b832-deecf6641d49.jpg",
                          }}
                          style={styles.showImage}
                          contentFit="cover"
                          transition={300}
                          placeholder={require("../../../assets/images/test_image.png")}
                          cachePolicy="memory-disk"
                        />
                        <LinearGradient
                          colors={['transparent', 'rgba(0,0,0,0.85)']}
                          style={styles.imageGradient}
                        />
                        <LinearGradient
                          colors={COLORS.primaryGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.statusBadge}
                        >
                          <Text style={styles.statusText}>{translateStatus(show.status)}</Text>
                        </LinearGradient>
                      </View>
                      <View style={styles.showDetails}>
                        <Text style={styles.showName} numberOfLines={1}>
                          {show.name || "Chưa cập nhật tên cuộc thi"}
                        </Text>
                        <View style={styles.infoRow}>
                          <Ionicons
                            name="calendar-outline"
                            size={14}
                            color={COLORS.text.secondary}
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
                            color={COLORS.text.secondary}
                          />
                          <Text style={styles.showLocation} numberOfLines={1}>
                            {show.location || "Chưa cập nhật địa điểm"}
                          </Text>
                        </View>
                        <LinearGradient
                          colors={['#F8F8F8', '#FFFFFF']}
                          style={styles.cardFooter}
                        >
                          <LinearGradient
                            colors={COLORS.primaryGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.feeContainer}
                          >
                            {renderRegistrationFee(show)}
                          </LinearGradient>
                          <View style={styles.participantInfo}>
                            <Ionicons
                              name="people-outline"
                              size={14}
                              color={COLORS.text.secondary}
                            />
                            <Text style={styles.participantText}>
                              {show.minParticipants}-{show.maxParticipants}
                            </Text>
                          </View>
                        </LinearGradient>
                      </View>
                    </MicroInteraction>
                  </FadeInView>
                </ParallaxItem>
              ))}
            </ScrollView>
          ) : (
            // Hiển thị thông báo khi không có kết quả tìm kiếm
            <View style={styles.noResultsContainer}>
              {searchQuery.length > 0 ? (
                <>
                  <Ionicons name="search-outline" size={40} color={COLORS.text.secondary} style={{ marginBottom: 10 }} />
                  <Text style={styles.noResultsText}>Không tìm thấy cuộc thi nào phù hợp</Text>
                  <Text style={styles.noResultsSubText}>Vui lòng thử tìm kiếm với từ khóa khác</Text>
                </>
              ) : (
                <>
                  <Ionicons name="calendar-outline" size={40} color={COLORS.text.secondary} style={{ marginBottom: 10 }} />
                  <Text style={styles.noResultsText}>Hiện tại chưa có cuộc thi nào</Text>
                </>
              )}
            </View>
          )}
        </View>
      </>
    );
  }, [scrollY, isSearchFocused, loading, searchQuery, handleShowPress, formatDate, renderRegistrationFee]);

  // Render search bar component for shows
  const renderShowSearchBar = useCallback(() => {
    if (!isSearchFocused) return null;

    return (
      <View style={styles.searchContainer}>
        <TextInput
          ref={searchInputRef}
          style={[styles.searchInput, { color: COLORS.text.primary }]}
          placeholder="Tìm kiếm cuộc thi..."
          placeholderTextColor={COLORS.text.secondary}
          value={searchQuery}
          onChangeText={handleSearch}
          onFocus={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          autoFocus={true}
        />
        {searchQuery.length > 0 ? (
          <TouchableOpacity
            onPress={clearSearch}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={18} color={COLORS.text.secondary} />
          </TouchableOpacity>
        ) : (
          <Ionicons name="search-outline" size={18} color={COLORS.text.secondary} />
        )}
      </View>
    );
  }, [isSearchFocused, searchQuery, handleSearch, clearSearch]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        <Animated.ScrollView
          style={[styles.scrollView, { backgroundColor: "#FFFFFF" }]}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary, COLORS.secondary]}
              progressBackgroundColor="#ffffff"
            />
          }>
          {/* Hero Section với Carousel3D và hiệu ứng Parallax */}
          <ParallaxHeroSection
            height={450}
            scrollY={scrollY}
            parallaxFactor={0.5}
            style={styles.heroSection}
          >
            {loading ? (
              <HeroSkeleton />
            ) : shows.length > 0 ? (
              <View style={styles.carouselWrapper}>
                <FadeInView delay={300} duration={800} from={{ opacity: 0, translateY: -20 }}>
                  <Text style={styles.heroSectionTitle}>
                    {shows.length > 0 ? 'Các cuộc thi nổi bật' : 'Vietnam Koi Show 2024'}
                  </Text>
                </FadeInView>
                <Carousel3DLandscape
                  items={getCarouselItems}
                  autoPlay={true}
                  autoPlayInterval={3000}
                  showControls={false}
                  onCardPress={handleCardPress}
                  containerStyle={{
                    height: '90%',
                    padding: 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  backgroundColor="#222"
                />
              </View>
            ) : (
              <View style={styles.noShowsContainer}>
                <Text style={styles.noShowsText}>Hiện tại chưa có cuộc thi nào</Text>
              </View>
            )}
          </ParallaxHeroSection>

          {/* Quick Access Section */}
          <FadeInView delay={400} duration={800} from={{ opacity: 0, translateY: 30 }}>
            <View style={styles.quickAccess}>
              <Text style={styles.sectionTitle}>Truy cập tính năng</Text>
              {renderQuickAccessButtons()}
            </View>
          </FadeInView>

          {/* Error message display */}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Featured Shows - All Shows with Parallax */}
          {loading ? (
            <CarouselSkeleton title="Các cuộc thi nổi bật" />
          ) : (
            <FadeInView delay={500} duration={800} from={{ opacity: 0, translateY: 30 }}>
              {renderShowCarousel(shows, "Các cuộc thi nổi bật", 600, false)}
            </FadeInView>
          )}

          {/* Upcoming Shows */}
          {loading ? (
            <CarouselSkeleton title="Các cuộc thi sắp diễn ra" />
          ) : (
            <FadeInView delay={600} duration={800} from={{ opacity: 0, translateY: 30 }}>
              {renderShowCarousel(upcomingShows, "Các cuộc thi sắp diễn ra", 900, true)}
            </FadeInView>
          )}

          {/* News and Blogs with Parallax */}
          <FadeInView delay={800} duration={800} from={{ opacity: 0, translateY: 30 }}>
            <View style={styles.newsAndBlogs}>
              <ParallaxItem
                scrollY={scrollY}
                startPosition={1500}
                endPosition={1800}
                parallaxFactor={0.2}
              >
                <Text style={styles.sectionTitleWhite}>Tin tức và bài viết mới</Text>
              </ParallaxItem>

              <ParallaxItem
                scrollY={scrollY}
                startPosition={1550}
                endPosition={1850}
                parallaxFactor={0.15}
              >
                <View style={styles.searchContainer}>
                  <TextInput
                    style={[styles.searchInput, { color: '#FFFFFF' }]}
                    placeholder="Tìm kiếm tin tức và bài viết..."
                    placeholderTextColor="#E1E1E1"
                  />
                  <Ionicons name="search-outline" size={18} color="#E1E1E1" />
                </View>
              </ParallaxItem>

              <View style={styles.articles}>
                {loading ? (
                  // Skeleton for articles with shimmer effect
                  [1, 2].map((index) => (
                    <FadeInView key={index} delay={index * 200 + 800} duration={500} from={{ opacity: 0, scale: 0.9 }}>
                      <View style={styles.articleCard}>
                        <SkeletonBox width="100%" height={120} />
                        <View style={{ padding: 10 }}>
                          <SkeletonBox width="90%" height={18} style={{ marginBottom: 8 }} />
                          <SkeletonBox width="100%" height={12} style={{ marginBottom: 4 }} />
                          <SkeletonBox width="80%" height={12} />
                        </View>
                      </View>
                    </FadeInView>
                  ))
                ) : (
                  [
                    {
                      image:
                        "https://plus.unsplash.com/premium_photo-1723351183913-f1015b61b230?q=80&w=2070&auto=format&fit=crop",
                      title: "Kỹ thuật nuôi cá Koi",
                     description:
                       "Tổng hợp những kinh nghiệm và kỹ thuật nuôi cá Koi từ các chuyên gia hàng đầu...",
                     date: "20/07/2024",
                   },
                   {
                     image:
                       "https://plus.unsplash.com/premium_photo-1723351183913-f1015b61b230?q=80&w=2070&auto=format&fit=crop",
                     title: "Bệnh thường gặp ở cá Koi",
                     description:
                       "Hướng dẫn nhận biết và điều trị các bệnh phổ biến ở cá Koi...",
                     date: "15/07/2024",
                    },
                  ].map((article, index) => (
                    <ParallaxItem
                      key={index}
                      scrollY={scrollY}
                      startPosition={1600 + index * 50}
                      endPosition={1900 + index * 50}
                      parallaxFactor={0.1 + (index * 0.05)}
                      direction={index % 2 === 0 ? "horizontal" : "vertical"}
                    >
                      <FadeInView delay={index * 200 + 800} duration={500} from={{ opacity: 0, scale: 0.9 }}>
                        <MicroInteraction 
                          scaleOnPress={true} 
                          springConfig={{ damping: 10, stiffness: 100 }}
                          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                        >
                          <View style={styles.articleCard}>
                            <View style={styles.articleImageContainer}>
                              <Image
                                source={{
                                  uri: article.image,
                                }}
                                style={styles.articleImage}
                                contentFit="cover"
                                transition={300}
                                cachePolicy="memory-disk"
                              />
                              <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
                                style={styles.articleImageGradient}
                              />
                            </View>
                            <View style={styles.articleContent}>
                              <View>
                                <Text style={styles.articleTitle}>{article.title}</Text>
                                <Text style={styles.articleDescription} numberOfLines={3}>
                                  {article.description}
                                </Text>
                              </View>

                              <View style={styles.articleFooter}>
                                <View style={styles.articleMetaRow}>
                                  <View style={styles.articleMetaItem}>
                                    <Ionicons name="calendar-outline" size={14} color="#FFF" />
                                    <Text style={styles.articleMetaText}>{article.date}</Text>
                                  </View>
                                </View>
                                <MicroInteraction 
                                  scaleOnPress={true} 
                                  springConfig={{ damping: 8, stiffness: 80 }}
                                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                                >
                                  <LinearGradient
                                    colors={['#FF8C00', '#FFA500', '#FFD700'] as readonly [string, string, ...string[]]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.readMoreButton}
                                  >
                                    <Text style={styles.readMoreText}>Xem thêm</Text>
                                    <Ionicons name="chevron-forward" size={14} color="#FFF" />
                                  </LinearGradient>
                                </MicroInteraction>
                              </View>
                            </View>
                          </View>
                        </MicroInteraction>
                      </FadeInView>
                    </ParallaxItem>
                  ))
                )}
              </View>
            </View>
          </FadeInView>

          {/* Add bottom padding to avoid content being hidden by footer */}
          <View style={{ height: 80 }} />
        </Animated.ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  noResultsContainer: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 12,
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  noResultsSubText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    opacity: 0.8,
    textAlign: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text.primary,
    fontFamily: 'Roboto',
    padding: 0,
    height: '100%',
    backgroundColor: 'transparent',
  },
  clearButton: {
    padding: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  searchButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
  },
  heroSection: {
    width: "100%",
    height: 450, // Điều chỉnh chiều cao để phù hợp với Carousel3DLandscape
    position: "relative",
    backgroundColor: COLORS.dark, // Màu nền tối hơn để tăng độ tương phản
    marginBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  carouselWrapper: {
    flex: 1,
    width: "100%",
    height: "100%",
    paddingTop: 15,
    paddingBottom: 20,
    paddingHorizontal: 0, // Đảm bảo không có padding ngang để hiển thị các card xung quanh
  },
  heroSectionTitle: {
    fontSize: 28,
    fontWeight: "800",
    fontFamily: "Roboto",
    color: "#FFF",
    textAlign: "center",
    marginVertical: 15,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    zIndex: 10, // Đảm bảo tiêu đề hiển thị phía trên carousel
  },
  carousel3DContainer: {
    height: '90%', // Đảm bảo carousel lấp đầy chiều cao của hero section
    padding: 0,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 20,
    alignItems: "center",
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: "Roboto",
    color: COLORS.text.primary,
    fontWeight: "700",
    alignSelf: "center",
    letterSpacing: 0.3,
  },
  quickAccessButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  quickAccessButtonContainer: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  quickAccessButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    paddingVertical: 18,
    borderRadius: 16,
    height: 90,
  },
  quickAccessIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickAccessText: {
    fontSize: 14,
    fontFamily: "Roboto",
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // News and Blog styles
  newsAndBlogs: {
    padding: 20,
    backgroundColor: COLORS.dark,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 25,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  sectionTitleWhite: {
    fontSize: 24,
    fontFamily: "Roboto",
    color: COLORS.text.light,
    marginBottom: 20,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  // Search styles
  searchContainer: {
    marginBottom: 20,
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  searchIcon: {
    width: 20,
    height: 20,
  },
  articles: {
    flexDirection: "column",
    width: "100%",
  },
  articleCard: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    flexDirection: "row",
    height: 150,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  articleImageContainer: {
    position: 'relative',
    width: 150,
    height: "100%",
  },
  articleImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  articleImageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
  },
  articleContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
  },
  articleTitle: {
    fontFamily: "Roboto",
    fontSize: 18,
    color: COLORS.text.light,
    marginBottom: 8,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  articleDescription: {
    fontFamily: "Roboto",
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 18,
    fontWeight: "400",
    maxWidth: '95%',
  },
  articleFooter: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  articleMetaRow: {
    flexDirection: 'row',
    flex: 1,
  },
  articleMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  articleMetaText: {
    color: '#FFF',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  readMoreText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },

  // Enhanced show carousel styles
  featuredShows: {
    marginTop: 20,
    marginBottom: 20,
    paddingLeft: 16,
  },
  showCard: {
    width: CARD_WIDTH,
    marginRight: 15,
    marginLeft: 5,
    marginVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 180,
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
  },
  showImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  statusBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  statusText: {
    color: COLORS.text.light,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  showDetails: {
    padding: 18,
  },
  showName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    color: COLORS.text.primary,
    letterSpacing: 0.2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  showDate: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginLeft: 8,
    fontWeight: "500",
  },
  showLocation: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginLeft: 8,
    flex: 1,
    fontWeight: "500",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 14,
    paddingHorizontal: 2,
    borderTopWidth: 0,
    borderRadius: 12,
  },
  feeContainer: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  registrationFee: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text.light,
    letterSpacing: 0.5,
  },
  currencyText: {
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.9,
  },
  participantInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  participantText: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginLeft: 6,
    fontWeight: "500",
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
