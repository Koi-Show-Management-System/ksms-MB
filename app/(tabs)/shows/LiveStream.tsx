// livestream.tsx
import { Video } from "expo-av";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Các hằng số và dữ liệu
const { width } = Dimensions.get("window");
const videoAspectRatio = 16 / 9;
const videoHeight = width / videoAspectRatio;

const LiveStream: React.FC = () => {
  const [isLive, setIsLive] = useState(true);
  const [viewCount, setViewCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.videoContainer}>
        <Video
          source={{ uri: "https://example.com/live-stream.mp4" }} // Replace with actual video source
          rate={1.0}
          volume={1.0}
          isMuted={false}
          resizeMode="cover"
          shouldPlay={true}
          isLooping={true}
          style={styles.video}
        />

        {/* Live indicator */}
        {isLive && (
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}

        {/* View count */}
        <View style={styles.viewCountContainer}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z8M5i1Qkk1tjpRQM/eye.png",
            }}
            style={styles.viewIcon}
          />
          <Text style={styles.viewCountText}>{viewCount}</Text>
        </View>

        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z8M5i1Qkk1tjpRQM/back.png",
            }}
            style={styles.backIcon}
          />
        </TouchableOpacity>
      </View>

      {/* Stream info */}
      <View style={styles.infoSection}>
        <Text style={styles.streamTitle}>
          2023 All Japan Koi Show - Day 2 Judging
        </Text>
        <View style={styles.streamStats}>
          <TouchableOpacity
            style={styles.statButton}
            onPress={() => {
              setIsLiked(!isLiked);
              setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
            }}>
            <Image
              source={{
                uri: isLiked
                  ? "https://dashboard.codeparrot.ai/api/image/Z8M5i1Qkk1tjpRQM/heart-filled.png"
                  : "https://dashboard.codeparrot.ai/api/image/Z8M5i1Qkk1tjpRQM/heart.png",
              }}
              style={styles.statIcon}
            />
            <Text style={styles.statText}>{likeCount}</Text>
          </TouchableOpacity>

          <View style={styles.statButton}>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z8M5i1Qkk1tjpRQM/comment.png",
              }}
              style={styles.statIcon}
            />
            <Text style={styles.statText}>{commentCount}</Text>
          </View>

          <TouchableOpacity style={styles.statButton}>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z8M5i1Qkk1tjpRQM/share.png",
              }}
              style={styles.statIcon}
            />
            <Text style={styles.statText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Comments section */}
      <ScrollView style={styles.commentsSection}>
        <Text style={styles.commentsSectionTitle}>Live Comments</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  videoContainer: {
    width: width,
    height: videoHeight,
    backgroundColor: "#000",
    position: "relative",
  },
  video: {
    width: "100%",
    height: "100%",
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
  },
  viewIcon: {
    width: 14,
    height: 14,
    marginRight: 4,
  },
  viewCountText: {
    color: "#fff",
    fontSize: 12,
  },
  backButton: {
    position: "absolute",
    top: 16,
    left: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  infoSection: {
    padding: 16,
  },
  streamTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  streamStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  statButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  statIcon: {
    width: 20,
    height: 20,
    marginRight: 4,
  },
  statText: {
    fontSize: 16,
  },
  commentsSection: {
    padding: 16,
  },
  commentsSectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
});

export default LiveStream;
