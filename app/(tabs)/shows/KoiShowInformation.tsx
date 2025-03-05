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
} from "react-native";
import { getKoiShowById, KoiShow } from "../../../services/showService";

const KoiShowInformation: React.FC = () => {
  const params = useLocalSearchParams();
  const id = params.id as string;

  const [showData, setShowData] = useState<KoiShow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    eventDetails: true, // Open by default
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

  // If loading, show loading indicator
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Đang tải thông tin sự kiện...</Text>
      </View>
    );
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
              <MaterialIcons name="location-on" size={18} color="#3498db" />
              <Text style={styles.quickInfoText}>{showData?.location}</Text>
            </View>
            <View style={styles.quickInfoItem}>
              <MaterialIcons name="date-range" size={18} color="#3498db" />
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
              <MaterialIcons name="info-outline" size={22} color="#3498db" />
              <Text style={styles.sectionTitle}>Chi tiết sự kiện</Text>
            </View>
            <MaterialIcons
              name={
                expandedSections.eventDetails ? "expand-less" : "expand-more"
              }
              size={24}
              color="#3498db"
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
                    <Text style={styles.detailLabel}>Hạn đăng ký</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(showData?.registrationDeadline || "")}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailItem}>
                  <MaterialIcons name="people" size={20} color="#3498db" />
                  <View>
                    <Text style={styles.detailLabel}>Số lượng tham gia</Text>
                    <Text style={styles.detailValue}>
                      {showData?.minParticipants} - {showData?.maxParticipants}{" "}
                      người
                    </Text>
                  </View>
                </View>

                <View style={styles.detailItem}>
                  <MaterialIcons
                    name="attach-money"
                    size={20}
                    color="#3498db"
                  />
                  <View>
                    <Text style={styles.detailLabel}>Phí đăng ký</Text>
                    <Text style={styles.detailValue}>
                      {showData?.registrationFee?.toLocaleString("vi-VN")} VNĐ
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Rules & Regulations Section */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection("rules")}>
            <View style={styles.sectionHeaderContent}>
              <MaterialIcons name="gavel" size={22} color="#3498db" />
              <Text style={styles.sectionTitle}>Quy định & Điều lệ</Text>
            </View>
            <MaterialIcons
              name={expandedSections.rules ? "expand-less" : "expand-more"}
              size={24}
              color="#3498db"
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
              <MaterialIcons name="star" size={22} color="#3498db" />
              <Text style={styles.sectionTitle}>Tiêu chí đánh giá</Text>
            </View>
            <MaterialIcons
              name={expandedSections.awards ? "expand-less" : "expand-more"}
              size={24}
              color="#3498db"
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
              <MaterialIcons name="timeline" size={22} color="#3498db" />
              <Text style={styles.sectionTitle}>Lịch trình sự kiện</Text>
            </View>
            <MaterialIcons
              name={expandedSections.timeline ? "expand-less" : "expand-more"}
              size={24}
              color="#3498db"
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
    backgroundColor: "#f5f6fa",
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
    backgroundColor: "#3498db",
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
    backgroundColor: "#3498db",
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
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
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
    backgroundColor: "white",
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 0,
    borderBottomColor: "#e5e7eb",
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
    color: "#2c3e50",
    marginLeft: 8,
  },
  sectionContent: {
    padding: 16,
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
    backgroundColor: "#3498db",
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
    backgroundColor: "#3498db",
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
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-around",
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
    backgroundColor: "#bdc3c7",
    borderWidth: 2,
    borderColor: "#95a5a6",
  },
  timelineDotActive: {
    backgroundColor: "#3498db",
    borderColor: "#2980b9",
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#bdc3c7",
    marginTop: 2,
  },
  timelineRightColumn: {
    flex: 1,
  },
  timelineContent: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#bdc3c7",
  },
  timelineContentActive: {
    backgroundColor: "#e8f4fd",
    borderLeftColor: "#3498db",
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 4,
  },
  timelineTitleActive: {
    color: "#2980b9",
    fontWeight: "700",
  },
  timelineStatus: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  timelineStatusActive: {
    color: "#3498db",
    fontWeight: "500",
  },
  emptyStateContainer: {
    alignItems: "center",
    padding: 24,
  },
  emptyStateText: {
    marginTop: 8,
    color: "#95a5a6",
    fontSize: 14,
    textAlign: "center",
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
    backgroundColor: "#3498db",
  },
  registerButton: {
    backgroundColor: "#2ecc71",
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
    backgroundColor: "#f5f6fa",
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
    backgroundColor: "#3498db",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default KoiShowInformation;
