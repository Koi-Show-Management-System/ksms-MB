import {
  Poppins_400Regular,
  Poppins_700Bold,
  useFonts,
} from "@expo-google-fonts/poppins";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import KoiStatusSwitch from "../../components/KoiStatusSwitch"; // Import component KoiStatusSwitch
import {
  KoiProfile as BaseKoiProfile,
  KoiMedia,
  getKoiProfileById,
} from "../../services/koiProfileService";
import { translateStatus } from "../../utils/statusTranslator"; // Import hàm dịch mới

// Lấy kích thước màn hình
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// --- Interfaces ---
interface Achievement {
  id: string;
  icon?: string;
  title: string;
  category: string;
  year: number;
  show: string;
  location?: string;
  awardType?: "first" | "second" | "third" | "grand_champion" | "peoples_choice" | string;
  awardName?: string;
  showName?: string;
  competitionDate?: string;
  categoryName?: string;
  prizeValue?: number;
}

// Mở rộng interface KoiProfile để thêm competitionHistory
interface CompetitionEntry {
  koiShowId: string; // Thêm trường ID của cuộc thi
  year: string;
  showName: string;
  showStatus: string;
  location: string;
  result: string;
  eliminationRound?: string;
}

// Tạo interface mở rộng từ KoiProfile gốc
interface KoiProfile extends BaseKoiProfile {
  competitionHistory?: CompetitionEntry[];
  achievements?: Achievement[];
}

