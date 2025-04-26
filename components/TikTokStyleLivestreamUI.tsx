import { Ionicons } from "@expo/vector-icons";
import { useCall, useCallStateHooks } from "@stream-io/video-react-native-sdk";
import React, { useCallback, useState } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import TikTokStyleLivestreamChat from "./TikTokStyleLivestreamChat";

interface TikTokStyleLivestreamUIProps {
  children: React.ReactNode;
  showName: string;
  onLeave: () => void;
  livestreamId: string;
  userId: string;
  userName: string;
  userProfileImage?: string;
}

const { width, height } = Dimensions.get("window");

const TikTokStyleLivestreamUI: React.FC<TikTokStyleLivestreamUIProps> = ({
  children,
  showName,
  onLeave,
  livestreamId,
  userId,
  userName,
  userProfileImage,
}) => {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Get call object and participant count
  const call = useCall();
  const { useParticipantCount } = useCallStateHooks();
  const participantCount = useParticipantCount() || 0;

  // Early return if call is not available
  if (!call) {
    console.warn("TikTokStyleLivestreamUI: Call object is not available");
    return (
      <View style={styles.centeredContent}>
        <Text style={styles.infoText}>Loading stream data...</Text>
      </View>
    );
  }

  // Handle leaving the livestream
  const handleLeave = useCallback(() => {
    console.log("User requested to leave livestream");
    onLeave();
  }, [onLeave]);

  // Handle sending a message
  const handleSendMessage = useCallback(async () => {
    if (message.trim() && call && !sending) {
      try {
        setSending(true);
        console.log("Sending message:", message);

        // Import sendChatMessage from chatService
        const { sendChatMessage } = require("../services/chatService");

        // Send message to Stream Chat
        await sendChatMessage(
          livestreamId,
          {
            authorId: userId,
            author: userName,
            content: message,
            profileImage: userProfileImage,
          },
          call?.id
        );

        // Clear the input
        setMessage("");
      } catch (error) {
        console.error("Error sending message:", error);
      } finally {
        setSending(false);
      }
    }
  }, [
    message,
    call,
    sending,
    livestreamId,
    userId,
    userName,
    userProfileImage,
  ]);

  return (
    <View style={styles.container}>
      {/* Video content */}
      <View style={styles.videoContainer}>
        {children}

        {/* Header overlay */}
        <View style={styles.headerOverlay}>
          <TouchableOpacity style={styles.backButton} onPress={handleLeave}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.streamerInfo}>
            <Image
              source={{
                uri:
                  userProfileImage ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    showName
                  )}`,
              }}
              style={styles.streamerAvatar}
            />
            <View style={styles.streamerTextInfo}>
              <Text style={styles.streamerName}>{showName}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.followButton}>
            <Text style={styles.followButtonText}>Follow</Text>
          </TouchableOpacity>
        </View>

        {/* Chat overlay */}
        <TikTokStyleLivestreamChat
          userId={userId}
          userName={userName}
          livestreamId={livestreamId}
          showName={showName}
          callId={call?.id}
          profileImage={userProfileImage}
        />

        {/* Bottom controls */}
        <View style={styles.bottomControls}>
          <View style={styles.inputContainer}>
            <View style={styles.inputWithIcon}>
              <Ionicons
                name="happy-outline"
                size={20}
                color="rgba(255, 255, 255, 0.6)"
                style={styles.emojiIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Nhập tin nhắn..."
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={message}
                onChangeText={setMessage}
                editable={!sending}
                onSubmitEditing={handleSendMessage}
                returnKeyType="send"
              />
            </View>
            <TouchableOpacity
              style={[styles.sendButton, sending ? styles.sendingButton : null]}
              onPress={handleSendMessage}
              disabled={!message.trim() || sending}>
              {sending ? (
                <View style={styles.loadingIndicator}>
                  <View style={styles.loadingDot} />
                  <View style={styles.loadingDot} />
                  <View style={styles.loadingDot} />
                </View>
              ) : (
                <Ionicons
                  name="send"
                  size={20}
                  color={message.trim() ? "#FFF" : "rgba(255, 255, 255, 0.4)"}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centeredContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  infoText: {
    color: "#FFF",
    fontSize: 16,
  },
  videoContainer: {
    flex: 1,
    position: "relative",
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  streamerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginHorizontal: 12,
  },
  streamerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  streamerTextInfo: {
    flex: 1,
  },
  streamerName: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  viewerCount: {
    color: "#FFF",
    fontSize: 12,
    opacity: 0.8,
  },
  followButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  followButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 12,
  },
  liveIndicator: {
    position: "absolute",
    top: 60,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#f00",
    marginRight: 4,
  },
  liveText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  bottomControls: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 10,
    zIndex: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 24,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  inputWithIcon: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  emojiIcon: {
    marginLeft: 8,
    marginRight: 4,
  },
  input: {
    flex: 1,
    height: 40,
    color: "#FFF",
    fontSize: 14,
    paddingLeft: 4,
  },
  sendButton: {
    padding: 8,
    minWidth: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  sendingButton: {
    opacity: 0.7,
  },
  loadingIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: 24,
    height: 24,
  },
  loadingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FFF",
    margin: 1,
    opacity: 0.7,
    // Add animation in React Native would require Animated API
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  actionButton: {
    position: "relative",
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#FF5252",
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    textAlign: "center",
    overflow: "hidden",
  },
});

export default TikTokStyleLivestreamUI;
