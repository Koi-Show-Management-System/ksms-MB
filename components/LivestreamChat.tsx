import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Channel as ChannelType, StreamChat } from "stream-chat";
import {
  Channel,
  Chat,
  MessageInput,
  MessageList,
  OverlayProvider,
} from "stream-chat-expo";
import {
  connectUser,
  getChatToken,
  getOrCreateLivestreamChannel,
  initChatClient,
  setupAutomaticChatReconnection,
} from "../services/chatService";

interface LivestreamChatProps {
  userId: string; // ID của người dùng hiện tại
  userName: string; // Tên người dùng
  livestreamId: string; // ID của livestream
  showName: string; // Tên hiển thị của show
  token?: string; // Optional token xác thực stream chat
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
  const [reconnecting, setReconnecting] = useState(false);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;
  const isInitialMount = useRef(true);

  // Handle reconnection attempts
  const attemptReconnect = useCallback(async () => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      setError(
        "Maximum reconnection attempts reached. Please try again later."
      );
      setReconnecting(false);
      return;
    }

    reconnectAttempts.current += 1;
    setReconnecting(true);
    console.log(
      `[LivestreamChat] Reconnect attempt ${reconnectAttempts.current}/${maxReconnectAttempts}`
    );

    try {
      await initChat();
    } catch (error) {
      console.error("[LivestreamChat] Reconnection attempt failed:", error);

      // Try again after a delay
      setTimeout(() => {
        attemptReconnect();
      }, 3000);
    }
  }, [userId, userName, livestreamId, showName]);

  // Initialize chat
  const initChat = useCallback(async () => {
    try {
      setLoading(true);

      if (!userId) {
        throw new Error("User ID is required");
      }

      console.log(
        `[LivestreamChat] Initializing chat for livestream: ${livestreamId}, user: ${userId}`
      );

      // Initialize Stream Chat client
      const chatClient = initChatClient();

      // Get authentication token - if token is provided in props, use it, otherwise fetch it
      const authToken = token || (await getChatToken(userId));

      if (!authToken) {
        throw new Error("Failed to obtain valid authentication token");
      }

      // Connect user with enhanced method that handles reconnections
      await connectUser(userId, userName, authToken, profileImage);

      setClient(chatClient);
      console.log("[LivestreamChat] User connected successfully");

      // Create or get livestream channel
      try {
        const livestreamChannel = await getOrCreateLivestreamChannel(
          chatClient,
          livestreamId,
          showName
        );

        console.log(`[LivestreamChat] Channel ready: ${livestreamChannel.id}`);
        setChannel(livestreamChannel);
        setError(null);
        reconnectAttempts.current = 0; // Reset reconnect attempts on success
      } catch (channelError: any) {
        console.error("[LivestreamChat] Error creating channel:", channelError);

        // Provide user-friendly error message based on the error
        if (channelError.code === 4) {
          setError("Chat initialization failed. Please try again.");
          attemptReconnect();
        } else if (channelError.code === 40) {
          setError("Chat channel not found. Creating a new one...");
          // Try to create a new channel
          try {
            const newChannel = chatClient.channel(
              "livestream",
              `livestream-${livestreamId}`,
              {
                name: `${showName || "Koi Show"} Chat`,
                created_by_id: userId,
                members: [userId],
              }
            );
            await newChannel.create();
            setChannel(newChannel);
            setError(null);
          } catch (newChannelError) {
            setError(
              "Failed to create chat channel. Please reload the livestream."
            );
            attemptReconnect();
          }
        } else {
          setError(`Chat error: ${channelError.message}`);
          attemptReconnect();
        }
      }
    } catch (err: any) {
      console.error("[LivestreamChat] Error initializing chat:", err);

      // Provide more helpful error messages based on error type
      if (err.message?.includes("token") || err.code === 40) {
        setError("Authentication error. Please reload the livestream.");
      } else if (
        err.message?.includes("network") ||
        err.message?.includes("connection")
      ) {
        setError("Network issue. Please check your connection.");
        attemptReconnect();
      } else {
        setError(`Chat error: ${err.message}`);
        attemptReconnect();
      }
    } finally {
      setLoading(false);
      setReconnecting(false);
    }
  }, [
    userId,
    userName,
    livestreamId,
    showName,
    token,
    profileImage,
    attemptReconnect,
  ]);

  // Initialize chat on component mount
  useEffect(() => {
    let isMounted = true;

    // Called when the component mounts
    const mountChat = async () => {
      try {
        // Setup automatic reconnection globally
        if (isInitialMount.current) {
          await setupAutomaticChatReconnection();
          isInitialMount.current = false;
        }

        if (isMounted) {
          // Initialize chat
          await initChat();
        }
      } catch (error) {
        console.error("[LivestreamChat] Mount error:", error);
        if (isMounted) {
          setError("Failed to initialize chat. Please reload the livestream.");
          setLoading(false);
        }
      }
    };

    mountChat();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [initChat]);

  // Handle connection status changes
  useEffect(() => {
    if (!client) return;

    const handleConnectionChange = (event: { online: boolean }) => {
      console.log(
        `[LivestreamChat] Connection status changed: ${
          event.online ? "online" : "offline"
        }`
      );

      if (!event.online) {
        setError("You are offline. Messages will be sent when you reconnect.");
      } else {
        setError(null);

        // Refresh channel when back online
        if (channel) {
          channel.watch().catch(console.error);
        }
      }
    };

    client.on("connection.changed", handleConnectionChange);

    return () => {
      client.off("connection.changed", handleConnectionChange);
    };
  }, [client, channel]);

  // Retry button handler
  const handleRetry = () => {
    reconnectAttempts.current = 0;
    initChat();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#0066CC" />
        <Text style={styles.loadingText}>
          {reconnecting ? "Reconnecting to chat..." : "Connecting to chat..."}
        </Text>
      </View>
    );
  }

  if (error && !channel) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={24} color="#FF6B6B" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!client || !channel) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Unable to connect to chat. Please reload the livestream.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Define theme for Stream Chat components
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
      status: {
        readBy: styles.readBy,
      },
    },
  };

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.warningBanner}>
          <Ionicons name="warning-outline" size={16} color="#FFD700" />
          <Text style={styles.warningText}>{error}</Text>
        </View>
      )}

      <OverlayProvider>
        <Chat client={client} style={chatTheme}>
          <Channel channel={channel}>
            <View style={styles.chatContainer}>
              <MessageList />
              <MessageInput />
            </View>
          </Channel>
        </Chat>
      </OverlayProvider>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
  },
  inputBox: {
    backgroundColor: "#F1F3F5",
    borderRadius: 20,
    paddingHorizontal: 12,
  },
  messageContent: {
    backgroundColor: "#E9ECEF",
    borderRadius: 16,
    padding: 10,
  },
  myMessageContent: {
    backgroundColor: "#0084FF",
    borderRadius: 16,
    padding: 10,
  },
  avatarWrapper: {
    marginRight: 8,
  },
  readBy: {
    fontSize: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 8,
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

export default LivestreamChat;
