import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { getKoiShows, KoiShow } from "../../../services/showService";
import { translateStatus } from "../../../utils/statusTranslator"; // Import hàm dịch mới

const { width: screenWidth } = Dimensions.get("window");

const KoiShowsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [shows, setShows] = useState<KoiShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const tabWidth = screenWidth / 2;
  const translateX = useSharedValue(0);

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
      const filteredShows = result.items.filter((show) =>
        activeTab === 0
          ? show.status !== "finished" && show.status !== "completed"
          : show.status === "completed" || show.status === "finished"
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
      return format(start, "dd/MM/yyyy HH:mm", { locale: vi });
    }

    return `${format(start, "dd/MM HH:mm", { locale: vi })} - ${format(
      end,
      "dd/MM/yyyy HH:mm",
      { locale: vi }
    )}`;
  };

  const HeaderSection = () => (
    <View style={styles.header}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      <TouchableOpacity onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Koi Shows</Text>
      <View style={{ width: 24 }} />
    </View>
  );

  const TabsSection = () => (
    <View style={styles.tabsContainer}>
      {["Đang Diễn Ra", "Đã Kết Thúc"].map((label, index) => (
        <TouchableOpacity
          key={index}
          style={styles.tab}
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
      <Animated.View style={[styles.indicator, indicatorStyle]} />
      <View style={styles.bottomBorder} />
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
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            style={styles.cardImageOverlay}
          />
          <View style={styles.cardStatusBadge}>
            <Text style={styles.cardStatusText}>
              {translateStatus(show.status)}
            </Text>
          </View>
          <View style={styles.cardContentContainer}>
            <View style={styles.cardContent}>
              <Text
                style={styles.cardTitle}
                numberOfLines={1}
                ellipsizeMode="tail">
                {show.name}
              </Text>
              <View style={styles.cardInfoRow}>
                <MaterialCommunityIcons
                  name="calendar-range"
                  size={16}
                  color="#CBD5E1"
                />
                <Text style={styles.cardInfo}>
                  {formatDateRange(show.startDate, show.endDate)}
                </Text>
              </View>
              <View style={styles.cardInfoRow}>
                <Ionicons name="location-outline" size={16} color="#CBD5E1" />
                <Text style={styles.cardInfo}>{show.location}</Text>
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
      params: { id: showId },
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
          <TouchableOpacity style={styles.retryButton} onPress={fetchKoiShows}>
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
            Không có{" "}
            {activeTab === 0 ? "sự kiện đang diễn ra" : "sự kiện đã kết thúc"}
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
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
            colors={["#3B82F6"]}
          />
        }
        style={styles.scrollView}>
        {renderContent()}
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingTop: 0, // Loại bỏ padding phía trên
  },
  header: {
    width: "100%",
    height: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#333333",
    textAlign: "center",
    marginLeft: 24, // Điều chỉnh để căn giữa chính xác, bù trừ cho nút back
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
    paddingTop: 0, // Loại bỏ padding phía trên
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
    flexDirection: "row",
    height: 55,
    position: "relative",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
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
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    opacity: 0.5,
  },
  activeTabText: {
    color: "#3B82F6",
    opacity: 1,
  },
  indicator: {
    height: 3,
    backgroundColor: "#3B82F6",
    position: "absolute",
    bottom: 0,
    left: 0,
    borderRadius: 3,
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
