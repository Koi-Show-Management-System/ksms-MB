import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
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
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;

  // Thiết lập kết nối tới hub thông báo
  async setupConnection() {
    try {
      // Nếu đang có promise kết nối đang chạy, đợi nó hoàn thành
      if (this.connectionPromise) {
        console.log(
          "[SignalR] Connection setup already in progress, waiting for it to complete"
        );
        try {
          await this.connectionPromise;
          return;
        } catch (connectionError) {
          console.error("[SignalR] Error in existing connection promise:", connectionError);
          // Reset connection promise nếu có lỗi
          this.connectionPromise = null;
        }
      }

      // Nếu đã có kết nối và đang hoạt động, không cần thiết lập lại
      if (this.connection && this.connection.state === HubConnectionState.Connected) {
        console.log("[SignalR] Connection already exists and is connected");
        return;
      }

      // Nếu đang có kết nối nhưng không ở trạng thái Connected, dừng kết nối cũ
      if (this.connection && this.connection.state !== HubConnectionState.Connected) {
        console.log(
          `[SignalR] Stopping existing connection in state: ${this.connection.state}`
        );
        try {
          await this.connection.stop();
        } catch (stopError) {
          console.error(
            "[SignalR] Error stopping existing connection:",
            stopError
          );
        }
        this.connection = null;
      }

      // Lấy token xác thực từ AsyncStorage
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        console.error("[SignalR] No authentication token found");
        return;
      }

      console.log(
        "[SignalR] Found authentication token:",
        token.substring(0, 10) + "..."
      );

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

        // Kiểm tra dữ liệu nhận được
        if (!notification) {
          console.error("[SignalR] Received empty notification data");
          return;
        }

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

        // Kiểm tra dữ liệu nhận được
        if (!notification) {
          console.error(
            "[SignalR] Received empty notification data (PascalCase)"
          );
          return;
        }

        this.notificationCallbacks.forEach((callback) =>
          callback(notification)
        );
        this.showToastNotification(notification);
      });

      // Lắng nghe sự kiện ForceLogout từ server
      this.connection.on("ForceLogout", (data) => {
        console.log("[SignalR] Force logout received:", data);

        if (!data) return;

        // Hiển thị thông báo với lý do được cung cấp từ server
        Toast.show({
          type: "error",
          text1: "Tài khoản không khả dụng",
          text2:
            data.reason ||
            "Tài khoản của bạn không còn khả dụng. Bạn sẽ bị đăng xuất.",
          visibilityTime: 3000,
          autoHide: true,
          topOffset: 60,
        });

        // Import không được ở đây vì đây là service
        // Sử dụng setTimeout để đăng xuất sau 3 giây
        setTimeout(async () => {
          try {
            // Dừng kết nối SignalR
            await this.stopConnection();

            // Xóa dữ liệu người dùng từ AsyncStorage
            await AsyncStorage.multiRemove([
              "userToken",
              "userId",
              "userEmail",
              "userRole",
              "userFullName",
            ]);

            // Chuyển về trang đăng nhập - sử dụng router từ expo-router
            const { router } = require("expo-router");
            router.replace("/(auth)/signIn");
          } catch (error) {
            console.error("[SignalR] Error during force logout:", error);
          }
        }, 3000);
      });

      // Lắng nghe sự kiện ForceLogout với tên viết thường (camelCase)
      this.connection.on("forceLogout", (data) => {
        console.log("[SignalR] Force logout received (camelCase):", data);

        if (!data) return;

        // Hiển thị thông báo với lý do được cung cấp từ server
        Toast.show({
          type: "error",
          text1: "Tài khoản không khả dụng",
          text2:
            data.reason ||
            "Tài khoản của bạn không còn khả dụng. Bạn sẽ bị đăng xuất.",
          visibilityTime: 3000,
          autoHide: true,
          topOffset: 60,
        });

        // Sử dụng setTimeout để đăng xuất sau 3 giây
        setTimeout(async () => {
          try {
            // Dừng kết nối SignalR
            await this.stopConnection();

            // Xóa dữ liệu người dùng từ AsyncStorage
            await AsyncStorage.multiRemove([
              "userToken",
              "userId",
              "userEmail",
              "userRole",
              "userFullName",
            ]);

            // Chuyển về trang đăng nhập
            const { router } = require("expo-router");
            router.replace("/(auth)/signIn");
          } catch (error) {
            console.error(
              "[SignalR] Error during force logout (camelCase):",
              error
            );
          }
        }, 3000);
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
        // Reset reconnect attempts on successful reconnection
        this.reconnectAttempts = 0;

        // No need to join user group - server handles this automatically
      });

      this.connection.onclose((error) => {
        console.log("[SignalR] Connection closed", error);
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.handleReconnect();
        } else {
          console.log(
            "[SignalR] Maximum reconnection attempts reached. Giving up."
          );
          // Reset for future connection attempts
          this.connection = null;
          this.connectionPromise = null;
        }
      });

      // Lưu promise kết nối để tránh nhiều lần kết nối đồng thời
      try {
        this.connectionPromise = this.startConnection();
        await this.connectionPromise;
        // Đặt connectionPromise về null sau khi hoàn thành để tránh đợi promise cũ
        this.connectionPromise = null;
        return true;
      } catch (error) {
        console.error("[SignalR] Error in connection promise:", error);
        this.connectionPromise = null;
        throw error;
      }
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
      console.error("[SignalR] Connection has not been initialized");
      throw new Error("[SignalR] Connection has not been initialized");
    }

    try {
      // Kiểm tra nếu kết nối đã được thiết lập
      if (this.connection.state === HubConnectionState.Connected) {
        console.log("[SignalR] Connection is already in Connected state");
        return;
      }

      console.log("[SignalR] Starting connection to notification hub...");

      // Đặt timeout để tránh treo quá lâu
      const connectionPromise = this.connection.start();
      const timeoutPromise = new Promise((_, reject) => {
        const timeout = setTimeout(() => {
          clearTimeout(timeout as unknown as NodeJS.Timeout);
          reject(new Error("[SignalR] Connection start timed out after 15 seconds"));
        }, 15000);
      });

      // Race giữa kết nối và timeout
      await Promise.race([connectionPromise, timeoutPromise]);
      console.log("[SignalR] Connected to notification hub successfully");

      // Reset reconnect attempts on successful connection
      this.reconnectAttempts = 0;

      // No need to join user group - server handles this automatically
    } catch (err) {
      console.error("[SignalR] Error starting connection:", err);

      // If connection fails, try to reconnect
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        console.log(
          "[SignalR] Initial connection failed, will attempt to reconnect"
        );
        this.handleReconnect();
      } else {
        console.log("[SignalR] Maximum reconnection attempts reached");
        // Reset connection objects to allow future connection attempts
        this.connection = null;
        this.connectionPromise = null;
      }

      throw err;
    }
  }

  // We don't need a joinUserGroup method as server handles group membership automatically

  // Handle reconnection with exponential backoff
  private handleReconnect() {
    // Tăng số lần thử kết nối lại
    this.reconnectAttempts++;

    // Tính toán thời gian chờ với thuật toán exponential backoff
    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts - 1),
      30000
    );

    console.log(
      `[SignalR] Attempting to reconnect in ${delay}ms. Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
    );

    // Xóa timeout cũ nếu có
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    // Đặt timeout mới để thử kết nối lại
    this.reconnectTimeoutId = setTimeout(async () => {
      try {
        // Nếu đang có promise kết nối đang chạy, đợi nó hoàn thành
        if (this.connectionPromise) {
          console.log(
            "[SignalR] Connection setup already in progress during reconnect"
          );
          try {
            await this.connectionPromise;
            console.log(
              "[SignalR] Existing connection promise resolved during reconnect"
            );

            // Kiểm tra nếu kết nối đã được thiết lập thành công
            if (this.isConnected()) {
              console.log(
                "[SignalR] Connection is now active after waiting for promise"
              );
              this.reconnectTimeoutId = null;
              return;
            }
          } catch (promiseError) {
            console.error(
              "[SignalR] Error in existing connection promise:",
              promiseError
            );
          }
        }

        // Cleanup existing connection
        if (this.connection && this.connection.state !== HubConnectionState.Disconnected) {
          try {
            await this.connection.stop();
            console.log(
              "[SignalR] Stopped existing connection before reconnect"
            );
          } catch (stopError) {
            console.error("[SignalR] Error stopping connection:", stopError);
          }
        }

        // Reset connection objects
        this.connection = null;
        this.connectionPromise = null;

        // Check if we have a valid token before attempting reconnection
        const token = await AsyncStorage.getItem("userToken");
        if (!token) {
          console.log("[SignalR] No token available, skipping reconnection");
          this.reconnectTimeoutId = null;
          return;
        }

        // Thiết lập kết nối mới
        await this.setupConnection();
        console.log("[SignalR] Reconnection successful");
        this.reconnectTimeoutId = null;
      } catch (err) {
        console.error("[SignalR] Error during reconnection attempt:", err);

        // If we still have attempts left, try again
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.handleReconnect();
        } else {
          console.log(
            "[SignalR] Maximum reconnection attempts reached. Giving up."
          );
          // Reset for future connection attempts
          this.connection = null;
          this.connectionPromise = null;
          this.reconnectTimeoutId = null;
        }
      }
    }, delay);
  }

  // Hiển thị Toast thông báo khi có thông báo mới
  private showToastNotification(notification: NotificationMessage) {
    if (!this.showToastOnNotification) return;

    try {
      // Kiểm tra dữ liệu thông báo
      if (!notification.title && !notification.message) {
        console.error(
          "[SignalR] Invalid notification data for toast:",
          notification
        );
        return;
      }

      // Xác định loại thông báo để hiển thị màu sắc phù hợp
      const toastType = this.getToastTypeFromNotification(notification.type);

      // Chuẩn bị nội dung thông báo
      const title = notification.title || "Thông báo mới";
      const message = notification.message || "";

      console.log("[SignalR] Showing toast notification:", {
        title,
        message,
        type: toastType,
      });

      // Hiển thị Toast với nội dung thông báo
      Toast.show({
        type: toastType,
        text1: title,
        text2: message,
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

      console.log("[SignalR] Toast notification displayed successfully");
    } catch (error) {
      console.error("[SignalR] Error displaying toast notification:", error);
    }
  }

  // Xác định loại Toast dựa trên loại thông báo
  private getToastTypeFromNotification(
    notificationType: string
  ): "success" | "error" | "info" | "warning" {
    // Chuyển đổi về chữ thường để xử lý không phân biệt hoa thường
    const type = notificationType?.toLowerCase() || "";

    if (type.includes("registration") || type.includes("success")) {
      return "success";
    } else if (type.includes("payment") || type.includes("transaction")) {
      return "info";
    } else if (type.includes("error") || type.includes("failed")) {
      return "error";
    } else if (type.includes("warning")) {
      return "warning";
    } else if (type.includes("show") || type.includes("event")) {
      return "info";
    } else if (type.includes("system")) {
      return "info";
    } else {
      // Mặc định là info cho các loại thông báo khác
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
    // Kiểm tra xem callback đã tồn tại chưa để tránh trùng lặp
    if (!this.notificationCallbacks.includes(callback)) {
      console.log("[SignalR] Adding new notification callback");
      this.notificationCallbacks.push(callback);
    } else {
      console.log("[SignalR] Notification callback already registered");
    }

    // Trả về hàm để hủy đăng ký callback
    return () => {
      console.log("[SignalR] Removing notification callback");
      this.notificationCallbacks = this.notificationCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  // Dừng và đóng kết nối
  async stopConnection() {
    console.log("[SignalR] Stopping connection...");

    // Clear any pending reconnect attempts
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    // Reset reconnect counters
    this.reconnectAttempts = 0;

    if (this.connection) {
      try {
        // Stop the connection
        await this.connection.stop();
        console.log("[SignalR] Connection stopped successfully");
      } catch (err) {
        console.error("[SignalR] Error stopping connection:", err);
      } finally {
        // Always clean up resources
        this.connection = null;
        this.connectionPromise = null;
        this.notificationCallbacks = [];
      }
    } else {
      console.log("[SignalR] No active connection to stop");
    }
  }

  // Kiểm tra trạng thái kết nối
  isConnected(): boolean {
    return this.connection?.state === HubConnectionState.Connected;
  }

  // Đảm bảo kết nối đang hoạt động trước khi thực hiện hành động
  async ensureConnection() {
    try {
      // Nếu đang có một kết nối đang được thiết lập, đợi nó hoàn thành
      if (this.connectionPromise) {
        console.log(
          "[SignalR] Waiting for existing connection promise to resolve"
        );
        await this.connectionPromise;
      }

      // Kiểm tra trạng thái kết nối sau khi đợi
      if (!this.isConnected()) {
        console.log(
          "[SignalR] Connection not active, setting up new connection"
        );

        // Kiểm tra token trước khi thiết lập kết nối
        const token = await AsyncStorage.getItem("userToken");
        if (!token) {
          console.warn(
            "[SignalR] No authentication token found, cannot ensure connection"
          );
          return false;
        }

        // Nếu có token nhưng không có kết nối, thiết lập kết nối mới
        await this.setupConnection();

        // Kiểm tra lại kết nối sau khi thiết lập
        if (!this.isConnected()) {
          console.warn("[SignalR] Failed to establish connection after setup");

          // Thử thiết lập lại kết nối một lần nữa nếu lần đầu thất bại
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            console.log("[SignalR] Attempting one more reconnection");
            this.handleReconnect();
          }

          return false;
        }
      } else {
        console.log("[SignalR] Connection already active");

        // Kiểm tra trạng thái kết nối
        if (this.connection?.state === HubConnectionState.Connected) {
          console.log("[SignalR] Connection is in Connected state");
          return true;
        } else if (
          this.connection?.state === HubConnectionState.Connecting ||
          this.connection?.state === HubConnectionState.Reconnecting
        ) {
          console.log(
            `[SignalR] Connection is in ${this.connection.state} state, waiting...`
          );
          // Đợi một chút để kết nối hoàn thành
          try {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            // Kiểm tra lại trạng thái kết nối sau khi đợi
            if (this.isConnected()) {
              console.log(
                "[SignalR] Connection is now in Connected state after waiting"
              );
              return true;
            } else {
              console.log(
                `[SignalR] Connection is still in ${this.connection?.state} state after waiting`
              );
              // Vẫn tiếp tục, có thể kết nối sẽ hoạt động
            }
          } catch (waitError) {
            console.error(
              "[SignalR] Error while waiting for connection:",
              waitError
            );
          }
        } else {
          console.log(
            `[SignalR] Connection is in unexpected state: ${this.connection?.state}`
          );
          // Thử khởi tạo lại kết nối
          try {
            await this.setupConnection();
            console.log("[SignalR] Connection reestablished");
          } catch (reconnectError) {
            console.error(
              "[SignalR] Failed to reestablish connection:",
              reconnectError
            );
          }
        }
      }

      return true;
    } catch (error) {
      console.error("[SignalR] Error ensuring connection:", error);
      return false;
    }
  }
}

// Export instance singletion để sử dụng trong toàn ứng dụng
export const signalRService = new SignalRService();
