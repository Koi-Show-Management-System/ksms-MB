import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getChatMessages, sendChatMessage } from "../services/chatService";

// Define message interface for better type safety
export interface ChatMessage {
  id: string;
  author: string;
  authorId: string;
  content: string;
  timestamp: Date;
  profileImage?: string;
}

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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const messageListRef = useRef<FlatList>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Format the message timestamp
  const formatTime = (date: Date) => {
    try {
      return new Date(date).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return "";
    }
  };

  // Load chat messages with retry mechanism
  const loadMessages = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      setError(null);

      try {
        const response = await getChatMessages(livestreamId);
        if (response.success && Array.isArray(response.data)) {
          setMessages(response.data);
        } else {
          console.warn("Failed to load chat messages:", response.message);
          setError("Không thể tải tin nhắn. Vui lòng thử lại sau.");
        }
      } catch (err) {
        console.error("Error loading chat messages:", err);
        setError("Lỗi kết nối. Vui lòng kiểm tra mạng của bạn.");
      } finally {
        setIsLoading(false);
      }
    },
    [livestreamId]
  );

  // Send a new message with error handling
  const handleSend = useCallback(async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const messageToSend = {
        authorId: userId,
        author: userName,
        content: newMessage.trim(),
        profileImage: profileImage,
      };

      const response = await sendChatMessage(livestreamId, messageToSend);

      if (response.success) {
        // Optimistically add message to the list
        const optimisticMessage: ChatMessage = {
          id: Date.now().toString(), // Temporary ID
          ...messageToSend,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, optimisticMessage]);
        setNewMessage("");

        // Scroll to bottom
        setTimeout(() => {
          messageListRef.current?.scrollToEnd({ animated: true });
        }, 100);

        // Refresh messages to get server-generated ID
        setTimeout(() => {
          loadMessages(true);
        }, 1000);
      } else {
        console.warn("Failed to send message:", response.message);
        alert("Không thể gửi tin nhắn. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Lỗi kết nối. Vui lòng kiểm tra mạng của bạn.");
    } finally {
      setIsSending(false);
    }
  }, [
    newMessage,
    userId,
    userName,
    profileImage,
    livestreamId,
    isSending,
    loadMessages,
  ]);

  // Set up polling for new messages
  useEffect(() => {
    loadMessages();

    // Start polling for new messages every 3 seconds
    pollingIntervalRef.current = setInterval(() => {
      loadMessages(true); // Silent refresh
    }, 3000);

    // Clean up on component unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [loadMessages]);

  // Render a single chat message
  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <View style={styles.messageContainer}>
        <View style={styles.messageAvatar}>
          {item.profileImage ? (
            <Image source={{ uri: item.profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.defaultAvatar}>
              <Text style={styles.avatarText}>
                {item.author.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            <Text style={styles.messageSender}>{item.author}</Text>
            <Text style={styles.messageTime}>{formatTime(item.timestamp)}</Text>
          </View>
          <Text style={styles.messageText}>{item.content}</Text>
        </View>
      </View>
    ),
    []
  );

  // Extract message keys for FlatList
  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {showName ? `Chat - ${showName}` : "Livestream Chat"}
        </Text>
      </View>

      {isLoading && messages.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Đang tải tin nhắn...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={24} color="red" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadMessages()}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={messageListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          style={styles.messageList}
          contentContainerStyle={
            messages.length === 0 ? styles.emptyList : styles.messageListContent
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={36}
                color="#ccc"
              />
              <Text style={styles.emptyText}>
                Không có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
              </Text>
            </View>
          }
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={10}
          onEndReachedThreshold={0.5}
          removeClippedSubviews={Platform.OS !== "web"}
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nhập tin nhắn..."
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !newMessage.trim() && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!newMessage.trim() || isSending}>
          {isSending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingVertical: 8,
  },
  emptyList: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messageContainer: {
    flexDirection: "row",
    padding: 10,
    marginBottom: 4,
  },
  messageAvatar: {
    marginRight: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  defaultAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#0066cc",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  messageContent: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  messageSender: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#333",
  },
  messageTime: {
    fontSize: 12,
    color: "#888",
  },
  messageText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  input: {
    flex: 1,
    backgroundColor: "#f1f1f1",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: "#0066cc",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#b3d1ff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    marginTop: 10,
    color: "#888",
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    color: "#dc3545",
    textAlign: "center",
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: "#0066cc",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default EnhancedLivestreamChat;
