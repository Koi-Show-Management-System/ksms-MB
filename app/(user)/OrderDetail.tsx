import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  ScrollView,
  Alert,
  Image
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

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
}

const OrderDetail = () => {
  const params = useLocalSearchParams();
  const orderId = params.orderId as string;
  
  const [orderDetails, setOrderDetails] = useState<OrderDetailItem[]>([]);
  const [orderInfo, setOrderInfo] = useState<OrderInfo>({ status: '', createdAt: '' });
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get<OrderDetailResponse>(`/api/v1/ticket-order/get-order-details/${orderId}`);
      
      if (response.data.statusCode === 200) {
        setOrderDetails(response.data.data);
        
        // Giả định rằng thông tin đơn hàng có thể được truy xuất từ một API hoặc từ headers
        // Cho mục đích demo, tôi đang giả định một vài thông tin
        const orderStatus = params.status as string || 'PENDING';
        setOrderInfo({ 
          status: orderStatus, 
          createdAt: new Date().toISOString() 
        });

        // Nếu trạng thái là paid, tải thông tin vé
        if (orderStatus.toUpperCase() === 'PAID') {
          fetchTickets();
        }
      } else {
        setError("Không thể tải chi tiết đơn hàng. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Failed to fetch order details:", err);
      setError("Đã xảy ra lỗi khi tải dữ liệu chi tiết đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      setLoadingTickets(true);
      
      // Đối với mỗi chi tiết đơn hàng, lấy thông tin vé
      const ticketsPromises = orderDetails.map(detail => 
        api.get<TicketsResponse>(`/api/v1/ticket-order/get-all-tickets/${detail.id}`)
      );
      
      const responses = await Promise.all(ticketsPromises);
      
      // Gộp tất cả các vé từ các response
      const allTickets = responses.flatMap(response => {
        if (response.data.statusCode === 200) {
          return response.data.data;
        }
        return [];
      });
      
      setTickets(allTickets);
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
      // Không hiển thị lỗi cho người dùng, chỉ log ra console
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
    switch (status.toUpperCase()) {
      case 'PENDING': return '#FFA500';
      case 'PAID': return '#4CAF50';
      case 'CANCELLED': return '#F44336';
      default: return '#999999';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING': return 'Chờ thanh toán';
      case 'PAID': return 'Đã thanh toán';
      case 'CANCELLED': return 'Đã hủy';
      default: return 'Không xác định';
    }
  };

  const navigateToTicketDetail = (ticket: Ticket) => {
    const showName = orderDetails[0]?.ticketType.koiShow.name || "Không xác định";
    const ticketType = orderDetails.find(item => item.id === ticket.id)?.ticketType.name || "Vé thường";
    
    router.push({
      pathname: "/(user)/TicketDetail",
      params: {
        qrCodeUrl: ticket.qrcodeData,
        showName: showName,
        ticketType: ticketType,
        ticketNumber: ticket.id.substring(0, 8).toUpperCase(),
        buyerName: "Người dùng KSMS",
        dateTime: new Date(ticket.expiredDate).toLocaleDateString('vi-VN'),
        venue: "Địa điểm cuộc thi",
      }
    });
  };

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

    return (
      <ScrollView style={styles.scrollView}>
        {/* Trạng thái đơn hàng */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(orderInfo.status) }]}>
            <Text style={styles.statusText}>{getStatusText(orderInfo.status)}</Text>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Thông tin cuộc thi</Text>
          <Text style={styles.showName}>{showName}</Text>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Danh sách vé</Text>
          {orderDetails.map((item, index) => (
            <View key={item.id} style={styles.ticketItem}>
              <View style={styles.ticketInfo}>
                <Text style={styles.ticketName}>{item.ticketType.name}</Text>
                <Text style={styles.ticketPrice}>{item.unitPrice.toLocaleString('vi-VN')} VNĐ</Text>
              </View>
              <View style={styles.ticketQuantity}>
                <Text style={styles.quantityText}>x{item.quantity}</Text>
                <Text style={styles.subtotalText}>
                  {(item.quantity * item.unitPrice).toLocaleString('vi-VN')} VNĐ
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Tổng cộng</Text>
          <Text style={styles.totalAmount}>{calculateTotal().toLocaleString('vi-VN')} VNĐ</Text>
        </View>

        {/* Hiển thị danh sách vé với mã QR khi đơn hàng đã thanh toán */}
        {orderInfo.status.toUpperCase() === 'PAID' && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Vé của bạn</Text>
            
            {loadingTickets ? (
              <ActivityIndicator color="#FFA500" style={{ marginVertical: 20 }} />
            ) : tickets.length > 0 ? (
              tickets.map((ticket, index) => (
                <TouchableOpacity 
                  key={ticket.id} 
                  style={styles.ticketCard}
                  onPress={() => navigateToTicketDetail(ticket)}
                >
                  <View style={styles.ticketCardContent}>
                    <View style={styles.ticketCardInfo}>
                      <Text style={styles.ticketCardTitle}>Mã vé: {ticket.id.substring(0, 8).toUpperCase()}</Text>
                      <Text style={styles.ticketCardStatus}>
                        {ticket.isCheckedIn ? 'Đã sử dụng' : 'Chưa sử dụng'}
                      </Text>
                    </View>
                    
                    <View style={styles.qrPreviewContainer}>
                      {ticket.qrcodeData ? (
                        <Image 
                          source={{ uri: ticket.qrcodeData }} 
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
              ))
            ) : (
              <Text style={styles.emptyTicketsText}>Không có vé nào khả dụng.</Text>
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

      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
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
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
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
    padding: 16,
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
    borderRadius: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    overflow: 'hidden',
  },
  ticketCardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  ticketCardInfo: {
    flex: 1,
    paddingRight: 8,
  },
  ticketCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 6,
  },
  ticketCardStatus: {
    fontSize: 14,
    color: '#666666',
  },
  qrPreviewContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderRadius: 4,
  },
  qrPreview: {
    width: 56,
    height: 56,
    borderRadius: 4,
  },
  qrPlaceholder: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
  },
  viewTicketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#F9F9F9',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  viewTicketText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFA500',
    marginRight: 4,
  },
  emptyTicketsText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 16,
  },
});

export default OrderDetail; 