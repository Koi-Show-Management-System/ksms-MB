import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, ActivityIndicator, Image, Dimensions } from 'react-native';
import Animated from 'react-native-reanimated';
import { MaterialIcons, FontAwesome, FontAwesome5, Ionicons } from '@expo/vector-icons';

// Import necessary types and services
import { CompetitionCategory } from '../../../services/registrationService';
import { CompetitionCategoryDetail } from '../../../services/competitionService';
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
    sectionContainer: {},
    sectionHeader: {},
    sectionHeaderExpanded: {},
    sectionHeaderContent: {},
    sectionTitle: {},
    sectionContent: {},
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
    emptyStateContainer: {},
    emptyStateText: {},
    categoryErrorText: {},
    ruleContainer: {},
    ruleNumber: {},
    ruleText: {},
    criterionContainer: {},
    criterionBullet: {},
    criterionBulletText: {},
    criterionText: {},
    timelineContainer: {},
    timelineItemContainer: {},
    timelineCenterColumn: {},
    timelineDot: {},
    timelineDotActive: {},
    timelineLine: {},
    timelineRightColumn: {},
    timelineContent: {},
    timelineContentActive: {},
    timelineTitle: {},
    timelineTitleActive: {},
    timelineDateTimeInside: {},
    timelineDateTimeInsideActive: {},
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
      scrollEventThrottle={16}
    >
      {/* Chi tiết sự kiện */}
      <View style={styles.sectionContainer}>
        <TouchableOpacity
          style={[
            styles.sectionHeader,
            expandedSections.eventDetails && styles.sectionHeaderExpanded,
          ]}
          onPress={() => toggleSection("eventDetails")}
        >
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
                  <Text style={styles.detailLabel}>
                    Thời gian biểu diễn
                  </Text>
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
                {showData?.ticketTypes &&
                showData.ticketTypes.length > 0 ? (
                  <ScrollView
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.ticketsCarouselContainer}
                  >
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
          onPress={() => toggleSection("categories")}
        >
          <View style={styles.sectionHeaderContent}>
            <MaterialIcons name="category" size={22} color="#000000" />
            <Text style={styles.sectionTitle}>Hạng mục thi đấu</Text>
          </View>
          <MaterialIcons
            name={
              expandedSections.categories ? "expand-less" : "expand-more"
            }
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
                keyExtractor={item => item.id}
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
          onPress={() => toggleSection("rules")}
        >
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
          onPress={() => toggleSection("criteria")}
        >
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
          onPress={() => toggleSection("timeline")}
        >
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
                            {!isLast && (
                              <View style={styles.timelineLine} />
                            )}
                          </View>

                          <View style={styles.timelineRightColumn}>
                            <View
                              style={[
                                styles.timelineContent,
                                status.isActive &&
                                  styles.timelineContentActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.timelineDateTimeInside,
                                  status.isActive &&
                                    styles.timelineDateTimeInsideActive,
                                ]}
                              >
                                {(() => {
                                  try {
                                    const start = new Date(
                                      status.startDate
                                    );
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
                                ]}
                              >
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
  );
};

// Styles will be defined or imported later
// const styles = StyleSheet.create({}); // Commenting out as styles will be imported or defined elsewhere

export default InfoTabContent;