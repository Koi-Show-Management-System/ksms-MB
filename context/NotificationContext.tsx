import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getNotifications } from '../services/notificationService';
import { signalRService } from '../services/signalRService';

interface NotificationContextType {
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  refreshUnreadCount: () => Promise<void>;
  hasNewNotifications: boolean;
  setHasNewNotifications: React.Dispatch<React.SetStateAction<boolean>>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [hasNewNotifications, setHasNewNotifications] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Get userId from AsyncStorage when component mounts
  useEffect(() => {
    const getUserId = async () => {
      try {
        const id = await AsyncStorage.getItem('userId');
        setUserId(id);
      } catch (err) {
        console.error('Error getting user ID:', err);
      }
    };

    getUserId();
  }, []);

  // Fetch unread notification count
  const refreshUnreadCount = async () => {
    if (!userId) return;

    try {
      const params = {
        isRead: false,
        page: 1,
        size: 10000, // Get all unread notifications
      };

      const response = await getNotifications(userId, params);

      if (response && response.data) {
        setUnreadCount(response.data.total);

        // If there are unread notifications, set hasNewNotifications to true
        if (response.data.total > 0) {
          setHasNewNotifications(true);
        }
      }
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
    }
  };

  // Listen for new notifications via SignalR
  useEffect(() => {
    if (!userId) return;

    try {
      // Ensure SignalR connection is established
      signalRService.ensureConnection();

      // Register callback for new notifications
      const unsubscribe = signalRService.onNotification((notification) => {
        console.log('[NotificationContext] Received new notification');

        // Increment unread count when a new notification is received
        setUnreadCount((prevCount) => prevCount + 1);
        setHasNewNotifications(true);
      });

      // Refresh count initially
      refreshUnreadCount();

      // Cleanup when component unmounts
      return () => {
        unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up SignalR in NotificationContext:', error);
    }
  }, [userId]);

  const value: NotificationContextType = {
    unreadCount,
    setUnreadCount,
    refreshUnreadCount,
    hasNewNotifications,
    setHasNewNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
