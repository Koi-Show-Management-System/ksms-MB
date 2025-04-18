// StreamingShow.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

// --- User Profile Icons Component ---
const UserProfileIcons: React.FC = () => {
  return (
    <View style={styles.profilesContainer}>
      {/* We'll load user profiles from API instead of using mock data */}
    </View>
  );
};

// --- Comments Section Component ---
interface CommentType {
  id: string;
  author: string;
  content: string;
  isVerified?: boolean;
}

// Create an interface for the ref methods
interface CommentsSectionRef {
  addComment: (comment: CommentType) => void;
}

// Convert CommentsSection to use forwardRef
const CommentsSection = React.forwardRef<CommentsSectionRef, {}>(
  (props, ref) => {
    const [comments, setComments] = useState<CommentType[]>([]);
    const scrollViewRef = useRef<ScrollView>(null);

    // Function to add a new comment
    const addComment = useCallback((newComment: CommentType) => {
      setComments((prevComments) => [newComment, ...prevComments]);
    }, []);

    // Expose methods to the parent component through the ref
    React.useImperativeHandle(ref, () => ({
      addComment,
    }));

    useEffect(() => {
      // Scroll to the bottom when new comments are added, with a slight delay
      const timeoutId = setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100); // Adjust the delay as needed

      return () => clearTimeout(timeoutId); // Clear timeout on unmount or if comments change before timeout fires
    }, [comments]);

    return (
      <View style={styles.commentsContainer}>
        <ScrollView ref={scrollViewRef} style={styles.commentsScrollContainer}>
          {comments.map((comment) => (
            <View key={comment.id} style={styles.commentContainer}>
              <View style={styles.commentHeader}>
                <Text
                  style={[
                    styles.commentAuthorText,
                    comment.isVerified && styles.commentVerifiedAuthor,
                  ]}>
                  {comment.author}
                </Text>
                {comment.isVerified && (
                  <View style={styles.commentVerifiedBadge} />
                )}
              </View>
              <Text style={styles.commentText}>{comment.content}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }
);

// --- Action Buttons Component ---
interface ActionButtonsProps {
  onLikePress: () => void;
  onSharePress: () => void;
  onCommentPress: () => void;
  onBookmarkPress: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onLikePress,
  onSharePress,
  onCommentPress,
  onBookmarkPress,
}) => {
  return (
    <View style={styles.actionsContainer}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={onLikePress}
        activeOpacity={0.7}>
        <Image
          source={{
            uri: "https://dashboard.codeparrot.ai/api/image/Z8Mislj1kitRpYQD/group-10.png",
          }}
          style={styles.actionLikeIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={onCommentPress}
        activeOpacity={0.7}>
        <Image
          source={{
            uri: "https://dashboard.codeparrot.ai/api/image/Z8Mislj1kitRpYQD/group-11.png",
          }}
          style={styles.actionCommentIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={onSharePress}
        activeOpacity={0.7}>
        <Image
          source={{
            uri: "https://dashboard.codeparrot.ai/api/image/Z8Mislj1kitRpYQD/group-12.png",
          }}
          style={styles.actionShareIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={onBookmarkPress}
        activeOpacity={0.7}>
        <Image
          source={{
            uri: "https://dashboard.codeparrot.ai/api/image/Z8Mislj1kitRpYQD/group-13.png",
          }}
          style={styles.actionBookmarkIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );
};

// --- Comment Input Component ---
interface CommentInputProps {
  onSubmit: (comment: string) => void;
}

const CommentInput: React.FC<CommentInputProps> = ({ onSubmit }) => {
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    if (comment.trim()) {
      onSubmit(comment);
      setComment("");
    }
  };

  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        placeholder="Type your comment ..."
        placeholderTextColor="#A7A6A6"
        value={comment}
        onChangeText={setComment}
        onSubmitEditing={handleSubmit}
        multiline={false}
        maxLength={500}
      />
    </View>
  );
};

// --- Main Component ---
const StreamingShow: React.FC = () => {
  const { width, height } = useWindowDimensions(); // Get screen dimensions
  const [viewerCount, setViewerCount] = useState<number>(0); // Initialize with 0 instead of mock data
  const commentsSectionRef = useRef<CommentsSectionRef>(null);

  const handleCommentSubmit = (newCommentText: string) => {
    const newComment: CommentType = {
      id: String(Date.now()), // Unique ID for the new comment
      author: "Current User", // Replace with actual user info
      content: newCommentText,
      isVerified: false, // Or determine based on user status
    };
    commentsSectionRef.current?.addComment(newComment);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"} // Adjust behavior based on platform
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0} // Adjust the offset as needed
    >
      <View style={[styles.container, { width, height }]}>
        {/* Background Image (Placeholder) */}
        <Image
          source={{ uri: "https://example.com/live_stream_background.jpg" }} // Replace with your background
          style={StyleSheet.absoluteFill} // This makes the image cover the entire container
          resizeMode="cover"
        />
        <View style={styles.contentContainer}>
          <UserProfileIcons />
          <CommentsSection ref={commentsSectionRef} />
        </View>
        <ActionButtons
          onLikePress={() => {
            /* Handle like */ setViewerCount((prevCount) => prevCount + 1);
          }}
          onSharePress={() => {
            /* Handle share */
          }}
          onCommentPress={() => {
            /* Handle comment (could focus input) */
          }}
          onBookmarkPress={() => {
            /* Handle bookmark */
          }}
        />
        <CommentInput onSubmit={handleCommentSubmit} />
      </View>
    </KeyboardAvoidingView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000", // Black background, assuming a video will be behind
    justifyContent: "space-between", // Distribute space between components
    alignItems: "stretch", // Stretch components to full width
  },

  // User Profile Icons Styles
  profilesContainer: {
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
    padding: 4,
    marginRight: 10, // Add some margin to separate from comments
  },
  profileIconWrapper: {
    marginVertical: 4,
    width: 40, // Increased size
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  profileIcon: {
    width: "100%",
    height: "100%",
  },

  // Comments Section Styles
  commentsContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
    borderRadius: 10,
    padding: 10,
    flex: 1, // Allow comments to take up available space
  },
  commentsScrollContainer: {
    flexGrow: 1,
  },
  commentContainer: {
    marginBottom: 10,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  commentAuthorText: {
    fontFamily: "Aleo",
    fontSize: 14, // Increased font size
    color: "#FFFFFF",
    marginRight: 5,
  },
  commentVerifiedAuthor: {
    fontWeight: "700",
  },
  commentVerifiedBadge: {
    width: 12, // Increased size
    height: 12,
    backgroundColor: "#4CAF50",
    borderRadius: 6,
  },
  commentText: {
    fontFamily: "Aleo",
    fontSize: 13, // Increased font size
    color: "#FFFFFF",
  },

  // Action Buttons Styles
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
    marginVertical: 10, // Add vertical margin
  },
  actionButton: {
    padding: 10, // Increased padding
  },
  actionLikeIcon: {
    width: 28, // Increased size
    height: 27,
  },
  actionCommentIcon: {
    width: 28, // Make icons consistent size
    height: 28,
  },
  actionShareIcon: {
    width: 28,
    height: 28,
  },
  actionBookmarkIcon: {
    width: 28,
    height: 28,
  },

  // Comment Input Styles
  inputContainer: {
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)", // Semi-transparent white
    borderRadius: 25,
    marginBottom: 10, // Margin at the bottom
    marginHorizontal: 10, // Add horizontal margin
  },
  input: {
    fontFamily: "Aleo",
    fontSize: 14,
    color: "#030303", // Changed text color to black
    minHeight: 24, // Adjust as needed
    padding: 0,
  },
  contentContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    padding: 10,
  },
});

export default StreamingShow;
