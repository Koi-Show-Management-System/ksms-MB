// app/(user)/CompetitionJoined.tsx
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from "react-native";
import {
  HistoryRegisterShowItem,
  getRegistrationHistory, 
  getFilterParams, 
  mapToCompetitionData, 
  getStatusColorWithRegistration, 
  getStatusTextWithRegistration
} from "../../services/competitionService";

// Competition Card Component
const CompetitionCard: React.FC<{
  competition: ReturnType<typeof mapToCompetitionData>;
  onPress: (competitionId: string) => void;
}> = ({ competition, onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.competitionCard} 
      onPress={() => onPress(competition.id)}
    >
      <Image
        source={{ uri: competition.image }}
        style={styles.competitionImage}
      />

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.competitionName}>{competition.name}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColorWithRegistration(competition.status) },
            ]}>
            <Text style={styles.statusText}>
              {getStatusTextWithRegistration(competition.status)}
            </Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/calendar-icon.png",
              }}
              style={styles.detailIcon}
            />
            <Text style={styles.detailText}>{competition.date}</Text>
          </View>

          <View style={styles.detailItem}>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/location-icon.png",
              }}
              style={styles.detailIcon}
            />
            <Text style={styles.detailText}>{competition.location}</Text>
          </View>
        </View>

        {competition.status === "completed" && competition.result && (
          <View style={styles.resultContainer}>
            {competition.result.awarded ? (
              <View style={styles.awardContainer}>
                <Image
                  source={{
                    uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/frame.png",
                  }}
                  style={styles.awardIcon}
                />
                <Text style={styles.awardText}>
                  {competition.result.awardTitle}
                </Text>
              </View>
            ) : (
              <Text style={styles.rankText}>
                Hạng: {competition.result.rank || "N/A"}
              </Text>
            )}
          </View>
        )}

        {competition.status === "completed" && (
          <View style={styles.viewResultsContainer}>
            <Text style={styles.viewResultsText}>Xem kết quả</Text>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/arrow-right.png",
              }}
              style={styles.arrowIcon}
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Filter Tab Component
const FilterTab: React.FC<{
  title: string;
  active: boolean;
  onPress: () => void;
}> = ({ title, active, onPress }) => (
  <TouchableOpacity
    style={[styles.filterTab, active && styles.activeFilterTab]}
    onPress={onPress}>
    <Text style={[styles.filterTabText, active && styles.activeFilterTabText]}>
      {title}
    </Text>
  </TouchableOpacity>
);

