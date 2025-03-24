import React, { useState, useEffect, useRef } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { getKoiProfileById, KoiProfile as BaseKoiProfile, KoiMedia } from "../../services/koiProfileService";
import { VideoView, useVideoPlayer } from "expo-video";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Modal,
  SafeAreaView,
  FlatList,
  StatusBar,
} from "react-native";
import { useFonts, Poppins_400Regular, Poppins_700Bold } from '@expo-google-fonts/poppins';

// Lấy kích thước màn hình
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// --- Interfaces ---
interface Achievement {
  icon: string;
  title: string;
  category: string;
  year: number;
}

// Mở rộng interface KoiProfile để thêm competitionHistory
interface CompetitionEntry {
  year: string;
  showName: string;
  showStatus: string; 
  location: string;
  result: string;
}

// Tạo interface mở rộng từ KoiProfile gốc 
interface KoiProfile extends BaseKoiProfile {
  competitionHistory?: CompetitionEntry[];
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
  const [error, setError] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<"Image" | "Video">("Image");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [mediaItems, setMediaItems] = useState<KoiMedia[]>([]);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  
  // State cho fullscreen
  const [fullscreenVisible, setFullscreenVisible] = useState<boolean>(false);
  const [fullscreenMedia, setFullscreenMedia] = useState<string | null>(null);
  const [fullscreenMediaType, setFullscreenMediaType] = useState<"Image" | "Video">("Image");
  const [isFullscreenPlaying, setIsFullscreenPlaying] = useState<boolean>(false);

  // Cấu hình để theo dõi item đang hiển thị
  const viewabilityConfig = { itemVisiblePercentThreshold: 50 };

  // Tạo video player cho video đang được xem
  const videoPlayer = useVideoPlayer(
    selectedMedia && selectedMediaType === "Video" ? selectedMedia : null,
    player => {
      player.loop = false;
    }
  );

  // Tạo video player cho fullscreen
  const fullscreenVideoPlayer = useVideoPlayer(
    fullscreenMedia && fullscreenMediaType === "Video" ? fullscreenMedia : null,
    player => {
      player.loop = false;
    }
  );

