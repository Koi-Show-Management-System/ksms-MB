import { ResizeMode, Video } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Modal,
  StatusBar as RNStatusBar,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  getShowMemberDetail,
  ShowDetailRegistration,
} from "../../services/competitionService";
import { translateStatus } from "../../utils/statusTranslator"; // Import hàm dịch mới

// Lấy kích thước màn hình
const { width } = Dimensions.get("window");

// Thêm interface cho AwardInfo (Đảm bảo nó khớp với định nghĩa trong competitionService.ts)
interface AwardInfo {
  categoryName: string;
  awardType: string;
  awardName: string;
  prizeValue: number;
}

// --- Fish Profile Header ---
interface FishProfileHeaderProps {
  fishName: string;
  fishImage: string;
}

const FishProfileHeader: React.FC<FishProfileHeaderProps> = ({
  fishName,
  fishImage,
}) => {
  return (
    <View style={styles.headerContainer}>
      <ImageBackground
        source={{ uri: fishImage }}
        style={styles.headerFishImage}
        resizeMode="cover">
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.7)"]}
          style={styles.headerGradient}>
          <Text style={styles.headerFishName}>{fishName}</Text>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
};

// --- Fish Details ---
interface FishDetailsProps {
  breed: string;
  size: string;
  age?: string;
  gender?: string;
  bloodline?: string;
  category: string;
  registrationNumber?: string | null;
}

