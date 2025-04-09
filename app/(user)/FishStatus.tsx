import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
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
  Modal,
  FlatList,
} from "react-native";
import { getShowMemberDetail, ShowDetailRegistration } from "../../services/competitionService";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Video, ResizeMode } from "expo-av";
import { translateStatus } from "../../utils/statusTranslator"; // Import hàm dịch mới
// Lấy kích thước màn hình
const { width } = Dimensions.get("window");

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
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
          style={styles.headerGradient}
        >
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
  registrationNumber
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
            <Text style={styles.detailValue}>{breed || 'Chưa có thông tin'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Kích thước:</Text>
            <Text style={styles.detailValue}>{size ? `${size} cm` : 'Chưa có thông tin'}</Text>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Tuổi:</Text>
            <Text style={styles.detailValue}>{age ? `${age} tháng` : 'Chưa có thông tin'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Giới tính:</Text>
            <Text style={styles.detailValue}>{gender || 'Chưa có thông tin'}</Text>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <View style={styles.detailItemFull}>
            <Text style={styles.detailLabel}>Hạng mục:</Text>
            <Text style={styles.detailValue}>{category || 'Chưa có thông tin'}</Text>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <View style={styles.detailItemFull}>
            <Text style={styles.detailLabel}>Dòng máu:</Text>
            <Text style={styles.detailValue}>{bloodline || 'Chưa có thông tin'}</Text>
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
  award?: string;
  rank?: number;
  totalParticipants?: number;
  eliminatedAtRound?: string;
  rejectedReason?: string;
  refundType?: string;
}

const CurrentStatus: React.FC<CurrentStatusProps> = ({ 
  status, 
  currentRound, 
  award, 
  rank,
  totalParticipants,
  eliminatedAtRound,
  rejectedReason,
  refundType
}) => {
  // Hàm getStatusText đã được thay thế bằng translateStatus import từ utils
  
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#FFA500';
      case 'confirmed':
        return '#22C55E';
      case 'competition':
        return '#4A90E2';
      case 'completed':
        return '#22C55E';
      case 'cancelled':
        return '#E74C3C';
      case 'rejected':
        return '#E74C3C';
      case 'eliminated':
        return '#FF6B6B';
      default:
        return '#666666';
    }
  };
  
  // Hàm getRefundTypeText đã được thay thế bằng translateStatus import từ utils
  
  const hasCompetitionInfo = currentRound || award || rank || eliminatedAtRound;
  
  return (
    <View style={styles.statusContainer}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIndicator} />
        <Text style={styles.sectionTitle}>Trạng thái hiện tại</Text>
      </View>
      
      <View style={styles.statusContent}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
          <Text style={styles.statusText}>{translateStatus(status)}</Text>
        </View>
        
        {rejectedReason && (
          <View style={styles.statusInfoRow}>
            <Text style={styles.statusLabel}>Lý do từ chối:</Text>
            <Text style={styles.statusValue}>{rejectedReason}</Text>
          </View>
        )}
        
        {refundType && (
          <View style={styles.statusInfoRow}>
            <Text style={styles.statusLabel}>Loại hoàn tiền:</Text>
            <Text style={styles.statusValue}>{translateStatus(refundType)}</Text>
          </View>
        )}
        
        {currentRound ? (
          <View style={styles.statusInfoRow}>
            <Text style={styles.statusLabel}>Vòng hiện tại:</Text>
            <Text style={styles.statusValue}>{currentRound}</Text>
          </View>
        ) : status.toLowerCase() !== 'cancelled' && status.toLowerCase() !== 'rejected' && (
          <View style={styles.statusInfoRow}>
            <Text style={styles.statusLabel}>Vòng hiện tại:</Text>
            <Text style={styles.statusValueNeutral}>Chưa có thông tin</Text>
          </View>
        )}
        
        {rank !== null && rank !== undefined ? (
          <View style={styles.statusInfoRow}>
            <Text style={styles.statusLabel}>Xếp hạng:</Text>
            <Text style={styles.statusValue}>
              {rank}{totalParticipants ? `/${totalParticipants}` : ''}
            </Text>
          </View>
        ) : status.toLowerCase() === 'completed' || status.toLowerCase() === 'eliminated' ? (
          <View style={styles.statusInfoRow}>
            <Text style={styles.statusLabel}>Xếp hạng:</Text>
            <Text style={styles.statusValueNeutral}>Chưa có thông tin xếp hạng</Text>
          </View>
        ) : null}
        
        {award ? (
          <View style={styles.awardContainer}>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/frame.png",
              }}
              style={styles.awardIcon}
            />
            <Text style={styles.awardText}>{award}</Text>
          </View>
        ) : status.toLowerCase() === 'completed' ? (
          <View style={styles.noAwardContainer}>
            <Text style={styles.noAwardText}>Không có giải thưởng</Text>
          </View>
        ) : null}

        {eliminatedAtRound && (
          <View style={styles.eliminatedContainer}>
            <Text style={styles.eliminatedLabel}>Bị loại tại:</Text>
            <Text style={styles.eliminatedValue}>{eliminatedAtRound}</Text>
          </View>
        )}
        
        {!hasCompetitionInfo && (
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
  status
}) => {
  if (!paymentMethod && !paidAmount && !status) return null;
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Chưa có thông tin';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const formattedAmount = paidAmount 
    ? new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(paidAmount)
    : 'Chưa có thông tin';
  
  return (
    <View style={styles.paymentContainer}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIndicator} />
        <Text style={styles.sectionTitle}>Thông tin thanh toán</Text>
      </View>
      
      <View style={styles.paymentContent}>
        <View style={styles.paymentRow}>
          <Text style={styles.paymentLabel}>Phương thức:</Text>
          <Text style={styles.paymentValue}>{paymentMethod || 'Chưa có thông tin'}</Text>
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
          <Text style={styles.paymentValue}>{transactionCode || 'Chưa có thông tin'}</Text>
        </View>
        
        {status && (
          <View style={styles.paymentStatusContainer}>
            <View style={[
              styles.paymentStatusBadge, 
              { backgroundColor: getPaymentStatusColor(status) }
            ]}>
              <Text style={styles.paymentStatusText}>
                {translateStatus(status)}
              </Text>
            </View>
          </View>
        )}
        
        {qrcodeData && (
          <View style={styles.qrcodeContainer}>
            <Text style={styles.qrcodeLabel}>Mã QR Checkin:</Text>
            <Image 
              source={{ uri: qrcodeData }} 
              style={styles.qrcodeImage} 
              resizeMode="contain"
            />
          </View>
        )}
      </View>
    </View>
  );
};

