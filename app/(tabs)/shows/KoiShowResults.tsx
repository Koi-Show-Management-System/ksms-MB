import { MaterialIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// Sử dụng alias path từ tsconfig.json
import {
  CompetitionCategory,
  getCompetitionCategories,
} from "@/services/registrationService";
import {
  AwardResult,
  getCategoryResults,
  ResultMedia,
} from "@/services/resultService";

interface KoiShowResultsProps {
  showId: string;
}

// Component hiển thị một hạng mục để chọn
const CategorySelectItem = React.memo(
  ({
    item,
    onPress,
    isSelected,
  }: {
    item: CompetitionCategory;
    onPress: (id: string, name: string) => void;
    isSelected: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.categoryCard, isSelected && styles.selectedCategoryCard]}
      onPress={() => onPress(item.id, item.name)}>
      <Text
        style={[
          styles.categoryName,
          isSelected && styles.selectedCategoryText,
        ]}>
        {item.name}
      </Text>
      <Text style={styles.categorySize}>
        {item.sizeMin} - {item.sizeMax} cm
      </Text>
    </TouchableOpacity>
  )
);

// Component hiển thị một người thắng giải
const AwardWinnerCard = ({ item }: { item: AwardResult }) => {
  const getAwardStyle = (awardType: string | null | undefined) => {
    switch (awardType?.toLowerCase()) {
      case "first":
        return styles.firstPlace;
      case "second":
        return styles.secondPlace;
      case "third":
        return styles.thirdPlace;
      case "honorable":
        return styles.honorableMention; // Giả sử có giải khuyến khích
      default:
        return {};
    }
  };

  const getAwardIcon = (awardType: string | null | undefined) => {
    switch (awardType?.toLowerCase()) {
      case "first":
        return { name: "emoji-events", color: "#FFD700" }; // Gold
      case "second":
        return { name: "emoji-events", color: "#C0C0C0" }; // Silver
      case "third":
        return { name: "emoji-events", color: "#CD7F32" }; // Bronze
      case "honorable":
        return { name: "military-tech", color: "#888" }; // Honorable mention
      default:
        return { name: "help-outline", color: "#ccc" };
    }
  };

  const awardStyle = getAwardStyle(item.awardType);
  const awardIcon = getAwardIcon(item.awardType);
  // Lấy ảnh từ mảng media
  const imageMedia = item.media?.find(
    (m: ResultMedia) => m.mediaType === "Image"
  );

  return (
    <View style={[styles.winnerCard, awardStyle]}>
      <View style={styles.awardIconContainer}>
        <MaterialIcons
          name={awardIcon.name as any}
          size={28}
          color={awardIcon.color}
        />
        <Text style={styles.awardTypeText}>
          {item.awardName ?? item.awardType?.toUpperCase() ?? "N/A"}
        </Text>
        {item.rank && <Text style={styles.rankText}>Hạng: {item.rank}</Text>}
      </View>
      <View style={styles.winnerInfo}>
        {imageMedia ? (
          <Image
            source={{ uri: imageMedia.mediaUrl }}
            style={styles.winnerImage}
          />
        ) : (
          <View style={styles.winnerImagePlaceholder}>
            <MaterialIcons name="image" size={30} color="#ccc" />
          </View>
        )}
        <View style={styles.winnerTextContainer}>
          <Text style={styles.winnerName} numberOfLines={1}>
            {item.koiName ?? "N/A"}
          </Text>
          <Text style={styles.winnerVariety} numberOfLines={1}>
            {item.variety ?? "N/A"}
          </Text>
          <Text style={styles.winnerRegCode}>
            #
            {item.registrationNumber ??
              item.registrationId.substring(0, 6) ??
              "N/A"}
          </Text>
          <Text style={styles.winnerOwner}>
            Người đăng ký: {item.registerName ?? "N/A"}
          </Text>
          <Text style={styles.winnerSize}>
            Kích thước: {item.koiSize?.toFixed(2) ?? "N/A"} cm
          </Text>
          {item.finalScore !== undefined && item.finalScore !== null && (
            <Text style={styles.winnerScore}>
              Điểm: {item.finalScore.toFixed(2)}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const KoiShowResults: React.FC<KoiShowResultsProps> = ({ showId }) => {
  const [categories, setCategories] = useState<CompetitionCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>("");
  const [results, setResults] = useState<AwardResult[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lấy danh sách hạng mục
  const fetchCategories = useCallback(
    async (isRefreshing = false) => {
      if (!isRefreshing) setIsLoadingCategories(true);
      setError(null);
      try {
        // *** Đảm bảo hàm getCompetitionCategories tồn tại và hoạt động ***
        const response = await getCompetitionCategories(showId);
        if (response?.data?.items) {
          setCategories(response.data.items);
          // Tự động chọn hạng mục đầu tiên nếu có
          if (response.data.items.length > 0 && !selectedCategory) {
            handleCategorySelect(
              response.data.items[0].id,
              response.data.items[0].name
            );
          } else if (selectedCategory && response.data.items.length > 0) {
            // Refresh results for the currently selected category
            fetchResults(selectedCategory, isRefreshing);
          } else {
            setError("Cuộc thi này chưa có hạng mục nào.");
          }
        } else {
          setError("Không tìm thấy hạng mục thi đấu.");
        }
      } catch (err) {
        console.error("Lỗi khi tải hạng mục:", err);
        setError("Đã xảy ra lỗi khi tải hạng mục.");
      } finally {
        if (!isRefreshing) setIsLoadingCategories(false);
        if (isRefreshing && !selectedCategory) setRefreshing(false);
      }
    },
    [showId, selectedCategory, fetchResults]
  );

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCategories(true);
  }, [fetchCategories]);

  useEffect(() => {
    if (showId) {
      fetchCategories();
    }
  }, [showId, fetchCategories]);

  // Lấy kết quả khi chọn hạng mục
  const fetchResults = useCallback(
    async (categoryId: string, isRefreshing = false) => {
      if (!categoryId) return;
      if (!isRefreshing) {
        setIsLoadingResults(true);
        setResults([]); // Xóa kết quả cũ khi không phải refreshing
      }
      setError(null);
      try {
        // *** Cần tạo hàm getCategoryResults trong resultService ***
        const response = await getCategoryResults(categoryId); // Chỉ cần categoryId theo API mới
        if (response?.data) {
          // Sắp xếp kết quả theo rank
          const sortedResults = response.data.sort(
            (a: AwardResult, b: AwardResult) =>
              (a.rank ?? 999) - (b.rank ?? 999)
          );
          setResults(sortedResults);
          if (sortedResults.length === 0) {
            setError("Chưa có kết quả cho hạng mục này.");
          }
        } else {
          // Kiểm tra message từ API nếu có
          setError(
            response?.message ?? "Không thể tải kết quả cho hạng mục này."
          );
        }
      } catch (err: any) {
        console.error("Lỗi khi tải kết quả:", err);
        setError(
          err?.response?.data?.message ||
            err.message ||
            "Đã xảy ra lỗi khi tải kết quả."
        );
      } finally {
        if (!isRefreshing) setIsLoadingResults(false);
        if (isRefreshing) setRefreshing(false);
      }
    },
    []
  ); // Bỏ showId khỏi dependency vì API mới không cần

  // Xử lý chọn hạng mục
  const handleCategorySelect = useCallback(
    (categoryId: string, categoryName: string) => {
      setSelectedCategory(categoryId);
      setSelectedCategoryName(categoryName); // Lưu tên hạng mục được chọn
      fetchResults(categoryId);
    },
    [fetchResults]
  );

  const renderCategoryItem = useCallback(
    ({ item }: { item: CompetitionCategory }) => (
      <CategorySelectItem
        item={item}
        onPress={handleCategorySelect}
        isSelected={selectedCategory === item.id}
      />
    ),
    [selectedCategory, handleCategorySelect]
  );

  const renderResultItem = useCallback(
    ({ item }: { item: AwardResult }) => <AwardWinnerCard item={item} />,
    []
  );

  return (
    <View style={styles.container}>
      {/* Chọn hạng mục */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Chọn Hạng Mục</Text>
        {isLoadingCategories ? (
          <ActivityIndicator
            size="small"
            color="#000000"
            style={styles.loadingIndicator}
          />
        ) : categories.length > 0 ? (
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalListContent}
          />
        ) : (
          !error && <Text style={styles.emptyText}>Không có hạng mục nào.</Text>
        )}
        {/* Hiển thị lỗi nếu có khi tải hạng mục */}
        {!isLoadingCategories && error && categories.length === 0 && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={40} color="#e74c3c" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>

      {/* Hiển thị kết quả */}
      <View style={[styles.sectionContainer, styles.resultsListContainer]}>
        <Text style={styles.sectionTitle}>
          Kết Quả {selectedCategoryName ? `- ${selectedCategoryName}` : ""}
        </Text>
        {isLoadingResults ? (
          <ActivityIndicator
            size="large"
            color="#000000"
            style={styles.loadingIndicator}
          />
        ) : error && results.length === 0 ? ( // Chỉ hiển thị lỗi nếu không có kết quả nào được tải
          <View style={styles.errorContainer}>
            <MaterialIcons name="info-outline" size={40} color="#3498db" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : results.length > 0 ? (
          <View style={{ flex: 1 }}>
            <FlatList
              data={results}
              renderItem={renderResultItem}
              keyExtractor={(item) => item.registrationId} // Sử dụng ID duy nhất
              contentContainerStyle={styles.resultsListContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={["#007bff"]}
                  tintColor="#007bff"
                />
              }
            />
          </View>
        ) : !selectedCategory && !isLoadingCategories ? ( // Chỉ hiển thị khi không loading categories và chưa chọn category
          <Text style={styles.emptyText}>
            Vui lòng chọn hạng mục để xem kết quả.
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa", // Light gray background
  },
  sectionContainer: {
    paddingVertical: 12,
    backgroundColor: "#ffffff", // White background for sections
    marginBottom: 8,
    // Subtle shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  resultsListContainer: {
    flex: 1, // Allow results list to take remaining space
    marginBottom: 0, // Remove bottom margin for the last section
  },
  sectionTitle: {
    fontSize: 17, // Slightly larger title
    fontWeight: "600",
    marginBottom: 12, // More space below title
    color: "#343a40", // Darker gray color
    paddingHorizontal: 16,
  },
  horizontalListContent: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  categoryCard: {
    backgroundColor: "#e9ecef", // Lighter gray for inactive categories
    paddingVertical: 10,
    paddingHorizontal: 18, // More horizontal padding
    marginRight: 10,
    borderRadius: 25, // More rounded corners
    borderWidth: 1,
    borderColor: "#dee2e6", // Light border color
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center", // Center content vertically
    height: 55, // Fixed height for consistency
  },
  selectedCategoryCard: {
    backgroundColor: "#007bff", // Primary blue for selected
    borderColor: "#0056b3", // Darker blue border
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#495057", // Standard gray text
    textAlign: "center",
  },
  categorySize: {
    fontSize: 11, // Smaller size text
    color: "#6c757d", // Muted gray
    marginTop: 3,
  },
  selectedCategoryText: {
    color: "#ffffff", // White text on selected
    fontWeight: "600",
  },
  resultsListContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 150, // Thêm padding bottom lớn để tránh bị footer che khuất
  },
  winnerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    marginBottom: 15, // More space between cards
    padding: 15, // More padding inside card
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 6, // Thicker border
    // More pronounced shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 4,
  },
  awardIconContainer: {
    marginRight: 15,
    alignItems: "center",
    width: 65, // Slightly wider icon area
  },
  awardTypeText: {
    fontSize: 11, // Slightly larger award type text
    fontWeight: "bold",
    marginTop: 5,
    color: "#555",
    textTransform: "uppercase",
    textAlign: "center",
  },
  rankText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#777",
    marginTop: 3,
  },
  winnerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  winnerImage: {
    width: 60, // Larger image
    height: 60,
    borderRadius: 30, // Keep it circular
    marginRight: 15,
    borderWidth: 2, // Thicker border for image
    borderColor: "#e9ecef",
  },
  winnerImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    backgroundColor: "#f1f3f5", // Lighter placeholder background
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  winnerTextContainer: {
    flex: 1,
  },
  winnerName: {
    fontSize: 16, // Larger name
    fontWeight: "bold", // Bold name
    color: "#212529", // Almost black
    marginBottom: 2,
  },
  winnerVariety: {
    fontSize: 14, // Slightly larger variety
    color: "#495057",
    marginBottom: 4,
  },
  winnerRegCode: {
    fontSize: 12,
    color: "#6c757d", // Muted gray
    fontStyle: "italic",
    marginBottom: 3,
  },
  winnerOwner: {
    fontSize: 12,
    color: "#6c757d",
    marginBottom: 3,
  },
  winnerSize: {
    fontSize: 12,
    color: "#6c757d",
    marginBottom: 3,
  },
  winnerScore: {
    fontSize: 13,
    fontWeight: "600",
    color: "#007bff", // Blue score
    marginTop: 2,
  },
  // Styles for different award types
  firstPlace: {
    borderColor: "#ffc107", // Bootstrap warning yellow (like gold)
    backgroundColor: "#fffcf1",
  },
  secondPlace: {
    borderColor: "#adb5bd", // Bootstrap secondary gray (like silver)
    backgroundColor: "#f8f9fa",
  },
  thirdPlace: {
    borderColor: "#fd7e14", // Bootstrap orange (like bronze)
    backgroundColor: "#fff8f2",
  },
  honorableMention: {
    borderColor: "#ced4da", // Lighter gray
    backgroundColor: "#f8f9fa",
  },
  loadingIndicator: {
    marginTop: 30,
    marginBottom: 30,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    marginTop: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 15, // Slightly larger error text
    color: "#6c757d", // More muted error color
    textAlign: "center",
    lineHeight: 22,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 30, // More margin top
    fontSize: 15,
    color: "#6c757d",
    paddingHorizontal: 20, // Padding for better readability
  },
});

export default KoiShowResults;
