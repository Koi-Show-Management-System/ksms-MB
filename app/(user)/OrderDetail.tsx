import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  ScrollView,
  Alert,
  Image,
  FlatList,
  Dimensions
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from "react-native-reanimated";
import { translateStatus } from '../../utils/statusTranslator'; // Import hàm dịch mới

interface OrderDetailItem {
  id: string;
  quantity: number;
  unitPrice: number;
  ticketType: {
    name: string;
    koiShow: {
      name: string;
    }
  }
}

interface Ticket {
  id: string;
  qrcodeData: string;
  expiredDate: string;
  isCheckedIn: boolean;
  checkInTime: string | null;
  checkInLocation: string | null;
  status: string;
  orderDetailId?: string;
}

interface OrderDetailResponse {
  data: OrderDetailItem[];
  statusCode: number;
  message: string;
}

interface TicketsResponse {
  data: Ticket[];
  statusCode: number;
  message: string;
}

interface OrderInfo {
  status: string;
  createdAt: string;
  transactionCode: string; // Thêm trường transactionCode
}

// Thêm interface cho Order từ API get-paging-orders
interface Order {
  id: string;
  fullName: string;
  email: string;
  orderDate: string;
  transactionCode: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
}

interface OrdersResponse {
  data: {
    size: number;
    page: number;
    total: number;
    totalPages: number;
    items: Order[];
  };
  statusCode: number;
  message: string;
}

