import { COLORS } from "@/constants/BlogColors";
import { BlogPost, getBlogPostById } from "@/services/blogService";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import RenderHTML from "react-native-render-html";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const BlogDetailScreen: React.FC = () => {
  const router = useRouter();
  const { blogId } = useLocalSearchParams<{ blogId: string }>();
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlogPost = async () => {
      if (!blogId) {
        setError("Không tìm thấy bài viết");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getBlogPostById(blogId);

        if (response.statusCode === 200) {
          setBlogPost(response.data);
        } else {
          setError("Không thể tải bài viết");
        }
      } catch (err: any) {
        console.error("Error fetching blog post:", err);
        setError("Không thể tải bài viết");
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPost();
  }, [blogId]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Handle share
  const handleShare = async () => {
    if (!blogPost) return;

    try {
      await Share.share({
        message: `${blogPost.title} - Đọc bài viết tại KSMS`,
        // You can add a URL here if you have a web version
        // url: `https://your-website.com/blog/${blogId}`
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  // Handle back
  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={["right", "left"]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải bài viết...</Text>
      </SafeAreaView>
    );
  }

  if (error || !blogPost) {
    return (
      <SafeAreaView style={styles.errorContainer} edges={["right", "left"]}>
        <Ionicons name="alert-circle-outline" size={64} color="#e74c3c" />
        <Text style={styles.errorText}>
          {error || "Không tìm thấy bài viết"}
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["right", "left"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.headerImageContainer}>
          <Image
            source={{ uri: blogPost.imgUrl }}
            style={styles.headerImage}
            resizeMode="cover"
          />
          <TouchableOpacity style={styles.backIconButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shareIconButton}
            onPress={handleShare}>
            <Ionicons name="share-social-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {/* Category */}
          <TouchableOpacity
            style={styles.categoryBadge}
            onPress={() => {
              // Navigate back to blog list with this category selected
              router.push({
                pathname: "/(tabs)/blog" as any,
                params: { categoryId: blogPost.blogCategory.id },
              });
            }}>
            <Text style={styles.categoryText}>
              {blogPost.blogCategory.name}
            </Text>
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.title}>{blogPost.title}</Text>

          {/* Author and Date */}
          <View style={styles.metaContainer}>
            <View style={styles.authorContainer}>
              <Image
                source={{ uri: blogPost.account.avatar }}
                style={styles.authorAvatar}
              />
              <Text style={styles.authorName}>{blogPost.account.fullName}</Text>
            </View>
            <Text style={styles.date}>{formatDate(blogPost.createdAt)}</Text>
          </View>

          {/* Content */}
          <View style={styles.htmlContent}>
            <RenderHTML
              contentWidth={width - 32}
              source={{ html: blogPost.content }}
              tagsStyles={{
                p: {
                  fontSize: 16,
                  lineHeight: 24,
                  color: "#333333",
                  marginBottom: 16,
                },
                h1: {
                  fontSize: 24,
                  fontWeight: "bold",
                  color: "#222222",
                  marginVertical: 16,
                },
                h2: {
                  fontSize: 22,
                  fontWeight: "bold",
                  color: "#222222",
                  marginVertical: 14,
                },
                h3: {
                  fontSize: 20,
                  fontWeight: "bold",
                  color: "#222222",
                  marginVertical: 12,
                },
                a: { color: COLORS.primary, textDecorationLine: "none" },
                img: { marginVertical: 16, borderRadius: 8 },
                ul: { marginLeft: 16, marginVertical: 8 },
                ol: { marginLeft: 16, marginVertical: 8 },
                li: {
                  fontSize: 16,
                  lineHeight: 24,
                  color: "#333333",
                  marginBottom: 8,
                },
              }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
  },
  backButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  headerImageContainer: {
    position: "relative",
    width: "100%",
    height: 250,
  },
  headerImage: {
    width: "100%",
    height: "100%",
  },
  backIconButton: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  shareIconButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    padding: 16,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.primary + "20", // 20% opacity
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 16,
  },
  metaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  authorContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  authorName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#555555",
  },
  date: {
    fontSize: 14,
    color: "#999999",
  },
  htmlContent: {
    marginBottom: 24,
  },
});

// Default export for Expo Router
export default function BlogDetail() {
  return <BlogDetailScreen />;
}
