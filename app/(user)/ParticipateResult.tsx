// ParticipateResult.tsx
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar as RNStatusBar,
  Dimensions,
  ImageBackground,
  Animated,
} from "react-native";
import { getShowMemberDetail, ShowMemberDetail, ShowDetailRegistration } from "../../services/competitionService";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";

// Lấy kích thước màn hình
const { width } = Dimensions.get("window");

// Mở rộng kiểu dữ liệu ShowMemberDetail để thêm trường cancellationReason
interface EnhancedShowMemberDetail extends ShowMemberDetail {
  cancellationReason?: string | null;
}

// Mở rộng kiểu dữ liệu ShowDetailRegistration
type EnhancedShowDetailRegistration = ShowDetailRegistration & {
  totalParticipants?: number;
};

// --- Fish Details Card ---
const FishDetailsCard: React.FC<{
  registration: EnhancedShowDetailRegistration;
  onPress: () => void;
  onShare: () => void;
}> = ({ registration, onPress, onShare }) => {
  // Chọn ảnh đầu tiên từ media hoặc sử dụng ảnh mặc định
  const fishImage = registration.media.find(item => item.mediaType === "Image")?.mediaUrl || 
    "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/group-4.png";
  
  // Kiểm tra xem cá có được trao giải thưởng không
  const hasAward = !!registration.award;
  
  // Lấy màu sắc status
  const getStatusColor = (status: string) => {
    switch(status) {
      case "Confirmed": return "#15803D"; // Xanh lá
      case "CheckIn": return "#047857"; // Xanh lá đậm
      case "Pending": return "#EAB308"; // Vàng
      case "WaitToPaid": return "#F59E0B"; // Cam
      case "Rejected": return "#B91C1C"; // Đỏ
      case "Refunded": return "#6366F1"; // Tím
      case "Cancelled": return "#7C3AED"; // Tím đậm
      default: return "#6B7280"; // Xám
    }
  };
  
  return (
    <View style={styles.fishCard}>
      <View style={styles.fishImageContainer}>
        <Image 
          source={{ uri: fishImage }} 
          style={styles.fishImage} 
          resizeMode="cover" 
        />
        {hasAward && (
          <View style={styles.awardBadge}>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/frame.png",
              }}
              style={styles.awardBadgeIcon}
            />
            <Text style={styles.awardBadgeText}>{registration.award}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.fishCardContent}>
        <Text style={styles.fishCardTitle}>{registration.koiName}</Text>
        
        <View style={styles.fishCardDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Giống:</Text>
              <Text style={styles.detailValue}>{registration.variety}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Kích thước:</Text>
              <Text style={styles.detailValue}>{registration.size} cm</Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailItemFull}>
              <Text style={styles.detailLabel}>Hạng mục:</Text>
              <Text style={styles.detailValue}>{registration.categoryName}</Text>
            </View>
          </View>
          
          {/* Hiển thị trạng thái cá */}
          <View style={styles.detailRow}>
            <View style={styles.detailItemFull}>
              <Text style={styles.detailLabel}>Trạng thái:</Text>
              <View style={[styles.statusChip, { backgroundColor: getStatusColor(registration.status) }]}>
                <Text style={styles.statusText}>{registration.status}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.rankingContainer}>
            {hasAward ? (
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.awardContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Image
                  source={{
                    uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/frame.png",
                  }}
                  style={styles.awardIcon}
                />
                <Text style={styles.awardText}>{registration.award}</Text>
              </LinearGradient>
            ) : (
              <View style={styles.rankContainer}>
                <Text style={styles.rankText}>
                  {registration.rank 
                    ? `Xếp hạng: ${registration.rank}/${registration.totalParticipants || '?'}` 
                    : "Chưa xếp hạng"}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.viewDetailButton}
            onPress={onPress}>
            <Text style={styles.viewDetailButtonText}>Xem chi tiết</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.shareButton}
            onPress={onShare}>
            <Text style={styles.shareButtonText}>Chia sẻ kết quả</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// --- Stats Badge Component ---