// Hàm trợ giúp xử lý trạng thái thanh toán
const getPaymentStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'paid':
      return '#22C55E';
    case 'pending':
      return '#FFA500';
    case 'cancelled':
      return '#E74C3C';
    default:
      return '#888888';
  }
};

// Hàm getPaymentStatusText đã được thay thế bằng translateStatus import từ utils

// --- Media Gallery ---
interface MediaGalleryProps {
  media?: Array<{id: string; mediaUrl: string; mediaType: string;}>;
}

const MediaGallery: React.FC<MediaGalleryProps> = ({ media }) => {
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [allVideos, setAllVideos] = useState<Array<{id: string; mediaUrl: string; mediaType: string;}>>([]);
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
  
  // Phân loại media
  const videos = media.filter(item => item.mediaType === 'Video');
  const images = media.filter(item => item.mediaType === 'Image');
  
  // Xử lý xem video
  const handleOpenVideo = (videoUrl: string) => {
    // Tìm index của video trong danh sách videos
    const videoIndex = videos.findIndex(v => v.mediaUrl === videoUrl);
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
  
  // Xử lý xem ảnh
  const handleOpenImage = (imageUrl: string) => {
    // Tìm index của ảnh trong danh sách images
    const imageIndex = images.findIndex(img => img.mediaUrl === imageUrl);
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
        contentContainerStyle={styles.galleryScrollContent}
      >
        {media.map((item, index) => (
          <TouchableOpacity 
            key={item.id || index} 
            style={styles.galleryItem}
            onPress={() => {
              if (item.mediaType === 'Video') {
                handleOpenVideo(item.mediaUrl);
              } else {
                handleOpenImage(item.mediaUrl);
              }
            }}
          >
            <Image 
              source={{ uri: item.mediaUrl }} 
              style={styles.galleryImage} 
              resizeMode="cover"
            />
            {item.mediaType === 'Video' && (
              <View style={styles.videoIndicator}>
                <View style={styles.playButton} />
              </View>
            )}
            <View style={styles.mediaTypeIndicator}>
              <Text style={styles.mediaTypeText}>
                {item.mediaType === 'Video' ? 'Video' : 'Ảnh'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Video Player Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={videoModalVisible}
        onRequestClose={handleCloseVideoModal}
      >
        <View style={styles.videoModalContainer}>
          <View style={styles.videoModalHeader}>
            <TouchableOpacity 
              style={styles.videoModalCloseButton}
              onPress={handleCloseVideoModal}
            >
              <Text style={styles.videoModalCloseText}>Đóng</Text>
            </TouchableOpacity>
            <Text style={styles.videoModalTitle}>Video {activeVideoIndex + 1}/{videos.length}</Text>
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
                      style={[styles.videoNavButton, activeVideoIndex === 0 && styles.videoNavButtonDisabled]}
                      onPress={handlePreviousVideo}
                      disabled={activeVideoIndex === 0}
                    >
                      <Text style={styles.videoNavButtonText}>{"<"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.videoNavButton, activeVideoIndex === videos.length - 1 && styles.videoNavButtonDisabled]}
                      onPress={handleNextVideo}
                      disabled={activeVideoIndex === videos.length - 1}
                    >
                      <Text style={styles.videoNavButtonText}>{">"}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
          
          {videos.length > 1 && (
            <View style={styles.videoListContainer}>
              <Text style={styles.videoListTitle}>Tất cả video ({videos.length})</Text>
              <FlatList
                data={videos}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item, index }) => (
                  <TouchableOpacity 
                    style={[
                      styles.videoThumbContainer,
                      activeVideoIndex === index && styles.videoThumbActive
                    ]}
                    onPress={() => handleSelectVideo(item.mediaUrl, index)}
                  >
                    <View style={styles.videoThumb}>
                      <Image 
                        source={{ uri: item.mediaUrl }}
                        style={styles.videoThumbImage}
                        resizeMode="cover"
                      />
                      <View style={styles.videoPlayIcon} />
                    </View>
                    <Text style={styles.videoThumbLabel}>Video {index + 1}</Text>
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
        onRequestClose={handleCloseImageModal}
      >
        <View style={styles.imageModalContainer}>
          <View style={styles.imageModalHeader}>
            <TouchableOpacity 
              style={styles.imageModalCloseButton}
              onPress={handleCloseImageModal}
            >
              <Text style={styles.imageModalCloseText}>Đóng</Text>
            </TouchableOpacity>
            <Text style={styles.imageModalTitle}>Ảnh {activeImageIndex + 1}/{images.length}</Text>
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
                      style={[styles.imageNavButton, activeImageIndex === 0 && styles.imageNavButtonDisabled]}
                      onPress={handlePreviousImage}
                      disabled={activeImageIndex === 0}
                    >
                      <Text style={styles.imageNavButtonText}>{"<"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.imageNavButton, activeImageIndex === images.length - 1 && styles.imageNavButtonDisabled]}
                      onPress={handleNextImage}
                      disabled={activeImageIndex === images.length - 1}
                    >
                      <Text style={styles.imageNavButtonText}>{">"}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
          
          {images.length > 1 && (
            <View style={styles.imageListContainer}>
              <Text style={styles.imageListTitle}>Tất cả ảnh ({images.length})</Text>
              <FlatList
                data={images}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item, index }) => (
                  <TouchableOpacity 
                    style={[
                      styles.imageThumbContainer,
                      activeImageIndex === index && styles.imageThumbActive
                    ]}
                    onPress={() => handleSelectImage(item.mediaUrl, index)}
                  >
                    <Image 
                      source={{ uri: item.mediaUrl }}
                      style={styles.imageThumb}
                      resizeMode="cover"
                    />
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
  const [totalParticipants, setTotalParticipants] = useState<number | undefined>(undefined);
  
  // Lấy showId và registrationId từ params
  const showId = params.showId as string;
  const registrationId = params.registrationId as string;
  
  useEffect(() => {
    const fetchFishData = async () => {
      try {
        setLoading(true);
        
        if (!showId) {
          throw new Error('Không tìm thấy ID cuộc thi');
        }
        
        // Fetch dữ liệu từ API
        const data = await getShowMemberDetail(showId);
        
        // Tìm registration cụ thể dựa vào registrationId
        const registration = data.registrations.find(
          (reg) => reg.registrationId === registrationId
        );
        
        if (!registration) {
          throw new Error('Không tìm thấy thông tin cá Koi');
        }
        
        setFishData(registration);
        setTotalParticipants(data.totalRegisteredKoi);
        setError(null);
      } catch (error: any) {
        console.error('Lỗi khi lấy thông tin chi tiết cá:', error);
        setError(error.message || 'Có lỗi xảy ra khi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFishData();
  }, [showId, registrationId]);
  
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
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
          <Text style={styles.headerTitle}>Chi tiết cá Koi</Text>
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
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
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
          <Text style={styles.headerTitle}>Chi tiết cá Koi</Text>
        </View>
        
        <View style={styles.errorContainer}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/error-icon.png",
            }}
            style={styles.errorIcon}
          />
          <Text style={styles.errorTitle}>Đã xảy ra lỗi</Text>
          <Text style={styles.errorText}>{error || 'Không tìm thấy dữ liệu'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  // Lấy ảnh đầu tiên từ media hoặc sử dụng ảnh mặc định
  const fishImage = fishData.media.find(item => item.mediaType === "Image")?.mediaUrl || 
    "https://dashboard.codeparrot.ai/api/image/Z79c2XnogYAtZdZn/group-4.png";
  
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <SafeAreaView style={styles.container}>
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
          <Text style={styles.headerTitle}>Chi tiết cá Koi</Text>
        </View>
        
        <ScrollView contentContainerStyle={styles.scrollViewContent} showsVerticalScrollIndicator={false}>
          <FishProfileHeader
            fishName={fishData.koiName || 'Cá Koi'}
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
            award={fishData.award || undefined}
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
          
          <MediaGallery
            media={fishData.media}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
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
  scrollViewContent: {
    paddingBottom: 80, // Extra padding for footer
  },
  
  // Fish Profile Header Styles
  headerContainer: {
    width: "100%",
  },
  headerFishImage: {
    width: "100%",
    height: 240,
  },
  headerGradient: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 16,
  },
  headerFishName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  
  // Section Common Styles
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
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333333",
  },
  
  // Fish Details Styles
  detailsContainer: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    margin: 16,
    marginTop: 24,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  detailsContent: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 12,
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
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: "#333333",
    fontWeight: "500",
  },
  
  // Current Status Styles
  statusContainer: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusContent: {
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  statusInfoRow: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 8,
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: "#666666",
  },
  statusValue: {
    fontSize: 14,
    color: "#333333",
    fontWeight: "600",
  },
  statusValueNeutral: {
    fontSize: 14,
    color: "#888888",
    fontWeight: "500",
  },
  awardContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFDF0",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
    width: "100%",
  },
  awardIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  awardText: {
    color: "#B8860B",
    fontWeight: "600",
    fontSize: 14,
  },
  noAwardContainer: {
    padding: 16,
    backgroundColor: "#FFFDF0",
    borderRadius: 8,
    marginTop: 8,
    width: "100%",
  },
  noAwardText: {
    color: "#888888",
    fontStyle: "italic",
  },
  eliminatedContainer: {
    padding: 16,
    backgroundColor: "#FFFDF0",
    borderRadius: 8,
    marginTop: 8,
    width: "100%",
  },
  eliminatedLabel: {
    color: "#888888",
    fontWeight: "500",
  },
  eliminatedValue: {
    color: "#333333",
    fontWeight: "600",
  },
  noInfoText: {
    fontSize: 14,
    color: "#888888",
    fontStyle: "italic",
    marginTop: 8,
  },
  
  // Payment Styles
  paymentContainer: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentContent: {
    marginTop: 8,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  paymentLabel: {
    fontSize: 14,
    color: "#666666",
  },
  paymentValue: {
    fontSize: 14,
    color: "#333333",
    fontWeight: "500",
    textAlign: "right",
    flex: 1,
    marginLeft: 8,
  },
  paymentStatusContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  paymentStatusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  paymentStatusText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  
  // Gallery Styles
  galleryContainer: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    margin: 16,
    marginTop: 0,
    marginBottom: 24,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  galleryScroll: {
    marginTop: 16,
  },
  galleryScrollContent: {
    paddingHorizontal: 16,
  },
  galleryItem: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 12,
    overflow: "hidden",
  },
  galleryImage: {
    width: "100%",
    height: "100%",
  },
  mediaCount: {
    fontSize: 14,
    color: "#666666",
    marginLeft: 6,
  },
  videoIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  mediaTypeIndicator: {
    position: "absolute",
    top: 0,
    right: 0,
    padding: 4,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 4,
  },
  mediaTypeText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  
  // Footer Styles
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
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  
  // Loading State
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
  
  // Error State
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
  
  // Video Modal Styles
  videoModalContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  videoModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: RNStatusBar.currentHeight || 40,
    paddingBottom: 16,
    backgroundColor: "#000000",
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  videoModalCloseButton: {
    padding: 8,
  },
  videoModalCloseText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  videoModalTitle: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  videoModalPlaceholder: {
    width: 40,
  },
  videoPlayerContainer: {
    width: width,
    height: width * 0.75,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  videoPlayer: {
    width: "100%",
    height: "100%",
  },
  videoListContainer: {
    padding: 16,
    backgroundColor: "#111111",
  },
  videoListTitle: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
    marginBottom: 12,
  },
  videoThumbContainer: {
    marginRight: 12,
    alignItems: "center",
    width: 80,
  },
  videoThumbActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#4A90E2",
  },
  videoThumb: {
    width: 60,
    height: 60,
    backgroundColor: "#333333",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  videoThumbImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  videoPlayIcon: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 16,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#FFFFFF",
    transform: [{ rotate: "90deg" }],
    position: "absolute",
    right: 10,
    bottom: 15,
  },
  videoThumbLabel: {
    fontSize: 12,
    color: "#CCCCCC",
    textAlign: "center",
  },
  videoNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 8,
  },
  videoNavButton: {
    padding: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
  },
  videoNavButtonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  videoNavButtonText: {
    fontSize: 16,
    color: "#333333",
    fontWeight: "600",
  },
  
  // Image Modal Styles
  imageModalContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  imageModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: RNStatusBar.currentHeight || 40,
    paddingBottom: 16,
    backgroundColor: "#000000",
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  imageModalCloseButton: {
    padding: 8,
  },
  imageModalCloseText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  imageModalTitle: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  imageModalPlaceholder: {
    width: 40,
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  imageWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: "100%",
    height: "100%",
  },
  imageNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 8,
  },
  imageNavButton: {
    padding: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
  },
  imageNavButtonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  imageNavButtonText: {
    fontSize: 16,
    color: "#333333",
    fontWeight: "600",
  },
  imageListContainer: {
    padding: 16,
    backgroundColor: "#111111",
  },
  imageListTitle: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
    marginBottom: 12,
  },
  imageThumbContainer: {
    marginRight: 12,
    alignItems: "center",
    width: 80,
  },
  imageThumbActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#4A90E2",
  },
  imageThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 4,
  },
  imageThumbLabel: {
    fontSize: 12,
    color: "#CCCCCC",
    textAlign: "center",
  },
  qrcodeContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  qrcodeLabel: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "600",
    marginBottom: 8,
  },
  qrcodeImage: {
    width: "100%",
    height: 120,
  },
  emptyMediaContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyMediaText: {
    fontSize: 16,
    color: "#666666",
    fontStyle: "italic",
  },
});

export default FishStatus;
