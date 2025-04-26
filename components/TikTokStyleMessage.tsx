import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

interface TikTokStyleMessageProps {
  type: "message" | "joined";
  user: {
    id?: string;
    name: string;
    image?: string;
  };
  text?: string;
  timestamp?: Date;
  isCurrentUser?: boolean;
}

const TikTokStyleMessage: React.FC<TikTokStyleMessageProps> = ({
  type,
  user,
  text,
  timestamp,
  isCurrentUser = false,
}) => {
  // Format timestamp
  const formatTime = (date: Date) => {
    if (!date) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (type === "joined") {
    return (
      <View style={styles.joinedContainer}>
        <Ionicons name="person-add" size={14} color="#FFF" />
        <Text style={styles.joinedText}>@{user.name} joined</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.messageContainer,
        isCurrentUser ? styles.currentUserContainer : null,
        isCurrentUser ? { alignSelf: "flex-end" } : { alignSelf: "flex-start" },
      ]}>
      {!isCurrentUser && (
        <Image
          source={{
            uri:
              user.image ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                user.name
              )}&background=random`,
          }}
          style={styles.avatar}
        />
      )}
      <View style={styles.messageContent}>
        <Text
          style={[
            styles.username,
            isCurrentUser ? styles.currentUserName : null,
          ]}>
          {isCurrentUser ? "You" : user.name}
        </Text>
        <View
          style={[
            styles.messageBubble,
            isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
          ]}>
          <Text
            style={[
              styles.messageText,
              isCurrentUser ? styles.currentUserText : null,
            ]}>
            {text}
          </Text>
        </View>
        {timestamp && (
          <Text
            style={[
              styles.timestamp,
              isCurrentUser ? styles.currentUserTimestamp : null,
            ]}>
            {formatTime(timestamp)}
          </Text>
        )}
      </View>
      {isCurrentUser && (
        <Image
          source={{
            uri:
              user.image ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                user.name
              )}&background=random`,
          }}
          style={[styles.avatar, styles.currentUserAvatar]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    maxWidth: "85%",
  },
  currentUserContainer: {
    flexDirection: "row-reverse",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  currentUserAvatar: {
    borderColor: "#1890ff",
  },
  messageContent: {
    flex: 1,
    maxWidth: "80%",
  },
  username: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 12,
    marginBottom: 2,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  currentUserName: {
    color: "#1890ff",
    textAlign: "right",
  },
  messageBubble: {
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 2,
  },
  currentUserBubble: {
    backgroundColor: "rgba(24, 144, 255, 0.8)",
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: "#FFF",
    fontSize: 14,
  },
  currentUserText: {
    color: "#FFFFFF",
  },
  timestamp: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 10,
    marginTop: 2,
  },
  currentUserTimestamp: {
    textAlign: "right",
  },
  joinedContainer: {
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
});

export default TikTokStyleMessage;