  // Xử lý khi item hiện tại thay đổi
  const onViewableItemsChanged = useRef(({ 
    viewableItems 
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
  }).current;

  // Lắng nghe sự kiện playingChange cho video
  useEffect(() => {
    const subscription = videoPlayer.addListener('playingChange', (event) => {
      setIsPlaying(!!event.isPlaying);
    });

    return () => {
      subscription.remove();
    };
  }, [videoPlayer]);

  // Lắng nghe sự kiện playingChange cho fullscreen video
  useEffect(() => {
    const subscription = fullscreenVideoPlayer.addListener('playingChange', (event) => {
      setIsFullscreenPlaying(!!event.isPlaying);
    });

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

  useEffect(() => {
    const fetchKoiData = async () => {
      try {
        if (!koiId) {
          setError("Không tìm thấy ID cá Koi");
          setIsLoading(false);
          return;
        }

        console.log("Đang tải thông tin cá Koi với ID:", koiId);
        const response = await getKoiProfileById(koiId);
        
        if (response.statusCode === 200) {
          console.log("Nhận được dữ liệu cá Koi:", response.data);
          setKoiData(response.data);
          
          // Lưu trữ tất cả media
          if (response.data.koiMedia && response.data.koiMedia.length > 0) {
            setMediaItems(response.data.koiMedia);
            // Chọn media đầu tiên để hiển thị
            const firstItem = response.data.koiMedia[0];
            setSelectedMedia(firstItem.mediaUrl);
            setSelectedMediaType(firstItem.mediaType);
          }
        } else {
          setError(`Không thể tải thông tin cá Koi: ${response.message}`);
        }
      } catch (err) {
        console.error("Lỗi khi tải thông tin cá Koi:", err);
        setError("Đã xảy ra lỗi khi tải thông tin cá Koi");
      } finally {
        setIsLoading(false);
      }
    };

    fetchKoiData();
  }, [koiId]);

  const handleMediaPress = (mediaUrl: string, mediaType: "Image" | "Video") => {
    setFullscreenMedia(mediaUrl);
    setFullscreenMediaType(mediaType);
    setFullscreenVisible(true);
  };

  const getMediaByType = (type: "Image" | "Video"): KoiMedia[] => {
    if (!koiData || !koiData.koiMedia) return [];
    return koiData.koiMedia.filter(media => media.mediaType === type);
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

  // Render item cho carousel media
  const renderMediaItem = ({ item, index }: { item: KoiMedia; index: number }) => (
    <View style={[styles.mediaSlide]}>
      {item.mediaType === "Image" ? (
        <TouchableOpacity 
          style={styles.mediaTouchable}
          onPress={() => handleMediaPress(item.mediaUrl, "Image")}
        >
          <Image
            source={{ uri: item.mediaUrl }}
            style={styles.mediaImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.3)']}
            style={styles.mediaGradient}
          />
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
            colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.3)']}
            style={styles.mediaGradient}
          />
          <TouchableOpacity
            style={styles.videoControls}
            onPress={handlePlayPause}
          >
            {!isPlaying && (
              <Image
                source={{
                  uri: "https://dashboard.codeparrot.ai/api/image/Z79CVK7obB3a4bxY/frame-8.png",
                }}
                style={styles.playIcon}
              />
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

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
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z8MggG37P2WCQpLp/frame.png",
            }}
            style={styles.backButtonIcon}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin cá Koi</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Media Carousel sử dụng FlatList */}
        {mediaItems.length > 0 && (
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
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.contentContainer}>
          {/* Tiêu đề và trạng thái */}
          <Text style={styles.koiName}>{koiData.name}</Text>
          <Text style={styles.statusText}>Trạng thái: {koiData.status}</Text>
          
          {/* Thông tin chi tiết */}
          <Text style={styles.sectionTitle}>Thông tin chi tiết</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Giống:</Text>
                <Text style={styles.detailValue}>{koiData.variety?.name}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Kích thước:</Text>
                <Text style={styles.detailValue}>{koiData.size} cm</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Tuổi:</Text>
                <Text style={styles.detailValue}>{koiData.age} năm</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Giới tính:</Text>
                <Text style={styles.detailValue}>{koiData.gender}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Dòng máu:</Text>
                <Text style={styles.detailValue}>{koiData.bloodline}</Text>
              </View>
              {koiData.createdAt && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Ngày tạo:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(koiData.createdAt).toLocaleDateString('vi-VN')}
                  </Text>
                </View>
              )}
            </View>
            
            {koiData.variety?.description && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionLabel}>Mô tả:</Text>
                <Text style={styles.descriptionText}>{koiData.variety?.description}</Text>
              </View>
            )}
          </View>

          {/* Phần hình ảnh và video */}
          <Text style={styles.sectionTitle}>Hình ảnh & Video</Text>
          <View style={styles.mediaSection}>
            {images.length > 0 && (
              <View style={styles.mediaCategory}>
                <Text style={styles.mediaCategoryTitle}>Hình ảnh ({images.length})</Text>
                <FlatList
                  data={images}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.thumbnailContainer}
                      onPress={() => handleMediaPress(item.mediaUrl, "Image")}>
                      <Image 
                        source={{ uri: item.mediaUrl }} 
                        style={styles.mediaThumbnail} 
                      />
                    </TouchableOpacity>
                  )}
                  contentContainerStyle={styles.mediaThumbnailList}
                />
              </View>
            )}
            
            {videos.length > 0 && (
              <View style={styles.mediaCategory}>
                <Text style={styles.mediaCategoryTitle}>Video ({videos.length})</Text>
                <FlatList
                  data={videos}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity
                      style={styles.thumbnailContainer}
                      onPress={() => handleMediaPress(item.mediaUrl, "Video")}>
                      <View style={styles.videoThumbnail}>
                        <Text style={styles.videoLabel}>Video {index + 1}</Text>
                        <Image 
                          source={{
                            uri: "https://dashboard.codeparrot.ai/api/image/Z79CVK7obB3a4bxY/frame-8.png",
                          }}
                          style={styles.playIconSmall}
                        />
                      </View>
                    </TouchableOpacity>
                  )}
                  contentContainerStyle={styles.mediaThumbnailList}
                />
              </View>
            )}
          </View>

          {/* Hiển thị lịch sử thi đấu nếu có */}
          {koiData.competitionHistory && koiData.competitionHistory.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Lịch sử thi đấu</Text>
              <View style={styles.competitionList}>
                {koiData.competitionHistory.map((competition, index) => (
                  <View key={index} style={styles.competitionCard}>
                    <Text style={styles.competitionTitle}>
                      {competition.year} - {competition.showName}
                    </Text>
                    <Text style={styles.competitionDetail}>
                      <Text style={styles.competitionLabel}>Địa điểm:</Text> {competition.location}
                    </Text>
                    <Text style={styles.competitionDetail}>
                      <Text style={styles.competitionLabel}>Kết quả:</Text> {competition.result}
                    </Text>
                    <View style={styles.competitionStatusContainer}>
                      <Text style={[
                        styles.competitionStatus,
                        competition.showStatus === "upcoming" ? styles.statusUpcoming : styles.statusFinished
                      ]}>
                        {competition.showStatus === "upcoming" ? "Sắp diễn ra" : "Đã kết thúc"}
                      </Text>
                      <TouchableOpacity style={styles.viewDetailsButton}>
                        <Text style={styles.viewDetailsText}>Xem chi tiết</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Full Screen Modal */}
      <Modal
        visible={fullscreenVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullscreenVisible(false)}
      >
        <SafeAreaView style={styles.fullscreenModal}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              if (fullscreenMediaType === "Video") {
                fullscreenVideoPlayer.pause();
              }
              setFullscreenVisible(false);
            }}
          >
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
              <View style={styles.fullscreenVideoControls}>
                <TouchableOpacity
                  style={styles.fullscreenPlayButton}
                  onPress={handleFullscreenPlayPause}
                >
                  <Text style={styles.fullscreenPlayButtonText}>
                    {isFullscreenPlaying ? "Tạm dừng" : "Phát video"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => router.push("/")}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z8MggG37P2WCQpLp/frame-4.png",
            }}
            style={styles.footerIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/UserProfile")}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z8MggG37P2WCQpLp/frame-5.png",
            }}
            style={styles.footerIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/KoiList")}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z8MggG37P2WCQpLp/frame-6.png",
            }}
            style={styles.footerIcon}
          />
        </TouchableOpacity>
      </View>
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
    height: 60,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginTop: 15,
  },
  backButtonContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonIcon: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    marginLeft: 16,
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: "#000000",
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4B5563',
    fontFamily: 'Poppins_400Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#e53e3e',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Poppins_400Regular',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    elevation: 2,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
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
    backgroundColor: '#000',
    position: "relative",
  },
  mediaVideo: {
    width: "100%",
    height: "100%",
  },
  videoControls: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontFamily: 'Poppins_700Bold',
    color: "#000000",
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: "#4B5563",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
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
    fontFamily: 'Poppins_400Regular',
    color: "#6B7280",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
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
    fontFamily: 'Poppins_400Regular',
    color: "#6B7280",
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
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
    fontFamily: 'Poppins_400Regular',
    color: "#4B5563",
    marginBottom: 12,
  },
  mediaThumbnailList: {
    paddingRight: 16,
  },
  thumbnailContainer: {
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
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
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'Poppins_400Regular',
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
    fontFamily: 'Poppins_700Bold',
    color: "#1F2937",
    marginBottom: 8,
  },
  competitionDetail: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: "#4B5563",
    marginBottom: 4,
  },
  competitionLabel: {
    fontFamily: 'Poppins_700Bold',
    color: "#4B5563",
  },
  competitionStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  competitionStatus: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusUpcoming: {
    backgroundColor: '#EBF5FF',
    color: '#007AFF',
  },
  statusFinished: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
  },
  viewDetailsButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  viewDetailsText: {
    fontSize: 13,
    color: '#007AFF',
    fontFamily: 'Poppins_400Regular',
  },

  // Fullscreen Modal
  fullscreenModal: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
  },
  fullscreenImage: {
    width: screenWidth,
    height: screenHeight * 0.8,
  },
  fullscreenVideoContainer: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenVideo: {
    width: '100%',
    height: '80%',
  },
  fullscreenVideoControls: {
    position: 'absolute',
    bottom: 80,
    width: '100%',
    alignItems: 'center',
  },
  fullscreenPlayButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  fullscreenPlayButtonText: {
    color: 'white',
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
  },

  // Footer
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 60,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  footerIcon: {
    width: 28,
    height: 28,
  },
});
