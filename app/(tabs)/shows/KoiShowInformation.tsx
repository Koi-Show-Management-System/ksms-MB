import {
  FontAwesome,
  FontAwesome5,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import React, { memo, useCallback, useEffect, useState } from "react";
import { Dimensions } from "react-native";
import { SceneMap, TabBar, TabView } from "react-native-tab-view";

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

// Info Tab Content Component
const InfoTabContent = ({
  showData,
  categories,
  expandedSections,
  toggleSection,
  formatDateAndTime,
  formatRuleContent,
  formatCriterionContent,
  formatTimelineContent,
  detailedCategories,
  isCategoryDetailsLoading,
  categoryDetailsError,
  renderCategoryItem,
  ItemSeparator,
}) => {
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      // No need to track scroll position for this tab
    },
  });

  return (
    <View style={{ flex: 1 }}>
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}>
        {/* Chi tiết sự kiện */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity
            style={[
              styles.sectionHeader,
              expandedSections.eventDetails && styles.sectionHeaderExpanded,
            ]}
            onPress={() => toggleSection("eventDetails")}>
            <View style={styles.sectionHeaderContent}>
              <MaterialIcons name="info-outline" size={22} color="#000000" />
              <Text style={styles.sectionTitle}>Chi tiết sự kiện</Text>
            </View>
            <MaterialIcons
              name={
                expandedSections.eventDetails ? "expand-less" : "expand-more"
              }
              size={24}
              color="#000000"
            />
          </TouchableOpacity>

          {expandedSections.eventDetails && (
            <View style={styles.sectionContent}>
              <Text style={styles.descriptionText}>
                {showData?.description || "Chưa có thông tin chi tiết"}
              </Text>

              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <MaterialIcons name="event" size={20} color="#3498db" />
                  <View>
                    <Text style={styles.detailLabel}>Thời gian biểu diễn</Text>
                    <Text style={styles.detailValue}>
                      {formatDateAndTime(
                        showData?.startExhibitionDate || "",
                        showData?.endExhibitionDate || ""
                      )}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailItem}>
                  <MaterialIcons
                    name="hourglass-bottom"
                    size={20}
                    color="#3498db"
                  />
                  <View>
                    <Text style={styles.detailLabel}>Thời lượng</Text>
                    <Text style={styles.detailValue}>
                      {/* Existing time duration content */}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Add Ticket Types Section */}
              <View style={styles.fullWidthSection}>
                <MaterialIcons
                  name="confirmation-number"
                  size={20}
                  color="#3498db"
                />
                <View>
                  <Text style={styles.detailLabel}>Loại vé</Text>
                  {showData?.ticketTypes && showData.ticketTypes.length > 0 ? (
                    <ScrollView
                      horizontal={true}
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.ticketsCarouselContainer}>
                      {showData.ticketTypes.map((ticket) => (
                        <View key={ticket.id} style={styles.ticketCard}>
                          <Text style={styles.ticketNameDetail}>
                            {ticket.name}
                          </Text>
                          <Text style={styles.ticketPriceDetail}>
                            {ticket.price.toLocaleString("vi-VN")} VNĐ
                          </Text>
                          <View style={styles.ticketAvailability}>
                            <MaterialIcons
                              name="event-seat"
                              size={16}
                              color="#3498db"
                            />
                            <Text style={styles.ticketQuantityDetail}>
                              Còn {ticket.availableQuantity} vé
                            </Text>
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                  ) : (
                    <Text style={styles.emptyText}>Chưa có thông tin vé</Text>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Categories Section - Sử dụng FlatList với performance optimization */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity
            style={[
              styles.sectionHeader,
              expandedSections.categories && styles.sectionHeaderExpanded,
            ]}
            onPress={() => toggleSection("categories")}>
            <View style={styles.sectionHeaderContent}>
              <MaterialIcons name="category" size={22} color="#000000" />
              <Text style={styles.sectionTitle}>Hạng mục thi đấu</Text>
            </View>
            <MaterialIcons
              name={expandedSections.categories ? "expand-less" : "expand-more"}
              size={24}
              color="#000000"
            />
          </TouchableOpacity>

          {expandedSections.categories && (
            <View style={styles.sectionContent}>
              {categories.length > 0 ? (
                <FlatList
                  data={categories}
                  renderItem={renderCategoryItem}
                  keyExtractor={(item) => item.id}
                  horizontal={true}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoriesContainer}
                  ItemSeparatorComponent={ItemSeparator}
                  initialNumToRender={3}
                  maxToRenderPerBatch={5}
                  windowSize={5}
                  removeClippedSubviews={true}
                />
              ) : (
                <View style={styles.emptyStateContainer}>
                  <MaterialIcons name="category" size={48} color="#d1d5db" />
                  <Text style={styles.emptyStateText}>
                    Chưa có hạng mục thi đấu nào được thêm vào cuộc thi này
                  </Text>
                </View>
              )}
              {categoryDetailsError && (
                <Text style={styles.categoryErrorText}>
                  {categoryDetailsError}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Rules & Regulations Section */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection("rules")}>
            <View style={styles.sectionHeaderContent}>
              <MaterialIcons name="gavel" size={22} color="#000000" />
              <Text style={styles.sectionTitle}>Quy định & Điều lệ</Text>
            </View>
            <MaterialIcons
              name={expandedSections.rules ? "expand-less" : "expand-more"}
              size={24}
              color="#000000"
            />
          </TouchableOpacity>

          {expandedSections.rules && (
            <View style={styles.sectionContent}>
              {showData?.showRules && showData.showRules.length > 0 ? (
                showData.showRules.map((rule, index) => (
                  <View key={index} style={styles.ruleContainer}>
                    <Text style={styles.ruleNumber}>{index + 1}</Text>
                    <Text style={styles.ruleText}>
                      {formatRuleContent(rule)}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyStateContainer}>
                  <MaterialIcons name="info" size={40} color="#bdc3c7" />
                  <Text style={styles.emptyStateText}>
                    Chưa có quy định nào được đăng tải
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Criteria Section */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection("criteria")}>
            <View style={styles.sectionHeaderContent}>
              <MaterialIcons name="star" size={22} color="#000000" />
              <Text style={styles.sectionTitle}>Tiêu chí đánh giá</Text>
            </View>
            <MaterialIcons
              name={expandedSections.criteria ? "expand-less" : "expand-more"}
              size={24}
              color="#000000"
            />
          </TouchableOpacity>

          {expandedSections.criteria && (
            <View style={styles.sectionContent}>
              {showData?.criteria && showData.criteria.length > 0 ? (
                showData.criteria.map((criterion, index) => (
                  <View key={index} style={styles.criterionContainer}>
                    <View style={styles.criterionBullet}>
                      <Text style={styles.criterionBulletText}>
                        {index + 1}
                      </Text>
                    </View>
                    <Text style={styles.criterionText}>
                      {formatCriterionContent(criterion)}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyStateContainer}>
                  <MaterialIcons name="info" size={40} color="#bdc3c7" />
                  <Text style={styles.emptyStateText}>
                    Chưa có tiêu chí nào được đăng tải
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Event Timeline Section */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection("timeline")}>
            <View style={styles.sectionHeaderContent}>
              <MaterialIcons name="timeline" size={22} color="#000000" />
              <Text style={styles.sectionTitle}>Lịch trình sự kiện</Text>
            </View>
            <MaterialIcons
              name={expandedSections.timeline ? "expand-less" : "expand-more"}
              size={24}
              color="#000000"
            />
          </TouchableOpacity>

          {expandedSections.timeline && (
            <View style={styles.sectionContent}>
              {showData?.showStatuses && showData.showStatuses.length > 0 ? (
                <View style={styles.timelineContainer}>
                  {[...showData.showStatuses]
                    .sort(
                      (a, b) =>
                        new Date(a.startDate).getTime() -
                        new Date(b.startDate).getTime()
                    )
                    .map((status, index, sortedArray) => {
                      const isLast = index === sortedArray.length - 1;
                      return (
                        <View key={status.id}>
                          <View style={styles.timelineItemContainer}>
                            <View style={styles.timelineCenterColumn}>
                              <View
                                style={[
                                  styles.timelineDot,
                                  status.isActive && styles.timelineDotActive,
                                ]}
                              />
                              {!isLast && <View style={styles.timelineLine} />}
                            </View>

                            <View style={styles.timelineRightColumn}>
                              <View
                                style={[
                                  styles.timelineContent,
                                  status.isActive &&
                                    styles.timelineContentActive,
                                ]}>
                                <Text
                                  style={[
                                    styles.timelineDateTimeInside,
                                    status.isActive &&
                                      styles.timelineDateTimeInsideActive,
                                  ]}>
                                  {(() => {
                                    try {
                                      const start = new Date(status.startDate);
                                      const end = new Date(status.endDate);
                                      const startDay = start.getDate();
                                      const endDay = end.getDate();
                                      const startMonth = start.getMonth() + 1;
                                      const endMonth = end.getMonth() + 1;
                                      const startYear = start.getFullYear();
                                      const endYear = end.getFullYear();
                                      const startTime =
                                        start.toLocaleTimeString("vi-VN", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        });
                                      const endTime = end.toLocaleTimeString(
                                        "vi-VN",
                                        { hour: "2-digit", minute: "2-digit" }
                                      );

                                      const isSameDay =
                                        startDay === endDay &&
                                        startMonth === endMonth &&
                                        startYear === endYear;

                                      if (isSameDay) {
                                        return `${startTime} - ${endTime} / ${startDay
                                          .toString()
                                          .padStart(2, "0")}/${startMonth
                                          .toString()
                                          .padStart(2, "0")}/${startYear}`;
                                      } else {
                                        const endDayFormatted = endDay
                                          .toString()
                                          .padStart(2, "0");
                                        const endMonthFormatted = endMonth
                                          .toString()
                                          .padStart(2, "0");
                                        const endYearFormatted = endYear;
                                        return `${startTime} - ${startDay
                                          .toString()
                                          .padStart(
                                            2,
                                            "0"
                                          )} / ${endTime} - ${endDayFormatted}/${endMonthFormatted}/${endYearFormatted}`;
                                      }
                                    } catch (e) {
                                      console.error(
                                        "Error formatting timeline date:",
                                        e
                                      );
                                      return formatDateAndTime(
                                        status.startDate,
                                        status.endDate
                                      );
                                    }
                                  })()}
                                </Text>
                                <Text
                                  style={[
                                    styles.timelineTitle,
                                    status.isActive &&
                                      styles.timelineTitleActive,
                                  ]}>
                                  {formatTimelineContent(status.description)}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                </View>
              ) : (
                <View style={styles.emptyStateContainer}>
                  <MaterialIcons name="info" size={40} color="#bdc3c7" />
                  <Text style={styles.emptyStateText}>
                    Chưa có lịch trình nào được đăng tải
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
};

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
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "info", title: "Chi tiết" },
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
  const BANNER_HEIGHT = 200;

  // Scroll handler
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Banner animation
  const bannerAnimatedStyles = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        scrollY.value,
        [0, BANNER_HEIGHT * 0.8],
        [1, 0],
        Extrapolation.CLAMP
      ),
    };
  });

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

  // Define the scene renderers for TabView
  const renderScene = SceneMap({
    info: () => (
      <InfoTabContent
        showData={showData}
        categories={categories}
        expandedSections={expandedSections}
        toggleSection={toggleSection}
        formatDateAndTime={formatDateAndTime}
        formatRuleContent={formatRuleContent}
        formatCriterionContent={formatCriterionContent}
        formatTimelineContent={formatTimelineContent}
        detailedCategories={detailedCategories}
        isCategoryDetailsLoading={isCategoryDetailsLoading}
        categoryDetailsError={categoryDetailsError}
        renderCategoryItem={renderCategoryItem}
        ItemSeparator={ItemSeparator}
      />
    ),
    contestants: () => <KoiContestants showId={showData?.id} />,
    results: () => <KoiShowResults showId={showData?.id} />,
    vote: () => <KoiShowVoting showId={showData?.id} />,
  });

  // Custom tab bar renderer
  const renderTabBar = (props) => (
    <TabBar
      {...props}
      style={styles.tabBar}
      indicatorStyle={styles.tabIndicator}
      labelStyle={styles.tabLabel}
      activeColor="#007bff"
      inactiveColor="#6c757d"
    />
  );

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
      <View style={styles.bannerContainer}>
        <Animated.View
          style={[styles.bannerImageContainer, bannerAnimatedStyles]}>
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

          {/* Event info overlay on banner */}
          <View style={styles.eventInfoOverlay}>
            <Text style={styles.eventTitle}>{showData?.name}</Text>
            <View style={styles.eventInfoRow}>
              <MaterialIcons name="location-on" size={18} color="#ffffff" />
              <Text style={styles.eventInfoText}>{showData?.location}</Text>
            </View>
            <View style={styles.eventInfoRow}>
              <MaterialIcons name="date-range" size={18} color="#ffffff" />
              <Text style={styles.eventInfoText}>
                {formatDateAndTime(
                  showData?.startDate || "",
                  showData?.endDate || ""
                )}
              </Text>
            </View>
          </View>

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

        {/* Tab Bar - Positioned directly below the banner */}
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{ width: Dimensions.get("window").width }}
          renderTabBar={renderTabBar}
          style={styles.tabView}
        />
      </View>

      {/* Livestream Button - Floating */}
      {isLivestreamLoading ? (
        <View style={styles.livestreamButtonContainer}>
          <ActivityIndicator
            size="small"
            color="#FFFFFF"
            style={styles.livestreamLoadingIndicator}
          />
        </View>
      ) : livestreamInfo && livestreamInfo.status === "active" ? (
        <TouchableOpacity
          style={styles.livestreamButtonContainer}
          onPress={handleViewLivestream}>
          <MaterialCommunityIcons name="video" size={18} color="#FFFFFF" />
          <Text style={styles.livestreamButtonText}>Xem Livestream</Text>
        </TouchableOpacity>
      ) : null}

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
  bannerContainer: {
    flex: 1,
  },
  bannerImageContainer: {
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
  // Event info overlay on banner
  eventInfoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 8,
  },
  eventInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  eventInfoText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#ffffff",
  },
  overlay: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "flex-end",
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
  // Tab Bar styles
  tabView: {
    backgroundColor: "#ffffff",
  },
  tabBar: {
    backgroundColor: "#ffffff",
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tabIndicator: {
    backgroundColor: "#007bff",
    height: 3,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "500",
    textTransform: "none",
  },
  // Title and content styles
  titleContainer: {
    padding: 16,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2c3e50",
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
  // Livestream button
  livestreamButtonContainer: {
    position: "absolute",
    top: 160, // Position below banner but above tabs
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e53935",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    zIndex: 10,
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
  // ScrollView styles
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 150, // Tăng padding để đảm bảo đủ không gian cho footer và các nút
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
    padding: 8, // Khôi phục padding để nút có đủ không gian
    paddingHorizontal: 12, // Tăng padding ngang để nút không quá sát cạnh
    paddingBottom: 8, // Khôi phục padding dưới
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: 10, // Tăng gap giữa các nút
    justifyContent: "space-between",
    position: "absolute",
    bottom: 0,
    marginBottom: 0, // Loại bỏ margin âm để footer không bị đẩy xuống quá thấp
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
    paddingVertical: 12, // Tăng padding để nút có đủ chiều cao
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    height: 44, // Tăng chiều cao cố định cho nút
  },
  ticketButton: {
    backgroundColor: "#1e88e5",
  },
  registerButton: {
    backgroundColor: "#e53935",
    borderRadius: 6,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 14, // Tăng lại kích thước font để dễ đọc
    fontWeight: "600",
    marginLeft: 6, // Tăng lại khoảng cách với icon
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
