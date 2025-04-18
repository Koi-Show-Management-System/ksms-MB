// components/livestream/ChatComponent.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Channel } from "stream-chat";
import { sendChatMessage } from "../../services/streamChatService";

const { width } = Dimensions.get("window");

interface ChatComponentProps {
  channel: Channel | null;
  userName?: string;
  userImage?: string;
  userId?: string;
}

const ChatComponent: React.FC<ChatComponentProps> = ({
  channel,
  userName = "Người dùng",
  userImage,
  userId,
}) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    if (!channel) return;

    // Load existing messages
    const loadMessages = async () => {
      try {
        const response = await channel.query({ messages: { limit: 50 } });
        if (response.messages) {
          setMessages(response.messages);
        }
      } catch (error) {
        console.error("Error loading messages:", error);
      }
    };

    loadMessages();

    // Listen for new messages
    const handleNewMessage = (event: any) => {
      console.log("Tin nhắn mới:", event.message);
      console.log("Avatar trong tin nhắn:", event.message.user?.image);
      setMessages((prevMessages) => [...prevMessages, event.message]);
    };

    channel.on("message.new", handleNewMessage);

    // Cleanup
    return () => {
      channel.off("message.new", handleNewMessage);
    };
  }, [channel]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !channel) return;

    try {
      setSending(true);
      await sendChatMessage(channel, newMessage);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!channel) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#0066CC" />
        <Text style={styles.loadingText}>Đang kết nối chat...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Messages header */}
      <View style={styles.header}>
        <View style={styles.headerLeftSection}>
          <View style={styles.liveDot} />
          <Text style={styles.headerText}>Chat trực tiếp</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="information-circle-outline" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Messages area */}
      <ScrollView
        ref={messagesEndRef}
        style={styles.messagesArea}
        contentContainerStyle={
          messages.length === 0 ? styles.emptyMessagesContent : undefined
        }>
        {messages.length === 0 ? (
          <View style={styles.emptyMessages}>
            <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
            <Text style={styles.emptyMessagesText}>
              Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
            </Text>
          </View>
        ) : (
          <View style={styles.messagesList}>
            {messages.map((msg, index) => {
              const isCurrentUser = msg.user?.id === userId;
              return (
                <View
                  key={msg.id || index}
                  style={[
                    styles.messageItem,
                    isCurrentUser ? styles.myMessageItem : undefined,
                  ]}>
                  {!isCurrentUser && (
                    <Image
                      source={{
                        uri:
                          msg.user?.image ||
                          `https://getstream.io/random_svg/?name=${encodeURIComponent(
                            msg.user?.name || "User"
                          )}`,
                      }}
                      style={styles.avatar}
                    />
                  )}
                  <View
                    style={[
                      styles.messageBubble,
                      isCurrentUser
                        ? styles.myMessageBubble
                        : styles.otherMessageBubble,
                    ]}>
                    {!isCurrentUser && (
                      <Text style={styles.messageUserName}>
                        {msg.user?.name || "Người dùng"}
                      </Text>
                    )}
                    <Text
                      style={[
                        styles.messageText,
                        isCurrentUser
                          ? styles.myMessageText
                          : styles.otherMessageText,
                      ]}>
                      {msg.text}
                    </Text>
                    <Text
                      style={[
                        styles.messageTime,
                        isCurrentUser
                          ? styles.myMessageTime
                          : styles.otherMessageTime,
                      ]}>
                      {formatTime(msg.created_at)}
                    </Text>
                  </View>
                  {isCurrentUser && (
                    <Image
                      source={{
                        uri:
                          userImage ||
                          `https://getstream.io/random_svg/?name=${encodeURIComponent(
                            userName
                          )}`,
                      }}
                      style={[styles.avatar, styles.myAvatar]}
                    />
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Input area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nhập tin nhắn..."
          placeholderTextColor="#999"
          value={newMessage}
          onChangeText={setNewMessage}
          onSubmitEditing={handleSendMessage}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !newMessage.trim() ? styles.sendButtonDisabled : undefined,
          ]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim() || sending}>
          {sending ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Ionicons name="send" size={20} color="#FFF" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    overflow: "hidden",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerLeftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
    marginRight: 6,
  },
  headerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  messagesArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  emptyMessagesContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyMessages: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyMessagesText: {
    marginTop: 12,
    color: "#999",
    textAlign: "center",
    fontSize: 14,
  },
  messagesList: {
    padding: 16,
  },
  messageItem: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-end",
  },
  myMessageItem: {
    flexDirection: "row-reverse",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginHorizontal: 8,
  },
  myAvatar: {
    borderWidth: 1,
    borderColor: "#0066CC",
  },
  messageBubble: {
    maxWidth: "70%",
    padding: 10,
    borderRadius: 16,
  },
  myMessageBubble: {
    backgroundColor: "#0066CC",
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: "#F0F0F0",
    borderBottomLeftRadius: 4,
  },
  messageUserName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  myMessageText: {
    color: "#fff",
  },
  otherMessageText: {
    color: "#333",
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  myMessageTime: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  otherMessageTime: {
    color: "#999",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#333",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0066CC",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: "#ccc",
  },
});

export default ChatComponent;
