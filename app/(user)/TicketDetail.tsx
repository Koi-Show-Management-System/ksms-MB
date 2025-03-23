import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from "react-native-reanimated";

// --- Event Details Component ---
interface EventDetailsProps {
  showName: string;
  dateTime: string;
  venue: string;
}

const EventDetails: React.FC<EventDetailsProps> = ({
  showName,
  dateTime,
  venue,
}) => (
  <View style={styles.eventDetailsContainer}>
    <Text style={styles.eventTitle}>{showName}</Text>
    <View style={styles.eventInfoRow}>
      <Ionicons name="calendar-outline" size={16} color="#666666" style={styles.eventIcon} />
      <Text style={styles.eventInfoText}>{dateTime}</Text>
    </View>
    <View style={styles.eventInfoRow}>
      <Ionicons name="location-outline" size={16} color="#666666" style={styles.eventIcon} />
      <Text style={styles.eventInfoText}>{venue}</Text>
    </View>
  </View>
);

// --- QR Code Section Component ---
interface QRCodeSectionProps {
  qrCodeUrl: string;
  onProcessedUrl?: (url: string) => void; // Callback khi URL đã được xử lý
}

const QRCodeSection: React.FC<QRCodeSectionProps> = ({ qrCodeUrl, onProcessedUrl }) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  const [finalUrl, setFinalUrl] = React.useState(qrCodeUrl);

  // Xử lý URL khi component mount hoặc URL thay đổi
  React.useEffect(() => {
    if (!qrCodeUrl) {
      setHasError(true);
      return;
    }

    // Kiểm tra lại URL Firebase Storage
    if (qrCodeUrl.includes('firebasestorage.googleapis.com')) {
      try {
        // Đảm bảo URL được encode đúng
        const pathStartIndex = qrCodeUrl.indexOf('.com/o/');
        if (pathStartIndex !== -1) {
          // Chỉ xử lý nếu URL chưa được encode đúng
          if (!qrCodeUrl.includes('%2F') && qrCodeUrl.includes('/o/') && qrCodeUrl.substring(pathStartIndex + 7).includes('/')) {
            const urlPrefix = qrCodeUrl.substring(0, pathStartIndex + 7); // Đến .com/o/
            let urlPath = qrCodeUrl.substring(pathStartIndex + 7);
            
            // Tách query params
            const queryParamsIndex = urlPath.indexOf('?');
            let queryParams = '';
            
            if (queryParamsIndex !== -1) {
              queryParams = urlPath.substring(queryParamsIndex);
              urlPath = urlPath.substring(0, queryParamsIndex);
            }
            
            // Encode đường dẫn
            const encodedPath = urlPath.replace(/\//g, '%2F');
            const newUrl = urlPrefix + encodedPath + queryParams;
            
            console.log("QRCodeSection - URL được encode: ", newUrl);
            setFinalUrl(newUrl);
            // Gọi callback nếu có
            if (onProcessedUrl) {
              onProcessedUrl(newUrl);
            }
          } else if (onProcessedUrl) {
            // Vẫn gọi callback với URL hiện tại nếu không cần xử lý
            onProcessedUrl(qrCodeUrl);
          }
        } else if (onProcessedUrl) {
          onProcessedUrl(qrCodeUrl);
        }
      } catch (error) {
        console.error("Lỗi khi xử lý URL Firebase:", error);
        if (onProcessedUrl) {
          onProcessedUrl(qrCodeUrl);
        }
      }
    } else if (onProcessedUrl) {
      onProcessedUrl(qrCodeUrl);
    }
  }, [qrCodeUrl, onProcessedUrl]);

  return (
    <View style={styles.qrCodeContainer}>
      <Text style={styles.sectionTitle}>Quét mã này tại lối vào</Text>
      <View style={styles.qrImageContainer}>
        {isLoading && (
          <View style={styles.qrLoading}>
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        )}
        {hasError && (
          <View style={styles.qrError}>
            <Ionicons name="warning-outline" size={32} color="#FF3B30" />
            <Text style={styles.errorText}>Không thể tải mã QR</Text>
          </View>
        )}
        <Image 
          source={{ uri: finalUrl }}
          style={styles.qrImage} 
          resizeMode="contain"
          onLoadStart={() => {
            setIsLoading(true);
            console.log("Bắt đầu tải QR với URL:", finalUrl.substring(0, 50) + "...");
          }}
          onLoad={() => {
            setIsLoading(false);
            console.log("Tải QR thành công");
          }}
          onError={(e) => {
            setIsLoading(false);
            setHasError(true);
            console.error("Lỗi khi tải mã QR:", e.nativeEvent.error);
          }}
        />
      </View>
      <Text style={styles.qrSubText}>Vui lòng đảm bảo mã QR được hiển thị rõ ràng khi quét</Text>
    </View>
  );
};

