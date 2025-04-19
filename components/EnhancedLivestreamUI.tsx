import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import EnhancedLivestreamChat from "./EnhancedLivestreamChat";

interface EnhancedLivestreamUIProps {
  children: React.ReactNode;
  showName: string;
  onLeave: () => void;
  livestreamId: string;
  userId: string;
  userName: string;
  userProfileImage?: string;
}

const EnhancedLivestreamUI: React.FC<EnhancedLivestreamUIProps> = ({
  children,
  showName,
  onLeave,
  livestreamId,
  userId,
  userName,
  userProfileImage,
}) => {
  const [viewerCount, setViewerCount] = useState(0);

  // Update viewer count - this function would be called when viewer information changes
  const updateViewerCount = (count: number) => {
    setViewerCount(count);
  };

  return (
    <View style={styles.livestreamContainer}>
      {/* Video section - renders the children which should be ViewerLivestream */}
      <View style={styles.videoWrapper}>
        {children}

        {/* LIVE indicator */}
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>

        {/* Viewer count */}
        <View style={styles.viewCountContainer}>
          <Ionicons name="eye" size={14} color="#FFF" />
          <Text style={styles.viewCountText}>{viewerCount}</Text>
        </View>

        {/* Back button */}
        <TouchableOpacity style={styles.backButtonOverlay} onPress={onLeave}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Stream information */}
      <View style={styles.infoSection}>
        <Text style={styles.streamTitle}>
          {showName || "Koi Show Livestream"}
        </Text>
        <View style={styles.streamStats}>
          <TouchableOpacity style={styles.statButton}>
            <Ionicons name="chatbubble-outline" size={20} color="#333" />
            <Text style={styles.statText}>Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statButton}>
            <Ionicons name="share-social-outline" size={20} color="#333" />
            <Text style={styles.statText}>Chia sẻ</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat section */}
      <View style={styles.commentsContainer}>
        <EnhancedLivestreamChat
          userId={userId}
          userName={userName}
          livestreamId={livestreamId}
          showName={showName}
          profileImage={userProfileImage}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  livestreamContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  videoWrapper: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
    position: "relative",
  },
  liveIndicator: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 10,
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
  viewCountContainer: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 10,
  },
  viewCountText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 4,
  },
  backButtonOverlay: {
    position: "absolute",
    top: 50,
    left: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  infoSection: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  streamTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  streamStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  statButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  statText: {
    fontSize: 14,
    marginLeft: 4,
    color: "#666",
  },
  commentsContainer: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
});

export default EnhancedLivestreamUI;
