import {
  AntDesign,
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  NotificationItem as ApiNotificationItem,
  NotificationType as ApiNotificationType,
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../services/notificationService";

// Hàm log debug
const logDebug = (message: string, data?: any) => {
  if (__DEV__) {
    if (data) {
      console.log(`[DEBUG][Notification] ${message}`, data);
    } else {
      console.log(`[DEBUG][Notification] ${message}`);
    }
  }
};

// Định nghĩa các loại thông báo UI khớp với API
enum NotificationType {
  Registration = "Registration",
  System = "System",
  Show = "Show",
  Payment = "Payment",
}

// Định nghĩa các route hợp lệ
type ValidRoute =
  | "/(tabs)/shows/KoiShowsPage"
  | "/(tabs)/shows/KoiRegistration"
  | "/(tabs)/shows/BuyTickets"
  | "/(tabs)/shows/AwardScreen"
  | "/(tabs)/shows/LiveStream"
  | "/(tabs)/home/homepage"
  | "/(tabs)/home/UserMenu";

// Interface cho dữ liệu thông báo UI
interface Notification {
  id: string;
  icon: string;
  title: string;
  description: string;
  type: NotificationType;
  date: string; // ISO date string
  isRead: boolean;
  actionUrl?: ValidRoute; // Optional URL or route to navigate to
}

// Hàm chuyển đổi từ thông báo API sang UI
const mapApiNotificationToUI = (
  apiNotification: ApiNotificationItem
): Notification => {
  logDebug(
    `Chuyển đổi thông báo từ API sang UI - ID: ${apiNotification.id}, Type: ${apiNotification.type}`
  );

  let actionUrl: ValidRoute | undefined;

  // Xác định URL hành động dựa trên loại thông báo và nội dung
  switch (apiNotification.type) {
    case "Registration":
      // Kiểm tra nội dung để xác định chính xác route
      if (apiNotification.content.includes("check in")) {
        actionUrl = "/(tabs)/shows/KoiShowsPage";
      } else if (apiNotification.content.includes("chấp nhận")) {
        actionUrl = "/(tabs)/shows/KoiShowsPage";
      } else {
        actionUrl = "/(tabs)/shows/KoiRegistration";
      }
      break;
    case "Show":
      actionUrl = "/(tabs)/shows/KoiShowsPage";
      break;
    case "Payment":
      actionUrl = "/(tabs)/shows/BuyTickets";
      break;
    default:
      actionUrl = undefined;
  }

  // Ánh xạ icon dựa trên loại thông báo
  let icon =
    "https://dashboard.codeparrot.ai/api/image/Z79HGa7obB3a4bxe/group.png"; // Default icon
  switch (apiNotification.type) {
    case "Registration":
      // Phân loại icon Registration chi tiết hơn dựa vào nội dung
      if (apiNotification.content.includes("check in")) {
        icon =
          "https://dashboard.codeparrot.ai/api/image/Z79HGa7obB3a4bxe/group-4.png";
      } else if (apiNotification.content.includes("chấp nhận")) {
        icon =
          "https://dashboard.codeparrot.ai/api/image/Z79HGa7obB3a4bxe/group-5.png";
      } else {
        icon =
          "https://dashboard.codeparrot.ai/api/image/Z79HGa7obB3a4bxe/group-2.png";
      }
      break;
    case "Payment":
      icon =
        "https://dashboard.codeparrot.ai/api/image/Z79HGa7obB3a4bxe/group-3.png";
      break;
    case "Show":
      icon =
        "https://dashboard.codeparrot.ai/api/image/Z79HGa7obB3a4bxe/group-4.png";
      break;
    case "System":
      icon =
        "https://dashboard.codeparrot.ai/api/image/Z79HGa7obB3a4bxe/group-5.png";
      break;
  }

  const uiNotification = {
    id: apiNotification.id,
    icon: icon,
    title: apiNotification.title,
    description: apiNotification.content,
    type: apiNotification.type as NotificationType,
    date: apiNotification.sentDate,
    isRead: apiNotification.isRead,
    actionUrl: actionUrl,
  };

  logDebug(`Kết quả chuyển đổi:`, uiNotification);
  return uiNotification;
};

interface NotificationItemProps {
  notification: Notification;
  onPress: (notification: Notification) => void;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
  onMarkAsRead,
  onDelete,
}) => {
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [bgColor, setBgColor] = useState(
    notification.isRead ? "#F9F9F9" : "#FFFFFF"
  );
  const [showDeleteButton, setShowDeleteButton] = useState(false);

  // Format the date to a more readable format
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();

    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return `Hôm nay lúc ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    // If yesterday, show "Yesterday"
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Hôm qua lúc ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    // Otherwise show date
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  // Get icon background color based on notification type
  const getBackgroundColor = (type: NotificationType): string => {
    switch (type) {
      case NotificationType.Show:
        return "#4A90E2";
      case NotificationType.Registration:
        return "#50C878";
      case NotificationType.Payment:
        return "#F5A623";
      case NotificationType.System:
        return "#9B59B6";
      default:
        return "#95A5A6";
    }
  };

  // Create animation for press effect - chỉ sử dụng native animation
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 20,
    }).start();

    // Thay vì dùng animation cho màu nền, cập nhật state trực tiếp
    setBgColor("#F0F7FF");
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();

    // Khôi phục màu nền
    setBgColor(notification.isRead ? "#F9F9F9" : "#FFFFFF");
  };

  // Xử lý nhấn giữ để hiển thị nút xóa
  const handleLongPress = () => {
    setShowDeleteButton(true);
  };

  // Xử lý xóa thông báo
  const handleDelete = () => {
    Alert.alert(
      "Xóa thông báo",
      "Bạn có chắc chắn muốn xóa thông báo này không?",
      [
        {
          text: "Hủy",
          style: "cancel",
          onPress: () => setShowDeleteButton(false),
        },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => {
            setShowDeleteButton(false);
            onDelete(notification.id);
          },
        },
      ]
    );
  };

  // Hàm lấy icon dựa trên loại thông báo
  const getIconComponent = (type: NotificationType) => {
    switch (type) {
      case NotificationType.Show:
        return <Ionicons name="calendar" size={22} color="#FFFFFF" />;
      case NotificationType.Registration:
        if (notification.description?.includes("check in")) {
          return <MaterialIcons name="done-all" size={22} color="#FFFFFF" />;
        } else if (notification.description?.includes("chấp nhận")) {
          return <AntDesign name="checkcircleo" size={22} color="#FFFFFF" />;
        } else {
          return (
            <FontAwesome5 name="clipboard-list" size={20} color="#FFFFFF" />
          );
        }
      case NotificationType.Payment:
        return <MaterialIcons name="payment" size={22} color="#FFFFFF" />;
      case NotificationType.System:
        return <Ionicons name="settings-sharp" size={22} color="#FFFFFF" />;
      default:
        return <Ionicons name="notifications" size={22} color="#FFFFFF" />;
    }
  };

  return (
    <Pressable
      style={styles.itemContainer}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => {
        if (showDeleteButton) {
          setShowDeleteButton(false);
          return;
        }
        logDebug(
          `Thông báo được nhấn - ID: ${notification.id}, Title: ${notification.title}`
        );
        onPress(notification);
        if (!notification.isRead) {
          onMarkAsRead(notification.id);
        }
      }}
      onLongPress={handleLongPress}
      delayLongPress={500}
      android_ripple={{ color: "rgba(0, 0, 0, 0.05)", borderless: false }}>
      <Animated.View
        style={[
          styles.itemContent,
          {
            transform: [{ scale: scaleAnim }],
            backgroundColor: bgColor,
            borderRadius: 12,
          },
        ]}>
        <View
          style={[
            styles.iconBackground,
            { backgroundColor: getBackgroundColor(notification.type) },
          ]}>
          {getIconComponent(notification.type)}
        </View>
        <View style={styles.itemTextContainer}>
          <Text
            style={[
              styles.itemTitle,
              notification.isRead ? styles.itemTitleRead : null,
            ]}
            numberOfLines={1}>
            {notification.title}
          </Text>
          {notification.description ? (
            <Text
              style={[
                styles.itemDescription,
                notification.isRead ? styles.itemDescriptionRead : null,
              ]}
              numberOfLines={2}>
              {notification.description}
            </Text>
          ) : null}
          <Text style={styles.itemDate}>{formatDate(notification.date)}</Text>
        </View>
        {!notification.isRead && <View style={styles.unreadIndicator} />}

        {/* Hiển thị nút xóa hoặc nút xem chi tiết */}
        {showDeleteButton ? (
          <Pressable
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && Platform.OS === "ios" ? { opacity: 0.7 } : {},
            ]}
            android_ripple={{
              color: "rgba(231, 76, 60, 0.1)",
              borderless: true,
            }}
            onPress={handleDelete}>
            <AntDesign name="delete" size={20} color="#E74C3C" />
          </Pressable>
        ) : (
          <Feather
            name="chevron-right"
            size={20}
            color="#999999"
            style={styles.itemChevron}
          />
        )}
      </Animated.View>
    </Pressable>
  );
};

const Notifications: React.FC = () => {
  logDebug("Rendering Notifications component");

  const [userId, setUserId] = useState<string>("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>("unread");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const emptyIconScale = useRef(new Animated.Value(1)).current;
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  // Lấy userId từ AsyncStorage khi component mount
  useEffect(() => {
    logDebug("useEffect - Lấy userId từ AsyncStorage");

    const getUserId = async () => {
      try {
        const id = await AsyncStorage.getItem("userId");
        logDebug(`Lấy userId từ AsyncStorage: ${id}`);

        if (id) {
          setUserId(id);
        } else {
          logDebug("Không tìm thấy userId trong AsyncStorage");
          setError("Vui lòng đăng nhập để xem thông báo");
          setLoading(false);
        }
      } catch (err) {
        logDebug("Lỗi khi lấy thông tin người dùng:", err);
        console.error("Lỗi khi lấy thông tin người dùng:", err);
        setError("Không thể lấy thông tin người dùng");
        setLoading(false);
      }
    };

    getUserId();
  }, []);

  // Fetch notifications
  const fetchNotifications = async (
    page: number = 1,
    filterType?: string,
    shouldAppend: boolean = false
  ) => {
    logDebug(
      `Bắt đầu fetch thông báo - Page: ${page}, Filter: ${
        filterType || "all"
      }, Append: ${shouldAppend}`
    );

    if (page > 1 && shouldAppend) {
      setIsLoadingMore(true);
    }

    try {
      setError(null);

      if (!userId) {
        logDebug("Không tìm thấy userId, không thể fetch thông báo");
        setError("Không tìm thấy ID người dùng");
        setLoading(false);
        return;
      }

      const params: {
        page: number;
        size: number;
        notificationType?: ApiNotificationType;
        isRead?: boolean;
      } = {
        page: page,
        size: 10,
      };

      // Xử lý các bộ lọc dựa trên API
      if (filterType === "unread") {
        // Tab "Chưa đọc" -> isRead = false
        logDebug("Áp dụng bộ lọc chưa đọc, isRead=false");
        params.isRead = false;
      } else if (filterType === "read") {
        // Tab "Đã đọc" -> isRead = true
        logDebug("Áp dụng bộ lọc đã đọc, isRead=true");
        params.isRead = true;
      }
      // Nếu là bộ lọc theo loại thông báo
      else if (filterType && filterType !== "all") {
        logDebug(`Áp dụng bộ lọc loại thông báo: ${filterType}`);
        params.notificationType = filterType as ApiNotificationType;
      }

      const apiUrl = `/notification/get-page/${userId}`;
      logDebug(`Gọi API: ${apiUrl} với tham số:`, params);

      try {
        const response = await getNotifications(userId, params);
        logDebug(`Nhận phản hồi từ API:`, response);

        // Log chi tiết dữ liệu thông báo nhận được
        logDebug(
          `Dữ liệu thông báo nhận được:`,
          JSON.stringify(response.data.items, null, 2)
        );

        if (response.statusCode === 200) {
          logDebug(
            `Tổng số thông báo: ${response.data.total}, Trang: ${response.data.page}/${response.data.totalPages}`
          );

          // Map dữ liệu từ API sang UI
          let mappedNotifications = response.data.items.map(
            mapApiNotificationToUI
          );

          // Sắp xếp thông báo: chưa đọc ở trên cùng
          // Chỉ sắp xếp khi không trong tab đã đọc/chưa đọc (vì những tab đó đã lọc sẵn)
          if (filterType !== "unread" && filterType !== "read") {
            logDebug(
              "Sắp xếp thông báo: thông báo chưa đọc hiển thị ở trên cùng"
            );
            mappedNotifications = mappedNotifications.sort((a, b) => {
              // Thông báo chưa đọc ưu tiên lên trên
              if (a.isRead !== b.isRead) {
                return a.isRead ? 1 : -1;
              }
              // Nếu cùng trạng thái đọc, thì sắp xếp theo thời gian mới nhất lên trên
              return new Date(b.date).getTime() - new Date(a.date).getTime();
            });
          } else {
            // Ngay cả khi đã lọc theo trạng thái đọc, vẫn sắp xếp theo thời gian
            logDebug("Sắp xếp thông báo theo thời gian (mới nhất lên trên)");
            mappedNotifications = mappedNotifications.sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
          }

          // Nếu nạp thêm, thêm vào danh sách hiện có
          if (shouldAppend && page > 1) {
            // Khi nạp thêm, vẫn phải sắp xếp lại toàn bộ danh sách
            setNotifications((prev) => {
              const combined = [...prev, ...mappedNotifications];

              // Nếu không ở tab đã đọc/chưa đọc, sắp xếp lại
              if (filterType !== "unread" && filterType !== "read") {
                return combined.sort((a, b) => {
                  // Thông báo chưa đọc ưu tiên lên trên
                  if (a.isRead !== b.isRead) {
                    return a.isRead ? 1 : -1;
                  }
                  // Nếu cùng trạng thái đọc, thì sắp xếp theo thời gian
                  return (
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                  );
                });
              } else {
                // Khi ở tab đã đọc/chưa đọc, chỉ sắp xếp theo thời gian
                return combined.sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                );
              }
            });
          } else {
            setNotifications(mappedNotifications);
          }

          setCurrentPage(response.data.page);
          setTotalPages(response.data.totalPages);

          logDebug(
            `Đã ánh xạ và sắp xếp ${mappedNotifications.length} thông báo vào UI`
          );
        } else {
          logDebug(
            `API trả về mã lỗi: ${response.statusCode}, Message: ${response.message}`
          );
          setError(
            `Không thể tải thông báo: ${
              response.message || "Lỗi không xác định"
            }`
          );
        }
      } catch (axiosError: any) {
        // Log chi tiết lỗi từ Axios
        const status = axiosError.response?.status;
        const statusText = axiosError.response?.statusText;
        const responseData = axiosError.response?.data;
        const requestUrl = axiosError.config?.url;
        const requestMethod = axiosError.config?.method;

        logDebug("Chi tiết lỗi API:", {
          status,
          statusText,
          requestUrl,
          requestMethod,
          responseData,
          message: axiosError.message,
          requestParams: params,
        });

        console.error("Lỗi khi gọi API:", axiosError);
        throw axiosError; // Ném lại lỗi để xử lý ở catch ngoài
      }
    } catch (err: any) {
      // Log thông tin chi tiết về lỗi
      logDebug("Lỗi khi tải thông báo:", err);
      logDebug("Stack trace:", err.stack);
      console.error("Lỗi khi tải thông báo:", err);

      // Hiển thị lỗi chi tiết
      const errorMsg = err.message || "Không thể kết nối với máy chủ";
      setError(`Lỗi: ${errorMsg}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  // Load notifications on component mount
  useEffect(() => {
    if (userId) {
      logDebug(
        `useEffect - userId thay đổi: ${userId}, gọi fetchNotifications`
      );
      fetchNotifications();
    }
  }, [userId]);

  // Load notifications when filter changes
  useEffect(() => {
    if (userId) {
      logDebug(
        `useEffect - filter thay đổi: ${filter}, gọi fetchNotifications`
      );
      setLoading(true);
      fetchNotifications(1, filter === "all" ? undefined : filter);
    }
  }, [filter, userId]);

  // Xử lý nhận thông báo từ SignalR
  useEffect(() => {
    if (!userId) return;

    logDebug("Thiết lập lắng nghe thông báo từ SignalR");

    // Đảm bảo kết nối SignalR đang hoạt động
    const setupSignalR = async () => {
      try {
        // Tắt Toast khi đang ở màn hình Notification để tránh hiển thị trùng lặp
        signalRService.setShowToast(false);

        // Đảm bảo kết nối SignalR đang hoạt động
        await signalRService.ensureConnection();

        // Đăng ký callback để nhận thông báo mới
        const unsubscribe = signalRService.onNotification((notification) => {
          logDebug("Nhận được thông báo mới từ SignalR:", notification);

          // Chuyển đổi thông báo SignalR sang định dạng UI
          const newNotification: Notification = {
            id: notification.id,
            title: notification.title,
            description: notification.message,
            type: notification.type as NotificationType,
            date: notification.timestamp.toString(), // SignalR trả về timestamp dạng Date
            isRead: false,
            icon: getIconForNotificationType(
              notification.type as NotificationType
            ),
            actionUrl: getActionUrlForNotificationType(
              notification.type as NotificationType,
              notification.message
            ),
          };

          // Thêm thông báo mới vào đầu danh sách (chỉ khi đang ở tab phù hợp)
          setNotifications((prevNotifications) => {
            // Kiểm tra nếu thông báo đã tồn tại
            if (prevNotifications.some((n) => n.id === notification.id)) {
              return prevNotifications;
            }

            // Chỉ thêm thông báo mới khi đang ở tab phù hợp
            if (
              filter === "all" ||
              filter === "unread" ||
              filter === notification.type
            ) {
              // Thêm thông báo mới vào đầu danh sách
              return [newNotification, ...prevNotifications];
            }

            // Không thêm thông báo nếu đang ở tab không phù hợp
            return prevNotifications;
          });

          // Cập nhật trạng thái có thông báo mới
          setHasNewNotifications(true);
        });

        // Cleanup khi component unmount
        return () => {
          unsubscribe();
          // Bật lại Toast khi rời khỏi màn hình Notification
          signalRService.setShowToast(true);
          logDebug("Đã hủy đăng ký lắng nghe thông báo SignalR");
        };
      } catch (error) {
        logDebug("Lỗi khi thiết lập SignalR:", error);
        console.error("Lỗi khi thiết lập SignalR:", error);
      }
    };

    setupSignalR();

    return () => {
      // Cleanup sẽ được xử lý trong hàm setupSignalR
      logDebug("Component unmount, cleanup SignalR listeners");
    };
  }, [userId, filter]);

  // Hàm hỗ trợ xác định icon cho loại thông báo
  const getIconForNotificationType = (type: NotificationType): string => {
    switch (type) {
      case NotificationType.Registration:
        return "https://dashboard.codeparrot.ai/api/image/Z79HGa7obB3a4bxe/group-2.png";
      case NotificationType.Payment:
        return "https://dashboard.codeparrot.ai/api/image/Z79HGa7obB3a4bxe/group-3.png";
      case NotificationType.Show:
        return "https://dashboard.codeparrot.ai/api/image/Z79HGa7obB3a4bxe/group-4.png";
      case NotificationType.System:
        return "https://dashboard.codeparrot.ai/api/image/Z79HGa7obB3a4bxe/group-5.png";
      default:
        return "https://dashboard.codeparrot.ai/api/image/Z79HGa7obB3a4bxe/group.png";
    }
  };

  // Hàm hỗ trợ xác định URL hành động cho loại thông báo
  const getActionUrlForNotificationType = (
    type: NotificationType,
    content: string
  ): ValidRoute | undefined => {
    switch (type) {
      case NotificationType.Registration:
        // Kiểm tra nội dung để xác định chính xác route
        if (content.includes("check in")) {
          return "/(tabs)/shows/KoiShowsPage";
        } else if (content.includes("chấp nhận")) {
          return "/(tabs)/shows/KoiShowsPage";
        } else {
          return "/(tabs)/shows/KoiRegistration";
        }
      case NotificationType.Show:
        return "/(tabs)/shows/KoiShowsPage";
      case NotificationType.Payment:
        return "/(tabs)/shows/BuyTickets";
      default:
        return undefined;
    }
  };

  // Handle refresh
  const onRefresh = () => {
    logDebug("onRefresh - Làm mới danh sách thông báo");
    setRefreshing(true);
    fetchNotifications(1, filter === "all" ? undefined : filter);
  };

  // Handle notification press
  const handleNotificationPress = async (notification: Notification) => {
    logDebug(
      `handleNotificationPress - ID: ${notification.id}, ActionUrl: ${notification.actionUrl}`
    );

    // Hiển thị thông tin chi tiết thông báo trước khi chuyển hướng
    const showNotificationDetails = () => {
      // Hiển thị modal hoặc alert tùy thuộc vào nội dung
      if (notification.description && notification.description.length > 50) {
        // Hiển thị modal cho nội dung dài
        Alert.alert(
          notification.title,
          notification.description,
          [
            {
              text: "Đóng",
              style: "cancel",
            },
            notification.actionUrl
              ? {
                  text: "Xem chi tiết",
                  onPress: () => {
                    logDebug(`Chuyển hướng đến: ${notification.actionUrl}`);
                    router.push(notification.actionUrl as any);
                  },
                }
              : undefined,
          ].filter(Boolean) as any[]
        );
      } else if (notification.actionUrl) {
        // Chuyển hướng trực tiếp cho thông báo có actionUrl và nội dung ngắn
        logDebug(`Chuyển hướng đến: ${notification.actionUrl}`);
        router.push(notification.actionUrl as any);
      } else {
        // Hiển thị alert đơn giản cho thông báo không có actionUrl
        Alert.alert(notification.title, notification.description, [
          { text: "OK" },
        ]);
      }
    };

    // Hiệu ứng chuyển đổi trạng thái và cập nhật UI
    if (!notification.isRead) {
      // Cập nhật UI ngay lập tức với optimistic update
      setNotifications((prevNotifications) =>
        prevNotifications.map((n) =>
          n.id === notification.id ? { ...n, isRead: true } : n
        )
      );

      // Hiển thị chi tiết thông báo
      showNotificationDetails();

      try {
        // Gọi API để đánh dấu đã đọc trong background
        logDebug(`Gọi API đánh dấu đã đọc - ID: ${notification.id}`);
        const result = await markNotificationAsRead(notification.id);

        // Xử lý kết quả từ API
        if (result.success) {
          logDebug(
            `Đánh dấu thông báo đã đọc thành công - ID: ${notification.id}`
          );
        } else {
          // Log lỗi nhưng không cần hiển thị cho người dùng
          console.warn(
            `Không thể đánh dấu thông báo đã đọc: ${result.message}`
          );
        }
      } catch (error: any) {
        // Xử lý lỗi một cách im lặng, không làm gián đoạn UX
        console.error(
          "Lỗi khi đánh dấu thông báo đã đọc:",
          error?.message || error
        );
        logDebug(`Lỗi chi tiết: ${JSON.stringify(error)}`);
      }
    } else {
      // Đối với thông báo đã đọc, chỉ hiển thị chi tiết
      showNotificationDetails();
    }
  };

  // Mark notification as read with animation
  const markAsRead = async (id: string) => {
    logDebug(`markAsRead - Đánh dấu thông báo đã đọc, ID: ${id}`);

    try {
      // Tìm thông báo cần đánh dấu đã đọc
      const notificationToMark = notifications.find((n) => n.id === id);
      if (!notificationToMark) {
        logDebug(`Không tìm thấy thông báo với ID: ${id}`);
        return;
      }

      // Cập nhật UI với optimistic update
      // Nếu đang ở tab "Chưa đọc", sử dụng hiệu ứng fade-out trước khi loại bỏ
      if (filter === "unread") {
        logDebug(`Đang ở tab "Chưa đọc", loại bỏ thông báo với hiệu ứng`);

        // Cập nhật UI để hiển thị thông báo đã đọc trước khi loại bỏ
        setNotifications((prevNotifications) =>
          prevNotifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          )
        );

        // Sau một khoảng thời gian ngắn, loại bỏ thông báo khỏi danh sách
        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 300);
      } else if (filter === "read") {
        // Nếu đang ở tab "Đã đọc", không cần thay đổi gì
        logDebug(`Đang ở tab "Đã đọc", giữ nguyên thông báo trong danh sách`);
      } else {
        // Nếu đang ở các tab khác, cập nhật trạng thái isRead và sắp xếp lại danh sách
        logDebug(
          `Đang ở tab khác, cập nhật trạng thái isRead và sắp xếp lại danh sách`
        );

        // Cập nhật UI và sắp xếp lại để đảm bảo thông báo chưa đọc vẫn ở trên cùng
        setNotifications((prevNotifications) => {
          // Đầu tiên cập nhật trạng thái đã đọc
          const updatedNotifications = prevNotifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          );

          // Sau đó sắp xếp lại để thông báo chưa đọc ở trên cùng
          return updatedNotifications.sort((a, b) => {
            // Thông báo chưa đọc ưu tiên lên trên
            if (a.isRead !== b.isRead) {
              return a.isRead ? 1 : -1;
            }
            // Nếu cùng trạng thái đọc, thì sắp xếp theo thời gian mới nhất
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          });
        });
      }

      // Gọi API để đánh dấu đã đọc (trong background)
      try {
        logDebug(`Gọi API đánh dấu đã đọc - ID: ${id}`);
        const result = await markNotificationAsRead(id);

        // Xử lý kết quả API
        if (result.success) {
          logDebug(`Đánh dấu thông báo đã đọc thành công - ID: ${id}`);
        } else {
          console.warn(
            `Không thể đánh dấu thông báo đã đọc: ${result.message}`
          );
          logDebug(`Lỗi khi đánh dấu đã đọc: ${result.message}`);
        }
      } catch (error: any) {
        // Xử lý lỗi một cách im lặng để không làm gián đoạn UX
        console.error(
          "Lỗi khi đánh dấu thông báo đã đọc:",
          error?.message || error
        );
        logDebug(`Lỗi chi tiết: ${JSON.stringify(error)}`);
      }
    } catch (err: any) {
      logDebug(`Lỗi tổng thể trong markAsRead: ${err?.message || err}`);
      console.error("Lỗi khi đánh dấu đã đọc:", err);
    }
  };

  // Mark all as read with animation
  const markAllAsRead = async () => {
    logDebug(`markAllAsRead - Đánh dấu tất cả thông báo đã đọc`);

    try {
      if (!userId) {
        logDebug("Không tìm thấy userId, không thể đánh dấu tất cả đã đọc");
        return;
      }

      // Đếm số thông báo chưa đọc
      const unreadNotifications = notifications.filter((n) => !n.isRead);
      if (unreadNotifications.length === 0) {
        logDebug("Không có thông báo chưa đọc");
        Alert.alert("Thông báo", "Không có thông báo chưa đọc");
        return;
      }

      // Cập nhật UI dựa trên tab đang hiển thị
      if (filter === "unread") {
        // Nếu đang ở tab "Chưa đọc", đánh dấu tất cả là đã đọc trước
        logDebug(`Đang ở tab "Chưa đọc", đánh dấu tất cả đã đọc với hiệu ứng`);

        // Cập nhật UI để hiển thị tất cả đã đọc trước khi loại bỏ
        setNotifications((prevNotifications) =>
          prevNotifications.map((n) => ({ ...n, isRead: true }))
        );

        // Sau một khoảng thời gian ngắn, làm trống danh sách
        setTimeout(() => {
          setNotifications([]);
        }, 300);
      } else {
        // Nếu đang ở tab khác, chỉ cập nhật trạng thái
        logDebug(`Đang ở tab khác, cập nhật trạng thái isRead cho tất cả`);
        setNotifications((prevNotifications) =>
          prevNotifications.map((n) => ({ ...n, isRead: true }))
        );
      }

      // Gọi API để đánh dấu tất cả đã đọc
      try {
        logDebug(`Gọi API đánh dấu tất cả đã đọc - userId: ${userId}`);
        const result = await markAllNotificationsAsRead(userId);

        // Xử lý kết quả API
        if (result.success) {
          logDebug(
            `Đánh dấu tất cả thông báo đã đọc thành công - userId: ${userId}`
          );
        } else {
          console.warn(
            `Không thể đánh dấu tất cả thông báo đã đọc: ${result.message}`
          );
          logDebug(`Lỗi khi đánh dấu tất cả đã đọc: ${result.message}`);
        }
      } catch (error: any) {
        // Xử lý lỗi một cách im lặng để không làm gián đoạn UX
        console.error(
          "Lỗi khi đánh dấu tất cả thông báo đã đọc:",
          error?.message || error
        );
        logDebug(`Lỗi chi tiết: ${JSON.stringify(error)}`);
      }
    } catch (err: any) {
      logDebug(`Lỗi tổng thể trong markAllAsRead: ${err?.message || err}`);
      console.error("Lỗi khi đánh dấu tất cả đã đọc:", err);
    }
  };

  // Xóa thông báo
  const handleDeleteNotification = async (id: string) => {
    logDebug(`handleDeleteNotification - Xóa thông báo, ID: ${id}`);

    try {
      // Lưu trạng thái thông báo ban đầu để có thể khôi phục nếu cần
      const originalNotifications = [...notifications];

      // Cập nhật UI ngay lập tức (optimistic update)
      setNotifications((prev) => prev.filter((n) => n.id !== id));

      // Gọi API để xóa thông báo
      try {
        const result = await deleteNotification(id);

        if (__DEV__) {
          if (result.success) {
            logDebug(`Đã xóa thông báo ID: ${id} thành công`);
          } else {
            console.warn(`Thất bại khi xóa thông báo: ${result.message}`);

            // Khôi phục UI nếu xóa thất bại
            setNotifications(originalNotifications);

            // Thông báo lỗi
            Alert.alert(
              "Lỗi",
              "Không thể xóa thông báo. Vui lòng thử lại sau."
            );
          }
        }
      } catch (error) {
        // Xử lý lỗi
        if (__DEV__) {
          console.error("Lỗi khi xóa thông báo:", error);
        }

        // Khôi phục UI nếu có lỗi
        setNotifications(originalNotifications);
        Alert.alert("Lỗi", "Không thể xóa thông báo. Vui lòng thử lại sau.");
      }
    } catch (err: any) {
      logDebug("Lỗi khi xóa thông báo:", err);
      console.error("Lỗi khi xóa thông báo:", err);
    }
  };

  // Filter options
  const filterOptions = [
    { label: "Tất cả", value: "all" },
    { label: "Chưa đọc", value: "unread" },
    { label: "Đã đọc", value: "read" },
    { label: "Đăng ký", value: NotificationType.Registration },
    { label: "Sự kiện", value: NotificationType.Show },
    { label: "Thanh toán", value: NotificationType.Payment },
    { label: "Hệ thống", value: NotificationType.System },
  ];

  // Count unread notifications
  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  logDebug(
    `Rendering component với ${notifications.length} thông báo, ${unreadCount} chưa đọc`
  );

  // Handle scroll to end
  const handleLoadMore = () => {
    if (currentPage < totalPages && !isLoadingMore && !refreshing) {
      logDebug(`handleLoadMore - Tải thêm thông báo, Page: ${currentPage + 1}`);
      fetchNotifications(
        currentPage + 1,
        filter === "all" ? undefined : filter,
        true
      );
    }
  };

  // Sửa lại hiệu ứng animation cho empty icon - chỉ sử dụng scale để tránh lỗi
  useEffect(() => {
    if (notifications.length === 0 && !loading) {
      // Tạo hiệu ứng đơn giản cho icon với chỉ scale
      Animated.sequence([
        Animated.timing(emptyIconScale, {
          toValue: 1.1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(emptyIconScale, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Lặp lại hiệu ứng sau 3 giây
        setTimeout(() => {
          if (notifications.length === 0) {
            Animated.loop(
              Animated.sequence([
                Animated.timing(emptyIconScale, {
                  toValue: 1.1,
                  duration: 800,
                  useNativeDriver: true,
                }),
                Animated.timing(emptyIconScale, {
                  toValue: 1,
                  duration: 800,
                  useNativeDriver: true,
                }),
              ]),
              { iterations: 2 }
            ).start();
          }
        }, 3000);
      });
    }
  }, [notifications.length, loading]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            logDebug("Nhấn nút quay lại");
            router.back();
          }}
          android_ripple={{ color: "rgba(0, 0, 0, 0.1)", borderless: true }}
          style={({ pressed }) => [
            styles.backButton,
            pressed && Platform.OS === "ios" ? { opacity: 0.7 } : {},
          ]}>
          <Ionicons name="arrow-back" size={24} color="#333333" />
        </Pressable>
        <Text style={styles.title}>Thông báo</Text>
        {unreadCount > 0 && (
          <Pressable
            onPress={() => {
              logDebug(
                `Nhấn nút đánh dấu tất cả đã đọc (${unreadCount} thông báo)`
              );
              markAllAsRead();
            }}
            android_ripple={{
              color: "rgba(74, 144, 226, 0.1)",
              borderless: true,
            }}
            style={({ pressed }) => [
              styles.markAllReadButton,
              pressed && Platform.OS === "ios" ? { opacity: 0.7 } : {},
            ]}>
            <Text style={styles.markAllReadText}>Đánh dấu đã đọc</Text>
          </Pressable>
        )}
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}>
        {filterOptions.map((option) => (
          <Pressable
            key={option.value}
            style={({ pressed }) => [
              styles.filterTab,
              filter === option.value && styles.activeFilterTab,
              pressed && styles.filterTabPressed,
            ]}
            onPress={() => {
              if (filter !== option.value) {
                logDebug(
                  `Thay đổi bộ lọc từ "${filter}" sang "${option.value}"`
                );
                setFilter(option.value);
              }
            }}>
            <Text
              style={[
                styles.filterText,
                filter === option.value && styles.activeFilterText,
              ]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Error message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              logDebug("Nhấn nút thử lại sau khi gặp lỗi");
              setLoading(true);
              fetchNotifications();
            }}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notifications list */}
      {loading && !isLoadingMore ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Animated.View
            style={{
              transform: [{ scale: emptyIconScale }],
            }}>
            <Ionicons
              name="notifications-off-outline"
              size={80}
              color="#CCCCCC"
              style={styles.emptyIcon}
            />
          </Animated.View>
          <Text style={styles.emptyText}>Không có thông báo</Text>
          <Text style={styles.emptySubtext}>
            Bạn chưa có thông báo nào{" "}
            {filter !== "all"
              ? `trong mục "${
                  filterOptions.find((o) => o.value === filter)?.label || filter
                }"`
              : ""}
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.refreshButton,
              pressed && { opacity: 0.8 },
            ]}
            android_ripple={{ color: "rgba(74, 144, 226, 0.2)" }}
            onPress={onRefresh}>
            <Text style={styles.refreshButtonText}>Làm mới</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.notificationsContainer}
          contentContainerStyle={[
            styles.scrollViewContent,
            { paddingBottom: 90 },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } =
              nativeEvent;
            const paddingToBottom = 20;
            const isCloseToBottom =
              layoutMeasurement.height + contentOffset.y >=
              contentSize.height - paddingToBottom;

            if (isCloseToBottom) {
              handleLoadMore();
            }
          }}
          scrollEventThrottle={400}>
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onPress={handleNotificationPress}
              onMarkAsRead={markAsRead}
              onDelete={handleDeleteNotification}
            />
          ))}

          {/* Loading indicator at the bottom when loading more */}
          {isLoadingMore && (
            <View style={styles.loadMoreIndicator}>
              <ActivityIndicator size="small" color="#4A90E2" />
              <Text style={styles.loadMoreText}>Đang tải thêm...</Text>
            </View>
          )}

          {/* "No more notifications" message if on the last page */}
          {currentPage === totalPages &&
            notifications.length > 0 &&
            !isLoadingMore && (
              <Text style={styles.noMoreNotificationsText}>
                Không còn thêm thông báo nào
              </Text>
            )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  backIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  title: {
    flex: 1,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
    fontSize: 24,
    fontWeight: "700",
    color: "#030303",
  },
  markAllReadButton: {
    padding: 8,
  },
  markAllReadText: {
    color: "#4A90E2",
    fontSize: 14,
    fontWeight: "500",
  },
  filterContainer: {
    maxHeight: 50,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    gap: 12,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    marginHorizontal: 4,
  },
  activeFilterTab: {
    backgroundColor: "#4A90E2",
  },
  filterTabPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666666",
  },
  activeFilterText: {
    color: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginBottom: 20,
  },
  notificationsContainer: {
    flex: 1,
    width: "100%",
  },
  scrollViewContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
  },
  // Error Styles
  errorContainer: {
    padding: 16,
    backgroundColor: "#FEE7E7",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorText: {
    color: "#E74C3C",
    flex: 1,
  },
  retryButton: {
    padding: 8,
    backgroundColor: "#E74C3C",
    borderRadius: 4,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  // Pagination Styles
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  paginationButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#4A90E2",
    borderRadius: 4,
  },
  paginationButtonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  paginationButtonText: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  paginationText: {
    marginHorizontal: 16,
    color: "#666666",
  },
  // Notification Item Styles
  itemContainer: {
    width: "100%",
    marginVertical: 6,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    backgroundColor: "transparent",
  },
  itemRead: {
    opacity: 0.9,
  },
  itemContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
  },
  iconBackground: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  itemTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 4,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  itemTitleRead: {
    fontWeight: "500",
    color: "#666666",
  },
  itemDescription: {
    fontSize: 14,
    fontWeight: "400",
    color: "#666666",
    marginBottom: 4,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  itemDescriptionRead: {
    color: "#888888",
  },
  itemDate: {
    fontSize: 12,
    color: "#999999",
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4A90E2",
    marginRight: 8,
  },
  itemChevron: {
    marginLeft: 8,
    opacity: 0.6,
  },
  // Delete button styles
  deleteButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#FEE7E7",
  },
  // Loading more indicator
  loadMoreIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
  },
  loadMoreText: {
    color: "#666666",
    fontSize: 14,
  },
  noMoreNotificationsText: {
    textAlign: "center",
    color: "#999999",
    fontSize: 14,
    paddingVertical: 16,
    fontStyle: "italic",
  },
  refreshButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#4A90E2",
    borderRadius: 25,
    marginTop: 16,
  },
  refreshButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default Notifications;