// --- Ticket Info Component ---
interface TicketInfoProps {
  ticketType: string;
  ticketNumber: string;
  buyerName: string;
}

const TicketInfo: React.FC<TicketInfoProps> = ({
  ticketType,
  ticketNumber,
  buyerName,
}) => {
  // Logic cho hiển thị mã vé
  const [showFullTicketId, setShowFullTicketId] = useState(false);
  const ticketIdAnimValue = useSharedValue(0);
  
  // Tính toán chiều rộng màn hình
  const currentScreenWidth = Dimensions.get('window').width;
  const maxContainerWidth = currentScreenWidth * 0.7;
  const minContainerWidth = currentScreenWidth * 0.3;
  
  // Function format mã ID dựa trên độ rộng màn hình
  const formatId = (id: string) => {
    if (!id) return "N/A";
    
    const screenWidth = Dimensions.get('window').width;
    // Ước tính số ký tự có thể hiển thị dựa trên độ rộng màn hình
    const availableWidth = screenWidth * 0.3; // 30% của màn hình dành cho ID
    const charWidth = 10.5; // Mỗi ký tự khoảng 10px + letterSpacing
    const maxChars = Math.floor(availableWidth / charWidth);
    
    // Nếu ID ngắn hơn số ký tự tối đa có thể hiển thị, hiển thị toàn bộ
    if (id.length <= maxChars) {
      return id;
    }
    
    // Nếu không, chỉ hiển thị phần đầu của ID và kết thúc bằng dấu ba chấm
    const visibleChars = maxChars - 3;
    const prefix = id.slice(0, visibleChars);
    
    return `${prefix}...`;
  };
  
  // Xử lý khi người dùng nhấn vào mã vé
  const toggleTicketIdDisplay = () => {
    setShowFullTicketId(!showFullTicketId);
    ticketIdAnimValue.value = withSpring(showFullTicketId ? 0 : 1, {
      damping: 20,
      stiffness: 90,
    });
  };
  
  // Style animation cho container của mã vé
  const animatedTicketIdStyle = useAnimatedStyle(() => {
    return {
      flex: interpolate(
        ticketIdAnimValue.value,
        [0, 1],
        [2, 4] // Tăng flex để mở rộng khi hiển thị đầy đủ
      ),
    };
  });
  
  // Style animation cho text mã vé
  const animatedTicketIdTextStyle = useAnimatedStyle(() => {
    return {
      fontSize: interpolate(
        ticketIdAnimValue.value,
        [0, 1],
        [15, 13] // Thu nhỏ font chữ khi hiển thị mã đầy đủ
      ),
    };
  });
  
  return (
    <View style={styles.ticketInfoContainer}>
      <View style={styles.ticketInfoRow}>
        <Text style={styles.ticketLabel}>Loại vé</Text>
        <Text style={styles.ticketValue}>{ticketType}</Text>
      </View>
      <View style={styles.infoSeparator} />
      <View style={styles.ticketInfoRow}>
        <Text style={styles.ticketLabel}>Mã vé</Text>
        <Animated.View style={[styles.ticketValueContainer, animatedTicketIdStyle]}>
          <TouchableOpacity onPress={toggleTicketIdDisplay} activeOpacity={0.6}>
            <Animated.Text style={[styles.ticketValue, animatedTicketIdTextStyle]}>
              {showFullTicketId ? ticketNumber : formatId(ticketNumber)}
            </Animated.Text>
            <Text style={styles.ticketIdTooltip}>
              {showFullTicketId ? "Thu gọn" : "Xem đầy đủ"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
      <View style={styles.infoSeparator} />
      <View style={styles.ticketInfoRow}>
        <Text style={styles.ticketLabel}>Người mua</Text>
        <Text style={styles.ticketValue}>{buyerName}</Text>
      </View>
    </View>
  );
};

// --- Important Notes Component ---
const ImportantNotes: React.FC = () => (
  <View style={styles.notesContainer}>
    <Text style={styles.sectionTitle}>Lưu ý quan trọng</Text>
    <View style={styles.notesBox}>
      <Text style={styles.notesText}>
        • Vui lòng xuất trình vé này tại lối vào{"\n"}
        • Mỗi vé chỉ có giá trị cho một người{"\n"}
        • Không được vào sau khi sự kiện đã bắt đầu{"\n"}
        • Vé bị mất không được thay thế{"\n"}
        • Không hoàn tiền hoặc đổi vé
      </Text>
    </View>
  </View>
);

// --- Main Component ---
const TicketDetail: React.FC = () => {
  // Get params from URL
  const params = useLocalSearchParams();
  const [expandedQR, setExpandedQR] = React.useState(false);
  const [processedQrUrl, setProcessedQrUrl] = React.useState<string | null>(null);

  // Xử lý qrCodeUrl
  const qrCodeUrl = React.useMemo(() => {
    const url = params.qrCodeUrl as string;
    if (!url) return null;
    
    // Log để debug
    console.log("QR Code URL từ params:", url.substring(0, 50) + (url.length > 50 ? "..." : ""));
    
    // Xử lý lại URL để đảm bảo mã hóa đúng
    let processedUrl = url;
    
    // Kiểm tra nếu là URL Firebase Storage
    if (url && url.includes('firebasestorage.googleapis.com')) {
      // Đảm bảo các ký tự / trong đường dẫn được mã hóa thành %2F
      const pathStartIndex = url.indexOf('.com/o/');
      if (pathStartIndex !== -1) {
        // Lấy phần trước và sau của đường dẫn
        const urlPrefix = url.substring(0, pathStartIndex + 7); // .com/o/
        let urlPath = url.substring(pathStartIndex + 7);
        
        // Tách phần đường dẫn và query params (nếu có)
        const queryParamsIndex = urlPath.indexOf('?');
        let queryParams = '';
        
        if (queryParamsIndex !== -1) {
          queryParams = urlPath.substring(queryParamsIndex);
          urlPath = urlPath.substring(0, queryParamsIndex);
        }
        
        // Kiểm tra xem đường dẫn đã được mã hóa chưa
        if (!urlPath.includes('%2F') && urlPath.includes('/')) {
          // Mã hóa đúng đường dẫn (thay thế / bằng %2F)
          const encodedPath = urlPath.replace(/\//g, '%2F');
          
          // Tạo lại URL hoàn chỉnh
          processedUrl = urlPrefix + encodedPath + queryParams;
          console.log("TicketDetail - URL sau khi encode:", processedUrl);
        }
      }
    }
    
    return processedUrl;
  }, [params.qrCodeUrl]);

  // Use params or default values
  const eventData = {
    showName: (params.showName as string) || "Cuộc thi cá Koi",
    dateTime: (params.dateTime as string) || "10/10/2023, 10:00",
    venue: (params.venue as string) || "Trung tâm triển lãm",
    qrCodeUrl: qrCodeUrl || "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=example",
    ticketType: (params.ticketType as string) || "Vé VIP",
    ticketNumber: (params.ticketNumber as string) || "1234567890",
    buyerName: (params.buyerName as string) || "Nguyễn Văn A",
  };

  // Component hiển thị QR phóng to
  const ExpandedQRView = () => (
    <TouchableOpacity
      style={styles.expandedQRContainer}
      activeOpacity={0.9}
      onPress={() => setExpandedQR(false)}
    >
      <View style={styles.expandedQRContent}>
        <Image 
          source={{ uri: processedQrUrl || eventData.qrCodeUrl }} 
          style={styles.expandedQRImage}
          resizeMode="contain"
        />
        <Text style={styles.expandedQRText}>Nhấn để đóng</Text>
      </View>
    </TouchableOpacity>
  );

  // Handler khi URL đã được xử lý
  const handleProcessedQrUrl = (url: string) => {
    console.log("URL QR đã xử lý:", url.substring(0, 50) + "...");
    setProcessedQrUrl(url);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#000000" style={styles.backIcon} />
          <Text style={styles.backText}>Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết vé</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}>
        <EventDetails
          showName={eventData.showName}
          dateTime={eventData.dateTime}
          venue={eventData.venue}
        />

        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => setExpandedQR(true)}
        >
          <QRCodeSection 
            qrCodeUrl={eventData.qrCodeUrl} 
            onProcessedUrl={handleProcessedQrUrl}
          />
          <Text style={styles.tapToExpandText}>Nhấn vào mã QR để phóng to</Text>
        </TouchableOpacity>

        <TicketInfo
          ticketType={eventData.ticketType}
          ticketNumber={eventData.ticketNumber}
          buyerName={eventData.buyerName}
        />

        <ImportantNotes />
      </ScrollView>

      {expandedQR && <ExpandedQRView />}
    </SafeAreaView>
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backIcon: {
    marginRight: 4,
  },
  backText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
  },
  placeholder: {
    width: 80, // To balance the back button width
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 40, // Add bottom padding to ensure content isn't cut off
  },
  eventDetailsContainer: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 12,
  },
  eventInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
  },
  eventIcon: {
    marginRight: 8,
  },
  eventInfoText: {
    fontSize: 14,
    color: "#4A4A4A",
  },
  qrCodeContainer: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 16,
  },
  qrImageContainer: {
    width: 220,
    height: 220,
    padding: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  qrImage: {
    width: 200,
    height: 200,
    borderRadius: 4,
  },
  qrLoading: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1,
  },
  qrError: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    marginTop: 10,
    fontSize: 14,
    color: '#FF3B30',
  },
  qrSubText: {
    fontSize: 12,
    color: '#757575',
    marginTop: 12,
    textAlign: 'center',
  },
  ticketInfoContainer: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ticketInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  ticketLabel: {
    fontSize: 15,
    color: "#666666",
    flex: 1,
    marginRight: 8,
  },
  ticketValueContainer: {
    flex: 2,
    alignItems: 'flex-end',
  },
  ticketValue: {
    fontSize: 15,
    color: "#000000",
    fontWeight: "600",
    textAlign: "right",
    flexWrap: "wrap",
  },
  ticketIdTooltip: {
    fontSize: 10,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'right',
    marginTop: 2,
  },
  infoSeparator: {
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  notesContainer: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  notesBox: {
    padding: 12,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#4A4A4A",
  },
  tapToExpandText: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
    marginTop: -12,
    marginBottom: 16,
    fontStyle: "italic",
  },
  expandedQRContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  expandedQRContent: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    width: "80%",
  },
  expandedQRImage: {
    width: 280,
    height: 280,
    marginBottom: 16,
  },
  expandedQRText: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },
});

export default TicketDetail;