const FishDetails: React.FC<FishDetailsProps> = ({
  breed,
  size,
  age,
  gender,
  bloodline,
  category,
  registrationNumber,
}) => {
  return (
    <View style={styles.detailsContainer}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIndicator} />
        <Text style={styles.sectionTitle}>Thông tin cá Koi</Text>
      </View>

      <View style={styles.detailsContent}>
        {registrationNumber && (
          <View style={styles.detailRow}>
            <View style={styles.detailItemFull}>
              <Text style={styles.detailLabel}>Số báo danh:</Text>
              <Text style={styles.detailValue}>{registrationNumber}</Text>
            </View>
          </View>
        )}

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Giống:</Text>
            <Text style={styles.detailValue}>
              {breed || "Chưa có thông tin"}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Kích thước:</Text>
            <Text style={styles.detailValue}>
              {size ? `${size} cm` : "Chưa có thông tin"}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Tuổi:</Text>
            <Text style={styles.detailValue}>
              {age ? `${age} tháng` : "Chưa có thông tin"}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Giới tính:</Text>
            <Text style={styles.detailValue}>
              {gender || "Chưa có thông tin"}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItemFull}>
            <Text style={styles.detailLabel}>Hạng mục:</Text>
            <Text style={styles.detailValue}>
              {category || "Chưa có thông tin"}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItemFull}>
            <Text style={styles.detailLabel}>Dòng máu:</Text>
            <Text style={styles.detailValue}>
              {bloodline || "Chưa có thông tin"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// --- Current Status ---
interface CurrentStatusProps {
  status: string;
  currentRound?: string;
  awards?: AwardInfo[]; // Sử dụng kiểu dữ liệu đã cập nhật
  rank?: number;
  totalParticipants?: number;
  eliminatedAtRound?: string;
  rejectedReason?: string;
  refundType?: string;
}

const CurrentStatus: React.FC<CurrentStatusProps> = ({
  status,
  currentRound,
  awards,
  rank,
  totalParticipants,
  eliminatedAtRound,
  rejectedReason,
  refundType,
}) => {
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case "pending":
        return "#FFA500"; // Cam
      case "confirmed":
        return "#4A90E2"; // Xanh dương
      case "competition":
        return "#34D399"; // Xanh lá cây nhạt
      case "prizewinner":
        return "#22C55E"; // Xanh lá cây đậm
      case "completed":
        return "#6B7280"; // Xám
      case "cancelled":
        return "#EF4444"; // Đỏ
      case "rejected":
        return "#EF4444"; // Đỏ
      case "eliminated":
        return "#F97316"; // Cam đậm
      default:
        return "#666666"; // Xám mặc định
    }
  };

  const hasCompetitionInfo =
    currentRound || (awards && awards.length > 0) || rank || eliminatedAtRound;

  return (
    <View style={styles.statusContainer}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIndicator} />
        <Text style={styles.sectionTitle}>Trạng thái & Kết quả</Text>
      </View>

      <View style={styles.statusContent}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(status) },
          ]}>
          <Text style={styles.statusText}>{translateStatus(status)}</Text>
        </View>

        {rejectedReason && (
          <View style={styles.statusInfoRow}>
            <Text style={styles.statusLabel}>Lý do từ chối:</Text>
            <Text style={[styles.statusValue, { color: "#EF4444" }]}>
              {rejectedReason}
            </Text>
          </View>
        )}

        {refundType && (
          <View style={styles.statusInfoRow}>
            <Text style={styles.statusLabel}>Loại hoàn tiền:</Text>
            <Text style={styles.statusValue}>
              {translateStatus(refundType)}
            </Text>
          </View>
        )}

        {currentRound &&
        !["eliminated", "prizewinner"].includes(status.toLowerCase()) ? (
          <View style={styles.statusInfoRow}>
            <Text style={styles.statusLabel}>Vòng hiện tại:</Text>
            <Text style={styles.statusValue}>{currentRound}</Text>
          </View>
        ) : (
          ![
            "eliminated",
            "prizewinner",
            "cancelled",
            "rejected",
            "pending",
          ].includes(status.toLowerCase()) && (
            <View style={styles.statusInfoRow}>
              <Text style={styles.statusLabel}>Vòng hiện tại:</Text>
              <Text style={styles.statusValueNeutral}>Chưa bắt đầu</Text>
            </View>
          )
        )}

        {rank !== null && rank !== undefined ? (
          <View style={styles.statusInfoRow}>
            <Text style={styles.statusLabel}>Xếp hạng:</Text>
            <Text style={styles.statusValue}>{rank}</Text>
          </View>
        ) : status.toLowerCase() === "completed" ||
          status.toLowerCase() === "eliminated" ||
          status.toLowerCase() === "prizewinner" ? (
          <View style={styles.statusInfoRow}>
            <Text style={styles.statusLabel}>Xếp hạng:</Text>
            <Text style={styles.statusValueNeutral}>Không có thông tin</Text>
          </View>
        ) : null}

        {/* Hiển thị danh sách giải thưởng */}
        {awards && awards.length > 0 ? (
          <View style={styles.awardsListContainer}>
            <View style={styles.awardListHeader}>
              <Image
                source={{
                  uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/frame.png",
                }}
                style={styles.awardIcon}
              />
              <Text style={styles.awardListTitle}>Giải thưởng đạt được:</Text>
            </View>
            {awards.map((awardItem, index) => (
              <View key={index} style={styles.awardItem}>
                <Text style={styles.awardItemName}>{awardItem.awardName}</Text>
                {awardItem.categoryName && (
                  <Text style={styles.awardItemCategory}>
                    Hạng mục: {awardItem.categoryName}
                  </Text>
                )}
                {awardItem.prizeValue > 0 && (
                  <Text style={styles.awardItemValue}>
                    Trị giá:{" "}
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(awardItem.prizeValue)}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ) : status.toLowerCase() === "completed" ||
          status.toLowerCase() === "prizewinner" ? (
          <View style={styles.noAwardContainer}>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/frame.png",
              }}
              style={[styles.awardIcon, { tintColor: "#888888" }]}
            />
            <Text style={styles.noAwardText}>Không đạt giải thưởng</Text>
          </View>
        ) : null}

        {eliminatedAtRound && (
          <View style={styles.eliminatedContainer}>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/eliminated-icon.png",
              }}
              style={styles.eliminatedIcon}
            />
            <View>
              <Text style={styles.eliminatedLabel}>Bị loại tại vòng:</Text>
              <Text style={styles.eliminatedValue}>{eliminatedAtRound}</Text>
            </View>
          </View>
        )}

        {!hasCompetitionInfo &&
          status.toLowerCase() !== "pending" &&
          status.toLowerCase() !== "confirmed" &&
          status.toLowerCase() !== "rejected" &&
          status.toLowerCase() !== "cancelled" && (
            <Text style={styles.noInfoText}>
              Chưa có thông tin về kết quả thi đấu
            </Text>
          )}
      </View>
    </View>
  );
};

