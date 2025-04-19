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
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeoutId: NodeJS.Timeout | null = null;

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
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            // Implement exponential backoff for reconnection attempts
            if (retryContext.previousRetryCount < 3) {
              // If we've retried less than 3 times, retry quickly
              return Math.min(
                1000 * Math.pow(2, retryContext.previousRetryCount),
                30000
              );
            } else {
              // After 3 retries, use a longer delay
              return 30000;
            }
          },
        })
        .configureLogging(LogLevel.Information)
        .build();

      // Đăng ký sự kiện nhận thông báo - với đúng tên phương thức từ server
      // Note: SignalR often uses camelCase for method names on the client
      this.connection.on("receiveNotification", (notification) => {
        console.log("[SignalR] Received notification:", notification);
        this.notificationCallbacks.forEach((callback) =>
          callback(notification)
        );
        this.showToastNotification(notification);
      });

      // Đăng ký phương thức dự phòng với tên viết hoa (PascalCase)
      this.connection.on("ReceiveNotification", (notification) => {
        console.log(
          "[SignalR] Received notification (PascalCase):",
          notification
        );
        this.notificationCallbacks.forEach((callback) =>
          callback(notification)
        );
        this.showToastNotification(notification);
      });

      // Handle reconnection events
      this.connection.onreconnecting((error) => {
        console.log(
          "[SignalR] Connection lost. Attempting to reconnect...",
          error
        );
      });

      this.connection.onreconnected((connectionId) => {
        console.log(
          "[SignalR] Connection reestablished. ConnectionId:",
          connectionId
        );
        this.joinUserGroup().catch((err) =>
          console.error(
            "[SignalR] Error joining user group after reconnection:",
            err
          )
        );
      });

      this.connection.onclose((error) => {
        console.log("[SignalR] Connection closed", error);
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.handleReconnect();
        }
      });

      // Lưu promise kết nối để tránh nhiều lần kết nối đồng thời
      this.connectionPromise = this.startConnection();
      await this.connectionPromise;
    } catch (error) {
      console.error("[SignalR] Error setting up connection:", error);
      this.connectionPromise = null;

      // Try to reconnect if setup fails
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.handleReconnect();
      }
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
      // Reset reconnect attempts on successful connection
      this.reconnectAttempts = 0;

      // Join the user-specific group
      await this.joinUserGroup();
    } catch (err) {
      console.error("[SignalR] Error starting connection:", err);
      throw err;
    }
  }

  // Join user-specific notification group
  private async joinUserGroup(): Promise<void> {
    if (!this.connection || this.connection.state !== "Connected") {
      console.warn("[SignalR] Cannot join group: Connection not ready");
      return;
    }

    try {
      // Lấy userId từ AsyncStorage
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        console.warn(
          "[SignalR] User ID not found, can't join notification group"
        );
        return;
      }

      console.log(`[SignalR] Attempting to join group for user: ${userId}`);

      // Based on Microsoft's documentation, try standard SignalR group methods
      // in order of most likely to be implemented on the server
      const methodsToTry = [
        { name: "AddToGroup", camelCase: "addToGroup" },
        { name: "JoinGroup", camelCase: "joinGroup" },
        { name: "Subscribe", camelCase: "subscribe" },
        { name: "SubscribeToUser", camelCase: "subscribeToUser" },
      ];

      let success = false;
      let lastError = null;

      // Try each method with both PascalCase and camelCase variations
      for (const method of methodsToTry) {
        if (success) break;

        try {
          // Try PascalCase (C# style)
          await this.connection.invoke(method.name, userId);
          console.log(
            `[SignalR] Successfully joined group using ${method.name}`
          );
          success = true;
          break;
        } catch (error) {
          console.log(
            `[SignalR] Method ${method.name} failed, trying camelCase version`
          );

          try {
            // Try camelCase (JavaScript style)
            await this.connection.invoke(method.camelCase, userId);
            console.log(
              `[SignalR] Successfully joined group using ${method.camelCase}`
            );
            success = true;
            break;
          } catch (camelError) {
            console.log(`[SignalR] Method ${method.camelCase} also failed`);
            lastError = camelError;
          }
        }
      }

      if (!success) {
        console.error("[SignalR] All group join methods failed:", lastError);
        // Don't throw to prevent connection failure
      }
    } catch (error) {
      console.error("[SignalR] Error setting up user group:", error);
      // Don't throw here to prevent connection setup failure
    }
  }

  // Handle reconnection with exponential backoff
  private handleReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts - 1),
      30000
    );

    console.log(
      `[SignalR] Attempting to reconnect in ${delay}ms. Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
    );

    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
    }

    this.reconnectTimeoutId = setTimeout(() => {
      this.connection = null;
      this.connectionPromise = null;
      this.setupConnection().catch((err) =>
        console.error("[SignalR] Error during reconnection attempt:", err)
      );
    }, delay);
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
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

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
