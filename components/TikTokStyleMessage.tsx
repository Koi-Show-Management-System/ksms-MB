import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
  const formatTime = (date: Date | undefined) => {
    if (!date) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (type === "joined") {
    return (
      <View style={styles.joinedContainer}>
        <LinearGradient
          colors={["rgba(0, 0, 0, 0.7)", "rgba(0, 0, 0, 0.5)"]}
          style={styles.joinedGradient}>
          <Ionicons name="person-add" size={14} color="#FFF" />
          <Text style={styles.joinedText}>@{user.name} joined</Text>
        </LinearGradient>
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
      <LinearGradient
        colors={
          isCurrentUser
            ? ["rgba(24, 144, 255, 0.9)", "rgba(24, 118, 210, 0.8)"]
            : ["rgba(0, 0, 0, 0.7)", "rgba(0, 0, 0, 0.5)"]
        }
        style={[
          styles.messageContent,
          isCurrentUser ? styles.currentUserMessageContent : null,
        ]}>
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
      </LinearGradient>
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
    borderRadius: 16,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 5,
  },
  currentUserMessageContent: {
    borderTopRightRadius: 4,
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
    color: "#FFFFFF",
    textAlign: "right",
  },
  messageBubble: {
    paddingVertical: 2,
    paddingHorizontal: 0,
    marginBottom: 2,
  },
  currentUserBubble: {
    // Custom styles for current user bubble
  },
  otherUserBubble: {
    // Custom styles for other user bubble
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
    alignSelf: "center",
    marginBottom: 8,
    borderRadius: 20,
    overflow: "hidden",
  },
  joinedGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  joinedText: {
    color: "#FFF",
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "500",
  },
});

export default TikTokStyleMessage;
