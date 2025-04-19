import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LivestreamChat from './LivestreamChat';
import { getLivestreamChatToken } from '../services/livestreamService';

interface EnhancedLivestreamChatProps {
  userId: string;
  userName: string;
  livestreamId: string;
  showName: string;
  profileImage?: string;
}

const EnhancedLivestreamChat: React.FC<EnhancedLivestreamChatProps> = ({
  userId,
  userName,
  livestreamId,
  showName,
  profileImage,
}) => {
  const [chatToken, setChatToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchChatToken = async () => {
      try {
        setLoading(true);
        setError(null);

        // Lấy token chat từ API giống như cách lấy token của livestream
        const response = await getLivestreamChatToken(livestreamId);
        
        if (response.data?.token) {
          console.log("[EnhancedLivestreamChat] Nhận được token chat");
          if (isMounted) {
            setChatToken(response.data.token);
          }
        } else {
          throw new Error("Không nhận được token từ API");
        }
      } catch (err: any) {
        console.error('Error fetching chat token:', err);
        if (isMounted) {
          setError(`Không thể lấy token chat: ${err.message}`);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchChatToken();

    return () => {
      isMounted = false;
    };
  }, [livestreamId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#0066CC" />
        <Text style={styles.loadingText}>Đang kết nối chat...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={24} color="#FF6B6B" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!chatToken) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không thể kết nối đến chat.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LivestreamChat
        userId={userId}
        userName={userName}
        livestreamId={livestreamId}
        showName={showName}
        token={chatToken}
        profileImage={profileImage}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 8,
    color: '#666666',
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  errorText: {
    marginTop: 8,
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default EnhancedLivestreamChat;