const OrderDetail = () => {
  const params = useLocalSearchParams();
  const orderId = params.orderId as string;
  
  const [orderDetails, setOrderDetails] = useState<OrderDetailItem[]>([]);
  const [orderInfo, setOrderInfo] = useState<OrderInfo>({ status: '', createdAt: '', transactionCode: '' });
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [error, setError] = useState("");
  const [ticketError, setTicketError] = useState("");
  
  // Logic cho hiển thị mã đơn hàng
  const [showFullOrderId, setShowFullOrderId] = useState(false);
  const orderIdAnimValue = useSharedValue(0);
  
  // Tính toán chiều rộng màn hình ở cấp độ component
  const currentScreenWidth = Dimensions.get('window').width;
  const maxContainerWidth = currentScreenWidth * 0.9;
  const minContainerWidth = currentScreenWidth * 0.3;

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  // Tạo một hàm reloadTickets riêng biệt để sử dụng cho các button và tránh lỗi TypeScript
  const reloadTickets = () => {
    fetchTickets(orderDetails);
  };

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      
      // 1. Trước tiên, lấy thông tin đơn hàng từ API get-paging-orders để có status
      const ordersResponse = await api.get<OrdersResponse>(`/api/v1/ticket-order/get-paging-orders?page=1&size=20`);
      
      if (ordersResponse.data.statusCode !== 200) {
        setError("Không thể tải thông tin đơn hàng. Vui lòng thử lại.");
        setLoading(false);
        return;
      }
      
      // Tìm đơn hàng có ID trùng với orderId
      const currentOrder = ordersResponse.data.data.items.find(order => order.id === orderId);
      
      if (!currentOrder) {
        setError("Không tìm thấy thông tin đơn hàng. Vui lòng thử lại.");
        setLoading(false);
        return;
      }
      
      // Lưu thông tin trạng thái đơn hàng và mã giao dịch
      const orderStatus = currentOrder.status; // "pending", "paid", hoặc "cancelled"
      console.log("Trạng thái đơn hàng từ API:", orderStatus);
      
      // Cập nhật orderInfo với transactionCode
      setOrderInfo({ 
        status: orderStatus, 
        createdAt: currentOrder.orderDate,
        transactionCode: currentOrder.transactionCode
      });
      
      // 2. Sau đó, lấy chi tiết đơn hàng
      const response = await api.get<OrderDetailResponse>(`/api/v1/ticket-order/get-order-details/${orderId}`);
      
      if (response.data.statusCode === 200) {
        const orderDetailsData = response.data.data;
        setOrderDetails(orderDetailsData);

        // Nếu trạng thái là paid, tải thông tin vé
        if (orderStatus.toLowerCase() === 'paid') {
          // Truyền orderDetailsData vào fetchTickets để đảm bảo có dữ liệu ngay lập tức
          fetchTickets(orderDetailsData);
        }
      } else {
        setError("Không thể tải chi tiết đơn hàng. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu đơn hàng:", err);
      setError("Đã xảy ra lỗi khi tải dữ liệu chi tiết đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async (details = orderDetails) => {
    try {
      setLoadingTickets(true);
      
      // Kiểm tra nếu details rỗng
      if (details.length === 0) {
        console.log("Không có chi tiết đơn hàng để tải vé");
        alert("Không thể tải vé do thiếu thông tin đơn hàng");
        return;
      }
      
      console.log("Đang tải vé cho", details.length, "mục đơn hàng. Chi tiết đơn hàng IDs:", details.map(d => d.id));
      
      // Đối với mỗi chi tiết đơn hàng, lấy thông tin vé
      const ticketsPromises = details.map(detail => {
        console.log(`Gọi API lấy vé cho orderDetailId: ${detail.id}`);
        return api.get<TicketsResponse>(`/api/v1/ticket-order/get-all-tickets/${detail.id}`)
          .catch(error => {
            console.error(`Lỗi khi lấy vé cho orderDetailId ${detail.id}:`, error);
            return { 
              data: { 
                data: [], 
                statusCode: 500, 
                message: `Lỗi khi lấy vé: ${error.message}` 
              } 
            };
          });
      });
      
      const responses = await Promise.all(ticketsPromises);
      
      // Debug xem API trả về gì
      let hasError = false;
      responses.forEach((response, index) => {
        const statusCode = response.data.statusCode;
        if (statusCode !== 200) {
          hasError = true;
        }
        console.log(`Response từ API cho orderDetailId ${details[index].id}:`, 
          statusCode, 
          response.data.message,
          response.data.data ? `Số vé: ${response.data.data.length}` : 'Không có dữ liệu'
        );
      });
      
      if (hasError) {
        console.warn("Có lỗi xảy ra khi tải một số vé");
      }
      
      // Gộp tất cả các vé từ các response
      const allTickets = responses.flatMap((response, index) => {
        if (response.data.statusCode === 200 && response.data.data) {
          return response.data.data.map(ticket => ({
            ...ticket,
            orderDetailId: details[index].id // Thêm orderDetailId vào mỗi ticket để tiện tham chiếu sau này
          }));
        }
        return [];
      });
      
      console.log("Đã tải được", allTickets.length, "vé. Thông tin sơ lược:", 
        allTickets.map(t => ({ 
          id: t.id, 
          hasQR: Boolean(t.qrcodeData), 
          orderDetailId: t.orderDetailId 
        }))
      );
      
      setTickets(allTickets);
      
      // Hiển thị thông báo nếu không có vé nào được tìm thấy
      if (allTickets.length === 0) {
        setTimeout(() => {
          alert("Không tìm thấy vé nào cho đơn hàng này. Vui lòng liên hệ với ban tổ chức để được hỗ trợ.");
        }, 500);
      }
    } catch (err) {
      console.error("Lỗi khi tải vé:", err);
      setTimeout(() => {
        alert("Đã xảy ra lỗi khi tải vé. Vui lòng thử lại sau.");
      }, 300);
    } finally {
      setLoadingTickets(false);
    }
  };

  const calculateTotal = () => {
    return orderDetails.reduce((total, item) => {
      return total + (item.quantity * item.unitPrice);
    }, 0);
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'pending': return '#FFA500';
      case 'paid': return '#4CAF50';
      case 'cancelled': return '#F44336';
      default: return '#999999';
    }
  };

  // Hàm getStatusText và getTicketStatusText đã được thay thế bằng translateStatus
  
  // Hàm lấy màu sắc dựa trên trạng thái vé (Giữ nguyên vì xử lý màu sắc, không phải dịch text)
  const getTicketStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    switch (statusLower) {
      case 'cancelled': return '#FF9800'; // Màu cam cho vé đã bị hủy
      case 'sold': return '#4CAF50'; // Màu xanh lá cho vé chưa sử dụng
      case 'checkin': return '#FF3B30'; // Màu đỏ cho vé đã sử dụng
      case 'refunded': return '#2196F3'; // Màu xanh dương cho vé đã hoàn tiền
      default: return '#999999'; // Màu xám cho các trạng thái khác
    }
  };

  const navigateToTicketDetail = async (ticket: Ticket) => {
    try {
      if (!ticket || !ticket.qrcodeData) {
        console.error("Thông tin vé không hợp lệ:", ticket);
        alert("Không thể xem chi tiết vé. Vui lòng thử lại sau.");
        return;
      }

      // Lấy tên người dùng từ AsyncStorage
      let userFullName = await AsyncStorage.getItem('userFullName');
      if (!userFullName) {
        userFullName = "Người dùng KSMS"; // Giá trị mặc định
        console.log("Không tìm thấy tên người dùng trong AsyncStorage, sử dụng giá trị mặc định");
      } else {
        console.log("Tên người dùng từ AsyncStorage:", userFullName);
      }

      // Tìm orderDetail tương ứng với vé này dựa trên orderDetailId
      const orderDetail = orderDetails.find(detail => detail.id === ticket.orderDetailId);
      
      const showName = orderDetail?.ticketType.koiShow.name || "Không xác định";
      const ticketType = orderDetail?.ticketType.name || "Không xác định";
      
      // Kiểm tra định dạng QR code data
      console.log("QR code data:", ticket.qrcodeData);
      
      // Đảm bảo qrCodeUrl là chuỗi URI hợp lệ
      let qrCodeUrl = ticket.qrcodeData;
      
      // Kiểm tra nếu là URL Firebase Storage
      if (qrCodeUrl && qrCodeUrl.includes('firebasestorage.googleapis.com')) {
        // Đảm bảo các ký tự / trong đường dẫn được mã hóa thành %2F
        // Tìm vị trí của .com/o/ trong URL
        const pathStartIndex = qrCodeUrl.indexOf('.com/o/');
        if (pathStartIndex !== -1) {
          // Lấy phần trước và sau của đường dẫn
          const urlPrefix = qrCodeUrl.substring(0, pathStartIndex + 7); // .com/o/
          let urlPath = qrCodeUrl.substring(pathStartIndex + 7);
          
          // Tách phần đường dẫn và query params (nếu có)
          const queryParamsIndex = urlPath.indexOf('?');
          let queryParams = '';
          
          if (queryParamsIndex !== -1) {
            queryParams = urlPath.substring(queryParamsIndex);
            urlPath = urlPath.substring(0, queryParamsIndex);
          }
          
          // Mã hóa đúng đường dẫn (thay thế / bằng %2F)
          const encodedPath = urlPath.replace(/\//g, '%2F');
          
          // Tạo lại URL hoàn chỉnh
          qrCodeUrl = urlPrefix + encodedPath + queryParams;
          console.log("URL sau khi encode:", qrCodeUrl);
        }
      } else if (!qrCodeUrl.startsWith("http") && !qrCodeUrl.startsWith("data:")) {
        // Nếu không phải URL hoặc data URI, chuyển đổi thành data URI
        qrCodeUrl = `data:image/png;base64,${ticket.qrcodeData}`;
        console.log("Đã chuyển đổi thành data URI:", qrCodeUrl.substring(0, 50) + "...");
      }
      
      router.push({
        pathname: "/(user)/TicketDetail",
        params: {
          qrCodeUrl: qrCodeUrl,
          showName: showName,
          ticketType: ticketType,
          ticketNumber: ticket.id.toUpperCase(),
          buyerName: userFullName,
          dateTime: new Date(ticket.expiredDate).toLocaleDateString('vi-VN'),
          venue: "Địa điểm cuộc thi",
        }
      });
    } catch (err) {
      console.error("Lỗi khi chuyển hướng đến chi tiết vé:", err);
      alert("Đã xảy ra lỗi khi mở chi tiết vé. Vui lòng thử lại sau.");
    }
  };

  // Function format mã ID dựa trên độ rộng màn hình
  const formatId = (id: string) => {
    if (!id) return "N/A";
    
    const screenWidth = Dimensions.get('window').width;
    // Ước tính số ký tự có thể hiển thị dựa trên độ rộng màn hình
    // Giả sử mỗi ký tự chiếm khoảng 10 điểm ảnh và style id có letterSpacing: 0.5
    // Để an toàn, giảm bớt khoảng 30% diện tích cho các yếu tố khác trong giao diện
    const availableWidth = screenWidth * 0.3; // 30% của màn hình dành cho ID
    const charWidth = 10.5; // Mỗi ký tự khoảng 10px + letterSpacing
    const maxChars = Math.floor(availableWidth / charWidth);
    
    // Nếu ID ngắn hơn số ký tự tối đa có thể hiển thị, hiển thị toàn bộ
    if (id.length <= maxChars) {
      return id.toUpperCase();
    }
    
    // Nếu không, chỉ hiển thị phần đầu của ID và kết thúc bằng dấu ba chấm
    // Trừ 3 ký tự cho dấu "..."
    const visibleChars = maxChars - 3;
    const prefix = id.slice(0, visibleChars);
    
    return `${prefix}...`.toUpperCase();
  };
  
  // Xử lý khi người dùng nhấn vào mã đơn hàng
  const toggleOrderIdDisplay = () => {
    setShowFullOrderId(!showFullOrderId);
    orderIdAnimValue.value = withSpring(showFullOrderId ? 0 : 1, {
      damping: 20,
      stiffness: 90,
    });
  };
  
  // Style animation cho container của mã đơn hàng
  const animatedOrderIdStyle = useAnimatedStyle(() => {
    return {
      maxWidth: interpolate(
        orderIdAnimValue.value,
        [0, 1],
        [minContainerWidth, maxContainerWidth], // Sử dụng biến đã tính trước
      ),
      paddingRight: interpolate(
        orderIdAnimValue.value,
        [0, 1],
        [8, 16], // Thêm padding khi mở rộng
      ),
    };
  });
  
  // Style animation cho text mã đơn hàng
  const animatedOrderIdTextStyle = useAnimatedStyle(() => {
    return {
      fontSize: interpolate(
        orderIdAnimValue.value,
        [0, 1],
        [16, 14], // Thu nhỏ font chữ khi hiển thị mã đầy đủ
      ),
    };
  });

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFA500" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchOrderDetails}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (orderDetails.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color="#CCCCCC" />
          <Text style={styles.emptyText}>Không có thông tin chi tiết cho đơn hàng này</Text>
        </View>
      );
    }

    const showName = orderDetails[0]?.ticketType.koiShow.name || "Không xác định";
    
    // Cải thiện cấu trúc hiển thị để tổ chức nội dung rõ ràng hơn
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          {/* Tiêu đề và trạng thái đơn hàng */}
          <View style={styles.orderHeaderContainer}>
            <Animated.View style={[styles.orderIdContainer, animatedOrderIdStyle]}>
              <Text style={styles.orderIdLabel}>Mã đơn hàng</Text>
              <TouchableOpacity onPress={toggleOrderIdDisplay} activeOpacity={0.6}>
                <Animated.Text style={[styles.orderIdText, animatedOrderIdTextStyle]}>
                  {showFullOrderId ? orderInfo.transactionCode.toUpperCase() : formatId(orderInfo.transactionCode)}
                </Animated.Text>
                <View style={styles.idTooltip}>
                  <Text style={styles.idTooltipText}>
                    {showFullOrderId ? "Thu gọn" : "Xem đầy đủ"}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(orderInfo.status) }]}>
              <Text style={styles.statusText}>{translateStatus(orderInfo.status)}</Text>
            </View>
          </View>

          {/* Thông tin cuộc thi */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Thông tin cuộc thi</Text>
            <Text style={styles.showName}>{showName}</Text>
            {orderInfo?.createdAt && (
              <Text style={styles.orderDateText}>
                Ngày đặt: {new Date(orderInfo.createdAt).toLocaleDateString('vi-VN')}
              </Text>
            )}
          </View>

          {/* Danh sách vé */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Danh sách vé</Text>
            {orderDetails.map((item, index) => (
              <View key={item.id} style={styles.ticketItem}>
                <View style={styles.ticketInfo}>
                  <Text style={styles.ticketName}>{item.ticketType.name}</Text>
                  <Text style={styles.ticketPrice}>{item.unitPrice.toLocaleString('vi-VN')} VNĐ</Text>
                </View>
                <View style={styles.ticketQuantity}>
                  <Text style={styles.quantityText}>Số lượng: {item.quantity}</Text>
                  <Text style={styles.subtotalText}>
                    Thành tiền: {(item.quantity * item.unitPrice).toLocaleString('vi-VN')} VNĐ
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Tổng cộng */}
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalAmount}>{calculateTotal().toLocaleString('vi-VN')} VNĐ</Text>
          </View>
          
          {/* Hiển thị danh sách vé với QR code khi đã thanh toán */}
          {orderInfo?.status && orderInfo.status.toLowerCase() === 'paid' && (
            <View style={styles.ticketsHeaderContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Vé của bạn</Text>
                {loadingTickets ? (
                  <ActivityIndicator size="small" color="#ff8c00" />
                ) : (
                  <TouchableOpacity onPress={reloadTickets} style={styles.reloadButton}>
                    <Ionicons name="reload" size={20} color="#ff8c00" />
                  </TouchableOpacity>
                )}
              </View>
              {loadingTickets && tickets.length === 0 && (
                <View style={styles.ticketLoadingContainer}>
                  <ActivityIndicator size="large" color="#ff8c00" />
                  <Text style={styles.loadingText}>Đang tải vé...</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.noteContainer}>
            <Text style={styles.noteText}>
              * Vui lòng mang theo CMND/CCCD khi đến tham dự cuộc thi.
            </Text>
            <Text style={styles.noteText}>
              * Mỗi vé chỉ có giá trị sử dụng một lần.
            </Text>
          </View>
        </ScrollView>
        
        {/* Danh sách vé hiển thị bên ngoài ScrollView */}
        {orderInfo?.status && orderInfo.status.toLowerCase() === 'paid' && tickets.length > 0 && (
          <View style={styles.ticketListContainer}>
            <FlatList
              data={tickets}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.ticketCard}
                  activeOpacity={0.7}
                  onPress={() => navigateToTicketDetail(item)}
                >
                  <View style={styles.ticketCardContent}>
                    <View style={styles.ticketCardInfo}>
                      <Text style={styles.ticketCardTitle}>Mã vé: {item.id.toUpperCase()}</Text>
                      <Text style={[
                        styles.ticketCardStatus,
                        {color: getTicketStatusColor(item.status)}
                      ]}>
                        {translateStatus(item.status)}
                      </Text>
                      <Text style={styles.ticketCardHint}>Nhấp để xem chi tiết</Text>
                    </View>
                    
                    <View style={styles.qrPreviewContainer}>
                      {item.qrcodeData ? (
                        <Image 
                          source={{ uri: item.qrcodeData }} 
                          style={styles.qrPreview}
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={styles.qrPlaceholder}>
                          <Ionicons name="qr-code" size={24} color="#CCCCCC" />
                        </View>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.viewTicketButton}>
                    <Text style={styles.viewTicketText}>Xem chi tiết vé</Text>
                    <Ionicons name="chevron-forward" size={16} color="#FFA500" />
                  </View>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.divider} />}
            />
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.contentContainer}>
        {renderContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FFA500',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  orderHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  orderIdContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  orderIdLabel: {
    fontSize: 13,
    color: "#666666",
    marginBottom: 2,
  },
  orderIdText: {
    fontSize: 16,
    color: "#000000",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  idTooltip: {
    position: 'absolute',
    right: 0,
    bottom: -16,
    opacity: 0.6,
  },
  idTooltipText: {
    fontSize: 10,
    color: '#666',
    fontStyle: 'italic',
  },
  orderDateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 80, // Add padding to prevent footer overlap
  },
  sectionContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  showName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  ticketItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingVertical: 12,
  },
  ticketInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ticketName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  ticketPrice: {
    fontSize: 16,
    color: '#FFA500',
    fontWeight: 'bold',
  },
  ticketQuantity: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  quantityText: {
    fontSize: 14,
    color: '#666',
  },
  subtotalText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 20,
    color: '#FFA500',
    fontWeight: 'bold',
  },
  noteContainer: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  ticketCardContent: {
    flexDirection: 'row',
    padding: 16,
  },
  ticketCardInfo: {
    flex: 1,
    paddingRight: 8,
  },
  ticketCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  ticketCardStatus: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 6,
  },
  qrPreviewContainer: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderRadius: 8,
  },
  qrPreview: {
    width: 65,
    height: 65,
    borderRadius: 4,
  },
  qrPlaceholder: {
    width: 65,
    height: 65,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
  },
  viewTicketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  viewTicketText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFA500',
    marginRight: 4,
  },
  emptySubText: {
    marginTop: 5,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  ticketsHeaderContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  ticketsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  ticketCardHint: {
    fontSize: 13,
    color: '#FFA500',
    fontStyle: 'italic',
    marginTop: 4,
  },
  ticketListContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  ticketLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  reloadButton: {
    padding: 8,
  },
});

export default OrderDetail; 