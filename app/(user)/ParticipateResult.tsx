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
import { translateStatus } from "../../utils/statusTranslator";
import { WebView } from 'react-native-webview'; // Import WebView
import Modal from 'react-native-modal'; // Import Modal

// Lấy kích thước màn hình
const { width } = Dimensions.get("window");
const { height } = Dimensions.get("window"); // Chỉ giữ lại height vì width đã khai báo

// Mở rộng kiểu dữ liệu ShowMemberDetail để thêm trường cancellationReason
interface EnhancedShowMemberDetail extends ShowMemberDetail {
  cancellationReason?: string | null;
}

// Mở rộng kiểu dữ liệu ShowDetailRegistration
// Đảm bảo kiểu Payment có tồn tại và chứa paymentUrl
interface PaymentDetail {
  id: string;
  paidAmount: number;
  paymentDate: string;
  qrcodeData: string | null;
  paymentMethod: string;
  transactionCode: string;
  status: string;
  paymentUrl: string | null; // Quan trọng: paymentUrl có thể là null
}

// Giữ lại định nghĩa EnhancedShowDetailRegistration bao gồm cả payment
type EnhancedShowDetailRegistration = ShowDetailRegistration & {
  totalParticipants?: number;
  payment?: PaymentDetail | null; // Thêm thông tin payment vào registration
};

