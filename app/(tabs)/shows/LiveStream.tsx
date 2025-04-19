// livestream.tsx
import { router } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Video } from "expo-av";
import { SafeAreaView } from "react-native-safe-area-context";

// Các hằng số và dữ liệu
const { width } = Dimensions.get("window");
const videoAspectRatio = 16 / 9;
const videoHeight = width / videoAspectRatio;

const LiveStream: React.FC = () => {
  const [isLive, setIsLive] = useState(true);
  const [viewCount, setViewCount] = useState(1245);
  const [likeCount, setLikeCount] = useState(324);
  const [commentCount, setCommentCount] = useState(56);
  const [isLiked, setIsLiked] = useState(false);

  // Simulating view count increase
  useEffect(() => {
    const interval = setInterval(() => {
      setViewCount(prev => prev + Math.floor(Math.random() * 3));
    }, 5000); // Increase view count randomly every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Giả lập dữ liệu bình luận
  const comments = [
    {
      id: '1',
      user: 'KoiLover55',
      text: 'That Showa is absolutely stunning! Look at those crisp patterns.',
      timeAgo: '2m',
      avatar: 'https://dashboard.codeparrot.ai/api/image/Z8M5i1Qkk1tjpRQM/user1.png',
    },
    {
      id: '2',
      user: 'JapaneseKoiExpert',
      text: 'The body confirmation on that Kohaku is world-class, definitely grand champion material!',
      timeAgo: '5m',
      avatar: 'https://dashboard.codeparrot.ai/api/image/Z8M5i1Qkk1tjpRQM/user2.png',
    },
    {
      id: '3',
      user: 'KoiBreeder_JP',
      text: 'Water quality looks perfect. What filtration system are they using?',
      timeAgo: '7m',
      avatar: 'https://dashboard.codeparrot.ai/api/image/Z8M5i1Qkk1tjpRQM/user3.png',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.videoContainer}>
        <Video
          source={{ uri: 'https://example.com/live-stream.mp4' }} // Replace with actual video source
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
            source={{ uri: 'https://dashboard.codeparrot.ai/api/image/Z8M5i1Qkk1tjpRQM/eye.png' }}
            style={styles.viewIcon}
          />
          <Text style={styles.viewCountText}>{viewCount}</Text>
        </View>
        
        {/* Back button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Image 
            source={{ uri: 'https://dashboard.codeparrot.ai/api/image/Z8M5i1Qkk1tjpRQM/back.png' }}
            style={styles.backIcon}
          />
        </TouchableOpacity>
      </View>
      
      {/* Stream info */}
      <View style={styles.infoSection}>
        <Text style={styles.streamTitle}>2023 All Japan Koi Show - Day 2 Judging</Text>
        <View style={styles.streamStats}>
          <TouchableOpacity 
            style={styles.statButton}
            onPress={() => {
              setIsLiked(!isLiked);
              setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
            }}
          >
            <Image 
              source={{ 
                uri: isLiked 
                  ? 'https://dashboard.codeparrot.ai/api/image/Z8M5i1Qkk1tjpRQM/heart-filled.png'
                  : 'https://dashboard.codeparrot.ai/api/image/Z8M5i1Qkk1tjpRQM/heart.png'
              }}
              style={styles.statIcon}
            />
            <Text style={styles.statText}>{likeCount}</Text>
          </TouchableOpacity>
          
          <View style={styles.statButton}>
            <Image 
              source={{ uri: 'https://dashboard.codeparrot.ai/api/image/Z8M5i1Qkk1tjpRQM/comment.png' }}
              style={styles.statIcon}
            />
            <Text style={styles.statText}>{commentCount}</Text>
          </View>
          
          <TouchableOpacity style={styles.statButton}>
            <Image 
              source={{ uri: 'https://dashboard.codeparrot.ai/api/image/Z8M5i1Qkk1tjpRQM/share.png' }}
              style={styles.statIcon}
            />
            <Text style={styles.statText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Comments section */}
      <ScrollView style={styles.commentsSection}>
        <Text style={styles.commentsSectionTitle}>Live Comments</Text>
        {comments.map(comment => (
          <View key={comment.id} style={styles.commentItem}>
            <Image source={{ uri: comment.avatar }} style={styles.commentAvatar} />
            <View style={styles.commentContent}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentUser}>{comment.user}</Text>
                <Text style={styles.commentTime}>{comment.timeAgo}</Text>
              </View>
              <Text style={styles.commentText}>{comment.text}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  videoContainer: {
    width: width,
    height: videoHeight,
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  liveIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f00',
    marginRight: 4,
  },
  liveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  viewCountContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
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
    color: '#fff',
    fontSize: 12,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: 'bold',
    marginBottom: 8,
  },
  streamStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: 'bold',
    marginBottom: 8,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 16,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUser: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  commentTime: {
    fontSize: 14,
    color: '#666',
  },
  commentText: {
    fontSize: 16,
  },
});

export default LiveStream;