const StatBadge: React.FC<{
  value: string | number;
  label: string;
  color: string;
}> = ({ value, label, color }) => {
  return (
    <View style={[styles.statBadge, { backgroundColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

// --- Competition Details ---
const CompetitionDetails: React.FC<{
  showDetail: EnhancedShowMemberDetail
}> = ({ showDetail }) => {
  // Tính toán số cá đã được trao giải
  const awardedFishCount = showDetail.registrations.filter(reg => reg.award).length;
  // Tìm giải thưởng cao nhất
  const highestAward = showDetail.registrations
    .filter(reg => reg.award)
    .sort((a, b) => {
      const rankA = a.rank || 999;
      const rankB = b.rank || 999;
      return rankA - rankB;
    })[0]?.award || "Không có";

  // Kiểm tra nếu triển lãm đã bị hủy
  const isShowCancelled = showDetail.status === "Cancelled";

  return (
    <View style={styles.competitionContainer}>
      <ImageBackground 
        source={{ uri: showDetail.showImageUrl }} 
        style={styles.competitionBanner} 
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)']}
          style={styles.bannerGradient}
        >
          <Text style={styles.competitionTitle}>{showDetail.showName}</Text>
          <Text style={styles.competitionSubtitle}>Kết quả chi tiết</Text>
          
          {/* Hiển thị banner khi cuộc thi bị hủy */}
          {isShowCancelled && (
            <View style={styles.cancelledBanner}>
              <Text style={styles.cancelledText}>Đã hủy</Text>
            </View>
          )}
        </LinearGradient>
      </ImageBackground>
      
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <View style={styles.sectionIndicator} />
            <Text style={styles.sectionTitle}>Thông tin cuộc thi</Text>
          </View>
        </View>
        
        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/calendar-icon.png",
              }}
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>{showDetail.duration}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/location-icon.png",
              }}
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>{showDetail.location}</Text>
          </View>
          
          {/* Hiển thị lý do hủy nếu triển lãm bị hủy */}
          {isShowCancelled && showDetail.cancellationReason && (
            <View style={styles.cancellationContainer}>
              <Image
                source={{
                  uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/warning-icon.png",
                }}
                style={[styles.infoIcon, { tintColor: "#E11D48" }]}
              />
              <Text style={styles.cancellationText}>
                Lý do hủy: {showDetail.cancellationReason}
              </Text>
            </View>
          )}
          
          {showDetail.description && (
            <View style={styles.infoItem}>
              <Image
                source={{
                  uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/info-icon.png",
                }}
                style={styles.infoIcon}
              />
              <Text style={styles.infoText}>{showDetail.description}</Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <View style={styles.sectionIndicator} />
            <Text style={styles.sectionTitle}>Kết quả của bạn</Text>
          </View>
        </View>
        
        <View style={styles.statsContainer}>
          <StatBadge
            value={showDetail.totalRegisteredKoi}
            label="Cá tham gia"
            color="#E6F7FF"
          />
          <StatBadge
            value={awardedFishCount}
            label="Cá đạt giải"
            color="#FFF7E6"
          />
          <StatBadge
            value={highestAward !== "Không có" ? "1" : "0"}
            label="Giải cao nhất"
            color="#F6FFED"
          />
        </View>
        
        {highestAward !== "Không có" && (
          <View style={styles.highestAwardContainer}>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/frame.png",
              }}
              style={styles.highestAwardIcon}
            />
            <Text style={styles.highestAwardText}>
              Giải thưởng cao nhất: {highestAward}
            </Text>
          </View>
        )}
        
        <Text style={styles.congratulationText}>
          {isShowCancelled ? "Rất tiếc cuộc thi đã bị hủy" : "Chúc mừng bạn đã tham gia!"}
        </Text>
      </View>
      
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <View style={styles.sectionIndicator} />
            <Text style={styles.sectionTitle}>Danh sách cá tham gia</Text>
          </View>
        </View>
        
        <Text style={styles.infoTextSubtle}>
          Xem kết quả chi tiết cho từng con cá bạn đã đăng ký 
          tham gia cuộc thi.
        </Text>
      </View>
    </View>
  );
};

