import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated from "react-native-reanimated";

// Import necessary types and services
import { CompetitionCategoryDetail } from "../../../services/competitionService";
import { CompetitionCategory } from "../../../services/registrationService";
// Assuming useKoiShow is not needed directly in InfoTabContent, data is passed via props

// Define props interface
interface InfoTabContentProps {
  scrollHandler: any; // Consider defining a more specific type for scroll handler if possible
  showData: any; // Define a more specific type for showData
  categories: CompetitionCategory[];
  expandedSections: { [key: string]: boolean };
  toggleSection: (section: string) => void;
  detailedCategories: Record<string, CompetitionCategoryDetail>;
  isCategoryDetailsLoading: boolean;
  categoryDetailsError: string | null;
  formatDateAndTime: (startDate: string, endDate: string) => string;
  formatTimelineContent: (content: any) => string;
  getTimelineItemColor: (description: string) => string;
  formatRuleContent: (rule: any) => string;
  formatCriterionContent: (criterion: any) => string;
  renderCategoryItem: ({ item }: { item: CompetitionCategory }) => JSX.Element;
  ItemSeparator: () => JSX.Element;
}

const InfoTabContent: React.FC<InfoTabContentProps> = ({
  scrollHandler,
  showData,
  categories,
  expandedSections,
  toggleSection,
  detailedCategories,
  isCategoryDetailsLoading,
  categoryDetailsError,
  formatDateAndTime,
  formatTimelineContent,
  getTimelineItemColor,
  formatRuleContent,
  formatCriterionContent,
  renderCategoryItem,
  ItemSeparator,
}) => {
  // Styles will be defined or imported later
  const styles = StyleSheet.create({
    // Placeholder styles - will be replaced with actual styles from KoiShowInformation.tsx
    scrollView: {},
    scrollViewContent: {},
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
    sectionHeaderExpanded: {},
    sectionHeaderContent: {},
    sectionTitle: {},
    sectionContent: {
      padding: 16,
      backgroundColor: "#ffffff",
    },
    descriptionText: {},
    detailsGrid: {},
    detailItem: {},
    detailLabel: {},
    detailValue: {},
    fullWidthSection: {},
    ticketsCarouselContainer: {},
    ticketCard: {},
    ticketNameDetail: {},
    ticketPriceDetail: {},
    ticketAvailability: {},
    ticketQuantityDetail: {},
    emptyText: {},
    categoriesContainer: {},
    emptyStateContainer: {
      padding: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#ffffff",
    },
    emptyStateText: {},
    categoryErrorText: {},
    ruleContainer: {},
    ruleNumber: {},
    ruleText: {},
    criterionContainer: {},
    criterionBullet: {},
    criterionBulletText: {},
    criterionText: {},
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
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: "#ffffff",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1.5,
      elevation: 2,
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
    categoryCard: {},
    categoryHeader: {},
    categoryName: {},
    categoryFeeContainer: {},
    categoryFeeLabel: {},
    categoryFee: {},
    categoryDescription: {},
    categoryDetailsContainer: {},
    categoryDetailItem: {},
    categoryDetailLabel: {},
    categoryDetailValue: {},
    varietiesContainer: {},
    varietiesTitle: {},
    varietiesList: {},
    varietyTag: {},
    varietyTagText: {},
    awardsContainer: {},
    awardsTitle: {},
    awardItem: {},
    awardDetails: {},
    awardName: {},
    awardPrize: {},
    awardsLoading: {},
    noAwardsText: {},
  });

  return (
    <Animated.ScrollView
      style={styles.scrollView}
      contentContainerStyle={[
        styles.scrollViewContent,
        // contentAnimatedStyles, // contentAnimatedStyles was for the old layout, might not be needed here or needs re-evaluation
      ]}
      showsVerticalScrollIndicator={false}
      onScroll={scrollHandler}
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
            name={expandedSections.eventDetails ? "expand-less" : "expand-more"}
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
                  <Text style={styles.ruleText}>{formatRuleContent(rule)}</Text>
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
                    <Text style={styles.criterionBulletText}>{index + 1}</Text>
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
                                <View style={styles.activeStatusBadgeContainer}>
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
  );
};

// Styles will be defined or imported later
// const styles = StyleSheet.create({}); // Commenting out as styles will be imported or defined elsewhere

export default InfoTabContent;
