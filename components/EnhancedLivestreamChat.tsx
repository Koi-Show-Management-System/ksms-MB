import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Channel as ChannelType, StreamChat } from "stream-chat";
import { Channel, Chat, MessageInput, MessageList } from "stream-chat-expo";
import {
  connectUser,
  getChatToken,
  initChatClient,
  setupAutomaticChatReconnection,
} from "../services/chatService";

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
  const [client, setClient] = useState<StreamChat | null>(null);
  const [channel, setChannel] = useState<ChannelType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [thread, setThread] = useState<any>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;

  // Initialize chat client and connect user
  const initializeChat = useCallback(async () => {
    try {
      setIsLoading(true);

      if (!userId) {
        throw new Error("User ID is required for chat");
      }

      console.log(
        "[EnhancedLivestreamChat] Initializing chat for user:",
        userId
      );

      // Initialize the chat client
      const chatClient = initChatClient();

      // Get token for authentication - pass livestreamId to use the same token
      const token = await getChatToken(userId, livestreamId);

      if (!token) {
        throw new Error("Failed to obtain chat authentication token");
      }

      // Connect user to Stream Chat
      await connectUser(userId, userName, token, profileImage);

      setClient(chatClient);
      console.log("[EnhancedLivestreamChat] Stream Chat client initialized");

      // Create or get channel
      const channelId = `livestream-${livestreamId}`;
      const channelType = "livestream";

      // Set up channel data according to official docs
      const channelData = {
        name: `${showName || "Koi Show"} Chat`,
        image:
          "https://getstream.io/random_svg/?name=" +
          encodeURIComponent(showName || "Koi Show"),
        // Stream docs recommend adding these fields
        created_by_id: userId,
        members: [userId],
      };

      // Create a channel instance
      const channelInstance = chatClient.channel(
        channelType,
        channelId,
        channelData
      );

      // Send a system message to verify channel is working
      try {
        await channelInstance.sendMessage({
          text: `${userName} joined the livestream chat`,
          type: "system",
        });
      } catch (msgError) {
        console.error("Error sending system message:", msgError);
        // Continue even if system message fails
      }

      // Watch the channel to connect to it
      await channelInstance.watch();
      console.log(
        "[EnhancedLivestreamChat] Channel watched successfully:",
        channelId
      );

      setChannel(channelInstance);
      setError(null);
      reconnectAttempts.current = 0;
    } catch (err: any) {
      console.error("[EnhancedLivestreamChat] Error initializing chat:", err);

      // User-friendly error message based on error type
      if (err.message?.includes("token") || err.code === 40) {
        setError("Authentication error. Please try again.");

        // Xóa token đã lưu trong trường hợp lỗi xác thực
        try {
          const AsyncStorage =
            require("@react-native-async-storage/async-storage").default;
          await AsyncStorage.removeItem("@StreamChat:userToken");
          console.log(
            "[EnhancedLivestreamChat] Cleared stored token due to auth error"
          );
        } catch (storageError) {
          console.error(
            "[EnhancedLivestreamChat] Error clearing token:",
            storageError
          );
        }
      } else if (
        err.message?.includes("network") ||
        err.message?.includes("connection")
      ) {
        setError("Network issue. Please check your connection.");

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          setReconnecting(true);

          setTimeout(() => {
            console.log(
              `[EnhancedLivestreamChat] Reconnect attempt ${reconnectAttempts.current}/${maxReconnectAttempts}`
            );
            initializeChat();
          }, 3000);
        } else {
          setError(
            "Failed to connect after multiple attempts. Please try again later."
          );
        }
      } else {
        setError(`Chat error: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
      setReconnecting(false);
    }
  }, [userId, userName, livestreamId, showName, profileImage]);

  // Initialize chat when component mounts
  useEffect(() => {
    const setupChat = async () => {
      // Setup automatic reconnection for the app
      await setupAutomaticChatReconnection();

      // Initialize chat
      await initializeChat();
    };

    setupChat();

    // Cleanup function - no need to disconnect user here
    // as it's handled by chatService.disconnectUser() when app closes
    return () => {
      // Optional: unsubscribe from channel if needed
      if (channel) {
        channel.stopWatching().catch(console.error);
      }
    };
  }, [initializeChat]);

  // Handle retry button press
  const handleRetry = () => {
    reconnectAttempts.current = 0;
    initializeChat();
  };

  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>
          {reconnecting ? "Reconnecting to chat..." : "Connecting to chat..."}
        </Text>
      </View>
    );
  }

  // Render error state
  if (error && !channel) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={24} color="#FF6B6B" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render not initialized state
  if (!client || !channel) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Chat service is not available. Please try again later.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Define custom chat theme based on official docs
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
        containerMine: styles.myMessageContent,
      },
      avatarWrapper: {
        container: styles.avatarWrapper,
      },
    },
  };

  // Render Stream Chat UI - following EXACT structure from official examples
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeftContent}>
            <View style={styles.activeDot} />
            <Text style={styles.headerTitle}>
              {showName ? `Chat - ${showName}` : "Livestream Chat"}
            </Text>
          </View>
          <TouchableOpacity>
            <Ionicons
              name="information-circle-outline"
              size={22}
              color="#666"
            />
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <View style={styles.warningBanner}>
          <Ionicons name="warning-outline" size={16} color="#FFD700" />
          <Text style={styles.warningText}>{error}</Text>
        </View>
      )}

      {/* Removed OverlayProvider as it's already provided at root level */}
      <Chat client={client as any} style={chatTheme}>
        <Channel
          channel={channel as any}
          thread={thread}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
          <View style={styles.chatContainer}>
            <MessageList
              onThreadSelect={(message) => {
                setThread(message);
              }}
            />
            <MessageInput />
          </View>
        </Channel>
      </Chat>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeftContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#52c41a",
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
  },
  chatContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  messageListContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  messageInputContainer: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E9ECEF",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  inputBox: {
    backgroundColor: "#F1F3F5",
    borderRadius: 20,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  messageContent: {
    backgroundColor: "#E9ECEF",
    borderRadius: 16,
    padding: 10,
    marginBottom: 4,
  },
  myMessageContent: {
    backgroundColor: "#0084FF",
    borderRadius: 16,
    padding: 10,
    marginBottom: 4,
  },
  avatarWrapper: {
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 12,
    color: "#666666",
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    padding: 20,
  },
  errorText: {
    marginTop: 8,
    marginBottom: 16,
    color: "#FF6B6B",
    fontSize: 14,
    textAlign: "center",
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3CD",
    padding: 8,
    borderRadius: 4,
    marginHorizontal: 8,
    marginTop: 8,
  },
  warningText: {
    color: "#856404",
    fontSize: 12,
    marginLeft: 4,
    flex: 1,
  },
  retryButton: {
    backgroundColor: "#0066CC",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
    marginTop: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});

export default EnhancedLivestreamChat;
