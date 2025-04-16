// services/socketService.ts
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';

// Định nghĩa các loại sự kiện socket
export enum SocketEvent {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  CONNECT_ERROR = 'connect_error',
  NEW_NOTIFICATION = 'new_notification',
  KOI_STATUS_UPDATED = 'koi_status_updated',
  SHOW_STATUS_UPDATED = 'show_status_updated',
  REGISTRATION_STATUS_UPDATED = 'registration_status_updated',
  LIVESTREAM_STARTED = 'livestream_started',
  PAYMENT_COMPLETED = 'payment_completed',
  RESULT_ANNOUNCED = 'result_announced',
}

// Định nghĩa interface cho các loại dữ liệu nhận được
export interface NotificationData {
  id: string;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  sentDate: string;
}

export interface KoiStatusUpdateData {
  koiId: string;
  newStatus: string;
  updatedAt: string;
}

export interface ShowStatusUpdateData {
  showId: string;
  newStatus: string;
  updatedAt: string;
}

export interface RegistrationStatusUpdateData {
  registrationId: string;
  newStatus: string;
  updatedAt: string;
}

export interface LivestreamStartedData {
  showId: string;
  streamUrl: string;
  startedAt: string;
}

export interface PaymentCompletedData {
  paymentId: string;
  status: string;
  amount: number;
  completedAt: string;
}

export interface ResultAnnouncedData {
  showId: string;
  categoryId: string;
  results: Array<{
    position: number;
    koiId: string;
    koiName: string;
  }>;
  announcedAt: string;
}

// Định nghĩa interface cho các callback
type SocketCallback<T> = (data: T) => void;

