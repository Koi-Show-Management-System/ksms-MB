import { Ionicons } from "@expo/vector-icons";
import { useCall, useCallStateHooks } from "@stream-io/video-react-native-sdk";
import React, { useCallback } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
  // Ensure the call object is available
  const call = useCall();
  if (!call) {
    // Safely handle the case where call is not available yet
    console.warn("EnhancedLivestreamUI: Call object is not available");
    return (
      <View style={styles.centeredContent}>
        <Text style={styles.infoText}>Loading stream data...</Text>
      </View>
    );
  }

  // Safely access hook from useCallStateHooks
  let participantCount = 0;
  try {
    const { useParticipantCount } = useCallStateHooks();
    participantCount = useParticipantCount() || 0;
  } catch (error) {
    console.warn("Error using participant count hook:", error);
  }

  // Safely handle the leave action
  const handleLeave = useCallback(() => {
    if (onLeave) {
      onLeave();
    }
  }, [onLeave]);

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
          <Text style={styles.viewCountText}>{participantCount}</Text>
        </View>

        {/* Back button */}
        <TouchableOpacity
          style={styles.backButtonOverlay}
          onPress={handleLeave}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Stream information - Removed redundant section */}

      {/* Chat section - Kept container but removed redundant chat component */}
      <View style={styles.commentsContainer}>
        {/* Chat component removed to avoid duplication */}
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
    padding: 0,
  },
  centeredContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  infoText: {
    fontSize: 16,
    color: "#333",
  },
});

export default EnhancedLivestreamUI;
