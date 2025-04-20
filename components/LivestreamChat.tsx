import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Channel as ChannelType, StreamChat } from "stream-chat";
import { Channel, Chat, MessageInput, MessageList } from "stream-chat-expo";
import {
  connectUser,
  getOrCreateLivestreamChannel,
  initChatClient,
} from "../services/chatService";

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
  const [reconnecting, setReconnecting] = useState(false);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;

  useEffect(() => {
    let isMounted = true;

    const initChat = async () => {
      try {
        setLoading(true);

        if (!userId || !token) {
          throw new Error("User ID and token are required");
        }

        console.log(
          `[LivestreamChat] Initializing chat for livestream: ${livestreamId}, user: ${userId}`
        );

        // Initialize Stream Chat client using improved method
        const chatClient = initChatClient();

        // Connect user with our enhanced method that handles reconnections
        await connectUser(userId, userName, token, profileImage);

        if (isMounted) {
          setClient(chatClient);
          console.log("[LivestreamChat] User connected successfully");

          // Create or get livestream channel with proper error handling
          try {
            const livestreamChannel = await getOrCreateLivestreamChannel(
              chatClient,
              livestreamId,
              showName
            );

            console.log(
              `[LivestreamChat] Channel ready: ${livestreamChannel.id}`
            );
            setChannel(livestreamChannel);
            setError(null);
          } catch (channelError: any) {
            console.error(
              "[LivestreamChat] Error creating channel:",
              channelError
            );

            // Provide user-friendly error message based on the error
            if (channelError.code === 4) {
              setError(
                "Channel creation requires additional user data. Please try again."
              );
            } else if (channelError.code === 40) {
              setError("Channel not found. A new channel will be created.");
              // Try to create a new channel as fallback
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
              }
            } else {
              setError(`Chat error: ${channelError.message}`);
            }
          }
        }
      } catch (err: any) {
        console.error("[LivestreamChat] Error initializing chat:", err);

        if (isMounted) {
          // Provide more helpful error messages based on error type
          if (err.message?.includes("token") || err.code === 40) {
            setError("Authentication error. Please reload the livestream.");
          } else if (
            err.message?.includes("network") ||
            err.message?.includes("connection")
          ) {
            setError("Network issue. Please check your connection.");
          } else {
            setError(`Chat error: ${err.message}`);
          }

          // Attempt reconnection if appropriate
          if (
            reconnectAttempts.current < maxReconnectAttempts &&
            (err.message?.includes("network") ||
              err.message?.includes("connection"))
          ) {
            reconnectAttempts.current += 1;
            setReconnecting(true);
            setTimeout(() => {
              if (isMounted) {
                console.log(
                  `[LivestreamChat] Reconnect attempt ${reconnectAttempts.current}/${maxReconnectAttempts}`
                );
                initChat();
              }
            }, 3000); // Wait 3 seconds before reconnecting
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setReconnecting(false);
        }
      }
    };

    initChat();

    // Cleanup function
    return () => {
      isMounted = false;
      // We don't disconnect here anymore, as it may affect other components
      // Let the chatService.disconnectUser() handle this when app actually closes
    };
  }, [userId, userName, livestreamId, showName, token, profileImage]);

  // Handle offline/online status changes
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
      </View>
    );
  }

  if (!client || !channel) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Unable to connect to chat. Please reload the livestream.
        </Text>
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
        // Adding specific styling for user messages vs other messages
        containerMine: styles.myMessageContent,
      },
      avatarWrapper: {
        container: styles.avatarWrapper,
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
});

export default LivestreamChat;
