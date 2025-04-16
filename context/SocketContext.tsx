// context/SocketContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import socketService, { 
  SocketEvent, 
  NotificationData,
  KoiStatusUpdateData,
  ShowStatusUpdateData,
  RegistrationStatusUpdateData,
  LivestreamStartedData,
  PaymentCompletedData,
  ResultAnnouncedData
} from '../services/socketService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from 'expo-router';
import Toast from 'react-native-toast-message';

// Định nghĩa interface cho context
interface SocketContextType {
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  notifications: NotificationData[];
  hasNewNotifications: boolean;
  markNotificationsAsSeen: () => void;
  koiStatusUpdates: KoiStatusUpdateData[];
  showStatusUpdates: ShowStatusUpdateData[];
  registrationStatusUpdates: RegistrationStatusUpdateData[];
  livestreamStarted: LivestreamStartedData | null;
  paymentCompleted: PaymentCompletedData | null;
  resultAnnounced: ResultAnnouncedData | null;
}

// Tạo context với giá trị mặc định
const SocketContext = createContext<SocketContextType>({
  isConnected: false,
  connect: async () => {},
  disconnect: async () => {},
  notifications: [],
  hasNewNotifications: false,
  markNotificationsAsSeen: () => {},
  koiStatusUpdates: [],
  showStatusUpdates: [],
  registrationStatusUpdates: [],
  livestreamStarted: null,
  paymentCompleted: null,
  resultAnnounced: null,
});

// Hook để sử dụng context
export const useSocket = () => useContext(SocketContext);

