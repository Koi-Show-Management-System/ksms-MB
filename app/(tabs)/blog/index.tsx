import { COLORS } from "@/constants/BlogColors";
import {
  BlogCategory,
  BlogPost,
  getAllBlogCategories,
  getBlogPosts,
} from "@/services/blogService";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const BlogListScreen: React.FC = () => {
  const router = useRouter();
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await getAllBlogCategories();
      if (response.statusCode === 200) {
        setCategories(response.data);
      }
    } catch (err: any) {
      console.error("Error fetching categories:", err);
      setError("Không thể tải danh mục bài viết");
    }
  }, []);

  // Fetch blog posts
  const fetchBlogPosts = useCallback(
    async (
      pageNum = 1,
      categoryId: string | null = null,
      shouldRefresh = false
    ) => {
      try {
        if (shouldRefresh) {
          setRefreshing(true);
        } else if (pageNum === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const response = await getBlogPosts(
          pageNum,
          10,
          categoryId || undefined
        );

        if (response.statusCode === 200) {
          const { items, totalPages: total } = response.data;

          if (pageNum === 1 || shouldRefresh) {
            setBlogPosts(items);
          } else {
            setBlogPosts((prev) => [...prev, ...items]);
          }

          setTotalPages(total);
          setPage(pageNum);
          setError(null);
        }
      } catch (err: any) {
        console.error("Error fetching blog posts:", err);
        setError("Không thể tải bài viết");
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    []
  );

  // Initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([fetchCategories(), fetchBlogPosts(1, null)]);
    };

    loadInitialData();
  }, [fetchCategories, fetchBlogPosts]);

  // Handle category selection
  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    fetchBlogPosts(1, categoryId, true);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchBlogPosts(1, selectedCategoryId, true);
  };

  // Handle load more
  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore) {
      fetchBlogPosts(page + 1, selectedCategoryId);
    }
  };

  // Navigate to blog detail
  const handleBlogPress = (blogId: string) => {
    router.push(`/(tabs)/blog/${blogId}` as any);
  };

  // Extract plain text from HTML content for preview
  const extractTextFromHtml = (html: string, maxLength = 100) => {
    // Simple regex to remove HTML tags
    const text = html.replace(/<[^>]*>?/gm, "");
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Render category item
  const renderCategoryItem = ({ item }: { item: BlogCategory }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategoryId === item.id && styles.selectedCategoryItem,
      ]}
      onPress={() => handleCategorySelect(item.id)}>
      <Text
        style={[
          styles.categoryName,
          selectedCategoryId === item.id && styles.selectedCategoryName,
        ]}
        numberOfLines={1}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  // Render "All" category item
  const renderAllCategoriesItem = () => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategoryId === null && styles.selectedCategoryItem,
      ]}
      onPress={() => handleCategorySelect(null)}>
      <Text
        style={[
          styles.categoryName,
          selectedCategoryId === null && styles.selectedCategoryName,
        ]}>
        Tất cả
      </Text>
    </TouchableOpacity>
  );

  // Render blog post item
  const renderBlogItem = ({ item }: { item: BlogPost }) => (
    <TouchableOpacity
      style={styles.blogItem}
      onPress={() => handleBlogPress(item.id)}
      activeOpacity={0.7}>
      <Image
        source={{ uri: item.imgUrl }}
        style={styles.blogImage}
        resizeMode="cover"
      />
      <LinearGradient
        colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.7)", "rgba(0,0,0,0.85)"]}
        style={styles.blogImageGradient}
      />
      <View style={styles.blogContent}>
        <View style={styles.categoryBadge}>
          <Text style={styles.blogCategory}>{item.blogCategory.name}</Text>
        </View>
        <View style={styles.blogTextContent}>
          <Text style={styles.blogTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.blogPreview} numberOfLines={2}>
            {extractTextFromHtml(item.content)}
          </Text>
        </View>
        <View style={styles.blogMeta}>
          <View style={styles.authorContainer}>
            <Image
              source={{ uri: item.account.avatar }}
              style={styles.authorAvatar}
            />
            <Text style={styles.authorName}>{item.account.fullName}</Text>
          </View>
          <Text style={styles.blogDate}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render footer (loading indicator when loading more)
  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.loadingMoreText}>Đang tải thêm...</Text>
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="newspaper-outline" size={64} color="#ccc" />
        <Text style={styles.emptyText}>
          {selectedCategoryId
            ? "Không có bài viết nào trong danh mục này"
            : "Không có bài viết nào"}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["right", "left"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tin tức & Bài viết</Text>
      </View>

      {/* Categories horizontal scroll */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={renderCategoryItem}
          ListHeaderComponent={renderAllCategoriesItem}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Blog posts list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải bài viết...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#e74c3c" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchBlogPosts(1, selectedCategoryId, true)}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={blogPosts}
          keyExtractor={(item) => item.id}
          renderItem={renderBlogItem}
          contentContainerStyle={styles.blogList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333333",
  },
  categoriesContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  categoriesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#F5F5F5",
  },
  selectedCategoryItem: {
    backgroundColor: COLORS.primary,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#555555",
  },
  selectedCategoryName: {
    color: "#FFFFFF",
  },
  blogList: {
    padding: 16,
  },
  blogItem: {
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    position: "relative",
    height: 180,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  blogImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  blogImageGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    height: "100%",
  },
  blogContent: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
    position: "relative",
    zIndex: 2,
    height: "100%",
  },
  categoryBadge: {
    backgroundColor: "#FF8C00",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 5,
  },
  blogCategory: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "700",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  blogTextContent: {
    flex: 1,
    justifyContent: "center",
  },
  blogTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  blogPreview: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  blogMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  authorContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  authorName: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "500",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  blogDate: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    minHeight: 300,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
  },
  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666666",
  },
});

// Default export for Expo Router
export default function BlogIndex() {
  return <BlogListScreen />;
}
