import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Platform,
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
  const [isAtBottom, setIsAtBottom] = useState(true);
  // Add fade animation value
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Function to check if user is at the bottom of the chat
  const isUserAtBottom = () => {
    return isAtBottom;
  };

  // Initialize chat
  const initializeChat = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("[TikTokStyleLivestreamChat] Initializing chat...");

      // Get chat token
      const token = await getChatToken(userId, livestreamId);
      console.log("[TikTokStyleLivestreamChat] Got token");

      // Initialize chat client
      const chatClient = initChatClient();
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
            image: message.user?.image as string | undefined,
          },
          text: message.text || "",
          type: "message",
          createdAt: new Date(message.created_at || Date.now()),
        };

        // Add message to state
        setMessages((prev) => [...prev, chatMessage]);

        // Trigger fade in animation
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();

        // Set new messages flag
        setHasNewMessages(true);

        // Scroll to bottom if user is already at the bottom or if it's the user's own message
        if (isUserAtBottom() || message.user?.id === userId) {
          setTimeout(() => {
            messagesEndRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
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
  }, [
    userId,
    userName,
    livestreamId,
    showName,
    callId,
    profileImage,
    fadeAnim,
  ]);

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

  // Render message item with animation for the last message
  const renderMessageItem = ({
    item,
    index,
  }: {
    item: ChatMessage;
    index: number;
  }) => {
    const isCurrentUser = item.user.id === userId;
    const isLastMessage = index === messages.length - 1;

    return (
      <Animated.View
        style={{
          opacity: isLastMessage ? fadeAnim : 1,
          transform: [
            {
              translateY: isLastMessage
                ? fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  })
                : 0,
            },
          ],
        }}>
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
      </Animated.View>
    );
  };

  // Render chat content function
  const renderChatContent = () => {
    return (
      <>
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
          showsVerticalScrollIndicator={true}
          initialNumToRender={3}
          maxToRenderPerBatch={5}
          windowSize={5}
          removeClippedSubviews={true}
          inverted={false}
          onEndReached={() => {
            setHasNewMessages(false);
            setIsAtBottom(true);
          }}
          onEndReachedThreshold={0.1}
          onScroll={(event) => {
            const { layoutMeasurement, contentOffset, contentSize } =
              event.nativeEvent;
            const paddingToBottom = 20;
            const isAtBottomNow =
              layoutMeasurement.height + contentOffset.y >=
              contentSize.height - paddingToBottom;
            setIsAtBottom(isAtBottomNow);
          }}
          scrollEventThrottle={400}
        />

        {hasNewMessages && !isAtBottom && (
          <Animated.View
            style={[
              styles.newMessageIndicator,
              {
                transform: [
                  {
                    translateY: new Animated.Value(0).interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -10],
                    }),
                  },
                ],
              },
            ]}>
            <TouchableOpacity
              style={styles.newMessageButton}
              onPress={() => {
                messagesEndRef.current?.scrollToEnd({ animated: true });
                setHasNewMessages(false);
                setIsAtBottom(true);
              }}>
              <Ionicons name="chevron-down" size={16} color="#FFF" />
              <Text style={styles.newMessageText}>Tin nhắn mới</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Improved scroll indicators */}
        {messages.length > 3 && (
          <View style={styles.scrollIndicators}>
            {!isAtBottom && (
              <TouchableOpacity
                style={styles.scrollDownIndicator}
                onPress={() => {
                  messagesEndRef.current?.scrollToEnd({ animated: true });
                  setIsAtBottom(true);
                }}>
                <View style={styles.buttonInner}>
                  <Ionicons name="arrow-down" size={16} color="#FFF" />
                </View>
              </TouchableOpacity>
            )}
            {isAtBottom && messages.length > 3 && (
              <TouchableOpacity
                style={styles.scrollUpIndicator}
                onPress={() => {
                  messagesEndRef.current?.scrollToOffset({
                    offset: 0,
                    animated: true,
                  });
                  setIsAtBottom(false);
                }}>
                <View style={styles.buttonInner}>
                  <Ionicons name="arrow-up" size={16} color="#FFF" />
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}
      </>
    );
  };

  // Render chat overlay with blur effect when supported
  return (
    <>
      {Platform.OS === "ios" ? (
        <BlurView
          tint="dark"
          intensity={30}
          style={[styles.container, styles.blurContainer]}
          ref={(ref) => {
            messagesContainerRef.current = ref;
          }}>
          {renderChatContent()}
        </BlurView>
      ) : (
        <View
          style={styles.container}
          ref={(ref) => {
            messagesContainerRef.current = ref;
          }}>
          {renderChatContent()}
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 70,
    left: 0,
    right: 0,
    maxHeight: "25%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 16,
    marginHorizontal: 8,
    zIndex: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  blurContainer: {
    backgroundColor: "transparent",
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
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 8,
    marginTop: 4,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  errorText: {
    color: "#FFD700",
    fontSize: 12,
    marginLeft: 6,
    fontWeight: "500",
  },
  messagesList: {
    paddingHorizontal: 12,
    height: "100%",
  },
  messagesListContent: {
    paddingVertical: 8,
    paddingBottom: 12,
  },
  newMessageIndicator: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    zIndex: 30,
  },
  newMessageButton: {
    backgroundColor: "rgba(24, 144, 255, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  newMessageText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 6,
  },
  scrollIndicators: {
    position: "absolute",
    right: 8,
    top: "50%",
    transform: [{ translateY: -20 }],
    flexDirection: "column",
    alignItems: "center",
    zIndex: 20,
  },
  scrollDownIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginBottom: 8,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  scrollUpIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  buttonInner: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
});

export default TikTokStyleLivestreamChat;