// Provider component
export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [hasNewNotifications, setHasNewNotifications] = useState<boolean>(false);
  const [koiStatusUpdates, setKoiStatusUpdates] = useState<KoiStatusUpdateData[]>([]);
  const [showStatusUpdates, setShowStatusUpdates] = useState<ShowStatusUpdateData[]>([]);
  const [registrationStatusUpdates, setRegistrationStatusUpdates] = useState<RegistrationStatusUpdateData[]>([]);
  const [livestreamStarted, setLivestreamStarted] = useState<LivestreamStartedData | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState<PaymentCompletedData | null>(null);
  const [resultAnnounced, setResultAnnounced] = useState<ResultAnnouncedData | null>(null);
  
  // Kết nối socket
  const connect = useCallback(async () => {
    try {
      await socketService.initialize();
      setIsConnected(socketService.isConnected());
    } catch (error) {
      console.error('Lỗi khi kết nối socket:', error);
    }
  }, []);
  
  // Ngắt kết nối socket
  const disconnect = useCallback(async () => {
    try {
      await socketService.disconnect();
      setIsConnected(false);
    } catch (error) {
      console.error('Lỗi khi ngắt kết nối socket:', error);
    }
  }, []);
  
  // Đánh dấu tất cả thông báo đã xem
  const markNotificationsAsSeen = useCallback(() => {
    setHasNewNotifications(false);
  }, []);
  
  // Đăng ký các sự kiện socket
  useEffect(() => {
    // Sự kiện kết nối
    const handleConnect = () => {
      console.log('Socket đã kết nối');
      setIsConnected(true);
    };
    
    // Sự kiện ngắt kết nối
    const handleDisconnect = () => {
      console.log('Socket đã ngắt kết nối');
      setIsConnected(false);
    };
    
    // Sự kiện lỗi kết nối
    const handleConnectError = (error: any) => {
      console.error('Lỗi kết nối socket:', error);
      setIsConnected(false);
    };
    
    // Sự kiện nhận thông báo mới
    const handleNewNotification = (data: NotificationData) => {
      console.log('Nhận thông báo mới:', data);
      
      // Thêm thông báo mới vào đầu danh sách
      setNotifications(prev => [data, ...prev]);
      
      // Đánh dấu có thông báo mới
      setHasNewNotifications(true);
      
      // Hiển thị toast
      socketService.showNotificationToast(data);
    };
    
    // Sự kiện cập nhật trạng thái cá Koi
    const handleKoiStatusUpdate = (data: KoiStatusUpdateData) => {
      console.log('Cập nhật trạng thái cá Koi:', data);
      
      // Thêm cập nhật mới vào đầu danh sách
      setKoiStatusUpdates(prev => [data, ...prev]);
      
      // Hiển thị toast
      Toast.show({
        type: 'info',
        text1: 'Cập nhật trạng thái cá Koi',
        text2: `Cá Koi đã được cập nhật trạng thái thành ${data.newStatus}`,
        visibilityTime: 3000,
        autoHide: true,
      });
    };
    
    // Sự kiện cập nhật trạng thái cuộc thi
    const handleShowStatusUpdate = (data: ShowStatusUpdateData) => {
      console.log('Cập nhật trạng thái cuộc thi:', data);
      
      // Thêm cập nhật mới vào đầu danh sách
      setShowStatusUpdates(prev => [data, ...prev]);
      
      // Hiển thị toast
      Toast.show({
        type: 'info',
        text1: 'Cập nhật trạng thái cuộc thi',
        text2: `Cuộc thi đã được cập nhật trạng thái thành ${data.newStatus}`,
        visibilityTime: 3000,
        autoHide: true,
      });
    };
    
    // Sự kiện cập nhật trạng thái đăng ký
    const handleRegistrationStatusUpdate = (data: RegistrationStatusUpdateData) => {
      console.log('Cập nhật trạng thái đăng ký:', data);
      
      // Thêm cập nhật mới vào đầu danh sách
      setRegistrationStatusUpdates(prev => [data, ...prev]);
      
      // Hiển thị toast
      Toast.show({
        type: 'info',
        text1: 'Cập nhật trạng thái đăng ký',
        text2: `Đăng ký đã được cập nhật trạng thái thành ${data.newStatus}`,
        visibilityTime: 3000,
        autoHide: true,
      });
    };
    
    // Sự kiện livestream bắt đầu
    const handleLivestreamStarted = (data: LivestreamStartedData) => {
      console.log('Livestream bắt đầu:', data);
      
      // Cập nhật thông tin livestream
      setLivestreamStarted(data);
      
      // Hiển thị toast
      Toast.show({
        type: 'success',
        text1: 'Livestream đã bắt đầu',
        text2: 'Nhấn để xem ngay',
        visibilityTime: 5000,
        autoHide: true,
        onPress: () => {
          // Điều hướng đến màn hình livestream
          // navigation.navigate('LiveStream', { showId: data.showId });
        }
      });
    };
    
    // Sự kiện thanh toán hoàn tất
    const handlePaymentCompleted = (data: PaymentCompletedData) => {
      console.log('Thanh toán hoàn tất:', data);
      
      // Cập nhật thông tin thanh toán
      setPaymentCompleted(data);
      
      // Hiển thị toast
      Toast.show({
        type: 'success',
        text1: 'Thanh toán hoàn tất',
        text2: `Số tiền: ${data.amount.toLocaleString('vi-VN')} VNĐ`,
        visibilityTime: 3000,
        autoHide: true,
      });
    };
    
    // Sự kiện công bố kết quả
    const handleResultAnnounced = (data: ResultAnnouncedData) => {
      console.log('Công bố kết quả:', data);
      
      // Cập nhật thông tin kết quả
      setResultAnnounced(data);
      
      // Hiển thị toast
      Toast.show({
        type: 'success',
        text1: 'Kết quả đã được công bố',
        text2: 'Nhấn để xem chi tiết',
        visibilityTime: 5000,
        autoHide: true,
        onPress: () => {
          // Điều hướng đến màn hình kết quả
          // navigation.navigate('Results', { showId: data.showId });
        }
      });
    };
    
    // Đăng ký các sự kiện
    socketService.on(SocketEvent.CONNECT, handleConnect);
    socketService.on(SocketEvent.DISCONNECT, handleDisconnect);
    socketService.on(SocketEvent.CONNECT_ERROR, handleConnectError);
    socketService.on(SocketEvent.NEW_NOTIFICATION, handleNewNotification);
    socketService.on(SocketEvent.KOI_STATUS_UPDATED, handleKoiStatusUpdate);
    socketService.on(SocketEvent.SHOW_STATUS_UPDATED, handleShowStatusUpdate);
    socketService.on(SocketEvent.REGISTRATION_STATUS_UPDATED, handleRegistrationStatusUpdate);
    socketService.on(SocketEvent.LIVESTREAM_STARTED, handleLivestreamStarted);
    socketService.on(SocketEvent.PAYMENT_COMPLETED, handlePaymentCompleted);
    socketService.on(SocketEvent.RESULT_ANNOUNCED, handleResultAnnounced);
    
    // Kết nối socket khi component mount
    connect();
    
    // Hủy đăng ký các sự kiện khi component unmount
    return () => {
      socketService.off(SocketEvent.CONNECT, handleConnect);
      socketService.off(SocketEvent.DISCONNECT, handleDisconnect);
      socketService.off(SocketEvent.CONNECT_ERROR, handleConnectError);
      socketService.off(SocketEvent.NEW_NOTIFICATION, handleNewNotification);
      socketService.off(SocketEvent.KOI_STATUS_UPDATED, handleKoiStatusUpdate);
      socketService.off(SocketEvent.SHOW_STATUS_UPDATED, handleShowStatusUpdate);
      socketService.off(SocketEvent.REGISTRATION_STATUS_UPDATED, handleRegistrationStatusUpdate);
      socketService.off(SocketEvent.LIVESTREAM_STARTED, handleLivestreamStarted);
      socketService.off(SocketEvent.PAYMENT_COMPLETED, handlePaymentCompleted);
      socketService.off(SocketEvent.RESULT_ANNOUNCED, handleResultAnnounced);
    };
  }, [connect]);
  
  // Kiểm tra trạng thái đăng nhập và kết nối/ngắt kết nối socket
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        
        if (token) {
          // Nếu có token, kết nối socket
          if (!isConnected) {
            connect();
          }
        } else {
          // Nếu không có token, ngắt kết nối socket
          if (isConnected) {
            disconnect();
          }
        }
      } catch (error) {
        console.error('Lỗi khi kiểm tra trạng thái đăng nhập:', error);
      }
    };
    
    checkAuthStatus();
    
    // Kiểm tra trạng thái đăng nhập mỗi khi component re-render
    const authCheckInterval = setInterval(checkAuthStatus, 60000); // Kiểm tra mỗi phút
    
    return () => {
      clearInterval(authCheckInterval);
    };
  }, [isConnected, connect, disconnect]);
  
  // Giá trị context
  const value: SocketContextType = {
    isConnected,
    connect,
    disconnect,
    notifications,
    hasNewNotifications,
    markNotificationsAsSeen,
    koiStatusUpdates,
    showStatusUpdates,
    registrationStatusUpdates,
    livestreamStarted,
    paymentCompleted,
    resultAnnounced,
  };
  
  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;