import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import api from "../../services/api";
import { translateStatus } from "../../utils/statusTranslator"; // Import hàm dịch mới
// --- Interface Definitions ---
interface OrderItem {
  id: string;
  date?: string;
  paymentMethod?: string;
  status?: "pending" | "paid" | "cancelled";
  orderStatus: string;
  orderDate: string;
  totalAmount: number;
  koiShow: {
    id: string;
    name: string;
  };
  transactionCode: string;
}

interface OrderListResponse {
  data: {
    size: number;
    page: number;
    total: number;
    totalPages: number;
    items: OrderItem[];
  };
  statusCode: number;
  message: string;
}

interface OrderCardProps {
  order: OrderItem;
  onPress: (order: OrderItem) => void;
}

// Thêm interface cho OrderDetailItem và Ticket
interface OrderDetailItem {
  id: string;
  quantity: number;
  unitPrice: number;
  ticketType: {
    name: string;
    koiShow: {
      name: string;
    };
  };
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

type RootStackParamList = {
  OrderDetail: { orderId: string };
};

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "OrderDetail"
>;

const { width: screenWidth } = Dimensions.get("window");

const OrderCard: React.FC<OrderCardProps> = ({ order, onPress }) => {
  const [showFullId, setShowFullId] = useState(false);
  const animatedValue = useSharedValue(0);
  // Tính toán chiều rộng màn hình ở cấp độ component
  const currentScreenWidth = Dimensions.get("window").width;
  const maxContainerWidth = currentScreenWidth * 0.9;
  const minContainerWidth = currentScreenWidth * 0.3;

  // Thêm state cho danh sách vé và chi tiết đơn hàng
  const [orderDetails, setOrderDetails] = useState<OrderDetailItem[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [showTickets, setShowTickets] = useState(false);
  const [ticketsExpanded, setTicketsExpanded] = useState(false);

  useEffect(() => {
    // Chỉ tải thông tin vé khi người dùng mở rộng xem vé, không cần kiểm tra status nữa
    if (showTickets && orderDetails.length === 0) {
      fetchOrderDetails();
    }
  }, [showTickets]);

  const fetchOrderDetails = async () => {
    try {
      setLoadingTickets(true);

      // Lấy chi tiết đơn hàng
      const response = await api.get<OrderDetailResponse>(
        `/api/v1/ticket-order/get-order-details/${order.id}`
      );

      if (response.data.statusCode === 200) {
        const orderDetailsData = response.data.data;
        setOrderDetails(orderDetailsData);

        // Sau khi có chi tiết đơn hàng, tải thông tin vé
        fetchTickets(orderDetailsData);
      }
    } catch (err) {
      console.error("Lỗi khi tải chi tiết đơn hàng:", err);
    }
  };

  const fetchTickets = async (details = orderDetails) => {
    try {
      // Kiểm tra nếu details rỗng
      if (details.length === 0) {
        console.log("Không có chi tiết đơn hàng để tải vé");
        setLoadingTickets(false);
        return;
      }

      // Đối với mỗi chi tiết đơn hàng, lấy thông tin vé
      const ticketsPromises = details.map((detail) => {
        return api
          .get<TicketsResponse>(
            `/api/v1/ticket-order/get-all-tickets/${detail.id}`
          )
          .catch((error) => {
            console.error(`Lỗi khi lấy vé cho orderDetailId ${detail.id}:`, error);
            return {
              data: {
                data: [],
                statusCode: 500,
                message: `Lỗi khi lấy vé: ${error.message}`,
              },
            };
          });
      });

      const responses = await Promise.all(ticketsPromises);

      // Gộp tất cả các vé từ các response
      const allTickets = responses.flatMap((response, index) => {
        if (response.data.statusCode === 200 && response.data.data) {
          return response.data.data.map((ticket) => ({
            ...ticket,
            orderDetailId: details[index].id,
          }));
        }
        return [];
      });

      setTickets(allTickets);
    } catch (err) {
      console.error("Lỗi khi tải vé:", err);
    } finally {
      setLoadingTickets(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
      case "PENDING":
        return "#FFA500";
      case "paid":
      case "PAID":
        return "#4CAF50";
      case "cancelled":
      case "CANCELLED":
        return "#F44336";
      default:
        return "#999999";
    }
  };

  // Hàm lấy màu sắc dựa trên trạng thái vé
  const getTicketStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || "";
    switch (statusLower) {
      case "cancelled":
        return "#FF9800"; // Màu cam cho vé đã bị hủy
      case "sold":
        return "#4CAF50"; // Màu xanh lá cho vé chưa sử dụng
      case "checkin":
        return "#FF3B30"; // Màu đỏ cho vé đã sử dụng
      case "refunded":
        return "#2196F3"; // Màu xanh dương cho vé đã hoàn tiền
      default:
        return "#999999"; // Màu xám cho các trạng thái khác
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return `${date.getDate()}/${
      date.getMonth() + 1
    }/${date.getFullYear()} ${date.getHours()}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  const formatOrderId = (id: string) => {
    if (!id) return "N/A";

    const screenWidth = Dimensions.get("window").width;
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

  const navigateToTicketDetail = async (ticket: Ticket) => {
    try {
      if (!ticket || !ticket.qrcodeData) {
        console.error("Thông tin vé không hợp lệ:", ticket);
        alert("Không thể xem chi tiết vé. Vui lòng thử lại sau.");
        return;
      }

      // Tìm orderDetail tương ứng với vé này dựa trên orderDetailId
      const orderDetail = orderDetails.find(
        (detail) => detail.id === ticket.orderDetailId
      );

      const showName = orderDetail?.ticketType.koiShow.name || "Không xác định";
      const ticketType = orderDetail?.ticketType.name || "Không xác định";

      // Đảm bảo qrCodeUrl là chuỗi URI hợp lệ
      let qrCodeUrl = ticket.qrcodeData;

      // Kiểm tra nếu là URL Firebase Storage
      if (qrCodeUrl && qrCodeUrl.includes("firebasestorage.googleapis.com")) {
        // Logic mã hóa URL Firebase giữ nguyên từ OrderDetail.tsx
        const pathStartIndex = qrCodeUrl.indexOf(".com/o/");
        if (pathStartIndex !== -1) {
          const urlPrefix = qrCodeUrl.substring(0, pathStartIndex + 7);
          let urlPath = qrCodeUrl.substring(pathStartIndex + 7);

          const queryParamsIndex = urlPath.indexOf("?");
          let queryParams = "";

          if (queryParamsIndex !== -1) {
            queryParams = urlPath.substring(queryParamsIndex);
            urlPath = urlPath.substring(0, queryParamsIndex);
          }

          const encodedPath = urlPath.replace(/\//g, "%2F");
          qrCodeUrl = urlPrefix + encodedPath + queryParams;
        }
      } else if (
        !qrCodeUrl.startsWith("http") &&
        !qrCodeUrl.startsWith("data:")
      ) {
        qrCodeUrl = `data:image/png;base64,${ticket.qrcodeData}`;
      }

      router.push({
        pathname: "/(user)/TicketDetail",
        params: {
          qrCodeUrl: qrCodeUrl,
          showName: showName,
          ticketType: ticketType,
          buyerName: "Người dùng KSMS", // Giá trị mặc định
          dateTime: new Date(ticket.expiredDate).toLocaleDateString("vi-VN"),
          venue: "Địa điểm cuộc thi",
        },
      });
    } catch (err) {
      console.error("Lỗi khi chuyển hướng đến chi tiết vé:", err);
      alert("Đã xảy ra lỗi khi mở chi tiết vé. Vui lòng thử lại sau.");
    }
  };

  const status = order.orderStatus || order.status || "";
  const orderDate = order.orderDate || order.date;

  // Tạo 2 phiên bản của orderId: dạng rút gọn và dạng đầy đủ
  const shortOrderId = formatOrderId(order.transactionCode);
  const fullOrderId = order.transactionCode.toUpperCase();

  // Xử lý khi người dùng nhấn vào mã vé
  const toggleOrderIdDisplay = () => {
    setShowFullId(!showFullId);
    animatedValue.value = withSpring(showFullId ? 0 : 1, {
      damping: 20,
      stiffness: 90,
    });
  };

  // Style animation cho container của mã vé
  const animatedOrderIdStyle = useAnimatedStyle(() => {
    return {
      maxWidth: interpolate(
        animatedValue.value,
        [0, 1],
        [minContainerWidth, maxContainerWidth] // Sử dụng biến đã tính trước
      ),
      paddingRight: interpolate(
        animatedValue.value,
        [0, 1],
        [8, 16] // Thêm padding khi mở rộng
      ),
    };
  });

  // Style animation cho text mã vé
  const animatedOrderIdTextStyle = useAnimatedStyle(() => {
    return {
      fontSize: interpolate(
        animatedValue.value,
        [0, 1],
        [16, 14] // Thu nhỏ font chữ khi hiển thị mã đầy đủ
      ),
    };
  });

  const navigation = useNavigation<NavigationProp>();

  const handleViewDetail = () => {
    navigation.navigate("OrderDetail", { orderId: order.id });
  };

  // Hàm để toggle hiển thị danh sách vé
  const toggleTicketsDisplay = () => {
    setShowTickets(!showTickets);
    // Tải dữ liệu vé nếu chưa có, không quan tâm đến status
    if (!showTickets && tickets.length === 0) {
      fetchOrderDetails();
    }
  };

  // Hàm toggle mở rộng danh sách vé
  const toggleTicketsExpanded = () => {
    setTicketsExpanded(!ticketsExpanded);
  };

  return (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={handleViewDetail}
      activeOpacity={0.7}>
      <View style={styles.orderHeader}>
        <Animated.View style={[styles.orderIdContainer, animatedOrderIdStyle]}>
          <Text style={styles.orderIdLabel}>Mã đơn hàng</Text>
          <TouchableOpacity onPress={toggleOrderIdDisplay} activeOpacity={0.6}>
            <Animated.Text style={[styles.orderId, animatedOrderIdTextStyle]}>
              {showFullId ? fullOrderId : shortOrderId}
            </Animated.Text>
            <View style={styles.idTooltip}>
              <Text style={styles.idTooltipText}>
                {showFullId ? "Thu gọn" : "Xem đầy đủ"}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(status) },
          ]}>
          <Text style={styles.statusText}>{translateStatus(status)}</Text>
        </View>
      </View>

      <View style={styles.orderDetailContainer}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderLabel}>Ngày đặt:</Text>
          <Text style={styles.orderValue}>{formatDate(orderDate)}</Text>
        </View>

        <View style={styles.orderInfo}>
          <Text style={styles.orderLabel}>Tổng tiền:</Text>
          <Text style={styles.orderAmount}>
            {order.totalAmount?.toLocaleString("vi-VN")} VNĐ
          </Text>
        </View>
      </View>

      {/* Toggle nút hiển thị vé cho tất cả đơn hàng, không phụ thuộc vào status */}
      <TouchableOpacity
        style={styles.showTicketsButton}
        onPress={toggleTicketsDisplay}
        activeOpacity={0.7}
      >
        <Text style={styles.showTicketsText}>
          {showTickets ? "Ẩn danh sách vé" : "Hiển thị danh sách vé"}
        </Text>
        <Ionicons
          name={showTickets ? "chevron-up" : "chevron-down"}
          size={18}
          color="#FFA500"
        />
      </TouchableOpacity>

      {/* Hiển thị danh sách vé khi showTickets = true, không phụ thuộc vào status */}
      {showTickets && (
        <View style={styles.ticketsContainer}>
          {loadingTickets ? (
            <View style={styles.loadingTicketsContainer}>
              <ActivityIndicator size="small" color="#FFA500" />
              <Text style={styles.loadingTicketsText}>Đang tải vé...</Text>
            </View>
          ) : orderDetails.length === 0 ? (
            <Text style={styles.noTicketsText}>
              {status.toLowerCase() === 'pending' ?
                "Đơn hàng chưa thanh toán. Vui lòng thanh toán để nhận vé." :
                "Không tìm thấy thông tin vé"}
            </Text>
          ) : (
            <>
              {/* Hiển thị danh sách vé theo loại vé */}
              {orderDetails.map((detail, index) => (
                <View key={detail.id} style={styles.ticketTypeItem}>
                  <View style={styles.ticketTypeHeader}>
                    <Text style={styles.ticketTypeName}>{detail.ticketType.name}</Text>
                  </View>

                  <View style={styles.ticketTypeDetails}>
                    <View style={styles.ticketDetailRow}>
                      <Text style={styles.ticketDetailLabel}>Số lượng:</Text>
                      <Text style={styles.ticketDetailValue}>{detail.quantity}</Text>
                    </View>

                    <View style={styles.ticketDetailRow}>
                      <Text style={styles.ticketDetailLabel}>Giá vé:</Text>
                      <Text style={styles.ticketDetailValue}>
                        {detail.unitPrice.toLocaleString("vi-VN")} VNĐ
                      </Text>
                    </View>

                    <View style={styles.ticketDetailRow}>
                      <Text style={styles.ticketDetailLabel}>Thành tiền:</Text>
                      <Text style={styles.ticketDetailTotal}>
                        {(detail.quantity * detail.unitPrice).toLocaleString("vi-VN")} VNĐ
                      </Text>
                    </View>
                  </View>

                  {index < orderDetails.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </>
          )}
        </View>
      )}

      <View style={styles.viewDetailContainer}>
        <Text style={styles.viewDetailText}>Xem chi tiết</Text>
        <Ionicons name="chevron-forward" size={18} color="#FFA500" />
      </View>
    </TouchableOpacity>
  );
};

// --- Main Component ---
const MyOrders: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "all" | "pending" | "paid" | "cancelled"
  >("all");
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const tabWidth = screenWidth / 4;
  const translateX = useSharedValue(0);

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const fetchOrders = async (pageToLoad = 1, shouldRefresh = false) => {
    try {
      if (shouldRefresh) {
        setRefreshing(true);
      } else if (pageToLoad === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      setError("");

      // Determine if we need to add status filter
      let endpoint = `/api/v1/ticket-order/get-paging-orders?page=${pageToLoad}&size=100`;
      if (activeTab !== "all") {
        endpoint += `&orderStatus=${activeTab}`;
      }

      const response = await api.get<OrderListResponse>(endpoint);

      if (response.data.statusCode === 200) {
        const newItems = response.data.data.items;

        if (shouldRefresh || pageToLoad === 1) {
          setOrders(newItems);
        } else {
          setOrders((prevOrders) => [...prevOrders, ...newItems]);
        }

        setTotalPages(response.data.data.totalPages);
        setPage(pageToLoad);
      } else {
        setError("Không thể tải dữ liệu. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError("Đã xảy ra lỗi khi tải dữ liệu.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleTabChange = (tab: "all" | "pending" | "paid" | "cancelled") => {
    setActiveTab(tab);

    // Calculate translateX based on tab index
    let tabIndex = 0;
    switch (tab) {
      case "all":
        tabIndex = 0;
        break;
      case "pending":
        tabIndex = 1;
        break;
      case "paid":
        tabIndex = 2;
        break;
      case "cancelled":
        tabIndex = 3;
        break;
    }

    translateX.value = withSpring(tabIndex * tabWidth, {
      damping: 20,
      stiffness: 90,
      mass: 1,
    });
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: tabWidth,
  }));

  const handleOrderPress = (order: OrderItem) => {
    // Navigate to OrderDetail with order ID and status
    router.push({
      pathname: "/(user)/OrderDetail",
      params: {
        orderId: order.id,
        status: order.orderStatus || order.status || "PENDING",
      },
    });
  };

  const handleRefresh = () => {
    if (!refreshing) { // Tránh các lần refresh liên tiếp
      fetchOrders(1, true);
    }
  };

  const handleLoadMore = () => {
    if (totalPages > page && !loadingMore) {
      fetchOrders(page + 1);
    }
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
            onPress={() => fetchOrders(1)}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (orders.length === 0) {
      return renderEmptyState();
    }

    return (
      <FlatList
        data={orders}
        renderItem={({ item }) => (
          <OrderCard key={item.id} order={item} onPress={handleOrderPress} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollViewContent}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#FFA500"]}
            tintColor="#FFA500"
            title="Đang cập nhật..."
            titleColor="#666"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderText}>
              {orders.length > 0
                ? `Đang hiển thị ${orders.length} đơn hàng`
                : ""}
            </Text>
          </View>
        }
      />
    );
  };

  const renderEmptyState = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="receipt-outline" size={80} color="#CCCCCC" />
        <Text style={styles.emptyText}>Không có đơn hàng nào</Text>
        <Text style={styles.emptySubtext}>
          {activeTab === "all"
            ? "Đơn hàng của bạn sẽ được hiển thị ở đây sau khi bạn mua vé"
            : activeTab === "pending"
            ? "Bạn không có đơn hàng nào đang chờ thanh toán"
            : activeTab === "paid"
            ? "Bạn không có đơn hàng nào đã thanh toán"
            : "Bạn không có đơn hàng nào đã hủy"}
        </Text>
        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => router.back()}>
          <Text style={styles.browseButtonText}>Quay lại trang chủ</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#FFA500" />
        <Text style={styles.footerText}>Đang tải thêm...</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => handleTabChange("all")}>
            <Text
              style={[
                styles.tabText,
                activeTab === "all" && styles.activeTabText,
              ]}>
              Tất cả
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => handleTabChange("pending")}>
            <Text
              style={[
                styles.tabText,
                activeTab === "pending" && styles.activeTabText,
              ]}>
              Chờ thanh toán
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => handleTabChange("paid")}>
            <Text
              style={[
                styles.tabText,
                activeTab === "paid" && styles.activeTabText,
              ]}>
              Đã thanh toán
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => handleTabChange("cancelled")}>
            <Text
              style={[
                styles.tabText,
                activeTab === "cancelled" && styles.activeTabText,
              ]}>
              Đã hủy
            </Text>
          </TouchableOpacity>
          <Animated.View style={[styles.indicator, indicatorStyle]} />
          <View style={styles.bottomBorder} />
        </View>

        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 0, // Loại bỏ padding phía trên
  },
  container: {
    flex: 1,
  },
  // Header Styles
  header: {
    width: "100%",
    height: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  homeText: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "700",
    color: "#030303",
  },
  headerTitle: {
    fontFamily: "Poppins",
    fontSize: 18,
    fontWeight: "700",
    color: "#030303",
    flex: 1, // Add this to center the title
    textAlign: "center", // Center the text
  },
  headerRightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16, // Consistent gap
  },
  headerIconButton: {
    padding: 4,
  },
  // Tab Styles
  tabContainer: {
    flexDirection: "row",
    height: 55,
    position: "relative",
  },
  tab: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    opacity: 0.5,
  },
  activeTabText: {
    color: "#FFA500",
    opacity: 1,
  },
  indicator: {
    height: 3,
    backgroundColor: "#FFA500",
    position: "absolute",
    bottom: 0,
    left: 0,
    borderRadius: 1.5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  bottomBorder: {
    width: "100%",
    height: 1,
    backgroundColor: "#E5E5E5",
    position: "absolute",
    bottom: 0,
  },

  // Loading and Error Styles
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#FFA500",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999999",
    textAlign: "center",
    marginTop: 8,
  },
  browseButton: {
    backgroundColor: "#FFA500",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  browseButtonText: {
    color: "white",
    fontWeight: "bold",
  },

  // ScrollView and Order List Styles
  scrollViewContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  listHeader: {
    width: "100%",
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  listHeaderText: {
    fontSize: 15,
    color: "#666666",
    textAlign: "center",
    fontWeight: "500",
  },
  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    width: "100%",
  },
  footerText: {
    fontSize: 15,
    color: "#666666",
    marginLeft: 8,
    fontWeight: "500",
  },

  // New OrderCard styles
  orderCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  orderIdContainer: {
    flex: 1,
    overflow: "hidden",
  },
  orderIdLabel: {
    fontSize: 13,
    color: "#666666",
    marginBottom: 2,
  },
  orderId: {
    fontSize: 16,
    color: "#000000",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  idTooltip: {
    position: "absolute",
    right: 0,
    bottom: -16,
    opacity: 0.6,
  },
  idTooltipText: {
    fontSize: 10,
    color: "#666",
    fontStyle: "italic",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  orderDetailContainer: {
    borderTopWidth: 0.5,
    borderTopColor: "#E0E0E0",
    paddingTop: 12,
    paddingBottom: 4,
  },
  orderInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderLabel: {
    fontSize: 13,
    color: "#666666",
  },
  orderValue: {
    fontSize: 13,
    color: "#333333",
    fontWeight: "500",
    marginLeft: 8,
  },
  orderAmount: {
    fontSize: 14,
    color: "#FFA500",
    fontWeight: "600",
    marginLeft: 8,
  },
  viewDetailContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: "#E0E0E0",
  },
  viewDetailText: {
    fontSize: 13,
    color: "#FFA500",
    fontWeight: "500",
    marginRight: 2,
  },
  // Thêm styles mới cho phần hiển thị danh sách vé
  showTicketsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: "#E0E0E0",
    marginTop: 8,
  },
  showTicketsText: {
    fontSize: 14,
    color: "#FFA500",
    fontWeight: "500",
    marginRight: 4,
  },
  ticketsContainer: {
    marginTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: "#E0E0E0",
    paddingTop: 10,
  },
  loadingTicketsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  loadingTicketsText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  noTicketsText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    padding: 10,
  },
  ticketTypeItem: {
    padding: 10,
    borderRadius: 6,
    backgroundColor: "#F9F9F9",
    marginBottom: 8,
  },
  ticketTypeHeader: {
    marginBottom: 8,
  },
  ticketTypeName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  ticketTypeDetails: {
    marginBottom: 4,
  },
  ticketDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  ticketDetailLabel: {
    fontSize: 13,
    color: "#666",
  },
  ticketDetailValue: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
  },
  ticketDetailTotal: {
    fontSize: 14,
    color: "#FFA500",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 8,
  },
});

export default MyOrders;
