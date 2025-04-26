import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Channel as ChannelType, StreamChat } from "stream-chat";
import {
  connectUser,
  getChatToken,
  initChatClient,
} from "../services/chatService";
import TikTokStyleMessage from "./TikTokStyleMessage";

interface TikTokStyleLivestreamChatProps {
  userId: string;
  userName: string;
  livestreamId: string;
  showName: string;
  callId?: string;
  profileImage?: string;
}

interface ChatMessage {
  id: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
  text: string;
  type: "message" | "joined";
  createdAt: Date;
}

const TikTokStyleLivestreamChat: React.FC<TikTokStyleLivestreamChatProps> = ({
  userId,
  userName,
  livestreamId,
  showName,
  callId,
  profileImage,
}) => {
  const [client, setClient] = useState<StreamChat | null>(null);
  const [channel, setChannel] = useState<ChannelType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;
  const messagesEndRef = useRef<FlatList>(null);
  const messagesContainerRef = useRef<View | null>(null);

  // Initialize chat
  const initializeChat = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("[TikTokStyleLivestreamChat] Initializing chat...");

      // Get chat token
      const token = await getChatToken(userId, livestreamId);
      console.log("[TikTokStyleLivestreamChat] Got token");

      // Initialize chat client
      const chatClient = await initChatClient();
      if (!chatClient) {
        throw new Error("Failed to initialize chat client");
      }

      // Connect user to Stream Chat
      await connectUser(userId, userName, token, profileImage);

      setClient(chatClient);
      console.log("[TikTokStyleLivestreamChat] Stream Chat client initialized");

      // Create or get channel
      const channelIdBase = callId || livestreamId;
      const channelId = `livestream-${channelIdBase}`;
      const channelType = "livestream";

      // Set up channel data according to official docs
      const channelData = {
        name: `Chat for ${showName || "Livestream"}`,
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

      // Send a system message to notify that user joined
      try {
        await channelInstance.sendMessage({
          text: `${userName} joined the livestream chat`,
          type: "system",
        });

        // Add joined message to local state
        setMessages((prev) => [
          ...prev,
          {
            id: `join-${Date.now()}`,
            user: {
              id: userId,
              name: userName,
              image: profileImage,
            },
            text: "joined",
            type: "joined",
            createdAt: new Date(),
          },
        ]);
      } catch (msgError) {
        console.error("Error sending system message:", msgError);
        // Continue even if system message fails
      }

      // Watch the channel to connect to it
      await channelInstance.watch();
      console.log(
        "[TikTokStyleLivestreamChat] Channel watched successfully:",
        channelId
      );

      // Set up event listener for new messages
      channelInstance.on("message.new", (event) => {
        const message = event.message;
        if (!message) return;

        // Convert Stream Chat message to our format
        const chatMessage: ChatMessage = {
          id: message.id,
          user: {
            id: message.user?.id || "unknown",
            name: message.user?.name || "Unknown User",
            image: message.user?.image,
          },
          text: message.text || "",
          type: "message",
          createdAt: new Date(message.created_at || Date.now()),
        };

        // Add message to state
        setMessages((prev) => [...prev, chatMessage]);

        // Set new messages flag
        setHasNewMessages(true);

        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollToEnd({ animated: true });
          // Reset new messages flag after scrolling
          setHasNewMessages(false);
        }, 300);
      });

      setChannel(channelInstance);
      setError(null);
      reconnectAttempts.current = 0;
    } catch (err: any) {
      console.error(
        "[TikTokStyleLivestreamChat] Error initializing chat:",
        err
      );

      // Handle specific error cases
      if (err.message?.includes("token")) {
        setError("Authentication failed. Please try again.");
      } else if (
        err.message?.includes("network") ||
        err.message?.includes("connection")
      ) {
        setError("Network issue. Please check your connection.");

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;

          setTimeout(() => {
            console.log(
              `[TikTokStyleLivestreamChat] Reconnect attempt ${reconnectAttempts.current}/${maxReconnectAttempts}`
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
    }
  }, [userId, userName, livestreamId, showName, callId, profileImage]);

  // Initialize chat on component mount
  useEffect(() => {
    initializeChat();

    // Cleanup function
    return () => {
      if (channel) {
        // Stop watching the channel
        channel.stopWatching();
      }
    };
  }, [initializeChat]);

  // Handle retry
  const handleRetry = () => {
    setError(null);
    reconnectAttempts.current = 0;
    initializeChat();
  };

  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#FFF" />
      </View>
    );
  }

  // Render message item
  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isCurrentUser = item.user.id === userId;

    return (
      <TikTokStyleMessage
        type={item.type}
        user={{
          id: item.user.id,
          name: item.user.name,
          image: item.user.image,
        }}
        text={item.text}
        timestamp={item.createdAt}
        isCurrentUser={isCurrentUser}
      />
    );
  };

  // Render chat overlay
  return (
    <View
      style={styles.container}
      ref={(ref) => {
        messagesContainerRef.current = ref;
      }}>
      {error && (
        <TouchableOpacity style={styles.errorBanner} onPress={handleRetry}>
          <Ionicons name="warning-outline" size={14} color="#FFD700" />
          <Text style={styles.errorText}>{error}</Text>
        </TouchableOpacity>
      )}

      <FlatList
        ref={messagesEndRef}
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesListContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={true}
      />

      {hasNewMessages && (
        <TouchableOpacity
          style={styles.newMessageIndicator}
          onPress={() => {
            messagesEndRef.current?.scrollToEnd({ animated: true });
            setHasNewMessages(false);
          }}>
          <Ionicons name="chevron-down" size={16} color="#FFF" />
          <Text style={styles.newMessageText}>Tin nhắn mới</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100, // Space for bottom tabs and input
    left: 0,
    right: 0,
    maxHeight: "70%",
    backgroundColor: "transparent",
    zIndex: 10,
  },
  loadingContainer: {
    padding: 8,
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 16,
    alignSelf: "center",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
    marginBottom: 8,
    alignSelf: "center",
  },
  errorText: {
    color: "#FFD700",
    fontSize: 12,
    marginLeft: 4,
  },
  messagesList: {
    paddingHorizontal: 12,
  },
  messagesListContent: {
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 8,
    maxWidth: "85%",
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  messageContent: {
    flex: 1,
  },
  username: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 12,
  },
  messageText: {
    color: "#FFF",
    fontSize: 13,
  },
  joinedMessage: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: "center",
    marginBottom: 8,
  },
  joinedText: {
    color: "#FFF",
    fontSize: 12,
    marginLeft: 4,
  },
  newMessageIndicator: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    backgroundColor: "rgba(24, 144, 255, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  newMessageText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 4,
  },
});

export default TikTokStyleLivestreamChat;
