import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from "@microsoft/signalr";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";

// Định nghĩa interface cho dữ liệu thông báo nhận được từ SignalR
export interface NotificationMessage {
  id: string;
  title: string;
  message: string;
  type: string;
  timestamp: Date;
}

class SignalRService {
  private connection: HubConnection | null = null;
  private notificationCallbacks: ((
    notification: NotificationMessage
  ) => void)[] = [];
  private connectionPromise: Promise<void> | null = null;
  private showToastOnNotification: boolean = true; // Thêm biến để kiểm soát hiển thị Toast

  // Thiết lập kết nối tới hub thông báo
  async setupConnection() {
    try {
      if (this.connection) {
        console.log("[SignalR] Connection already exists");
        return;
      }

      // Lấy token xác thực từ AsyncStorage
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        console.error("[SignalR] No authentication token found");
        return;
      }

      console.log("[SignalR] Building connection to notification hub");
      this.connection = new HubConnectionBuilder()
        .withUrl("https://api.ksms.news/notificationHub", {
          accessTokenFactory: () => token,
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Information)
        .build();

      // Đăng ký sự kiện nhận thông báo
      this.connection.on("ReceiveNotification", (notification) => {
        console.log("[SignalR] Received notification:", notification);
        this.notificationCallbacks.forEach((callback) =>
          callback(notification)
        );
        this.showToastNotification(notification);
      });

      // Lưu promise kết nối để tránh nhiều lần kết nối đồng thời
      this.connectionPromise = this.startConnection();
      await this.connectionPromise;
    } catch (error) {
      console.error("[SignalR] Error setting up connection:", error);
      this.connectionPromise = null;
    }
  }

  // Bắt đầu kết nối đến hub
  private async startConnection(): Promise<void> {
    if (!this.connection) {
      throw new Error("[SignalR] Connection has not been initialized");
    }

    try {
      await this.connection.start();
      console.log("[SignalR] Connected to notification hub");

      // Lấy userId từ AsyncStorage để đăng ký nhận thông báo cho user cụ thể
      const userId = await AsyncStorage.getItem("userId");
      if (userId) {
        await this.connection.invoke("JoinGroup", userId);
        console.log(`[SignalR] Joined notification group for user: ${userId}`);
      } else {
        console.warn(
          "[SignalR] User ID not found, can't join notification group"
        );
      }
    } catch (err) {
      console.error("[SignalR] Error starting connection:", err);
      throw err;
    }
  }

  // Hiển thị Toast thông báo khi có thông báo mới
  private showToastNotification(notification: NotificationMessage) {
    if (!this.showToastOnNotification) return;

    // Xác định loại thông báo để hiển thị màu sắc phù hợp
    const toastType = this.getToastTypeFromNotification(notification.type);

    // Hiển thị Toast với nội dung thông báo
    Toast.show({
      type: toastType,
      text1: notification.title,
      text2: notification.message,
      visibilityTime: 4000,
      autoHide: true,
      topOffset: 60,
      onPress: () => {
        // Điều hướng đến màn hình thông báo khi người dùng nhấn vào Toast
        // Import router và sử dụng không được ở đây vì đây là service,
        // nên chúng ta sẽ cung cấp callback thông qua onToastPress
        if (this.onToastPressCallback) {
          this.onToastPressCallback(notification);
        }
      },
    });
  }

  // Xác định loại Toast dựa trên loại thông báo
  private getToastTypeFromNotification(
    notificationType: string
  ): "success" | "error" | "info" {
    switch (notificationType) {
      case "Registration":
        return "success";
      case "Payment":
        return "info";
      case "System":
        return "info";
      case "Show":
        return "info";
      default:
        return "info";
    }
  }

  // Callback khi nhấn vào Toast
  private onToastPressCallback:
    | ((notification: NotificationMessage) => void)
    | null = null;

  // Đặt callback để xử lý khi người dùng nhấn vào Toast
  setOnToastPress(callback: (notification: NotificationMessage) => void) {
    this.onToastPressCallback = callback;
  }

  // Bật/tắt hiển thị Toast khi có thông báo mới
  setShowToast(show: boolean) {
    this.showToastOnNotification = show;
  }

  // Thêm callback để xử lý khi nhận được thông báo mới
  onNotification(callback: (notification: NotificationMessage) => void) {
    this.notificationCallbacks.push(callback);
    return () => {
      this.notificationCallbacks = this.notificationCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  // Dừng và đóng kết nối
  async stopConnection() {
    if (this.connection) {
      try {
        await this.connection.stop();
        console.log("[SignalR] Connection stopped");
        this.connection = null;
        this.connectionPromise = null;
      } catch (err) {
        console.error("[SignalR] Error stopping connection:", err);
      }
    }
  }

  // Kiểm tra trạng thái kết nối
  isConnected(): boolean {
    return this.connection?.state === "Connected";
  }

  // Đảm bảo kết nối đang hoạt động trước khi thực hiện hành động
  async ensureConnection() {
    if (this.connectionPromise) {
      await this.connectionPromise;
    } else if (!this.isConnected()) {
      await this.setupConnection();
    }
  }
}

// Export instance singletion để sử dụng trong toàn ứng dụng
export const signalRService = new SignalRService();