// --- Payment Information ---
interface PaymentInfoProps {
  paymentMethod?: string;
  paidAmount?: number;
  paymentDate?: string;
  transactionCode?: string;
  qrcodeData?: string | null;
  status?: string;
}

const PaymentInfo: React.FC<PaymentInfoProps> = ({
  paymentMethod,
  paidAmount,
  paymentDate,
  transactionCode,
  qrcodeData,
  status,
}) => {
  if (!paymentMethod && !paidAmount && !status) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Chưa có thông tin";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formattedAmount = paidAmount
    ? new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(paidAmount)
    : "Chưa có thông tin";

  const getPaymentStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case "paid":
        return "#22C55E";
      case "pending":
        return "#FFA500";
      case "cancelled":
      case "failed":
        return "#E74C3C";
      default:
        return "#888888";
    }
  };

  return (
    <View style={styles.paymentContainer}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIndicator} />
        <Text style={styles.sectionTitle}>Thông tin thanh toán</Text>
      </View>
      <View style={styles.paymentContent}>
        {status && (
          <View style={styles.paymentStatusContainer}>
            <View
              style={[
                styles.paymentStatusBadge,
                { backgroundColor: getPaymentStatusColor(status) },
              ]}>
              <Text style={styles.paymentStatusText}>
                {translateStatus(status)}
              </Text>
            </View>
          </View>
        )}
        <View style={styles.paymentRow}>
          <Text style={styles.paymentLabel}>Phương thức:</Text>
          <Text style={styles.paymentValue}>
            {paymentMethod || "Chưa có thông tin"}
          </Text>
        </View>
        <View style={styles.paymentRow}>
          <Text style={styles.paymentLabel}>Số tiền:</Text>
          <Text style={styles.paymentValue}>{formattedAmount}</Text>
        </View>
        <View style={styles.paymentRow}>
          <Text style={styles.paymentLabel}>Ngày thanh toán:</Text>
          <Text style={styles.paymentValue}>{formatDate(paymentDate)}</Text>
        </View>
        <View style={styles.paymentRow}>
          <Text style={styles.paymentLabel}>Mã giao dịch:</Text>
          <Text style={styles.paymentValue}>
            {transactionCode || "Chưa có thông tin"}
          </Text>
        </View>
        {qrcodeData && (
          <View style={styles.qrcodeContainer}>
            <Text style={styles.qrcodeLabel}>Mã QR Check-in:</Text>
            <Image
              source={{ uri: qrcodeData }}
              style={styles.qrcodeImage}
              resizeMode="contain"
            />
            <Text style={styles.qrcodeNote}>
              Vui lòng kiểm tra lịch trình để tham gia check-in đúng giờ
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

// --- Media Gallery ---
interface MediaGalleryProps {
  media?: Array<{ id: string; mediaUrl: string; mediaType: string }>;
}

const MediaGallery: React.FC<MediaGalleryProps> = ({ media }) => {
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [allVideos, setAllVideos] = useState<
    Array<{ id: string; mediaUrl: string; mediaType: string }>
  >([]);
  const videoRef = useRef(null);

  if (!media || media.length === 0) {
    return (
      <View style={styles.galleryContainer}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIndicator} />
          <Text style={styles.sectionTitle}>Thư viện ảnh & video</Text>
        </View>
        <View style={styles.emptyMediaContainer}>
          <Text style={styles.emptyMediaText}>Chưa có ảnh hoặc video nào</Text>
        </View>
      </View>
    );
  }

  const videos = media.filter((item) => item.mediaType === "Video");
  const images = media.filter((item) => item.mediaType === "Image");

  const handleOpenVideo = (videoUrl: string) => {
    const videoIndex = videos.findIndex((v) => v.mediaUrl === videoUrl);
    if (videoIndex !== -1) {
      setSelectedVideo(videoUrl);
      setActiveVideoIndex(videoIndex);
      setAllVideos(videos);
      setVideoModalVisible(true);
    }
  };
  const handleCloseVideoModal = () => {
    setVideoModalVisible(false);
    setSelectedVideo(null);
  };
  const handleSelectVideo = (videoUrl: string, index: number) => {
    setSelectedVideo(videoUrl);
    setActiveVideoIndex(index);
  };
  const handleNextVideo = () => {
    if (videos.length > 1 && activeVideoIndex < videos.length - 1) {
      const nextIndex = activeVideoIndex + 1;
      setSelectedVideo(videos[nextIndex].mediaUrl);
      setActiveVideoIndex(nextIndex);
    }
  };
  const handlePreviousVideo = () => {
    if (videos.length > 1 && activeVideoIndex > 0) {
      const prevIndex = activeVideoIndex - 1;
      setSelectedVideo(videos[prevIndex].mediaUrl);
      setActiveVideoIndex(prevIndex);
    }
  };

  const handleOpenImage = (imageUrl: string) => {
    const imageIndex = images.findIndex((img) => img.mediaUrl === imageUrl);
    if (imageIndex !== -1) {
      setSelectedImage(imageUrl);
      setActiveImageIndex(imageIndex);
      setImageModalVisible(true);
    }
  };
  const handleCloseImageModal = () => {
    setImageModalVisible(false);
    setSelectedImage(null);
  };
  const handleSelectImage = (imageUrl: string, index: number) => {
    setSelectedImage(imageUrl);
    setActiveImageIndex(index);
  };
  const handleNextImage = () => {
    if (images.length > 1 && activeImageIndex < images.length - 1) {
      const nextIndex = activeImageIndex + 1;
      setSelectedImage(images[nextIndex].mediaUrl);
      setActiveImageIndex(nextIndex);
    }
  };
  const handlePreviousImage = () => {
    if (images.length > 1 && activeImageIndex > 0) {
      const prevIndex = activeImageIndex - 1;
      setSelectedImage(images[prevIndex].mediaUrl);
      setActiveImageIndex(prevIndex);
    }
  };

  return (
    <View style={styles.galleryContainer}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIndicator} />
        <Text style={styles.sectionTitle}>Thư viện ảnh & video</Text>
        <Text style={styles.mediaCount}>({media.length})</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.galleryScroll}
        contentContainerStyle={styles.galleryScrollContent}>
        {media.map((item, index) => (
          <TouchableOpacity
            key={item.id || index}
            style={styles.galleryItem}
            onPress={() => {
              if (item.mediaType === "Video") handleOpenVideo(item.mediaUrl);
              else handleOpenImage(item.mediaUrl);
            }}>
            <Image
              source={{ uri: item.mediaUrl }}
              style={styles.galleryImage}
              resizeMode="cover"
            />
            {item.mediaType === "Video" && (
              <View style={styles.videoIndicator}>
                <Image
                  source={{
                    uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/play-icon.png",
                  }}
                  style={styles.playIcon}
                />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Video Player Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={videoModalVisible}
        onRequestClose={handleCloseVideoModal}>
        <View style={styles.videoModalContainer}>
          <View style={styles.videoModalHeader}>
            <TouchableOpacity
              style={styles.videoModalCloseButton}
              onPress={handleCloseVideoModal}>
              <Text style={styles.videoModalCloseText}>Đóng</Text>
            </TouchableOpacity>
            <Text style={styles.videoModalTitle}>
              Video {activeVideoIndex + 1}/{videos.length}
            </Text>
            <View style={styles.videoModalPlaceholder} />
          </View>
          <View style={styles.videoPlayerContainer}>
            {selectedVideo && (
              <>
                <Video
                  ref={videoRef}
                  style={styles.videoPlayer}
                  source={{ uri: selectedVideo }}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  isLooping={false}
                />
                {videos.length > 1 && (
                  <View style={styles.videoNavigation}>
                    <TouchableOpacity
                      style={[
                        styles.videoNavButton,
                        activeVideoIndex === 0 && styles.videoNavButtonDisabled,
                      ]}
                      onPress={handlePreviousVideo}
                      disabled={activeVideoIndex === 0}>
                      <Text style={styles.videoNavButtonText}>{"<"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.videoNavButton,
                        activeVideoIndex === videos.length - 1 &&
                          styles.videoNavButtonDisabled,
                      ]}
                      onPress={handleNextVideo}
                      disabled={activeVideoIndex === videos.length - 1}>
                      <Text style={styles.videoNavButtonText}>{">"}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
          {videos.length > 1 && (
            <View style={styles.videoListContainer}>
              <Text style={styles.videoListTitle}>
                Tất cả video ({videos.length})
              </Text>
              <FlatList
                data={videos}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={[
                      styles.videoThumbContainer,
                      activeVideoIndex === index && styles.videoThumbActive,
                    ]}
                    onPress={() => handleSelectVideo(item.mediaUrl, index)}>
                    <View
                      style={[
                        styles.videoThumb,
                        activeVideoIndex === index &&
                          styles.videoThumbActiveBorder,
                      ]}>
                      <Image
                        source={{ uri: item.mediaUrl }}
                        style={styles.videoThumbImage}
                        resizeMode="cover"
                      />
                      <Image
                        source={{
                          uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/play-icon.png",
                        }}
                        style={styles.videoPlayIconSmall}
                      />
                    </View>
                    <Text style={styles.videoThumbLabel}>
                      Video {index + 1}
                    </Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item, index) => item.id || index.toString()}
              />
            </View>
          )}
        </View>
      </Modal>

      {/* Image Viewer Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={imageModalVisible}
        onRequestClose={handleCloseImageModal}>
        <View style={styles.imageModalContainer}>
          <View style={styles.imageModalHeader}>
            <TouchableOpacity
              style={styles.imageModalCloseButton}
              onPress={handleCloseImageModal}>
              <Text style={styles.imageModalCloseText}>Đóng</Text>
            </TouchableOpacity>
            <Text style={styles.imageModalTitle}>
              Ảnh {activeImageIndex + 1}/{images.length}
            </Text>
            <View style={styles.imageModalPlaceholder} />
          </View>
          <View style={styles.imageViewerContainer}>
            {selectedImage && (
              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
                {images.length > 1 && (
                  <View style={styles.imageNavigation}>
                    <TouchableOpacity
                      style={[
                        styles.imageNavButton,
                        activeImageIndex === 0 && styles.imageNavButtonDisabled,
                      ]}
                      onPress={handlePreviousImage}
                      disabled={activeImageIndex === 0}>
                      <Text style={styles.imageNavButtonText}>{"<"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.imageNavButton,
                        activeImageIndex === images.length - 1 &&
                          styles.imageNavButtonDisabled,
                      ]}
                      onPress={handleNextImage}
                      disabled={activeImageIndex === images.length - 1}>
                      <Text style={styles.imageNavButtonText}>{">"}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
          {images.length > 1 && (
            <View style={styles.imageListContainer}>
              <Text style={styles.imageListTitle}>
                Tất cả ảnh ({images.length})
              </Text>
              <FlatList
                data={images}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={[
                      styles.imageThumbContainer,
                      activeImageIndex === index && styles.imageThumbActive,
                    ]}
                    onPress={() => handleSelectImage(item.mediaUrl, index)}>
                    <View
                      style={[
                        styles.imageThumb,
                        activeImageIndex === index &&
                          styles.imageThumbActiveBorder,
                      ]}>
                      <Image
                        source={{ uri: item.mediaUrl }}
                        style={styles.imageThumbImage}
                        resizeMode="cover"
                      />
                    </View>
                    <Text style={styles.imageThumbLabel}>Ảnh {index + 1}</Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item, index) => item.id || index.toString()}
              />
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

// --- Main Component ---
const FishStatus: React.FC = () => {
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fishData, setFishData] = useState<ShowDetailRegistration | null>(null);
  const [totalParticipants, setTotalParticipants] = useState<
    number | undefined
  >(undefined);

  const showId = params.showId as string;
  const registrationId = params.registrationId as string;

  useEffect(() => {
    const fetchFishData = async () => {
      try {
        setLoading(true);
        if (!showId) throw new Error("Không tìm thấy ID cuộc thi");

        const data = await getShowMemberDetail(showId);
        const registration = data.registrations.find(
          (reg) => reg.registrationId === registrationId
        );

        if (!registration)
          throw new Error("Không tìm thấy thông tin đăng ký của cá Koi này");

        setFishData(registration);
        const categoryRegistrations = data.registrations.filter(
          (r) => r.categoryId === registration.categoryId
        );
        setTotalParticipants(categoryRegistrations.length);
        setError(null);
      } catch (err: any) {
        console.error("Lỗi khi lấy thông tin chi tiết cá:", err);
        setError(err.message || "Có lỗi xảy ra khi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    fetchFishData();
  }, [showId, registrationId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        {/* Header đơn giản cho loading */}
        <View style={styles.simpleHeader}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/back-icon.png",
              }}
              style={[styles.headerIcon, { tintColor: "#333" }]}
            />
          </TouchableOpacity>
          <Text style={styles.simpleHeaderTitle}>Chi tiết cá Koi</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !fishData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        {/* Header đơn giản cho error */}
        <View style={styles.simpleHeader}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/back-icon.png",
              }}
              style={[styles.headerIcon, { tintColor: "#333" }]}
            />
          </TouchableOpacity>
          <Text style={styles.simpleHeaderTitle}>Chi tiết cá Koi</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.errorContainer}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/error-icon.png",
            }}
            style={styles.errorIcon}
          />
          <Text style={styles.errorTitle}>Đã xảy ra lỗi</Text>
          <Text style={styles.errorText}>
            {error || "Không tìm thấy dữ liệu"}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const fishImage =
    fishData.media.find((item) => item.mediaType === "Image")?.mediaUrl ||
    "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/default-koi-image.png";

  return (
    // Bỏ View ngoài cùng không cần thiết
    <SafeAreaView style={styles.safeArea}>
      {/* Đặt StatusBar ở đây */}
      <StatusBar style="dark" />
      {/* Header chuẩn, không absolute */}
      <View style={styles.simpleHeader}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/back-icon.png",
            }}
            style={[styles.headerIcon, { tintColor: "#333" }]}
          />
        </TouchableOpacity>
        <Text style={styles.simpleHeaderTitle}>Chi tiết cá Koi</Text>
        <View style={styles.headerButton} />
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}>
        {/* Nội dung cuộn bắt đầu từ đây */}
        <FishProfileHeader
          fishName={fishData.koiName || "Cá Koi"}
          fishImage={fishImage}
        />
        <FishDetails
          breed={fishData.variety}
          size={fishData.size.toString()}
          age={fishData.age ? fishData.age.toString() : undefined}
          gender={fishData.gender || undefined}
          bloodline={fishData.bloodLine || undefined}
          category={fishData.categoryName}
          registrationNumber={fishData.registrationNumber}
        />
        <CurrentStatus
          status={fishData.status}
          currentRound={fishData.currentRound || undefined}
          awards={fishData.awards}
          rank={fishData.rank !== null ? fishData.rank : undefined}
          totalParticipants={totalParticipants}
          eliminatedAtRound={fishData.eliminatedAtRound || undefined}
          rejectedReason={fishData.rejectedReason || undefined}
          refundType={fishData.refundType || undefined}
        />
        <PaymentInfo
          paymentMethod={fishData.payment?.paymentMethod}
          paidAmount={fishData.payment?.paidAmount}
          paymentDate={fishData.payment?.paymentDate}
          transactionCode={fishData.payment?.transactionCode}
          qrcodeData={fishData.payment?.qrcodeData}
          status={fishData.payment?.status}
        />
        <MediaGallery media={fishData.media} />
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  // Bỏ style container không cần thiết
  // container: { ... },
  simpleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    backgroundColor: "#FFFFFF",
    // Không cần paddingTop vì SafeAreaView đã xử lý
  },
  simpleHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333333",
    textAlign: "center",
  },
  headerButton: {
    padding: 8,
    width: 40,
    alignItems: "center",
  },
  headerIcon: {
    width: 24,
    height: 24,
    // tintColor sẽ được override khi cần
  },
  // Bỏ các style của customHeader
  /* customHeader: { ... },
     customHeaderTitle: { ... }, */
  scrollViewContent: {
    paddingBottom: 30, // Giữ lại padding bottom nếu cần khoảng trống ở cuối
  },
  headerContainer: {
    width: "100%",
  },
  headerFishImage: {
    width: "100%",
    height: 280,
  },
  headerGradient: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 20,
  },
  headerFishName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionIndicator: {
    width: 4,
    height: 20,
    backgroundColor: "#4A90E2",
    borderRadius: 2,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333333",
  },
  detailsContainer: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: -20, // Đã sửa giá trị này
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 16,
  },
  detailsContent: {
    marginTop: 12,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 14,
  },
  detailItem: {
    flex: 1,
    paddingRight: 10,
  },
  detailItemFull: {
    width: "100%",
  },
  detailLabel: {
    fontSize: 13,
    color: "#888888",
    marginBottom: 5,
    textTransform: "uppercase",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 15,
    color: "#333333",
    fontWeight: "600",
  },
  statusContainer: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  statusContent: {
    alignItems: "stretch",
    marginTop: 12,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  statusText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
    textTransform: "uppercase",
  },
  statusInfoRow: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 12,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 0,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  statusLabel: {
    fontSize: 14,
    color: "#666666",
    marginRight: 8,
  },
  statusValue: {
    fontSize: 14,
    color: "#333333",
    fontWeight: "600",
    textAlign: "right",
    flexShrink: 1,
  },
  statusValueNeutral: {
    fontSize: 14,
    color: "#888888",
    fontWeight: "500",
    textAlign: "right",
    flexShrink: 1,
  },
  awardsListContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  awardListHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  awardIcon: {
    width: 22,
    height: 22,
    marginRight: 10,
    tintColor: "#B8860B",
  },
  awardListTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  awardItem: {
    backgroundColor: "#FFFAF0",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 5,
    borderLeftColor: "#F59E0B",
  },
  awardItemName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#D97706",
    marginBottom: 5,
  },
  awardItemCategory: {
    fontSize: 13,
    color: "#6B7280",
  },
  awardItemValue: {
    fontSize: 13,
    color: "#1F2937",
    marginTop: 6,
    fontWeight: "600",
  },
  noAwardContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    paddingVertical: 10,
    paddingHorizontal: 0,
  },
  noAwardText: {
    fontSize: 14,
    color: "#888888",
    fontStyle: "italic",
    marginLeft: 10,
  },
  eliminatedContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    paddingVertical: 10,
    paddingHorizontal: 0,
  },
  eliminatedIcon: {
    width: 22,
    height: 22,
    marginRight: 10,
    tintColor: "#EF4444",
  },
  eliminatedLabel: {
    fontSize: 14,
    color: "#666666",
  },
  eliminatedValue: {
    fontSize: 14,
    color: "#EF4444",
    fontWeight: "600",
  },
  noInfoText: {
    fontSize: 14,
    color: "#888888",
    fontStyle: "italic",
    marginTop: 20,
    textAlign: "center",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  paymentContainer: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  paymentContent: {
    marginTop: 12,
  },
  paymentStatusContainer: {
    alignItems: "flex-start",
    marginBottom: 20,
  },
  paymentStatusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  paymentStatusText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
    textTransform: "uppercase",
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  paymentLabel: {
    fontSize: 14,
    color: "#666666",
    marginRight: 8,
  },
  paymentValue: {
    fontSize: 14,
    color: "#333333",
    fontWeight: "500",
    textAlign: "right",
    flex: 1,
    marginLeft: 8,
  },
  qrcodeContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  qrcodeLabel: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "600",
    marginBottom: 12,
  },
  qrcodeImage: {
    width: "100%",
    aspectRatio: 1,
    height: undefined,
    borderRadius: 8,
  },
  qrcodeNote: {
    fontSize: 14,
    color: "#E74C3C",
    fontWeight: "500",
    marginTop: 12,
    textAlign: "center",
    fontStyle: "italic",
  },
  galleryContainer: {
    paddingVertical: 20,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  galleryScroll: {
    marginTop: 0,
  },
  galleryScrollContent: {
    paddingHorizontal: 0,
    paddingVertical: 10,
  },
  galleryItem: {
    width: 140,
    height: 140,
    borderRadius: 12,
    marginRight: 16,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
  },
  galleryImage: {
    width: "100%",
    height: "100%",
  },
  mediaCount: {
    fontSize: 14,
    color: "#666666",
    marginLeft: 8,
    fontWeight: "500",
  },
  videoIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 12,
  },
  playIcon: {
    width: 40,
    height: 40,
    tintColor: "rgba(255, 255, 255, 0.9)",
  },
  emptyMediaContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    marginTop: 16,
  },
  emptyMediaText: {
    fontSize: 15,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    backgroundColor: "#FFFFFF",
  },
  errorIcon: {
    width: 100,
    height: 100,
    marginBottom: 24,
    tintColor: "#EF4444",
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#EF4444",
    marginBottom: 12,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: "#4A90E2",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  videoModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
  },
  videoModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: (RNStatusBar.currentHeight || 0) + 10,
    paddingBottom: 16,
    backgroundColor: "#111111",
  },
  videoModalCloseButton: { padding: 8 },
  videoModalCloseText: { fontSize: 16, color: "#FFFFFF", fontWeight: "600" },
  videoModalTitle: { fontSize: 17, color: "#FFFFFF", fontWeight: "700" },
  videoModalPlaceholder: { width: 40 },
  videoPlayerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 150,
  },
  videoPlayer: { width: "100%", height: "100%" },
  videoListContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "rgba(17, 17, 17, 0.9)",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  videoListTitle: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
    marginBottom: 12,
  },
  videoThumbContainer: { marginRight: 12, alignItems: "center", width: 80 },
  videoThumbActive: { opacity: 1 /* Có thể thêm style khác nếu muốn */ },
  videoThumbActiveBorder: { borderColor: "#4A90E2" }, // Style viền khi active
  videoThumb: {
    width: 70,
    height: 70,
    backgroundColor: "#333333",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  videoThumbImage: { width: "100%", height: "100%" },
  videoPlayIconSmall: {
    position: "absolute",
    width: 20,
    height: 20,
    tintColor: "rgba(255, 255, 255, 0.8)",
  },
  videoThumbLabel: { fontSize: 11, color: "#CCCCCC", textAlign: "center" },
  videoNavigation: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  videoNavButton: {
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 30,
  },
  videoNavButtonDisabled: { opacity: 0.5 },
  videoNavButtonText: { fontSize: 20, color: "#FFFFFF", fontWeight: "bold" },
  imageModalContainer: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.95)" },
  imageModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: (RNStatusBar.currentHeight || 0) + 10,
    paddingBottom: 16,
    backgroundColor: "#111111",
  },
  imageModalCloseButton: { padding: 8 },
  imageModalCloseText: { fontSize: 16, color: "#FFFFFF", fontWeight: "600" },
  imageModalTitle: { fontSize: 17, color: "#FFFFFF", fontWeight: "700" },
  imageModalPlaceholder: { width: 40 },
  imageViewerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 150,
  },
  imageWrapper: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: { width: "100%", height: "100%" },
  imageNavigation: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  imageNavButton: {
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 30,
  },
  imageNavButtonDisabled: { opacity: 0.5 },
  imageNavButtonText: { fontSize: 20, color: "#FFFFFF", fontWeight: "bold" },
  imageListContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "rgba(17, 17, 17, 0.9)",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  imageListTitle: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
    marginBottom: 12,
  },
  imageThumbContainer: { marginRight: 12, alignItems: "center", width: 80 },
  imageThumbActive: {
    /* Có thể thêm style khác nếu muốn */
  },
  imageThumbActiveBorder: { borderColor: "#4A90E2" }, // Style viền khi active
  imageThumb: {
    width: 70,
    height: 70,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 6,
    borderWidth: 2,
    borderColor: "transparent",
  },
  imageThumbImage: {
    // Thêm style cho ảnh thumbnail image
    width: "100%",
    height: "100%",
  },
  imageThumbLabel: { fontSize: 11, color: "#CCCCCC", textAlign: "center" },
});

export default FishStatus;
