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
import { TabBar, TabView } from "react-native-tab-view";
import { useAuth } from "../../../context/AuthContext";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
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
interface InfoTabContentProps {
  showData: any;
  categories: any[];
  expandedSections: {
    eventDetails: boolean;
    categories: boolean;
    criteria: boolean;
    rules: boolean;
    timeline: boolean;
  };
  toggleSection: (
    section: "eventDetails" | "categories" | "criteria" | "rules" | "timeline"
  ) => void;
  formatDateAndTime: (startDate: string, endDate: string) => string;
  formatRuleContent: (rule: any) => string;
  formatCriterionContent: (criterion: any) => string;
  formatTimelineContent: (content: any) => string;
  getTimelineItemColor: (description: string) => string;
  detailedCategories: Record<string, CompetitionCategoryDetail>;
  isCategoryDetailsLoading: boolean;
  categoryDetailsError: string | null;
  renderCategoryItem: ({
    item,
  }: {
    item: CompetitionCategory;
  }) => React.ReactElement;
  ItemSeparator: () => React.ReactElement;
  refetch: () => Promise<void>;
}

const InfoTabContent: React.FC<InfoTabContentProps> = ({
  showData,
  categories,
  expandedSections,
  toggleSection,
  formatDateAndTime,
  formatRuleContent,
  formatCriterionContent,
  formatTimelineContent,
  getTimelineItemColor,
  detailedCategories,
  isCategoryDetailsLoading,
  categoryDetailsError,
  renderCategoryItem,
  ItemSeparator,
  refetch,
}) => {
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      // Call the actual refetch function from context
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return (
    <View style={{ flex: 1 }}>
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3B82F6"]}
            tintColor="#3B82F6"
          />
        }>
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

              {/* Event details grid removed as requested */}

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
                      const statusDescription = formatTimelineContent(
                        status.description
                      );
                      const dotColor = getTimelineItemColor(statusDescription);

                      // Tự động xác định giai đoạn hiện tại dựa trên thời gian
                      const now = new Date();
                      const startDate = new Date(status.startDate);
                      const endDate = new Date(status.endDate);
                      const isCurrentStage = now >= startDate && now <= endDate;

                      return (
                        <View key={status.id}>
                          <View
                            style={[
                              styles.timelineItemContainer,
                              (status.isActive || isCurrentStage) &&
                                styles.timelineItemContainerActive,
                            ]}>
                            <View style={styles.timelineCenterColumn}>
                              <View
                                style={[
                                  styles.timelineDot,
                                  {
                                    backgroundColor: dotColor,
                                    borderColor:
                                      status.isActive || isCurrentStage
                                        ? "#ffffff"
                                        : dotColor,
                                    transform: [
                                      {
                                        scale:
                                          status.isActive || isCurrentStage
                                            ? 1.2
                                            : 1,
                                      },
                                    ],
                                  },
                                  (status.isActive || isCurrentStage) &&
                                    styles.timelineDotActive,
                                ]}
                              />
                              {!isLast && (
                                <View
                                  style={[
                                    styles.timelineLine,
                                    { backgroundColor: "#e0e0e0" },
                                  ]}
                                />
                              )}
                            </View>

                            <View
                              style={[
                                styles.timelineRightColumn,
                                (status.isActive || isCurrentStage) &&
                                  styles.timelineRightColumnActive,
                              ]}>
                              <View style={styles.timelineTitleContainer}>
                                <Text
                                  style={[
                                    styles.timelineTitle,
                                    (status.isActive || isCurrentStage) &&
                                      styles.timelineTitleActive,
                                  ]}>
                                  {statusDescription}
                                </Text>
                                {(status.isActive || isCurrentStage) && (
                                  <View
                                    style={styles.activeStatusBadgeContainer}>
                                    <Text style={styles.activeStatusBadge}>
                                      Đang diễn ra
                                    </Text>
                                  </View>
                                )}
                              </View>
                              <Text
                                style={[
                                  styles.timelineDateTimeOutside,
                                  (status.isActive || isCurrentStage) &&
                                    styles.timelineDateTimeOutsideActive,
                                ]}>
                                {(() => {
                                  try {
                                    const start = new Date(status.startDate);
                                    const end = new Date(status.endDate);
                                    const startDay = start
                                      .getDate()
                                      .toString()
                                      .padStart(2, "0");
                                    const startMonth = (start.getMonth() + 1)
                                      .toString()
                                      .padStart(2, "0");
                                    const startYear = start.getFullYear();
                                    const startTime = start.toLocaleTimeString(
                                      "vi-VN",
                                      {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      }
                                    );
                                    const endTime = end.toLocaleTimeString(
                                      "vi-VN",
                                      {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      }
                                    );

                                    const isSameDay =
                                      start.getDate() === end.getDate() &&
                                      start.getMonth() === end.getMonth() &&
                                      start.getFullYear() === end.getFullYear();

                                    if (isSameDay) {
                                      return `${startDay}/${startMonth}/${startYear}, ${startTime} - ${endTime}`;
                                    } else {
                                      const endDay = end
                                        .getDate()
                                        .toString()
                                        .padStart(2, "0");
                                      const endMonth = (end.getMonth() + 1)
                                        .toString()
                                        .padStart(2, "0");
                                      const endYear = end.getFullYear();
                                      return `${startDay}/${startMonth}/${startYear}, ${startTime} - ${endDay}/${endMonth}/${endYear}, ${endTime}`;
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

// Add new lazy loaded component for Voting
const LazyKoiShowVoting = ({ showId }: { showId: string | undefined }) => {
  const [isTabMounted, setIsTabMounted] = useState(false);

  useEffect(() => {
    // Set the component as mounted when it's rendered for the first time
    setIsTabMounted(true);
  }, []);

  if (!showId) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Không tìm thấy thông tin cuộc thi</Text>
      </View>
    );
  }

  // Only render the actual component when the tab has been visited
  if (!isTabMounted) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 16, color: "#666" }}>
          Đang tải dữ liệu bình chọn...
        </Text>
      </View>
    );
  }

  return <KoiShowVoting showId={showId} />;
};

// Main content component
const KoiShowInformationContent = () => {
  const { showData, categories, isLoading, error, refetch } = useKoiShow();
  const { isGuest } = useAuth();
  const [expandedSections, setExpandedSections] = useState({
    eventDetails: true,
    categories: true,
    criteria: false,
    rules: false,
    timeline: true,
  });
  const [index, setIndex] = useState(0);
  const [routes] = useState(() => {
    const baseRoutes = [
      { key: "info", title: "Chi tiết" },
      { key: "contestants", title: "Thí sinh" },
      { key: "results", title: "Kết quả" },
    ];

    // Only add voting tab for authenticated users
    if (!isGuest()) {
      baseRoutes.push({ key: "vote", title: "Bình chọn" });
    }

    return baseRoutes;
  });
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

  // Scroll handler for banner animation
  useAnimatedScrollHandler({
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

  // Removed unused isToday function

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

  // Determine color for timeline item based on description
  const getTimelineItemColor = useCallback((description: string): string => {
    const desc = description.toLowerCase();

    if (desc.includes("đăng ký")) return "#0a7ea4"; // Xanh dương
    if (desc.includes("check-in cá") || desc.includes("checkin cá"))
      return "#00BCD4"; // Xanh ngọc
    if (desc.includes("check-in vé") || desc.includes("checkin vé"))
      return "#FF5252"; // Đỏ
    if (desc.includes("sơ khảo")) return "#4CAF50"; // Xanh lá
    if (desc.includes("đánh giá chính") || desc.includes("chính"))
      return "#9C27B0"; // Tím
    if (desc.includes("chung kết")) return "#FFC107"; // Vàng
    if (desc.includes("triển lãm")) return "#00BCD4"; // Xanh ngọc
    if (desc.includes("công bố kết quả")) return "#FFEB3B"; // Vàng nhạt
    if (desc.includes("trao giải")) return "#000000"; // Đen
    if (desc.includes("kết thúc")) return "#FF5722"; // Cam đỏ

    return "#aaaaaa"; // Màu mặc định
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

  // Define the scene renderers for TabView - modify to use the lazy loaded voting component
  const renderScene = useCallback(
    ({ route }: { route: { key: string } }) => {
      switch (route.key) {
        case "info":
          return (
            <InfoTabContent
              showData={showData}
              categories={categories}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
              formatDateAndTime={formatDateAndTime}
              formatRuleContent={formatRuleContent}
              formatCriterionContent={formatCriterionContent}
              formatTimelineContent={formatTimelineContent}
              getTimelineItemColor={getTimelineItemColor}
              detailedCategories={detailedCategories}
              isCategoryDetailsLoading={isCategoryDetailsLoading}
              categoryDetailsError={categoryDetailsError}
              renderCategoryItem={renderCategoryItem}
              ItemSeparator={ItemSeparator}
              refetch={refetch}
            />
          );
        case "contestants":
          return showData?.id ? <KoiContestants showId={showData.id} /> : null;
        case "results":
          return showData?.id ? <KoiShowResults showId={showData.id} /> : null;
        case "vote":
          // Only render the voting component when this tab is selected (lazy loading)
          return showData?.id ? (
            <LazyKoiShowVoting showId={showData.id} />
          ) : null;
        default:
          return null;
      }
    },
    [
      showData,
      categories,
      expandedSections,
      toggleSection,
      formatDateAndTime,
      formatRuleContent,
      formatCriterionContent,
      formatTimelineContent,
      getTimelineItemColor,
      detailedCategories,
      isCategoryDetailsLoading,
      categoryDetailsError,
      renderCategoryItem,
      ItemSeparator,
    ]
  );

  // Custom tab bar renderer
  const renderTabBar = (props: any) => (
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

        {/* Tab Bar - Modified to use the callback renderScene instead of SceneMap */}
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{ width: Dimensions.get("window").width }}
          renderTabBar={renderTabBar}
          style={styles.tabView}
          lazy={true}
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
          onPress={() => {
            if (isGuest()) {
              Alert.alert(
                "Yêu cầu đăng nhập",
                "Bạn cần phải login để đăng ký thi đấu",
                [
                  {
                    text: "Đăng nhập",
                    onPress: () => router.push("/(auth)/signIn"),
                  },
                  {
                    text: "Hủy",
                    style: "cancel",
                  },
                ]
              );
            } else {
              router.push({
                pathname: "/(tabs)/shows/KoiRegistration",
                params: { showId: showData.id },
              });
            }
          }}>
          <FontAwesome5 name="fish" size={18} color="#FFFFFF" />
          <Text style={styles.buttonText}>Đăng ký thi đấu</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.ticketButton]}
          onPress={() => {
            if (isGuest()) {
              Alert.alert(
                "Yêu cầu đăng nhập",
                "Bạn cần phải login để mua vé tham dự",
                [
                  {
                    text: "Đăng nhập",
                    onPress: () => router.push("/(auth)/signIn"),
                  },
                  {
                    text: "Hủy",
                    style: "cancel",
                  },
                ]
              );
            } else {
              router.push({
                pathname: "/(tabs)/shows/BuyTickets",
                params: { showId: showData.id },
              });
            }
          }}>
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
    backgroundColor: "#ffffff",
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
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 0,
    borderBottomColor: "#f0f0f0",
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
    backgroundColor: "#ffffff",
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
    backgroundColor: "#ffffff",
  },
  timelineItemContainer: {
    flexDirection: "row",
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
  },
  timelineItemContainerActive: {
    backgroundColor: "#edf8ff",
    borderWidth: 1,
    borderColor: "#c7e6ff",
    shadowColor: "#4285F4",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
    marginHorizontal: 4,
    marginVertical: 4,
  },
  timelineCenterColumn: {
    alignItems: "center",
    width: 20,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#aaaaaa",
    borderWidth: 0,
  },
  timelineDotActive: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#e0e0e0",
    marginTop: 2,
  },
  timelineRightColumn: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: "center",
    paddingVertical: 8,
    paddingRight: 8,
    borderRadius: 8,
  },
  timelineRightColumnActive: {
    backgroundColor: "transparent",
    borderLeftWidth: 4,
    borderLeftColor: "#4285F4",
    borderRadius: 8,
    marginRight: 8,
  },
  timelineTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 4,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333333",
    marginBottom: 4,
  },
  timelineTitleActive: {
    fontWeight: "700",
    color: "#000000",
  },
  activeStatusBadgeContainer: {
    marginLeft: 8,
  },
  activeStatusBadge: {
    color: "#FF5252",
    fontWeight: "700",
    fontSize: 12,
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#FFCDD2",
    shadowColor: "#FF5252",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  timelineDateTimeOutside: {
    fontSize: 13,
    color: "#666666",
  },
  timelineDateTimeOutsideActive: {
    color: "#333333",
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
    backgroundColor: "#ffffff",
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