// --- Main Component ---
const ParticipateResult: React.FC = () => {
  const params = useLocalSearchParams();
  const competitionId = params.competitionId as string;
  
  const [loading, setLoading] = useState(true);
  // Cập nhật kiểu dữ liệu với enhancedData
  const [showDetail, setShowDetail] = useState<EnhancedShowMemberDetail & { registrations: EnhancedShowDetailRegistration[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Animation state
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchShowDetail = async () => {
      try {
        setLoading(true);
        const data = await getShowMemberDetail(competitionId);
        
        // Cập nhật thêm thông tin totalParticipants cho mỗi registration
        const enhancedData = {
          ...data,
          registrations: data.registrations.map(reg => ({
            ...reg,
            totalParticipants: data.totalRegisteredKoi // Thêm thông tin tổng số cá
          }))
        };
        
        setShowDetail(enhancedData);
        setError(null);
        
        // Kích hoạt animation fade-in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
        
      } catch (error: any) {
        console.error('Lỗi khi lấy thông tin chi tiết show:', error);
        setError(error.message || 'Có lỗi xảy ra khi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    if (competitionId) {
      fetchShowDetail();
    } else {
      setError('Không tìm thấy ID cuộc thi');
      setLoading(false);
    }
  }, [competitionId]);

  // Xử lý chuyển hướng đến màn hình chi tiết cá
  const handleViewFishDetail = (registration: EnhancedShowDetailRegistration) => {
    router.push({
      pathname: "/(user)/FishStatus",
      params: {
        showId: competitionId,
        registrationId: registration.registrationId
      },
    });
  };

  // Xử lý chia sẻ kết quả
  const handleShareResults = (registration: EnhancedShowDetailRegistration) => {
    Alert.alert(
      "Chia sẻ kết quả",
      `Chia sẻ kết quả của cá "${registration.koiName}" trên mạng xã hội?`,
      [
        { text: "Hủy", style: "cancel" },
        { text: "Chia sẻ", onPress: () => console.log("Chia sẻ kết quả:", registration.koiName) }
      ]
    );
  };

  // Xử lý chuyển hướng đến trang shows
  const handleJoinOtherCompetitions = () => {
    router.push("/(tabs)/shows/KoiShowsPage");
  };

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
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
          <Text style={styles.headerTitle}>Chi tiết cuộc thi</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/error-icon.png",
              }}
              style={styles.errorIcon}
            />
            <Text style={styles.errorTitle}>Đã xảy ra lỗi</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => router.back()}>
              <Text style={styles.retryButtonText}>Quay lại</Text>
            </TouchableOpacity>
          </View>
        ) : showDetail ? (
          <Animated.ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
            style={{ opacity: fadeAnim }}
          >
            <CompetitionDetails showDetail={showDetail} />
            
            {showDetail.registrations.length > 0 ? (
              <View style={styles.fishListContainer}>
                {showDetail.registrations.map((registration) => (
                  <FishDetailsCard 
                    key={registration.registrationId} 
                    registration={registration} 
                    onPress={() => handleViewFishDetail(registration)}
                    onShare={() => handleShareResults(registration)}
                  />
                ))}
                
                <TouchableOpacity
                  style={styles.joinOtherButton}
                  onPress={handleJoinOtherCompetitions}>
                  <LinearGradient
                    colors={['#4A90E2', '#007AFF']}
                    style={styles.gradientButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.joinOtherButtonText}>Tham gia cuộc thi khác</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Image
                  source={{
                    uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/empty-icon.png",
                  }}
                  style={styles.emptyIcon}
                />
                <Text style={styles.emptyTitle}>Không có dữ liệu</Text>
                <Text style={styles.emptyText}>Bạn chưa đăng ký cá nào cho cuộc thi này</Text>
                
                <TouchableOpacity
                  style={styles.joinOtherButton}
                  onPress={handleJoinOtherCompetitions}>
                  <LinearGradient
                    colors={['#4A90E2', '#007AFF']}
                    style={styles.gradientButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.joinOtherButtonText}>Tham gia cuộc thi</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </Animated.ScrollView>
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Không có dữ liệu</Text>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    paddingTop: RNStatusBar.currentHeight,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
    fontWeight: "500",
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#333333",
    textAlign: "center",
    marginRight: 40, // To center the title accounting for the back button
  },
  scrollContent: {
    paddingBottom: 30,
  },
  // Competition container styles
  competitionContainer: {
    backgroundColor: "#FFFFFF",
  },
  competitionBanner: {
    width: "100%",
    height: 200,
  },
  bannerGradient: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 16,
  },
  competitionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  competitionSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  sectionContainer: {
    padding: 16,
    borderBottomWidth: 8,
    borderBottomColor: "#F0F0F0",
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionIndicator: {
    width: 4,
    height: 20,
    backgroundColor: "#4A90E2",
    borderRadius: 2,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333333",
  },
  infoContainer: {
    marginTop: 8,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  infoIcon: {
    width: 18,
    height: 18,
    marginRight: 8,
    tintColor: "#666666",
  },
  infoText: {
    fontSize: 14,
    color: "#666666",
    flex: 1,
    lineHeight: 20,
  },
  infoTextSubtle: {
    fontSize: 14,
    color: "#888888",
    lineHeight: 20,
    fontStyle: "italic",
  },
  // Stats Container
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 16,
  },
  statBadge: {
    width: (width - 48) / 3.2,
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333333",
  },
  statLabel: {
    fontSize: 12,
    color: "#666666",
    marginTop: 4,
  },
  highestAwardContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFDF0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  highestAwardIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  highestAwardText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#B8860B",
  },
  congratulationText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#15803D",
    textAlign: "center",
    marginTop: 8,
  },
  // Fish list container
  fishListContainer: {
    padding: 16,
    backgroundColor: "#F8F9FA",
  },
  // Fish card styles
  fishCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
  },
  fishImageContainer: {
    width: "100%",
    height: 180,
    position: "relative",
  },
  fishImage: {
    width: "100%",
    height: "100%",
  },
  awardBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255, 215, 0, 0.9)",
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  awardBadgeIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  awardBadgeText: {
    color: "#8B4513",
    fontWeight: "700",
    fontSize: 12,
  },
  fishCardContent: {
    padding: 16,
  },
  fishCardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 12,
  },
  fishCardDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  detailItem: {
    flex: 1,
  },
  detailItemFull: {
    width: "100%",
  },
  detailLabel: {
    fontSize: 12,
    color: "#888888",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: "#333333",
    fontWeight: "500",
  },
  rankingContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  awardContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  awardIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  awardText: {
    color: "#8B4513",
    fontWeight: "700",
    fontSize: 14,
  },
  rankContainer: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  rankText: {
    color: "#666666",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  actionButtonsContainer: {
    flexDirection: "column",
    gap: 10,
  },
  viewDetailButton: {
    backgroundColor: "#4A90E2",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  viewDetailButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
  shareButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  shareButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
  // Join other competitions
  joinOtherButton: {
    marginTop: 16,
    borderRadius: 10,
    overflow: "hidden",
  },
  gradientButton: {
    paddingVertical: 14,
    alignItems: "center",
  },
  joinOtherButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666666",
  },
  // Error states
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  errorIcon: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#E74C3C",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#4A90E2",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  // Empty state
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  emptyIcon: {
    width: 100,
    height: 100,
    marginBottom: 16,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  // Thêm styles mới
  cancelledBanner: {
    backgroundColor: "#E11D48",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  cancelledText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
  },
  cancellationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: "#FECDD3",
    borderRadius: 8,
    padding: 10,
  },
  cancellationText: {
    fontSize: 14,
    color: "#E11D48",
    flex: 1,
    lineHeight: 20,
    fontWeight: "600",
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});

export default ParticipateResult;