// Singleton class để quản lý kết nối socket
class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 5000; // 5 giây
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private isConnecting: boolean = false;

  private constructor() {
    // Private constructor để đảm bảo singleton
  }

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  /**
   * Khởi tạo kết nối socket
   */
  public async initialize(): Promise<void> {
    if (this.socket || this.isConnecting) return;
    
    this.isConnecting = true;
    
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        console.log('Không thể khởi tạo socket: Không có token');
        this.isConnecting = false;
        return;
      }
      
      // Lấy userId từ AsyncStorage
      const userId = await AsyncStorage.getItem('userId');
      
      if (!userId) {
        console.log('Không thể khởi tạo socket: Không có userId');
        this.isConnecting = false;
        return;
      }
      
      // Khởi tạo socket với các tùy chọn
      this.socket = io('https://api.ksms.news', {
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectInterval,
        query: {
          userId
        },
        auth: {
          token
        },
        extraHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Đăng ký các sự kiện mặc định
      this.registerDefaultEvents();
      
      console.log('Socket đã được khởi tạo');
    } catch (error) {
      console.error('Lỗi khi khởi tạo socket:', error);
    } finally {
      this.isConnecting = false;
    }
  }
  
  /**
   * Đăng ký các sự kiện mặc định cho socket
   */
  private registerDefaultEvents(): void {
    if (!this.socket) return;
    
    // Sự kiện kết nối thành công
    this.socket.on(SocketEvent.CONNECT, () => {
      console.log('Socket đã kết nối thành công');
      this.reconnectAttempts = 0;
      
      // Thông báo cho tất cả các listeners về sự kiện kết nối
      this.notifyListeners(SocketEvent.CONNECT, {});
    });
    
    // Sự kiện ngắt kết nối
    this.socket.on(SocketEvent.DISCONNECT, (reason) => {
      console.log(`Socket đã ngắt kết nối: ${reason}`);
      
      // Thông báo cho tất cả các listeners về sự kiện ngắt kết nối
      this.notifyListeners(SocketEvent.DISCONNECT, { reason });
      
      // Thử kết nối lại nếu lý do là lỗi mạng
      if (reason === 'io server disconnect' || reason === 'transport close') {
        this.reconnect();
      }
    });
    
    // Sự kiện lỗi kết nối
    this.socket.on(SocketEvent.CONNECT_ERROR, (error) => {
      console.error('Lỗi kết nối socket:', error);
      
      // Thông báo cho tất cả các listeners về sự kiện lỗi kết nối
      this.notifyListeners(SocketEvent.CONNECT_ERROR, { error });
      
      // Thử kết nối lại
      this.reconnect();
    });
  }
  
  /**
   * Thử kết nối lại socket
   */
  private reconnect(): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
    }
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Đã đạt đến số lần thử kết nối tối đa');
      return;
    }
    
    this.reconnectAttempts++;
    
    console.log(`Đang thử kết nối lại lần ${this.reconnectAttempts}/${this.maxReconnectAttempts} sau ${this.reconnectInterval}ms`);
    
    this.reconnectTimeoutId = setTimeout(async () => {
      try {
        await this.disconnect();
        await this.initialize();
      } catch (error) {
        console.error('Lỗi khi thử kết nối lại:', error);
      }
    }, this.reconnectInterval);
  }
  
  /**
   * Ngắt kết nối socket
   */
  public async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    
    this.listeners.clear();
    console.log('Socket đã ngắt kết nối');
  }
  
  /**
   * Kiểm tra trạng thái kết nối của socket
   */
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }
  
  /**
   * Đăng ký lắng nghe một sự kiện
   * @param event Tên sự kiện
   * @param callback Hàm callback khi sự kiện xảy ra
   */
  public on<T>(event: SocketEvent, callback: SocketCallback<T>): void {
    if (!this.socket) {
      console.warn(`Không thể đăng ký sự kiện ${event}: Socket chưa được khởi tạo`);
      return;
    }
    
    // Thêm callback vào danh sách listeners
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
      
      // Đăng ký sự kiện với socket nếu chưa có listeners nào
      this.socket.on(event, (data: T) => {
        this.notifyListeners(event, data);
      });
    }
    
    // Thêm callback vào set
    this.listeners.get(event)?.add(callback);
    
    console.log(`Đã đăng ký lắng nghe sự kiện ${event}`);
  }
  
  /**
   * Hủy đăng ký lắng nghe một sự kiện
   * @param event Tên sự kiện
   * @param callback Hàm callback đã đăng ký
   */
  public off<T>(event: SocketEvent, callback: SocketCallback<T>): void {
    if (!this.socket) return;
    
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      
      // Nếu không còn listeners nào, hủy đăng ký sự kiện với socket
      if (eventListeners.size === 0) {
        this.socket.off(event);
        this.listeners.delete(event);
      }
    }
    
    console.log(`Đã hủy đăng ký lắng nghe sự kiện ${event}`);
  }
  
  /**
   * Thông báo cho tất cả các listeners về một sự kiện
   * @param event Tên sự kiện
   * @param data Dữ liệu sự kiện
   */
  private notifyListeners<T>(event: string, data: T): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Lỗi khi gọi callback cho sự kiện ${event}:`, error);
        }
      });
    }
  }
  
  /**
   * Gửi một sự kiện đến server
   * @param event Tên sự kiện
   * @param data Dữ liệu gửi kèm
   */
  public emit<T>(event: string, data: T): void {
    if (!this.socket) {
      console.warn(`Không thể gửi sự kiện ${event}: Socket chưa được khởi tạo`);
      return;
    }
    
    this.socket.emit(event, data);
    console.log(`Đã gửi sự kiện ${event} với dữ liệu:`, data);
  }
  
  /**
   * Hiển thị thông báo toast khi nhận được thông báo mới
   * @param notification Dữ liệu thông báo
   */
  public showNotificationToast(notification: NotificationData): void {
    // Xác định icon dựa trên loại thông báo
    let iconType = 'info';
    switch (notification.type) {
      case 'Registration':
        iconType = 'success';
        break;
      case 'Payment':
        iconType = 'success';
        break;
      case 'Show':
        iconType = 'info';
        break;
      case 'System':
        iconType = 'info';
        break;
      default:
        iconType = 'info';
    }
    
    // Hiển thị toast
    Toast.show({
      type: iconType as any,
      text1: notification.title,
      text2: notification.content,
      visibilityTime: 4000,
      autoHide: true,
      topOffset: Platform.OS === 'ios' ? 50 : 30,
      bottomOffset: 40,
    });
  }
}

// Export singleton instance
export default SocketService.getInstance();