// --- Fish Details Card ---
const FishDetailsCard: React.FC<{
  registration: EnhancedShowDetailRegistration;
  onPress: () => void;
  onShare: () => void;
  onContinuePayment: (url: string) => void; // Thêm prop mới
}> = ({ registration, onPress, onShare, onContinuePayment }) => { // Thêm onContinuePayment vào props destructured
  // Chọn ảnh đầu tiên từ media hoặc sử dụng ảnh mặc định
  const fishImage = registration.media.find(item => item.mediaType === "Image")?.mediaUrl || 
    "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/group-4.png";
  
  // Kiểm tra xem cá có được trao giải thưởng không dựa trên status
  const hasAward = registration.status === 'prizewinner';
  
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
            <Text style={styles.awardBadgeText}>{registration.awards[0]?.awardName || 'Đạt giải'}</Text>
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
                <Text style={styles.statusText}>{translateStatus(registration.status)}</Text>
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
                <Text style={styles.awardText}>{registration.awards[0]?.awardName || 'Đạt giải'}</Text>
              </LinearGradient>
            ) : (
              <View style={styles.rankContainer}>
                <Text style={styles.rankText}>
                  {registration.rank 
                    ? `Xếp hạng: ${registration.rank}` 
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

          {/* Nút Tiếp tục thanh toán */}
          {registration.status.toLowerCase() === "waittopaid" && registration.payment?.paymentUrl && (
            <TouchableOpacity
              style={styles.continuePaymentButton} // Thêm style mới
              onPress={() => registration.payment?.paymentUrl && onContinuePayment(registration.payment.paymentUrl)}
            >
              <Text style={styles.continuePaymentButtonText}>Tiếp tục thanh toán</Text>
            </TouchableOpacity>
          )}

          {/* Chỉ hiển thị nút chia sẻ nếu cá đạt giải */}
          {hasAward && (
             <TouchableOpacity
               style={styles.shareButton}
               onPress={onShare}>
               <Text style={styles.shareButtonText}>Chia sẻ kết quả</Text>
             </TouchableOpacity>
          )}
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
  // Tính toán số cá đã được trao giải dựa trên status
  const awardedFishCount = showDetail.registrations.filter(reg => reg.status === 'prizewinner').length;
  // Đếm số lượng cá đạt giải nhất (rank 1 và status Prizewinner)
  const highestRankAwardCount = showDetail.registrations
    .filter(reg => reg.status === 'prizewinner' && reg.rank === 1)
    .length;
  
  // Tìm giải thưởng cao nhất (awardName của con cá có rank nhỏ nhất trong số các con đạt giải)
  const highestAwardType = showDetail.registrations
    .filter(reg => reg.status === 'prizewinner' && reg.awards && reg.awards.length > 0) // Lọc cá đạt giải và có thông tin giải thưởng
    .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999)) // Sắp xếp theo rank tăng dần
    [0]?.awards[0]?.awardName || null; // Lấy awardName của giải đầu tiên của cá rank cao nhất

  // Log giá trị để debug
  console.log("Highest Award Type Calculated:", highestAwardType);

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
              <Text style={styles.cancelledText}>{translateStatus("Cancelled")}</Text>
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
            value={highestRankAwardCount}
            label="Giải nhất"
            color="#F6FFED"
          />
        </View>
        
        {/* Hiển thị lại chi tiết giải thưởng cao nhất với awardType */}
        {highestAwardType && (
          <View style={styles.highestAwardContainer}>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/frame.png",
              }}
              style={styles.highestAwardIcon}
            />
            <Text style={styles.highestAwardText}>
              Giải thưởng cao nhất: {highestAwardType} 
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
  // State cho WebView Modal
  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  // Định nghĩa fetchShowDetail bên ngoài useEffect để có thể gọi lại
  const fetchShowDetail = async () => {
    try {
      setLoading(true);
      const data = await getShowMemberDetail(competitionId);

      // Cập nhật thêm thông tin totalParticipants và payment cho mỗi registration
      const enhancedData = {
        ...data,
        registrations: data.registrations.map(reg => ({
          ...reg,
          totalParticipants: data.totalRegisteredKoi, // Thêm thông tin tổng số cá
          payment: reg.payment // Đảm bảo payment được truyền vào
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

    } catch (error: any) { // Sửa lỗi cú pháp: dấu phẩy không cần thiết
      console.error('Lỗi khi lấy thông tin chi tiết show:', error);
      setError(error.message || 'Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }; // Kết thúc hàm fetchShowDetail

  useEffect(() => {
    fetchShowDetail(); // Gọi hàm đã định nghĩa ở trên
  }, [competitionId]); // Dependency array vẫn giữ nguyên

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

  // Xử lý mở WebView thanh toán
  const handleContinuePayment = (url: string) => {
    setPaymentUrl(url);
    setShowPaymentWebView(true);
  };

  // Xử lý đóng WebView thanh toán
  const handleCloseWebView = () => {
    setShowPaymentWebView(false);
    setPaymentUrl(null);
    // Tải lại dữ liệu sau khi đóng webview để cập nhật trạng thái thanh toán
    fetchShowDetail();
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
                    onContinuePayment={handleContinuePayment} // Truyền hàm xử lý
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

        {/* Modal sẽ được render bên ngoài SafeAreaView chính */}
        </SafeAreaView>
         {/* Modal hiển thị WebView - Render bên ngoài ScrollView và điều kiện loading/error */}
         <Modal
           isVisible={showPaymentWebView}
           style={styles.webViewModal}
           onBackdropPress={handleCloseWebView} // Đóng khi nhấn bên ngoài
           onBackButtonPress={handleCloseWebView} // Đóng khi nhấn nút back Android
           animationIn="slideInUp"
           animationOut="slideOutDown"
           backdropOpacity={0.5}
         >
           <SafeAreaView style={styles.webViewSafeArea}>
             <View style={styles.webViewContainer}>
               <View style={styles.webViewHeader}>
                 <Text style={styles.webViewTitle}>Tiếp tục thanh toán</Text>
                 <TouchableOpacity onPress={handleCloseWebView} style={styles.closeButton}>
                    <Image source={{ uri: 'https://img.icons8.com/ios-glyphs/30/777777/multiply.png' }} style={styles.closeIcon} />
                 </TouchableOpacity>
               </View>
               {paymentUrl ? ( // Chỉ render WebView khi có URL
                 <WebView
                   source={{ uri: paymentUrl }}
                   style={styles.webView}
                   startInLoadingState={true}
                   renderLoading={() => (
                     <ActivityIndicator
                       color="#4A90E2"
                       size="large"
                       style={styles.webViewLoading}
                     />
                   )}
                   onError={(syntheticEvent) => {
                     const { nativeEvent } = syntheticEvent;
                     console.warn('WebView error: ', nativeEvent);
                     Alert.alert('Lỗi tải trang', 'Không thể tải trang thanh toán. Vui lòng thử lại.');
                     handleCloseWebView(); // Đóng modal nếu có lỗi
                   }}
                 />
               ) : (
                  <View style={styles.webViewLoading}>
                     <Text>Đang tải URL...</Text>
                  </View>
               )}
             </View>
           </SafeAreaView>
         </Modal>
    </View>
  );
}; // Sửa lỗi cú pháp: Đặt dấu chấm phẩy đúng vị trí

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
  continuePaymentButton: { // Style cho nút mới
    backgroundColor: "#F59E0B", // Màu cam
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    elevation: 2,
  },
  continuePaymentButtonText: { // Style cho text nút mới
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
  // Thêm lại style cho highestAwardContainer
  highestAwardContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFDF0",
    borderRadius: 8,
    padding: 12,
    marginTop: 12, // Thêm khoảng cách trên
    marginBottom: 12, // Giữ khoảng cách dưới
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
  // WebView Modal Styles
  webViewModal: {
    margin: 0, // Modal chiếm toàn màn hình
    justifyContent: 'flex-end',
  },
  webViewSafeArea: {
    flex: 1,
    backgroundColor: 'white', // Nền trắng cho safe area
    borderTopLeftRadius: 15, // Bo góc trên
    borderTopRightRadius: 15,
    overflow: 'hidden', // Đảm bảo bo góc hoạt động
    maxHeight: height * 0.9, // Giới hạn chiều cao modal
  },
  webViewContainer: {
    flex: 1,
  },
  webViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f8f8f8',
  },
  webViewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 8, // Tăng vùng chạm
  },
  closeIcon: {
    width: 20,
    height: 20,
  },
  webView: {
    flex: 1,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
});

export default ParticipateResult;

