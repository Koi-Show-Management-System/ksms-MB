import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
} from "react-native";
import { getKoiShowById, KoiShow } from "../../../services/showService";
import { CompetitionCategory, getCompetitionCategories } from "../../../services/registrationService";

// Skeleton Component
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
          <View style={[styles.skeletonText, { width: '100%', height: 80 }]} />
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
              <View key={item} style={[styles.categoryCard, styles.skeletonCard]}>
                <View style={[styles.skeletonText, { width: '80%', height: 20 }]} />
                <View style={[styles.skeletonText, { width: '60%', height: 16 }]} />
                <View style={[styles.skeletonText, { width: '40%', height: 16 }]} />
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

const KoiShowInformation: React.FC = () => {
  const params = useLocalSearchParams();
  const id = params.id as string;

  const [showData, setShowData] = useState<KoiShow | null>(null);
  const [categories, setCategories] = useState<CompetitionCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    eventDetails: true, // Open by default
    categories: true, // Open categories section by default
    awards: false,
    rules: false,
    timeline: false, // Renamed from enteringKoi
  });

  // Fetch show data
  useEffect(() => {
    const fetchShowData = async () => {
      try {
        setLoading(true);
        const data = await getKoiShowById(id);
        setShowData(data);
        setError("");
        
        // Sau khi lấy dữ liệu cuộc thi, lấy danh sách hạng mục
        await fetchCategories(id);
      } catch (err) {
        console.error("Failed to fetch show details:", err);
        setError("Failed to load show details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchShowData();
    } else {
      setError("No show ID provided");
      setLoading(false);
    }
  }, [id]);
  
  // Fetch categories
  const fetchCategories = async (showId: string) => {
    try {
      const response = await getCompetitionCategories(showId);
      if (response && response.data && response.data.items) {
        setCategories(response.data.items);
        console.log(`Loaded ${response.data.items.length} categories`);
      } else {
        console.error("Invalid response format in fetchCategories:", response);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      // Vẫn hiển thị thông tin show ngay cả khi không lấy được hạng mục
    }
  };

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Format date function to display in a nicer way
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      console.error("Date formatting error:", error);
      return dateString;
    }
  };

  // Format time function
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Time formatting error:", error);
      return "";
    }
  };

  // Check if date is today
  const isToday = (dateString: string) => {
    const today = new Date();
    const date = new Date(dateString);
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Add this function to render categories
  const renderCategoryItem = ({ item }: { item: CompetitionCategory }) => (
    <View style={styles.categoryCard}>
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryName}>{item.name}</Text>
      </View>
      
      <View style={styles.categoryFeeContainer}>
        <Text style={styles.categoryFeeLabel}>Phí đăng ký:</Text>
        <Text style={styles.categoryFee}>{item.registrationFee.toLocaleString('vi-VN')} đ</Text>
      </View>
      
      <View style={styles.categoryDetailsContainer}>
        <View style={styles.categoryDetailItem}>
          <Text style={styles.categoryDetailLabel}>Kích thước:</Text>
          <Text style={styles.categoryDetailValue}>{item.sizeMin} - {item.sizeMax} cm</Text>
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
    </View>
  );

  // Replace loading condition with Skeleton
  if (loading) {
    return <SkeletonLoader />;
  }

  // If error, show error message
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={64} color="#e74c3c" />
        <Text style={styles.errorText}>{error}</Text>
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
      <ScrollView style={styles.scrollView}>
        {/* Header with Show Banner Image */}
        <View style={styles.bannerContainer}>
          {showData?.imgUrl ? (
            <Image
              source={{ uri: showData.imgUrl }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.bannerImage, styles.placeholderBanner]}>
              <FontAwesome5 name="koi" size={64} color="#ffffff" />
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
        </View>

        {/* Show Title and Quick Info */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{showData?.name}</Text>
          <View style={styles.quickInfoContainer}>
            <View style={styles.quickInfoItem}>
              <MaterialIcons name="location-on" size={18} color="#000000" />
              <Text style={styles.quickInfoText}>{showData?.location}</Text>
            </View>
            <View style={styles.quickInfoItem}>
              <MaterialIcons name="date-range" size={18} color="#000000" />
              <Text style={styles.quickInfoText}>
                {formatDate(showData?.startDate || "")} -{" "}
                {formatDate(showData?.endDate || "")}
              </Text>
            </View>
          </View>
        </View>

        {/* Event Details Section */}
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
                      {formatDate(showData?.startExhibitionDate || "")} -{" "}
                      {formatDate(showData?.endExhibitionDate || "")}
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
                          <Text style={styles.ticketNameDetail}>{ticket.name}</Text>
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

        {/* Categories Section - New Section */}
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
                  keyExtractor={(item) => item.id}
                  horizontal={true}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoriesContainer}
                  ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
                />
              ) : (
                <View style={styles.emptyStateContainer}>
                  <MaterialIcons name="category" size={48} color="#d1d5db" />
                  <Text style={styles.emptyStateText}>
                    Chưa có hạng mục thi đấu nào được thêm vào cuộc thi này
                  </Text>
                </View>
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
                    <Text style={styles.ruleText}>{rule}</Text>
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
            onPress={() => toggleSection("awards")}>
            <View style={styles.sectionHeaderContent}>
              <MaterialIcons name="star" size={22} color="#000000" />
              <Text style={styles.sectionTitle}>Tiêu chí đánh giá</Text>
            </View>
            <MaterialIcons
              name={expandedSections.awards ? "expand-less" : "expand-more"}
              size={24}
              color="#000000"
            />
          </TouchableOpacity>

          {expandedSections.awards && (
            <View style={styles.sectionContent}>
              {showData?.criteria && showData.criteria.length > 0 ? (
                showData.criteria.map((criterion, index) => (
                  <View key={index} style={styles.criterionContainer}>
                    <View style={styles.criterionBullet}>
                      <Text style={styles.criterionBulletText}>
                        {index + 1}
                      </Text>
                    </View>
                    <Text style={styles.criterionText}>{criterion}</Text>
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

              <View style={styles.awardInfoContainer}>
                <View style={styles.awardInfoItem}>
                  <MaterialIcons
                    name={
                      showData?.hasGrandChampion ? "check-circle" : "cancel"
                    }
                    size={24}
                    color={showData?.hasGrandChampion ? "#2ecc71" : "#e74c3c"}
                  />
                  <Text style={styles.awardInfoText}>Grand Champion</Text>
                </View>

                <View style={styles.awardInfoItem}>
                  <MaterialIcons
                    name={showData?.hasBestInShow ? "check-circle" : "cancel"}
                    size={24}
                    color={showData?.hasBestInShow ? "#2ecc71" : "#e74c3c"}
                  />
                  <Text style={styles.awardInfoText}>Best In Show</Text>
                </View>
              </View>
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
                  {showData.showStatuses.map((status, index) => {
                    const isLast = index === showData.showStatuses.length - 1;
                    return (
                      <View key={status.id}>
                        <View style={styles.timelineItemContainer}>
                          <View style={styles.timelineLeftColumn}>
                            <Text style={styles.timelineDate}>
                              {formatDate(status.startDate)}
                            </Text>
                            <Text style={styles.timelineTime}>
                              {formatTime(status.startDate)} -{" "}
                              {formatTime(status.endDate)}
                            </Text>
                          </View>

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
                                status.isActive && styles.timelineContentActive,
                              ]}>
                              <Text
                                style={[
                                  styles.timelineTitle,
                                  status.isActive && styles.timelineTitleActive,
                                ]}>
                                {status.description}
                              </Text>
                              <Text
                                style={[
                                  styles.timelineStatus,
                                  status.isActive &&
                                    styles.timelineStatusActive,
                                ]}>
                                {status.isActive
                                  ? "Đang diễn ra"
                                  : new Date(status.endDate) < new Date()
                                  ? "Đã hoàn thành"
                                  : "Sắp diễn ra"}
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
      </ScrollView>

      {/* Footer with action buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.ticketButton]}
          onPress={() =>
            router.push({
              pathname: "/(tabs)/shows/BuyTickets",
              params: { showId: id },
            })
          }>
          <MaterialIcons name="confirmation-number" size={20} color="#ffffff" />
          <Text style={styles.buttonText}>Mua vé tham quan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.registerButton]}
          onPress={() =>
            router.push({
              pathname: "/(tabs)/shows/koiRegistration",
              params: { showId: id },
            })
          }>
          <MaterialIcons name="app-registration" size={20} color="#ffffff" />
          <Text style={styles.buttonText}>Đăng ký tham gia</Text>
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
  scrollView: {
    flex: 1,
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
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 8,
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
  awardInfoContainer: {
    marginTop: 16,
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-around",
    borderWidth: 1,
    borderColor: "#dadada",
  },
  awardInfoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  awardInfoText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#2c3e50",
    fontWeight: "500",
  },
  timelineContainer: {
    paddingLeft: 8,
    backgroundColor: "#f0f0f0",
  },
  timelineItemContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  timelineLeftColumn: {
    width: 80,
  },
  timelineDate: {
    fontSize: 12,
    color: "#7f8c8d",
    marginBottom: 2,
  },
  timelineTime: {
    fontSize: 11,
    color: "#95a5a6",
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
  timelineStatus: {
    fontSize: 12,
    color: "#666666",
  },
  timelineStatusActive: {
    color: "#000000",
    fontWeight: "500",
  },
  emptyStateContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: "#f0f0f0",
  },
  emptyStateText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    backgroundColor: "#ffffff",
    padding: 16,
    flexDirection: "column",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: 12,
  },
  actionButton: {
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  ticketButton: {
    backgroundColor: "#000000",
  },
  registerButton: {
    backgroundColor: '#000000',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#7f8c8d",
  },
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
  fullWidthSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingHorizontal: 10,
    width: "100%",
  },
  ticketTypeContainer: {
    marginTop: 8,
  },
  ticketTypeItem: {
    backgroundColor: "#f0f8ff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 6,
  },
  categoryFeeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#991B1B',
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
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  categoryDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  categoryDetailLabel: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  categoryDetailValue: {
    fontSize: 13,
    color: '#000000',
    fontWeight: '500',
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
  bottomButtonContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  // Skeleton styles
  skeletonBanner: {
    backgroundColor: '#e0e0e0',
  },
  skeletonTitle: {
    height: 24,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
    width: '80%',
  },
  skeletonIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
  },
  skeletonText: {
    height: 16,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginLeft: 8,
    width: 120,
  },
  skeletonCard: {
    backgroundColor: '#f5f5f5',
    marginRight: 12,
    padding: 16,
    width: 270,
    height: 180,
    justifyContent: 'space-between',
  },
  skeletonButton: {
    backgroundColor: '#e0e0e0',
    height: 48,
  },
});

export default KoiShowInformation;
