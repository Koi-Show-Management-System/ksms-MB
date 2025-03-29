import { router } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Platform,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
  FadeIn,
  SlideInRight,
} from "react-native-reanimated";
import { getKoiShows, KoiShow } from "../../../services/showService";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: screenWidth } = Dimensions.get("window");
const HEADER_MAX_HEIGHT = 100;
const HEADER_MIN_HEIGHT = 60;
const HEADER_SCROLL_RANGE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const KoiShowsPage: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(0);
  const [shows, setShows] = useState<KoiShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const tabWidth = screenWidth / 2;
  const translateX = useSharedValue(0);
  const scrollY = useSharedValue(0);

  const headerHeight = useAnimatedStyle(() => {
    return {
      height: interpolate(
        scrollY.value,
        [0, HEADER_SCROLL_RANGE],
        [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
        Extrapolation.CLAMP
      ),
      opacity: interpolate(
        scrollY.value,
        [0, HEADER_SCROLL_RANGE / 2, HEADER_SCROLL_RANGE],
        [1, 0.8, 0.7],
        Extrapolation.CLAMP
      ),
    };
  });

  const titleStyle = useAnimatedStyle(() => {
    return {
      fontSize: interpolate(
        scrollY.value,
        [0, HEADER_SCROLL_RANGE],
        [24, 20],
        Extrapolation.CLAMP
      ),
      opacity: interpolate(
        scrollY.value,
        [0, HEADER_SCROLL_RANGE],
        [1, 0.9],
        Extrapolation.CLAMP
      ),
    };
  });

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  useEffect(() => {
    fetchKoiShows();
  }, [activeTab]);

  const fetchKoiShows = async () => {
    try {
      setError(null);
      if (!refreshing) {
        setLoading(true);
      }
      const result = await getKoiShows(1, 1000);
      
      // Lọc danh sách shows dựa vào tab đang active
      const filteredShows = result.items.filter(show => 
        activeTab === 0 
          ? show.status === "upcoming" 
          : show.status === "completed"
      );
      
      setShows(filteredShows);
    } catch (err) {
      setError("Không thể tải danh sách sự kiện. Vui lòng thử lại sau.");
      console.error("Error fetching shows:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchKoiShows();
  };

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    translateX.value = withSpring(index * tabWidth, {
      damping: 20,
      stiffness: 90,
      mass: 1,
    });
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: tabWidth,
  }));

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start.toDateString() === end.toDateString()) {
      return format(start, "dd/MM/yyyy", { locale: vi });
    }
    
    return `${format(start, "dd/MM", { locale: vi })} - ${format(end, "dd/MM/yyyy", { locale: vi })}`;
  };

  const HeaderSection = () => (
    <Animated.View style={[styles.headerContainer, headerHeight]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={styles.headerContent}>
        <View style={styles.leftSection}>
          <TouchableOpacity style={styles.homeContainer}>
            <Ionicons name="home-outline" size={22} color="#030303" />
          </TouchableOpacity>
        </View>
        <View style={styles.centerSection}>
          <Animated.Text style={[styles.title, titleStyle]}>
            Koi Shows
          </Animated.Text>
        </View>
        <View style={styles.rightSection}>
          <TouchableOpacity style={styles.profileButton}>
            <Ionicons name="person-circle-outline" size={28} color="#030303" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  const TabsSection = () => (
    <View style={styles.tabsContainer}>
      <BlurView intensity={90} tint="light" style={styles.blurView}>
        <View style={styles.tabs}>
          {["Sắp Diễn Ra", "Đã Kết Thúc"].map((label, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.tab, activeTab === index && styles.activeTab]}
              onPress={() => handleTabChange(index)}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === index && styles.activeTabText,
                ]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Animated.View style={[styles.indicator, indicatorStyle]} />
      </BlurView>
    </View>
  );

  const ShowCardItem = ({
    show,
    onPress,
    index,
  }: {
    show: KoiShow;
    onPress: (showId: string) => void;
    index: number;
  }) => (
    <Animated.View entering={SlideInRight.delay(index * 100).springify()}>
      <TouchableOpacity
        style={styles.cardTouchable}
        onPress={() => onPress(show.id)}
        activeOpacity={0.8}>
        <View style={styles.cardContainer}>
          <Image
            source={{ uri: show.imgUrl }}
            style={styles.cardImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.cardImageOverlay}
          />
          <View style={styles.cardStatusBadge}>
            <Text style={styles.cardStatusText}>
              {show.status === "upcoming" ? "Sắp Diễn Ra" : "Đã Kết Thúc"}
            </Text>
          </View>
          <View style={styles.cardContentContainer}>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
                {show.name}
              </Text>
              <View style={styles.cardInfoRow}>
                <MaterialCommunityIcons name="calendar-range" size={16} color="#CBD5E1" />
                <Text style={styles.cardInfo}>
                  {formatDateRange(show.startDate, show.endDate)}
                </Text>
              </View>
              <View style={styles.cardInfoRow}>
                <Ionicons name="location-outline" size={16} color="#CBD5E1" />
                <Text style={styles.cardInfo}>
                  {show.location}
                </Text>
              </View>
              <View style={styles.participantsContainer}>
                <Text style={styles.participantsText}>
                  {show.minParticipants} - {show.maxParticipants} người tham gia
                </Text>
              </View>
            </View>
            <View style={styles.arrowIconContainer}>
              <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const handleShowPress = (showId: string) => {
    router.push({
      pathname: "/(tabs)/shows/KoiShowInformation",
      params: { id: showId }
    });
  };

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      );
    } 
    
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchKoiShows}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (shows.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={48} color="#94A3B8" />
          <Text style={styles.emptyText}>
            Không có {activeTab === 0 ? "sự kiện sắp tới" : "sự kiện đã qua"}
          </Text>
        </View>
      );
    }
    
    return (
      <Animated.View entering={FadeIn} style={styles.showCardsContainer}>
        {shows.map((show, index) => (
          <ShowCardItem 
            key={show.id} 
            show={show} 
            onPress={handleShowPress}
            index={index}
          />
        ))}
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <HeaderSection />
      <TabsSection />
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
            colors={["#3B82F6"]}
          />
        }
        style={styles.scrollView}
      >
        {renderContent()}
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingTop: 8,
    paddingBottom: 100,
  },
  headerContainer: {
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === 'ios' ? 48 : StatusBar.currentHeight,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 100,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 60,
  },
  leftSection: {
    flex: 1,
    alignItems: "flex-start",
  },
  homeContainer: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(203, 213, 225, 0.2)",
  },
  centerSection: {
    flex: 2,
    alignItems: "center",
  },
  title: {
    fontFamily: "Poppins",
    fontWeight: "700",
    color: "#111827",
  },
  rightSection: {
    flex: 1,
    alignItems: "flex-end",
  },
  profileButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "rgba(203, 213, 225, 0.2)",
  },
  tabsContainer: {
    width: "100%",
    zIndex: 99,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 3,
  },
  blurView: {
    width: "100%",
    overflow: "hidden",
  },
  tabs: {
    flexDirection: "row",
    height: 48,
    width: "100%",
    paddingTop: 4,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  tabText: {
    fontFamily: "Lexend Deca",
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B",
  },
  activeTabText: {
    color: "#1E40AF",
  },
  indicator: {
    height: 3,
    backgroundColor: "#3B82F6",
    position: "absolute",
    bottom: 0,
    left: 0,
    borderRadius: 3,
  },
  activeTab: {},
  showCardsContainer: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cardTouchable: {
    width: "100%",
    marginBottom: 16,
  },
  cardContainer: {
    width: "100%",
    height: 220,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  cardImageOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "70%",
    borderRadius: 16,
  },
  cardStatusBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(30, 64, 175, 0.8)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  cardStatusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Lexend Deca",
  },
  cardContentContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    fontFamily: "Poppins",
  },
  cardInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  cardInfo: {
    fontSize: 14,
    fontWeight: "400",
    color: "#F1F5F9",
    marginLeft: 6,
    fontFamily: "Roboto",
  },
  participantsContainer: {
    marginTop: 6,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 8,
    alignSelf: "flex-start",
  },
  participantsText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "Roboto",
  },
  arrowIconContainer: {
    backgroundColor: "rgba(30, 64, 175, 0.7)",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    height: 300,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748B",
    fontFamily: "Lexend Deca",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    height: 300,
  },
  errorText: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    marginVertical: 16,
    fontFamily: "Lexend Deca",
  },
  retryButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontFamily: "Lexend Deca",
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    height: 300,
  },
  emptyText: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    marginTop: 16,
    fontFamily: "Lexend Deca",
  },
});

export default KoiShowsPage;