// Main Component
const CompetitionJoined: React.FC = () => {
  // State for filter
  const [activeFilter, setActiveFilter] = useState<
    "all" | "upcoming" | "ongoing" | "completed"
  >("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [registrations, setRegistrations] = useState<HistoryRegisterShowItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [registrationStatus, setRegistrationStatus] = useState<string | null>(null);
  const [showStatus, setShowStatus] = useState<string | undefined>(undefined);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Prepare empty message text based on filter
  const getEmptyStateMessage = () => {
    if (activeFilter === "completed") {
      return "Bạn chưa có cuộc thi nào đã kết thúc hoặc có thể đang có vấn đề khi tải dữ liệu. Hãy thử lọc theo 'Tất cả' để xem tất cả các cuộc thi.";
    } else if (activeFilter === "ongoing") {
      return "Bạn chưa tham gia cuộc thi đang diễn ra nào.";
    } else if (activeFilter === "upcoming") {
      return "Bạn chưa tham gia cuộc thi sắp diễn ra nào.";
    } else {
      return "Bạn chưa tham gia cuộc thi nào.";
    }
  };

  // Fetch registrations
  const fetchRegistrations = async (page = 1, showStat = showStatus, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (!refreshing) {
        setLoading(true);
      }

      // Reset error state
      setHasError(false);
      setErrorMessage('');

      const paginatedResponse = await getRegistrationHistory(page, 10, showStat);
      
      if (refresh || page === 1) {
        setRegistrations(paginatedResponse.items);
      } else {
        setRegistrations(prev => [...prev, ...paginatedResponse.items]);
      }
      setTotalPages(paginatedResponse.totalPages);
      setCurrentPage(paginatedResponse.page);
    } catch (error: any) {
      console.error('Lỗi khi tải danh sách đăng ký:', error);
      setHasError(true);
      setErrorMessage(error.message || 'Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Set filter based on activeFilter
  useEffect(() => {
    const filterParams = getFilterParams(activeFilter);
    setRegistrationStatus(filterParams.registrationStatus);
    setShowStatus(filterParams.showStatus || undefined);
    setCurrentPage(1); // Reset về trang 1
    fetchRegistrations(1, filterParams.showStatus || undefined, true);
  }, [activeFilter]);

  // Load more items when reaching end of list
  const handleLoadMore = () => {
    if (currentPage < totalPages && !loading) {
      fetchRegistrations(currentPage + 1);
    }
  };

  // Refresh data
  const handleRefresh = () => {
    fetchRegistrations(1, showStatus, true);
  };

  // Map registration data to competition data
  const mappedCompetitions = registrations.map((item) => mapToCompetitionData(item));

  // Handle competition press
  const handleCardPress = (competitionId: string) => {
    router.push({
      pathname: "/(user)/ParticipateResult",
      params: { competitionId }
    });
  };

  // Initial fetch
  useEffect(() => {
    fetchRegistrations();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/back-icon.png",
            }}
            style={styles.backIcon}
          />
          <Text style={styles.backText}>Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cuộc thi của tôi</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}>
          <FilterTab
            title="Tất cả"
            active={activeFilter === "all"}
            onPress={() => setActiveFilter("all")}
          />
          <FilterTab
            title="Sắp diễn ra"
            active={activeFilter === "upcoming"}
            onPress={() => setActiveFilter("upcoming")}
          />
          <FilterTab
            title="Đang diễn ra"
            active={activeFilter === "ongoing"}
            onPress={() => setActiveFilter("ongoing")}
          />
          <FilterTab
            title="Đã kết thúc"
            active={activeFilter === "completed"}
            onPress={() => setActiveFilter("completed")}
          />
        </ScrollView>
      </View>

      {/* Competition List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      ) : hasError ? (
        <View style={styles.errorContainer}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/error-icon.png",
            }}
            style={styles.errorIcon}
          />
          <Text style={styles.errorTitle}>Đã xảy ra lỗi</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchRegistrations(1, showStatus, true)}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : mappedCompetitions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/empty-competitions.png",
            }}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>Không tìm thấy cuộc thi</Text>
          <Text style={styles.emptyText}>{getEmptyStateMessage()}</Text>
          
          <View style={styles.buttonContainer}>
            {activeFilter === "completed" && (
              <TouchableOpacity
                style={[styles.actionButton, styles.viewAllButton]}
                onPress={() => setActiveFilter("all")}>
                <Text style={styles.viewAllButtonText}>Xem tất cả</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.actionButton, styles.browseButton]}
              onPress={() => router.push("/(tabs)/shows/KoiShowsPage")}>
              <Text style={styles.browseButtonText}>Tìm cuộc thi</Text>
            </TouchableOpacity>
          </View>
          
        </View>
      ) : (
        <FlatList
          data={mappedCompetitions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CompetitionCard
              competition={item}
              onPress={handleCardPress}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#4A90E2"]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            currentPage < totalPages ? (
              <ActivityIndicator 
                style={{ marginVertical: 20 }} 
                size="small" 
                color="#4A90E2" 
              />
            ) : null
          }
        />
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => router.push("/(tabs)/home/homepage")}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/home-icon.png",
            }}
            style={styles.footerIcon}
          />
          <Text style={styles.footerText}>Trang chủ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => router.push("/(user)/Notification")}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/notification-icon.png",
            }}
            style={styles.footerIcon}
          />
          <Text style={styles.footerText}>Thông báo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => router.push("/(tabs)/home/UserMenu")}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/profile-icon.png",
            }}
            style={styles.footerIcon}
          />
          <Text style={styles.footerText}>Hồ sơ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  backIcon: {
    width: 20,
    height: 20,
    marginRight: 4,
  },
  backText: {
    fontSize: 16,
    color: "#4A90E2",
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: "700",
    color: "#333333",
    textAlign: "center",
    marginRight: 40, // To center the title accounting for the back button
  },
  filterContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
  },
  activeFilterTab: {
    backgroundColor: "#4A90E2",
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666666",
  },
  activeFilterTabText: {
    color: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginBottom: 24,
  },
  browseButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
    paddingBottom: 80, // Extra padding at bottom for better UX
  },
  competitionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  competitionImage: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  competitionName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333333",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  detailsRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  detailIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
  },
  detailText: {
    fontSize: 14,
    color: "#666666",
  },
  koiInfoContainer: {
    marginTop: 10,
    marginBottom: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  koiName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 4,
  },
  koiDetails: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 4,
  },
  paymentStatus: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333333",
  },
  statLabel: {
    fontSize: 12,
    color: "#666666",
  },
  resultContainer: {
    alignItems: "flex-end",
    marginTop: 8,
  },
  awardContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  awardIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  awardText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E74C3C",
  },
  rankText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
  },
  viewResultsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  viewResultsText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A90E2",
    marginRight: 4,
  },
  arrowIcon: {
    width: 16,
    height: 16,
    tintColor: "#4A90E2",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    paddingBottom: 20, // Extra padding for iPhone home indicator
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerButton: {
    alignItems: "center",
  },
  footerIcon: {
    width: 24,
    height: 24,
    marginBottom: 4,
  },
  footerText: {
    fontSize: 12,
    color: "#666666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorIcon: {
    width: 80,
    height: 80,
    marginBottom: 24,
    tintColor: "#E74C3C",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#E74C3C",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: "#4A90E2",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    gap: 10,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  viewAllButton: {
    backgroundColor: "#666666",
  },
  viewAllButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  browseButton: {
    backgroundColor: "#4A90E2",
  },
});

export default CompetitionJoined;