// --- Main Component ---
export default function KoiInformation() {
  const params = useLocalSearchParams();
  const koiId = params.id as string;
  const flatListRef = useRef<FlatList>(null);

  // Load fonts
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_700Bold,
  });

  const [koiData, setKoiData] = useState<KoiProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<"Image" | "Video">(
    "Image"
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [mediaItems, setMediaItems] = useState<KoiMedia[]>([]);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // State cho fullscreen
  const [fullscreenVisible, setFullscreenVisible] = useState<boolean>(false);
  const [fullscreenMedia, setFullscreenMedia] = useState<string | null>(null);
  const [fullscreenMediaType, setFullscreenMediaType] = useState<
    "Image" | "Video"
  >("Image");
  const [isFullscreenPlaying, setIsFullscreenPlaying] =
    useState<boolean>(false);

  // Cấu hình để theo dõi item đang hiển thị
  const viewabilityConfig = { itemVisiblePercentThreshold: 50 };

  // Tạo video player cho video đang được xem
  const videoPlayer = useVideoPlayer(
    selectedMedia && selectedMediaType === "Video" ? selectedMedia : null,
    (player) => {
      player.loop = false;
    }
  );

  // Tạo video player cho fullscreen
  const fullscreenVideoPlayer = useVideoPlayer(
    fullscreenMedia && fullscreenMediaType === "Video" ? fullscreenMedia : null,
    (player) => {
      player.loop = false;
    }
  );

  // Xử lý khi item hiện tại thay đổi
  const onViewableItemsChanged = useRef(
    ({
      viewableItems,
    }: {
      viewableItems: Array<{
        index: number | null;
        item: KoiMedia;
        key: string;
        isViewable: boolean;
      }>;
    }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        const index = viewableItems[0].index;
        setCurrentMediaIndex(index);
        const currentItem = mediaItems[index];
        if (currentItem) {
          setSelectedMedia(currentItem.mediaUrl);
          setSelectedMediaType(currentItem.mediaType);
        }
      }
    }
  ).current;

  // Lắng nghe sự kiện playingChange cho video
  useEffect(() => {
    const subscription = videoPlayer.addListener("playingChange", (event) => {
      setIsPlaying(!!event.isPlaying);
    });

    return () => {
      subscription.remove();
    };
  }, [videoPlayer]);

  // Lắng nghe sự kiện playingChange cho fullscreen video
  useEffect(() => {
    const subscription = fullscreenVideoPlayer.addListener(
      "playingChange",
      (event) => {
        setIsFullscreenPlaying(!!event.isPlaying);
      }
    );

    return () => {
      subscription.remove();
    };
  }, [fullscreenVideoPlayer]);

  // Dừng video khi chuyển slide
  useEffect(() => {
    if (selectedMediaType === "Video") {
      // Bắt đầu phát khi đến slide video
      videoPlayer.play();
    } else {
      // Dừng phát khi rời khỏi slide video
      videoPlayer.pause();
    }
  }, [selectedMedia, selectedMediaType, videoPlayer]);

  // Dữ liệu mẫu cho thành tích nếu không có từ API
  const sampleAchievements: Achievement[] = [
    {
      id: "1",
      title: "Grand Champion",
      category: "Kohaku",
      year: 2022,
      show: "All Japan Koi Show",
      location: "Tokyo, Japan",
      icon: "trophy",
    },
    {
      id: "2",
      title: "First Place",
      category: "Small Fish Champion",
      year: 2021,
      show: "International Koi Expo",
      location: "Osaka, Japan",
      icon: "medal",
    },
  ];

  const fetchKoiData = useCallback(
    async (isRefreshing = false) => {
      try {
        if (!koiId) {
          setError("Không tìm thấy ID cá Koi");
          setIsLoading(false);
          if (isRefreshing) setRefreshing(false);
          return;
        }

        console.log("Đang tải thông tin cá Koi với ID:", koiId);
        const response = await getKoiProfileById(koiId);

        if (response.statusCode === 200) {
          console.log("Nhận được dữ liệu cá Koi:", response.data);

          // Nếu không có thành tích trong dữ liệu API, KHÔNG thêm dữ liệu mẫu nữa
          const koiDataWithAchievements: KoiProfile = {
            ...response.data,
            // Giữ mảng achievements rỗng nếu không có từ API
            achievements: (response.data as any).achievements || [],
          };

          setKoiData(koiDataWithAchievements);

          // Lưu trữ tất cả media
          if (response.data.koiMedia && response.data.koiMedia.length > 0) {
            setMediaItems(response.data.koiMedia);
            // Chọn media đầu tiên để hiển thị
            const firstItem = response.data.koiMedia[0];
            setSelectedMedia(firstItem.mediaUrl);
            setSelectedMediaType(firstItem.mediaType);
          }
          
          // Thêm phản hồi rung nhẹ khi tải dữ liệu thành công trong trường hợp refresh
          if (isRefreshing) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        } else {
          setError(`Không thể tải thông tin cá Koi: ${response.message}`);
          // Phản hồi rung khi có lỗi
          if (isRefreshing) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          }
        }
      } catch (err) {
        console.error("Lỗi khi tải thông tin cá Koi:", err);
        setError("Đã xảy ra lỗi khi tải thông tin cá Koi");
        // Phản hồi rung khi có lỗi
        if (isRefreshing) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } finally {
        setIsLoading(false);
        if (isRefreshing) setRefreshing(false);
      }
    },
    [koiId]
  );

  // Handle pull-to-refresh with haptic feedback
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Tạo phản hồi rung nhẹ khi người dùng kéo để làm mới
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchKoiData(true);
  }, [fetchKoiData]);

  useEffect(() => {
    fetchKoiData();
  }, [fetchKoiData]);

  const handleMediaPress = (mediaUrl: string, mediaType: "Image" | "Video") => {
    setFullscreenMedia(mediaUrl);
    setFullscreenMediaType(mediaType);
    setFullscreenVisible(true);
  };

  const getMediaByType = (type: "Image" | "Video"): KoiMedia[] => {
    if (!koiData || !koiData.koiMedia) return [];
    return koiData.koiMedia.filter((media) => media.mediaType === type);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      videoPlayer.pause();
    } else {
      videoPlayer.play();
    }
  };

  const handleFullscreenPlayPause = () => {
    if (isFullscreenPlaying) {
      fullscreenVideoPlayer.pause();
    } else {
      fullscreenVideoPlayer.play();
    }
  };

  // Thêm hàm xử lý khi trạng thái thay đổi
  const handleStatusChange = (newStatus: string) => {
    if (koiData) {
      setKoiData({
        ...koiData,
        status: newStatus,
      });
    }
  };

  // Render item cho carousel media
  const renderMediaItem = ({
    item,
    index,
  }: {
    item: KoiMedia;
    index: number;
  }) => (
    <View style={[styles.mediaSlide]}>
      {item.mediaType === "Image" ? (
        <TouchableOpacity
          style={styles.mediaTouchable}
          onPress={() => handleMediaPress(item.mediaUrl, "Image")}
          accessibilityLabel="Xem ảnh cá Koi">
          <Image
            source={{ uri: item.mediaUrl }}
            style={styles.mediaImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.3)", "transparent", "rgba(0,0,0,0.3)"]}
            style={styles.mediaGradient}
          />
          <Text style={{display: 'none'}}></Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.mediaVideoContainer}>
          {index === currentMediaIndex && (
            <VideoView
              style={styles.mediaVideo}
              player={videoPlayer}
              contentFit="cover"
              nativeControls={false}
            />
          )}
          <LinearGradient
            colors={["rgba(0,0,0,0.3)", "transparent", "rgba(0,0,0,0.3)"]}
            style={styles.mediaGradient}
          />
          <TouchableOpacity
            style={styles.videoControls}
            onPress={handlePlayPause}
            accessibilityLabel="Phát/Tạm dừng video">
            {!isPlaying && (
              <Image
                source={{
                  uri: "https://dashboard.codeparrot.ai/api/image/Z79CVK7obB3a4bxY/frame-8.png",
                }}
                style={styles.playIcon}
              />
            )}
            <Text style={{display: 'none'}}></Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Thêm hàm điều hướng đến màn hình thông tin cuộc thi
  const navigateToKoiShowDetails = (koiShowId: string) => {
    router.push({
      pathname: "/(tabs)/shows/KoiShowInformation",
      params: { id: koiShowId },
    });
  };

  // Hiển thị khi đang tải
  if (isLoading || !fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải thông tin cá Koi...</Text>
      </View>
    );
  }

  // Hiển thị khi có lỗi
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Hiển thị khi không có dữ liệu
  if (!koiData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không tìm thấy thông tin cá Koi</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = getMediaByType("Image");
  const videos = getMediaByType("Video");

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButtonContainer}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin cá Koi</Text>
        {/* Add Edit Button */}
        <TouchableOpacity
          onPress={() => router.push(`/(user)/KoiProfileEdit?id=${koiId}`)}
          style={styles.editButtonContainer} // Add style for this
        >
          <Text style={styles.editButtonText}>Sửa</Text> {/* Or use an icon */}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#FFA500", "#4A90E2"]} // Sử dụng màu cam làm màu chính và màu xanh làm màu thứ hai
            tintColor="#FFA500" // Màu cam cho iOS
            progressBackgroundColor="#ffffff" // Nền trắng cho thanh tiến trình
            title="Đang cập nhật..." // Thêm văn bản (chỉ hiển thị trên iOS)
          />
        }>
        {/* Media Carousel sử dụng FlatList */}
        {mediaItems.length > 0 ? (
          <View style={styles.heroSection}>
            <FlatList
              ref={flatListRef}
              data={mediaItems}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              renderItem={renderMediaItem}
              keyExtractor={(item) => item.id}
              decelerationRate="fast"
              snapToInterval={screenWidth}
              snapToAlignment="center"
            />

            {/* Chấm phân trang (Pagination) */}
            <View style={styles.paginationContainer}>
              {mediaItems.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === currentMediaIndex && styles.paginationDotActive,
                  ]}
                  onPress={() => {
                    flatListRef.current?.scrollToIndex({
                      index,
                      animated: true,
                    });
                  }}
                  accessibilityLabel={`Trang ${index + 1}`} 
                >
                  <Text style={{display: 'none'}}></Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.noMediaContainer}>
            <Text style={styles.noMediaText}>Chưa có hình ảnh hoặc video</Text>
          </View>
        )}

        <View style={styles.contentContainer}>
          {/* Tiêu đề và trạng thái */}
          <Text style={styles.koiName}>{koiData.name || "Không có tên"}</Text>
          <KoiStatusSwitch
            koiId={koiId}
            initialStatus={koiData.status || "inactive"}
            onStatusChange={handleStatusChange}
          />

          {/* Thông tin chi tiết */}
          <Text style={styles.sectionTitle}>Thông tin chi tiết</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Giống:</Text>
                <Text style={styles.detailValue}>
                  {koiData.variety?.name || "Không xác định"}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Kích thước:</Text>
                <Text style={styles.detailValue}>
                  {koiData.size ? `${koiData.size} cm` : "Chưa cập nhật"}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Tuổi:</Text>
                <Text style={styles.detailValue}>
                  {koiData.age ? `${koiData.age} năm` : "Chưa cập nhật"}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Giới tính:</Text>
                <Text style={styles.detailValue}>
                  {koiData.gender === "Female"
                    ? "Cái"
                    : koiData.gender === "Male"
                    ? "Đực"
                    : koiData.gender || "Chưa xác định"}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Dòng máu:</Text>
                <Text style={styles.detailValue}>
                  {koiData.bloodline || "Chưa cập nhật"}
                </Text>
              </View>
              {koiData.createdAt && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Ngày tạo:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(koiData.createdAt).toLocaleDateString("vi-VN")}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Phần thành tích */}
          <Text style={styles.sectionTitle}>Thành tích</Text>
          {koiData.achievements && koiData.achievements.length > 0 ? (
            <View style={styles.achievementsList}>
              {koiData.achievements.map((achievement, index) => (
                <View key={index} style={styles.achievementCard}>
                  <View style={styles.achievementHeader}>
                    <View
                      style={[
                        styles.achievementIcon,
                        achievement.awardType === "first"
                          ? styles.goldIcon
                          : achievement.awardType === "second"
                          ? styles.silverIcon
                          : achievement.awardType === "third"
                          ? styles.bronzeIcon
                          : achievement.awardType === "grand_champion"
                          ? styles.grandChampionIcon
                          : achievement.awardType === "peoples_choice"
                          ? styles.peoplesChoiceIcon
                          : styles.otherAwardIcon,
                      ]}>
                      <Text style={styles.achievementIconText}>
                        {achievement.awardType === "first"
                          ? "🥇"
                          : achievement.awardType === "second"
                          ? "🥈"
                          : achievement.awardType === "third"
                          ? "🥉"
                          : achievement.awardType === "grand_champion"
                          ? "🏆"
                          : achievement.awardType === "peoples_choice"
                          ? "👑"
                          : "🎖️"}
                      </Text>
                    </View>
                    <View style={styles.achievementTitleContainer}>
                      <Text style={styles.achievementTitle}>
                        {achievement.awardName}
                      </Text>
                      <Text style={styles.achievementSubtitle}>
                        {achievement.showName} -{" "}
                        {achievement.competitionDate 
                          ? new Date(achievement.competitionDate).getFullYear()
                          : achievement.year}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.achievementDetails}>
                    {achievement.categoryName && (
                      <Text style={styles.achievementDetail}>
                        <Text style={styles.achievementDetailLabel}>
                          Danh mục:
                        </Text>{" "}
                        {achievement.categoryName}
                      </Text>
                    )}
                    {achievement.location && (
                      <Text style={styles.achievementDetail}>
                        <Text style={styles.achievementDetailLabel}>
                          Địa điểm:
                        </Text>{" "}
                        {achievement.location}
                      </Text>
                    )}
                    {achievement.prizeValue && (
                      <Text style={styles.achievementDetail}>
                        <Text style={styles.achievementDetailLabel}>
                          Giá trị giải thưởng:
                        </Text>{" "}
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(achievement.prizeValue)}
                      </Text>
                    )}
                    <Text style={styles.achievementDetail}>
                      <Text style={styles.achievementDetailLabel}>
                        Ngày thi đấu:
                      </Text>{" "}
                      {achievement.competitionDate
                        ? new Date(achievement.competitionDate).toLocaleDateString("vi-VN")
                        : "Không có thông tin"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Cá Koi này chưa đạt bất kỳ giải thưởng nào
              </Text>
            </View>
          )}

          {/* Phần hình ảnh và video */}
          <Text style={styles.sectionTitle}>Hình ảnh & Video</Text>
          <View style={styles.mediaSection}>
            {images.length > 0 ? (
              <View style={styles.mediaCategory}>
                <Text style={styles.mediaCategoryTitle}>
                  Hình ảnh ({images.length})
                </Text>
                <FlatList
                  data={images}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.thumbnailContainer}
                      onPress={() => handleMediaPress(item.mediaUrl, "Image")}
                      accessibilityLabel={`Xem ảnh cá Koi`}>
                      <Image
                        source={{ uri: item.mediaUrl }}
                        style={styles.mediaThumbnail}
                      />
                      <Text style={{display: 'none'}}></Text>
                    </TouchableOpacity>
                  )}
                  contentContainerStyle={styles.mediaThumbnailList}
                />
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Không có hình ảnh</Text>
              </View>
            )}

            {videos.length > 0 ? (
              <View style={styles.mediaCategory}>
                <Text style={styles.mediaCategoryTitle}>
                  Video ({videos.length})
                </Text>
                <FlatList
                  data={videos}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity
                      style={styles.thumbnailContainer}
                      onPress={() => handleMediaPress(item.mediaUrl, "Video")}
                      accessibilityLabel={`Xem video ${index + 1}`}>
                      <View style={styles.videoThumbnail}>
                        <Text style={styles.videoLabel}>Video {index + 1}</Text>
                        <Image
                          source={{
                            uri: "https://dashboard.codeparrot.ai/api/image/Z79CVK7obB3a4bxY/frame-8.png",
                          }}
                          style={styles.playIconSmall}
                        />
                      </View>
                      <Text style={{display: 'none'}}></Text>
                    </TouchableOpacity>
                  )}
                  contentContainerStyle={styles.mediaThumbnailList}
                />
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Không có video</Text>
              </View>
            )}
          </View>

          {/* Hiển thị lịch sử thi đấu nếu có */}
          <Text style={styles.sectionTitle}>Lịch sử thi đấu</Text>
          {koiData.competitionHistory &&
          koiData.competitionHistory.length > 0 ? (
            <View style={styles.competitionList}>
              {koiData.competitionHistory.map((competition, index) => (
                <View key={index} style={styles.competitionCard}>
                  <Text style={styles.competitionTitle}>
                    {competition.year} - {competition.showName}
                    {competition.showStatus === "cancelled" && (
                      <Text style={styles.cancelledLabel}> (Đã huỷ)</Text>
                    )}
                  </Text>
                  <Text style={styles.competitionDetail}>
                    <Text style={styles.competitionLabel}>Địa điểm:</Text>{" "}
                    {competition.location || "Không có thông tin"}
                  </Text>
                  <Text style={styles.competitionDetail}>
                    <Text style={styles.competitionLabel}>Kết quả:</Text>{" "}
                    {competition.result || "Chưa có kết quả"}
                  </Text>
                  {competition.eliminationRound && (
                    <Text style={styles.competitionDetail}>
                      <Text style={styles.competitionLabel}>
                        Bị loại tại vòng:
                      </Text>{" "}
                      {competition.eliminationRound}
                    </Text>
                  )}
                  <View style={styles.competitionStatusContainer}>
                    <Text
                      style={[
                        styles.competitionStatus,
                        competition.showStatus === "upcoming"
                          ? styles.statusUpcoming
                          : competition.showStatus === "inprogress"
                          ? styles.statusInProgress
                          : styles.statusFinished,
                      ]}>
                      {translateStatus(competition.showStatus)}
                    </Text>
                    <TouchableOpacity
                      style={styles.viewDetailsButton}
                      onPress={() =>
                        navigateToKoiShowDetails(competition.koiShowId)
                      }>
                      <Text style={styles.viewDetailsText}>Xem chi tiết</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Cá Koi này chưa tham gia cuộc thi nào
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Full Screen Modal */}
      <Modal
        visible={fullscreenVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullscreenVisible(false)}>
        <SafeAreaView style={styles.fullscreenModal}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              if (fullscreenMediaType === "Video") {
                fullscreenVideoPlayer.pause();
              }
              setFullscreenVisible(false);
            }}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>

          {fullscreenMediaType === "Image" ? (
            <Image
              source={{ uri: fullscreenMedia! }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.fullscreenVideoContainer}>
              <VideoView
                style={styles.fullscreenVideo}
                player={fullscreenVideoPlayer}
                contentFit="contain"
                nativeControls={true}
              />
              <View style={styles.videoControlsContainer}>
                <TouchableOpacity
                  style={styles.playPauseButton}
                  onPress={handleFullscreenPlayPause}
                  accessibilityLabel={isFullscreenPlaying ? "Tạm dừng video" : "Phát video"}
                >
                  <Ionicons
                    name={isFullscreenPlaying ? "pause" : "play"}
                    size={30}
                    color="#fff"
                  />
                  <Text style={{ display: 'none' }}></Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  // Header Styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Adjust alignment for the new button
    height: 60,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginTop: 15,
  },
  backButtonContainer: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    marginLeft: 16,
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: "#000000",
  },
  editButtonContainer: {
    paddingHorizontal: 10, // Add some padding
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  editButtonText: {
    fontSize: 16,
    color: "#007AFF", // Blue color like links
    fontFamily: "Poppins_400Regular", // Or bold if preferred
  },

  // ScrollView
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  contentContainer: {
    padding: 16,
  },

  // Loading & Error Styles
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#4B5563",
    fontFamily: "Poppins_400Regular",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#e53e3e",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "Poppins_400Regular",
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    elevation: 2,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
  },

  // Hero/Media Section Styles
  heroSection: {
    width: "100%",
    height: 280,
    position: "relative",
    backgroundColor: "#f7f7f7",
  },
  mediaSlide: {
    width: screenWidth,
    height: 280,
    backgroundColor: "#f0f0f0",
  },
  mediaTouchable: {
    width: screenWidth,
    height: 280,
  },
  mediaImage: {
    width: screenWidth,
    height: 280,
  },
  mediaGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  mediaVideoContainer: {
    width: screenWidth,
    height: 280,
    backgroundColor: "#000",
    position: "relative",
  },
  mediaVideo: {
    width: "100%",
    height: "100%",
  },
  videoControls: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  paginationDotActive: {
    backgroundColor: "#007AFF",
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  playIcon: {
    width: 56,
    height: 56,
    tintColor: "#FFFFFF",
  },
  playIconSmall: {
    width: 32,
    height: 32,
    tintColor: "#FFFFFF",
  },

  // Koi Information Styles
  koiName: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    color: "#000000",
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#4B5563",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: "#000000",
    marginBottom: 16,
  },

  // Detail Card
  detailCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#6B7280",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#1F2937",
  },
  descriptionContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  descriptionLabel: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#6B7280",
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#1F2937",
    lineHeight: 20,
  },

  // Media Section
  mediaSection: {
    marginBottom: 24,
  },
  mediaCategory: {
    marginBottom: 16,
  },
  mediaCategoryTitle: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#4B5563",
    marginBottom: 12,
  },
  mediaThumbnailList: {
    paddingRight: 16,
  },
  thumbnailContainer: {
    marginRight: 12,
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  mediaThumbnail: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  videoThumbnail: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: "#1F2937",
    justifyContent: "center",
    alignItems: "center",
  },
  videoLabel: {
    fontSize: 12,
    color: "#FFFFFF",
    fontFamily: "Poppins_400Regular",
    marginBottom: 8,
  },

  // Competition Section
  competitionList: {
    marginBottom: 16,
  },
  competitionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  competitionTitle: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  competitionDetail: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#4B5563",
    marginBottom: 4,
  },
  competitionLabel: {
    fontFamily: "Poppins_700Bold",
    color: "#4B5563",
  },
  competitionStatusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  competitionStatus: {
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusUpcoming: {
    backgroundColor: "#EBF5FF",
    color: "#007AFF",
  },
  statusFinished: {
    backgroundColor: "#F3F4F6",
    color: "#6B7280",
  },
  statusInProgress: {
    backgroundColor: "#FFF9C4",
    color: "#FFA000",
  },
  cancelledLabel: {
    color: "#EF4444", // Red color for cancelled status
    fontFamily: "Poppins_700Bold",
  },
  viewDetailsButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  viewDetailsText: {
    fontSize: 13,
    color: "#007AFF",
    fontFamily: "Poppins_400Regular",
  },

  // Fullscreen Modal
  fullscreenModal: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 30,
    fontWeight: "bold",
  },
  fullscreenImage: {
    width: screenWidth,
    height: screenHeight * 0.8,
  },
  fullscreenVideoContainer: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenVideo: {
    width: "100%",
    height: "80%",
  },
  videoControlsContainer: {
    position: "absolute",
    bottom: 80,
    width: "100%",
    alignItems: "center",
  },
  playPauseButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  playPauseButtonText: {
    color: "white",
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
  },

  // Achievement Styles
  achievementsList: {
    marginBottom: 24,
  },
  achievementCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  achievementHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  goldIcon: {
    backgroundColor: "#FFCC00",
  },
  silverIcon: {
    backgroundColor: "#C0C0C0",
  },
  bronzeIcon: {
    backgroundColor: "#CD7F32",
  },
  grandChampionIcon: {
    backgroundColor: "#FF4500",
  },
  peoplesChoiceIcon: {
    backgroundColor: "#FF1493",
  },
  otherAwardIcon: {
    backgroundColor: "#9370DB",
  },
  achievementIconText: {
    fontSize: 20,
  },
  achievementTitleContainer: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: "#1F2937",
    marginBottom: 2,
  },
  achievementSubtitle: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#4B5563",
  },
  achievementDetails: {
    marginTop: 4,
  },
  achievementDetail: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#4B5563",
    marginBottom: 4,
  },
  achievementDetailLabel: {
    fontFamily: "Poppins_700Bold",
    color: "#4B5563",
  },

  // No Media Styles
  noMediaContainer: {
    width: "100%",
    height: 280,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
  },
  noMediaText: {
    fontSize: 16,
    color: "#4B5563",
    fontFamily: "Poppins_400Regular",
  },

  // Empty Styles
  emptyContainer: {
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyText: {
    fontSize: 16,
    color: "#4B5563",
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
  },
});
