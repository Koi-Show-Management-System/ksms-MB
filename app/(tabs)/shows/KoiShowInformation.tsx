import {
  FontAwesome,
  FontAwesome5,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import React, { memo, useCallback, useEffect, useState } from "react";
import { SceneMap, TabView, TabBar } from 'react-native-tab-view';
import { Dimensions } from 'react-native'; // Need Dimensions for initialLayout

import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import KoiContestants from "./KoiContestants";
import KoiShowResults from "./KoiShowResults";
import KoiShowVoting from "./KoiShowVoting";

import { KoiShowProvider, useKoiShow } from "../../../context/KoiShowContext";
import {
  CompetitionCategoryDetail,
  getCompetitionCategoryDetail,
} from "../../../services/competitionService";
import {
  getAllLivestreamsForShow,
  LivestreamInfo,
} from "../../../services/livestreamService";
import { CompetitionCategory } from "../../../services/registrationService";

// Skeleton Component (unchanged)
const SkeletonLoader = () => {
  // Skeleton implementation remains the same
  return (
    <ScrollView style={styles.scrollView}>
      {/* Banner Skeleton */}
      <View style={[styles.bannerContainer, styles.skeletonBanner]} />

      {/* Title Skeleton */}
      <View style={styles.titleContainer}>
        <View style={styles.skeletonTitle} />
        <View style={styles.quickInfoContainer}>
          <View style={styles.quickInfoItem}>
            <View style={styles.skeletonIcon} />
            <View style={styles.skeletonText} />
          </View>
          <View style={styles.quickInfoItem}>
            <View style={styles.skeletonIcon} />
            <View style={styles.skeletonText} />
          </View>
        </View>
      </View>

      {/* Event Details Section Skeleton */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderContent}>
            <View style={styles.skeletonIcon} />
            <View style={[styles.skeletonText, { width: 120 }]} />
          </View>
        </View>
        <View style={styles.sectionContent}>
          <View style={[styles.skeletonText, { width: "100%", height: 80 }]} />
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <View style={styles.skeletonIcon} />
              <View>
                <View style={[styles.skeletonText, { width: 100 }]} />
                <View style={[styles.skeletonText, { width: 150 }]} />
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Categories Section Skeleton */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderContent}>
            <View style={styles.skeletonIcon} />
            <View style={[styles.skeletonText, { width: 120 }]} />
          </View>
        </View>
        <View style={styles.sectionContent}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[1, 2, 3].map((item) => (
              <View
                key={item}
                style={[styles.categoryCard, styles.skeletonCard]}>
                <View
                  style={[styles.skeletonText, { width: "80%", height: 20 }]}
                />
                <View
                  style={[styles.skeletonText, { width: "60%", height: 16 }]}
                />
                <View
                  style={[styles.skeletonText, { width: "40%", height: 16 }]}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Footer Skeleton */}
      <View style={styles.footer}>
        <View style={[styles.actionButton, styles.skeletonButton]} />
        <View style={[styles.actionButton, styles.skeletonButton]} />
      </View>
    </ScrollView>
  );
};

// Wrapper component
const KoiShowInformation = () => {
  const params = useLocalSearchParams();
  const id = params.id as string;

  return (
    <KoiShowProvider showId={id}>
      <KoiShowInformationContent />
    </KoiShowProvider>
  );
};

// Memoized CategoryItem - Updated to accept detailedCategory
const CategoryItem = memo(
  ({
    item,
    detailedCategory,
    isLoadingDetails,
  }: {
    item: CompetitionCategory;
    detailedCategory?: CompetitionCategoryDetail;
    isLoadingDetails: boolean;
  }) => (
    <View style={styles.categoryCard}>
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryName}>{item.name}</Text>
      </View>

      <View style={styles.categoryFeeContainer}>
        <Text style={styles.categoryFeeLabel}>Phí đăng ký:</Text>
        <Text style={styles.categoryFee}>
          {item.registrationFee.toLocaleString("vi-VN")} đ
        </Text>
      </View>

      <View style={styles.categoryDetailsContainer}>
        <View style={styles.categoryDetailItem}>
          <Text style={styles.categoryDetailLabel}>Kích thước:</Text>
          <Text style={styles.categoryDetailValue}>
            {item.sizeMin} - {item.sizeMax} cm
          </Text>
        </View>

        <View style={styles.categoryDetailItem}>
          <Text style={styles.categoryDetailLabel}>Số lượng tối đa:</Text>
          <Text style={styles.categoryDetailValue}>{item.maxEntries} Koi</Text>
        </View>
      </View>

      {item.description && (
        <Text style={styles.categoryDescription}>{item.description}</Text>
      )}

      {item.varieties && item.varieties.length > 0 && (
        <View style={styles.varietiesContainer}>
          <Text style={styles.varietiesTitle}>Giống Koi được phép:</Text>
          <View style={styles.varietiesList}>
            {item.varieties.map((variety, index) => (
              <View key={index} style={styles.varietyTag}>
                <Text style={styles.varietyTagText}>{variety}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Awards Section */}
      {isLoadingDetails ? (
        <ActivityIndicator
          size="small"
          color="#666"
          style={styles.awardsLoading}
        />
      ) : detailedCategory?.awards && detailedCategory.awards.length > 0 ? (
        <View style={styles.awardsContainer}>
          <Text style={styles.awardsTitle}>Giải thưởng</Text>
          {detailedCategory.awards.map((award) => (
            <View key={award.id} style={styles.awardItem}>
              <FontAwesome name="trophy" size={16} color="#FFD700" />
              <View style={styles.awardDetails}>
                <Text style={styles.awardName}>{award.name}</Text>
                <Text style={styles.awardPrize}>
                  {award.prizeValue.toLocaleString("vi-VN")} VNĐ
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        !isLoadingDetails && (
          <Text style={styles.noAwardsText}>Chưa có thông tin giải thưởng</Text>
        )
      )}
    </View>
  )
);

// Main content component
const KoiShowInformationContent = () => {
  const { showData, categories, isLoading, error, refetch } = useKoiShow();
  const [expandedSections, setExpandedSections] = useState({
    eventDetails: true,
    categories: true,
    criteria: false,
    rules: false,
    timeline: false,
  });
  const [index, setIndex] = useState(0); // Index của tab đang được chọn
  const [routes] = useState([ // Danh sách các tab
    { key: "info", title: "Thông tin" },
    { key: "contestants", title: "Thí sinh" },
    { key: "results", title: "Kết quả" },
    { key: "vote", title: "Bình chọn" },
  ]);
  const [livestreamInfo, setLivestreamInfo] = useState<LivestreamInfo | null>(
    null
  );
  const [isLivestreamLoading, setIsLivestreamLoading] =
    useState<boolean>(false);
  const [detailedCategories, setDetailedCategories] = useState<
    Record<string, CompetitionCategoryDetail>
  >({});
  const [isCategoryDetailsLoading, setIsCategoryDetailsLoading] =
    useState<boolean>(false);
  const [categoryDetailsError, setCategoryDetailsError] = useState<
    string | null
  >(null);

  // Animation values for sticky header
  const scrollY = useSharedValue(0);
  const BANNER_HEIGHT = 200; // Chiều cao Banner của bạn
  const TITLE_SECTION_HEIGHT = 100; // Chiều cao ước tính của khu vực Title + Quick Info
  const TAB_BAR_HEIGHT = 55; // Chiều cao mong muốn cho TabBar (bao gồm padding)
  const HEADER_HEIGHT = BANNER_HEIGHT + TITLE_SECTION_HEIGHT; // Tổng chiều cao Header ban đầu
  const COLLAPSED_HEADER_HEIGHT = 0; // Header ẩn hoàn toàn khi thu gọn
  const SCROLL_THRESHOLD = HEADER_HEIGHT - COLLAPSED_HEADER_HEIGHT; // Điểm TabBar bắt đầu dính lại

  // Scroll handler
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Animation styles for the header (Banner + Title/Info)
  const headerAnimatedStyles = useAnimatedStyle(() => {
    const translateY = interpolate(
        scrollY.value,
        [0, SCROLL_THRESHOLD],
        [0, -SCROLL_THRESHOLD], // Di chuyển lên trên
        Extrapolation.CLAMP
    );
    return {
        transform: [{ translateY }],
        position: 'absolute', // Quan trọng
        top: 0, left: 0, right: 0,
        zIndex: 1,
        backgroundColor: '#FFF', // Cần background
        height: HEADER_HEIGHT, // Cần chiều cao cố định
    };
  });

  // Banner animation
  const bannerAnimatedStyles = useAnimatedStyle(() => {
    return {
      transform: [
  // Animation styles for the TabBar (sticky effect)
  const tabBarAnimatedStyles = useAnimatedStyle(() => {
    const translateY = interpolate(
        scrollY.value,
        [0, SCROLL_THRESHOLD],
        [HEADER_HEIGHT, COLLAPSED_HEADER_HEIGHT], // Di chuyển từ dưới header lên vị trí sticky
        Extrapolation.CLAMP
    );
    return {
        transform: [{ translateY }],
        position: 'absolute', // Quan trọng
        top: 0, // Vị trí Y được điều khiển bởi transform
        left: 0, right: 0,
        zIndex: 2, // Nằm trên Header khi sticky
    };

  const renderScene = SceneMap({
    info: () => <InfoTabContent scrollHandler={scrollHandler} /* ... các props khác ... */ />,
    contestants: () => <KoiContestants scrollHandler={scrollHandler} showId={showData!.id} />,
    results: () => <KoiShowResults scrollHandler={scrollHandler} showId={showData!.id} />,
    vote: () => <KoiShowVoting scrollHandler={scrollHandler} showId={showData!.id} />,
  });

  });

  const renderCustomTabBar = (props: any) => (
    <Animated.View style={[styles.tabBarContainer, tabBarAnimatedStyles]}>
        <TabBar
            {...props}
            scrollEnabled
            style={styles.tabBarItself}
            indicatorStyle={styles.tabIndicator}
            activeColor="#007bff"
            inactiveColor="#6c757d"
            renderLabel={({ route, focused, color }) => ( /* ... JSX cho label + icon ... */ )}
        />
    </Animated.View>
  );


        {
          translateY: interpolate(
            scrollY.value,
            [0, BANNER_HEIGHT],
            [0, -BANNER_HEIGHT / 2],
            Extrapolation.CLAMP
          ),
        },
      ],
      opacity: interpolate(
        scrollY.value,
        [0, BANNER_HEIGHT],
        [1, 0.3],
        Extrapolation.CLAMP
      ),
    };
  });

  // Content padding animation to push content down when header is visible
  const contentAnimatedStyles = useAnimatedStyle(() => {
    // When scrolling, we reduce the top padding to allow content to flow under the header
    const paddingTop = interpolate(
      scrollY.value,
      [0, BANNER_HEIGHT],
      [BANNER_HEIGHT + HEADER_HEIGHT, HEADER_HEIGHT],
      Extrapolation.CLAMP
    );

    return {
      paddingTop,
    };
  });

  // Memo key extractor for FlatList
  const keyExtractor = useCallback((item: CompetitionCategory) => item.id, []);

  // Toggle section expansion
  const toggleSection = useCallback(
    (section: keyof typeof expandedSections) => {
      setExpandedSections((prev) => ({
        ...prev,
        [section]: !prev[section],
      }));
    },
    []
  );

  // Format date function to display in a nicer way
  const formatDateAndTime = useCallback(
    (startDate: string, endDate: string) => {
      try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const isSameDay =
          start.getDate() === end.getDate() &&
          start.getMonth() === end.getMonth() &&
          start.getFullYear() === end.getFullYear();

        if (isSameDay) {
          // Same day format: từ [time] đến [time]/[date]
          const date = start.toLocaleDateString("vi-VN", {
            day: "numeric",
            month: "numeric",
            year: "numeric",
          });
          const startTime = start.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          });
          const endTime = end.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          });
          return `${startTime} - ${endTime} / ${date}`;
        } else {
          // Different days format
          return `${start.toLocaleDateString(
            "vi-VN"
          )} - ${end.toLocaleDateString("vi-VN")}`;
        }
      } catch (error) {
        console.error("Date/Time formatting error:", error);
        return `${startDate} - ${endDate}`;
      }
    },
    []
  );

  // Check if date is today
  const isToday = useCallback((dateString: string) => {
    const today = new Date();
    const date = new Date(dateString);
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }, []);

  // Format timeline content để đảm bảo là string
  const formatTimelineContent = useCallback((content: any): string => {
    if (typeof content === "string") return content;
    if (content && typeof content === "object") {
      if (content.title && content.content) {
        return `${content.title}: ${content.content}`;
      }
      return JSON.stringify(content);
    }
    return String(content || "");
  }, []);

  // Format rule content để đảm bảo là string
  const formatRuleContent = useCallback((rule: any): string => {
    if (typeof rule === "string") return rule;
    if (rule && typeof rule === "object") {
      if (rule.id && rule.title && rule.content) {
        return `${rule.title}: ${rule.content}`;
      } else if (rule.title && rule.content) {
        return `${rule.title}: ${rule.content}`;
      }
      return JSON.stringify(rule);
    }
    return String(rule || "");
  }, []);

  // Format criterion content để đảm bảo là string
  const formatCriterionContent = useCallback((criterion: any): string => {
    if (typeof criterion === "string") return criterion;
    if (criterion && typeof criterion === "object") {
      if (criterion.id && criterion.title && criterion.content) {
        return `${criterion.title}: ${criterion.content}`;
      } else if (criterion.title && criterion.content) {
        return `${criterion.title}: ${criterion.content}`;
      }
      return JSON.stringify(criterion);
    }
    return String(criterion || "");
  }, []);

  // Memoized renderItem function for FlatList
  const renderCategoryItem = useCallback(
    ({ item }: { item: CompetitionCategory }) => (
      <CategoryItem
        item={item}
        detailedCategory={detailedCategories[item.id]}
        isLoadingDetails={isCategoryDetailsLoading}
      />
    ),
    [detailedCategories, isCategoryDetailsLoading]
  );

  // Spacer component for FlatList
  const ItemSeparator = useCallback(() => <View style={{ width: 12 }} />, []);

  // --- Fetch Livestream Status ---
  useEffect(() => {
    async function fetchLivestreamStatus() {
      if (!showData?.id) return;

      setIsLivestreamLoading(true);
      setLivestreamInfo(null);

      try {
        const response = await getAllLivestreamsForShow(showData.id);
        const activeStream = response.data.find(
          (stream) => stream.status === "active"
        );
        if (activeStream) {
          setLivestreamInfo(activeStream);
        } else {
          setLivestreamInfo(null);
          console.log(`No active livestream found for show ${showData.id}`);
        }
      } catch (error) {
        console.error("Error fetching livestream status in component:", error);
        setLivestreamInfo(null);
      } finally {
        setIsLivestreamLoading(false);
      }
    }

    fetchLivestreamStatus();
  }, [showData?.id]);

  // --- Fetch Category Details (including awards) ---
  useEffect(() => {
    const fetchAllCategoryDetails = async () => {
      if (!categories || categories.length === 0) {
        setDetailedCategories({});
        return;
      }

      setIsCategoryDetailsLoading(true);
      setCategoryDetailsError(null);
      const detailsMap: Record<string, CompetitionCategoryDetail> = {};

      try {
        const detailPromises = categories.map((category) =>
          getCompetitionCategoryDetail(category.id)
        );
        const results = await Promise.allSettled(detailPromises);

        results.forEach((result, index) => {
          const categoryId = categories[index].id;
          if (result.status === "fulfilled") {
            detailsMap[categoryId] = result.value;
          } else {
            console.error(
              `Lỗi khi lấy chi tiết hạng mục ${categoryId}:`,
              result.reason
            );
          }
        });

        setDetailedCategories(detailsMap);
      } catch (error) {
        console.error("Lỗi nghiêm trọng khi lấy chi tiết các hạng mục:", error);
        setCategoryDetailsError(
          "Không thể tải đầy đủ thông tin giải thưởng cho các hạng mục."
        );
      } finally {
        setIsCategoryDetailsLoading(false);
      }
    };

    fetchAllCategoryDetails();
  }, [categories]);

  // --- Handle Navigation to Livestream ---
  const handleViewLivestream = useCallback(() => {
    if (!livestreamInfo) return;

    const apiKey = "z87auffz2r8y";
    console.log("--- Navigating to Livestream --- ");
    console.log("Livestream Info:", JSON.stringify(livestreamInfo, null, 2));
    console.log("Show Name:", showData?.name);
    console.log("API Key:", apiKey);
    console.log("Navigating to livestream...");
    console.log("Livestream ID:", livestreamInfo.id);
    console.log("Call ID:", livestreamInfo.callId);
    console.log("API Key:", apiKey);

    router.push({
      pathname: "/(tabs)/shows/LivestreamViewer",
      params: {
        livestreamId: livestreamInfo.id,
        callId: livestreamInfo.callId,
        apiKey: apiKey,
        showName: showData?.name || "Livestream",
      },
    });
  }, [livestreamInfo, router, showData?.name]);

  // Nếu đang loading, hiển thị skeleton
  if (isLoading) {
    return <SkeletonLoader />;
  }

  // Nếu có lỗi, hiển thị thông báo lỗi
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={64} color="#e74c3c" />
        <Text style={styles.errorText}>{error.message}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Nếu không có dữ liệu
  if (!showData) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="info-outline" size={64} color="#3498db" />
        <Text style={styles.errorText}>Không tìm thấy thông tin cuộc thi</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Banner */}
      <Animated.View style={[styles.bannerContainer, bannerAnimatedStyles]}>
        {showData?.imgUrl ? (
          <Image
            source={{ uri: showData.imgUrl }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.bannerImage, styles.placeholderBanner]}>
            <Ionicons name="fish" size={64} color="#ffffff" />
          </View>
        )}
        <View style={styles.overlay}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {showData?.status === "upcoming"
                ? "Sắp diễn ra"
                : showData?.status === "active"
                ? "Đang diễn ra"
                : showData?.status === "completed"
                ? "Đã kết thúc"
                : "Đã lên lịch"}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Integrated Header (Title + Tabs) - This will move together */}
      <Animated.View style={[styles.headerContainer, headerAnimatedStyles]}>
        {/* Title Section */}
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {showData?.name}
            </Text>
            {isLivestreamLoading ? (
              <ActivityIndicator
                size="small"
                color="#000000"
                style={styles.livestreamLoadingIndicator}
              />
            ) : livestreamInfo && livestreamInfo.status === "active" ? (
              <TouchableOpacity
                style={styles.livestreamButton}
                onPress={handleViewLivestream}>
                <MaterialCommunityIcons
                  name="video"
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.livestreamButtonText}>Xem Livestream</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <View style={styles.quickInfoContainer}>
            <View style={styles.quickInfoItem}>
              <MaterialIcons name="location-on" size={18} color="#000000" />
              <Text style={styles.quickInfoText} numberOfLines={1}>
                {showData?.location}
              </Text>
            </View>
            <View style={styles.quickInfoItem}>
              <MaterialIcons name="date-range" size={18} color="#000000" />
              <Text style={styles.quickInfoText} numberOfLines={1}>
                {formatDateAndTime(
                  showData?.startDate || "",
                  showData?.endDate || ""
                )}
              </Text>
            </View>
          </View>
        </View>

      </Animated.View>

      {/* Content Area */}
      <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{ width: Dimensions.get('window').width }} // Cần initialLayout
          renderTabBar={renderCustomTabBar}
          style={{ paddingTop: HEADER_HEIGHT }} // QUAN TRỌNG: Padding để nội dung không bị che ban đầu
          lazy // Tùy chọn: Tăng hiệu năng
          lazyPreloadDistance={1} // Tùy chọn
      />

      {/* Footer với 2 nút: đăng ký thi đấu và mua vé */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.registerButton]}
          onPress={() =>
            router.push({
              pathname: "/(tabs)/shows/KoiRegistration",
              params: { showId: showData.id },
            })
          }>
          <FontAwesome5 name="fish" size={18} color="#FFFFFF" />
          <Text style={styles.buttonText}>Đăng ký thi đấu</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.ticketButton]}
          onPress={() =>
            router.push({
              pathname: "/(tabs)/shows/BuyTickets",
              params: { showId: showData.id },
            })
          }>
          <MaterialIcons name="confirmation-number" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Mua vé tham dự</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  // Header container (combines title and tabs)
  headerContainer: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  // Tab content container
  tabContentContainer: {
    flex: 1,
    paddingTop: 320, // Banner height + header height
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 140, // Điều chỉnh padding để tránh bị footer che phủ
  },
  bannerContainer: {
    height: 200,
    width: "100%",
    position: "relative",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  placeholderBanner: {
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    flexDirection: "row",
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  statusBadge: {
    backgroundColor: "#000000",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  titleContainer: {
    padding: 16,
    backgroundColor: "#ffffff",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2c3e50",
    flexShrink: 1,
    marginRight: 8,
  },
  livestreamButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e53935",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
  },
  livestreamButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 5,
  },
  livestreamLoadingIndicator: {
    marginLeft: 8,
  },
  quickInfoContainer: {
    marginTop: 8,
  },
  quickInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  quickInfoText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#7f8c8d",
  },
  // Tab styles
  tabBarWrapper: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  tabContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
  },
  activeTabButton: {
    backgroundColor: "#f0f0f0",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666666",
    marginLeft: 4,
  },
  activeTabText: {
    color: "#000000",
    fontWeight: "600",
  },
  // Section styles
  sectionContainer: {
    backgroundColor: "#e9e9e9",
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1.0,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#e9e9e9",
    borderBottomWidth: 0,
    borderBottomColor: "#dadada",
  },
  sectionHeaderExpanded: {
    borderBottomWidth: 1,
  },
  sectionHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginLeft: 8,
  },
  sectionContent: {
    padding: 16,
    backgroundColor: "#f0f0f0",
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#34495e",
    marginBottom: 16,
  },
  detailsGrid: {
    marginTop: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    marginLeft: 12,
  },
  detailValue: {
    fontSize: 14,
    color: "#2c3e50",
    fontWeight: "500",
    marginLeft: 12,
    marginTop: 2,
  },
  // Timeline styles
  timelineContainer: {
    paddingLeft: 8,
    backgroundColor: "#f0f0f0",
  },
  timelineItemContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  timelineCenterColumn: {
    alignItems: "center",
    width: 20,
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#aaaaaa",
    borderWidth: 2,
    borderColor: "#888888",
  },
  timelineDotActive: {
    backgroundColor: "#000000",
    borderColor: "#000000",
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#aaaaaa",
    marginTop: 2,
  },
  timelineRightColumn: {
    flex: 1,
  },
  timelineContent: {
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#c0c0c0",
  },
  timelineContentActive: {
    backgroundColor: "#f8f8f8",
    borderLeftColor: "#000000",
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  timelineTitleActive: {
    color: "#000000",
    fontWeight: "700",
  },
  timelineDateTimeInside: {
    fontSize: 12,
    color: "#7f8c8d",
    marginBottom: 6,
  },
  timelineDateTimeInsideActive: {
    color: "#555",
    fontWeight: "500",
  },
  // Rules styles
  ruleContainer: {
    flexDirection: "row",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  ruleNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#000000",
    color: "white",
    textAlign: "center",
    lineHeight: 24,
    marginRight: 12,
    fontSize: 12,
    fontWeight: "bold",
  },
  ruleText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: "#34495e",
  },
  // Criteria styles
  criterionContainer: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-start",
  },
  criterionBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  criterionBulletText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  criterionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: "#34495e",
  },
  // Category styles
  categoriesContainer: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  categoryCard: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    width: 270,
    borderWidth: 1,
    borderColor: "#dadada",
    marginVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryName: {
    fontFamily: "Lexend Deca",
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  categoryFeeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#FEF2F2",
    padding: 8,
    borderRadius: 6,
  },
  categoryFeeLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#991B1B",
    marginRight: 4,
  },
  categoryFee: {
    fontFamily: "Roboto",
    fontSize: 16,
    color: "#EF4444",
    fontWeight: "600",
  },
  categoryDescription: {
    fontFamily: "Roboto",
    fontSize: 14,
    color: "#333333",
    marginBottom: 10,
  },
  categoryDetailsContainer: {
    backgroundColor: "#F9FAFB",
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  categoryDetailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  categoryDetailLabel: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "500",
  },
  categoryDetailValue: {
    fontSize: 13,
    color: "#000000",
    fontWeight: "500",
  },
  varietiesContainer: {
    marginTop: 8,
  },
  varietiesTitle: {
    fontFamily: "Lexend Deca",
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  varietiesList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  varietyTag: {
    padding: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 6,
    backgroundColor: "#F9FAFB",
  },
  varietyTagText: {
    fontFamily: "Roboto",
    fontSize: 13,
    color: "#000000",
  },
  // Awards styles
  awardsContainer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  awardsTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  awardItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  awardDetails: {
    marginLeft: 8,
  },
  awardName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#444",
  },
  awardPrize: {
    fontSize: 13,
    color: "#e74c3c",
    fontWeight: "500",
  },
  awardsLoading: {
    marginTop: 10,
  },
  noAwardsText: {
    fontSize: 13,
    color: "#888",
    fontStyle: "italic",
    marginTop: 10,
    textAlign: "center",
  },
  // Ticket styles
  fullWidthSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingHorizontal: 10,
    width: "100%",
  },
  ticketCard: {
    backgroundColor: "#f0f8ff",
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 180,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e1ecf4",
  },
  ticketNameDetail: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 8,
    color: "#2c3e50",
  },
  ticketPriceDetail: {
    color: "#e74c3c",
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 10,
  },
  ticketAvailability: {
    flexDirection: "row",
    alignItems: "center",
  },
  ticketQuantityDetail: {
    marginLeft: 5,
    color: "#7f8c8d",
    fontSize: 14,
  },
  ticketsCarouselContainer: {
    paddingVertical: 10,
    paddingRight: 16,
  },
  // Empty state styles
  emptyStateContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f0f0",
  },
  emptyStateText: {
    marginTop: 8,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    fontStyle: "italic",
  },
  categoryErrorText: {
    fontSize: 13,
    color: "red",
    fontStyle: "italic",
    marginTop: 10,
    textAlign: "center",
  },
  // Footer styles
  footer: {
    backgroundColor: "#ffffff",
    padding: 16,
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: 12,
    justifyContent: "space-between",
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    zIndex: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  actionButton: {
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  ticketButton: {
    backgroundColor: "#1e88e5",
  },
  registerButton: {
    backgroundColor: "#e53935",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  // Error and loading styles
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f6fa",
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: "#e74c3c",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: "#000000",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Skeleton styles
  skeletonBanner: {
    backgroundColor: "#e0e0e0",
  },
  skeletonTitle: {
    height: 24,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginBottom: 8,
    width: "80%",
  },
  skeletonIcon: {
    width: 24,
    height: 24,
    backgroundColor: "#e0e0e0",
    borderRadius: 12,
  },
  skeletonText: {
    height: 16,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginLeft: 8,
    width: 120,
  },
  skeletonCard: {
    backgroundColor: "#f5f5f5",
    marginRight: 12,
    padding: 16,
    width: 270,
    height: 180,
    justifyContent: "space-between",
  },
  skeletonButton: {
    backgroundColor: "#e0e0e0",
    height: 48,
  },
});

export default KoiShowInformation;
