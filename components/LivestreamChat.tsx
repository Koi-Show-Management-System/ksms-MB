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
  callId?: string; // ID cuộc gọi stream (cần thiết để đồng bộ với web)
  token?: string; // Optional token xác thực stream chat
  profileImage?: string; // URL hình ảnh đại diện (tùy chọn)
}

const LivestreamChat: React.FC<LivestreamChatProps> = ({
  userId,
  userName,
  livestreamId,
  showName,
  callId,
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
      const authToken = token || (await getChatToken(userId, livestreamId));

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
          showName,
          callId
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
            const channelIdBase = callId || livestreamId;
            const newChannel = chatClient.channel(
              "livestream",
              `livestream-${channelIdBase}`,
              {
                name: `Chat for ${showName || "Livestream"}`,
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
    callId,
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

    const handleConnectionChange = (event: any) => {
      const isOnline = !!event.online; // Chuyển sang boolean rõ ràng

      console.log(
        `[LivestreamChat] Connection status changed: ${
          isOnline ? "online" : "offline"
        }`
      );

      if (!isOnline) {
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
        <Text
          style={[
            styles.loadingText,
            { fontSize: 12, marginTop: 4, opacity: 0.7 },
          ]}>
          Please wait while we connect you to the livestream chat
        </Text>
      </View>
    );
  }

  if (error && !channel) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={24} color="#FF6B6B" />
        <Text style={styles.errorText}>{error}</Text>
        <Text
          style={[
            styles.errorText,
            { fontSize: 12, opacity: 0.7, marginBottom: 8 },
          ]}>
          Unable to connect to the livestream chat at this time
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Ionicons
            name="refresh-outline"
            size={16}
            color="#FFFFFF"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.retryButtonText}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!client || !channel) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={32}
          color="#666666"
        />
        <Text style={styles.errorText}>
          Unable to connect to chat. Please reload the livestream.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Ionicons
            name="refresh-outline"
            size={16}
            color="#FFFFFF"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Define theme for Stream Chat components - enhanced for livestream appearance
  const chatTheme = {
    messageList: {
      container: styles.messageListContainer,
      contentContainer: styles.messageListContentContainer,
    },
    messageInput: {
      container: styles.messageInputContainer,
      inputBox: styles.inputBox,
      sendButton: styles.sendButton,
      attachButton: styles.attachButton,
    },
    message: {
      content: {
        container: styles.messageContent,
        containerMine: styles.myMessageContent,
        markdown: styles.messageText,
      },
      avatarWrapper: {
        container: styles.avatarWrapper,
      },
      status: {
        readBy: styles.readBy,
      },
      gallery: {
        width: 200, // Limit gallery width for livestream chat
      },
      card: {
        container: styles.cardContainer,
      },
      replies: {
        container: styles.repliesContainer,
      },
    },
    messageSimple: {
      container: styles.messageContainer,
      content: {
        container: styles.messageContentWrapper,
        containerInner: styles.messageContentInner,
      },
      avatarWrapper: {
        container: styles.avatarWrapper,
      },
      metadata: {
        container: styles.metadataContainer,
      },
      textContainer: styles.textContainer,
    },
    typing: {
      container: styles.typingContainer,
      text: styles.typingText,
    },
  };

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.warningBanner}>
          <Ionicons name="warning-outline" size={16} color="#FFD700" />
          <Text style={styles.warningText}>{error}</Text>
          <TouchableOpacity onPress={handleRetry}>
            <Ionicons name="refresh-outline" size={16} color="#856404" />
          </TouchableOpacity>
        </View>
      )}

      <OverlayProvider bottomInset={0} topInset={0}>
        <Chat client={client as any} style={chatTheme}>
          <Channel channel={channel as any} keyboardVerticalOffset={0}>
            <View style={styles.chatContainer}>
              <MessageList
                additionalFlatListProps={{
                  showsVerticalScrollIndicator: true,
                  initialNumToRender: 15,
                  maxToRenderPerBatch: 10,
                  windowSize: 10,
                  removeClippedSubviews: true, // Optimize performance
                }}
                noGroupByUser={true} // Don't group messages by user for livestream style
              />
              <MessageInput
                additionalTextInputProps={{
                  placeholder: "Chat in livestream...",
                  placeholderTextColor: "rgba(255, 255, 255, 0.5)",
                  maxLength: 200, // Limit message length for livestream chat
                }}
              />
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
    backgroundColor: "#1A1A1A", // Darker background for livestream chat
  },
  chatContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  messageListContainer: {
    flex: 1,
    backgroundColor: "rgba(26, 26, 26, 0.9)", // Semi-transparent dark background
  },
  messageListContentContainer: {
    paddingHorizontal: 8, // Tighter padding for livestream chat
  },
  messageInputContainer: {
    backgroundColor: "rgba(40, 40, 40, 0.95)", // Darker input area
    borderTopWidth: 1,
    borderTopColor: "#333333",
    paddingVertical: 6, // Smaller padding for more compact input
    paddingHorizontal: 8,
  },
  inputBox: {
    backgroundColor: "rgba(60, 60, 60, 0.6)", // Semi-transparent input
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6, // Smaller vertical padding
    color: "#FFFFFF", // White text
    fontSize: 14, // Smaller font size
  },
  sendButton: {
    backgroundColor: "#0066CC",
  },
  attachButton: {
    backgroundColor: "transparent",
  },
  // Message styling
  messageContainer: {
    paddingVertical: 4, // Tighter spacing between messages
    marginVertical: 1,
  },
  messageContent: {
    backgroundColor: "rgba(60, 60, 60, 0.6)", // Semi-transparent message bubbles
    borderRadius: 12,
    padding: 8, // Smaller padding
    borderWidth: 1,
    borderColor: "rgba(80, 80, 80, 0.5)",
  },
  myMessageContent: {
    backgroundColor: "rgba(0, 132, 255, 0.6)", // Semi-transparent blue for own messages
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 132, 255, 0.3)",
  },
  messageContentWrapper: {
    backgroundColor: "transparent",
    padding: 0,
  },
  messageContentInner: {
    backgroundColor: "transparent",
  },
  textContainer: {
    marginLeft: 0,
    marginRight: 0,
  },
  messageText: {
    color: "#FFFFFF", // White text
    fontSize: 14, // Smaller font
  },
  avatarWrapper: {
    marginRight: 6, // Smaller margin
    width: 24, // Smaller avatar
    height: 24, // Smaller avatar
  },
  metadataContainer: {
    marginTop: 2,
  },
  readBy: {
    fontSize: 8, // Smaller read indicator
    color: "rgba(255, 255, 255, 0.6)",
  },
  // Card and attachment styling
  cardContainer: {
    backgroundColor: "rgba(60, 60, 60, 0.8)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(80, 80, 80, 0.5)",
  },
  repliesContainer: {
    backgroundColor: "rgba(60, 60, 60, 0.4)",
    borderRadius: 12,
  },
  // Typing indicator
  typingContainer: {
    padding: 4,
    backgroundColor: "transparent",
  },
  typingText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
  },
  // Loading and error states
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1A1A1A", // Match the dark theme
  },
  loadingText: {
    marginTop: 8,
    color: "#CCCCCC", // Lighter text for dark background
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1A1A1A", // Match the dark theme
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
    backgroundColor: "rgba(255, 243, 205, 0.8)", // Semi-transparent warning
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
