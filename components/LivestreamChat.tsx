import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Channel, Chat, MessageInput, MessageList } from 'stream-chat-expo';
import { Channel as ChannelType, StreamChat } from 'stream-chat';
import { getOrCreateLivestreamChannel, initChatClient } from '../services/chatService';
import { Ionicons } from '@expo/vector-icons';

interface LivestreamChatProps {
  userId: string; // ID của người dùng hiện tại
  userName: string; // Tên người dùng
  livestreamId: string; // ID của livestream
  showName: string; // Tên hiển thị của show
  token: string; // Token xác thực stream chat
  profileImage?: string; // URL hình ảnh đại diện (tùy chọn)
}

const LivestreamChat: React.FC<LivestreamChatProps> = ({
  userId,
  userName,
  livestreamId,
  showName,
  token,
  profileImage,
}) => {
  const [client, setClient] = useState<StreamChat | null>(null);
  const [channel, setChannel] = useState<ChannelType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initChat = async () => {
      try {
        // Khởi tạo Stream Chat client
        const chatClient = initChatClient();
        console.log("[LivestreamChat] Khởi tạo chat client với userId:", userId);

        // Kết nối người dùng với Stream Chat
        await chatClient.connectUser(
          {
            id: userId,
            name: userName,
            image: profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}`,
          },
          token
        );

        if (isMounted) {
          setClient(chatClient);
          console.log("[LivestreamChat] Kết nối người dùng thành công");

          // Tạo hoặc lấy kênh chat cho livestream
          const livestreamChannel = await getOrCreateLivestreamChannel(
            chatClient,
            livestreamId,
            showName
          );
          console.log("[LivestreamChat] Kênh chat đã sẵn sàng:", livestreamChannel.id);

          setChannel(livestreamChannel);
        }
      } catch (err: any) {
        console.error('Error initializing chat:', err);
        if (isMounted) {
          setError(`Không thể kết nối với chat: ${err.message}`);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initChat();

    // Cleanup function
    return () => {
      isMounted = false;
      // Ngắt kết nối khi component unmount
      if (client) {
        console.log("[LivestreamChat] Ngắt kết nối client khi unmount");
        client.disconnectUser().catch(console.error);
      }
    };
  }, [userId, userName, livestreamId, showName, token, profileImage]);

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

  if (!client || !channel) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không thể kết nối đến chat.</Text>
      </View>
    );
  }

  const chatTheme = {
    messageList: {
      container: styles.messageListContainer,
    },
    messageInput: {
      container: styles.messageInputContainer,
      inputBox: styles.inputBox,
    },
    message: {
      content: {
        container: styles.messageContent,
      },
    },
  };

  return (
    <View style={styles.container}>
      <Chat client={client} style={chatTheme}>
        <Channel channel={channel}>
          <View style={styles.chatContainer}>
            <MessageList />
            <MessageInput />
          </View>
        </Channel>
      </Chat>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  chatContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  messageListContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  messageInputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  inputBox: {
    backgroundColor: '#F1F3F5',
    borderRadius: 20,
  },
  messageContent: {
    backgroundColor: '#E9ECEF',
    borderRadius: 16,
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

export default LivestreamChat; 