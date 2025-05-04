import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  CompetitionCategory,
  getCompetitionCategories,
  getContestants,
  getRounds,
  KoiContestant,
  Round,
} from "../../../services/contestantService";
import { translateStatus } from "../../../utils/statusTranslator"; // Import hàm dịch mới
interface KoiContestantsProps {
  showId: string;
}

const KoiContestants: React.FC<KoiContestantsProps> = ({ showId }) => {
  const [categories, setCategories] = useState<CompetitionCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>("");
  const [roundTypes] = useState<string[]>([
    "Preliminary",
    "Evaluation",
    "Final",
  ]);
  const [roundTypeLabels] = useState<Record<string, string>>({
    Preliminary: "Sơ khảo",
    Evaluation: "Đánh giá",
    Final: "Chung kết",
  });
  const [selectedRoundType, setSelectedRoundType] = useState<string | null>(
    null
  );
  const [rounds, setRounds] = useState<Round[]>([]);
  const [selectedRound, setSelectedRound] = useState<string | null>(null);
  const [contestants, setContestants] = useState<KoiContestant[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedContestant, setSelectedContestant] =
    useState<KoiContestant | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showAllContestants, setShowAllContestants] = useState(false);
  const [activeTabInModal, setActiveTabInModal] = useState("info");
  const [currentPage, setCurrentPage] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const itemsPerPage = 4;

  // Forward declarations to avoid circular dependencies
  const fetchRounds = useCallback(async (isRefreshing = false) => {}, []);
  const fetchContestants = useCallback(async (isRefreshing = false) => {}, []);

  // Lấy danh sách hạng mục thi đấu
  const fetchCategories = useCallback(
    async (isRefreshing = false) => {
      if (!isRefreshing) setLoading(true);
      setError(null);
      try {
        const response = await getCompetitionCategories(showId);
        if (response?.data?.items) {
          setCategories(response.data.items);
          if (response.data.items.length > 0 && !selectedCategory) {
            setSelectedCategory(response.data.items[0].id);
            setSelectedCategoryName(response.data.items[0].name);
          }
        } else {
          setError("Không tìm thấy hạng mục thi đấu");
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách hạng mục:", error);
        setError("Đã xảy ra lỗi khi tải danh sách hạng mục");
      } finally {
        setLoading(false);
        if (isRefreshing) setRefreshing(false);
      }
    },
    [showId, selectedCategory]
  );

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCategories(true);

    // If we have selected category and round type, refresh rounds
    if (selectedCategory && selectedRoundType) {
      fetchRounds(true);
    }

    // If we have selected round, refresh contestants
    if (selectedRound) {
      fetchContestants(true);
    }
  }, [
    selectedCategory,
    selectedRoundType,
    selectedRound,
    fetchCategories,
    fetchRounds,
    fetchContestants,
  ]);

  useEffect(() => {
    if (showId) {
      fetchCategories();
    }
  }, [showId, fetchCategories]);

  // Lấy danh sách vòng đấu khi chọn hạng mục và loại vòng
  // Override the initial empty implementation
  Object.assign(
    fetchRounds,
    useCallback(
      async (isRefreshing = false) => {
        if (!selectedCategory || !selectedRoundType) return;

        if (!isRefreshing) setLoading(true);
        setError(null);
        try {
          const response = await getRounds(selectedCategory, selectedRoundType);
          if (response?.data?.items) {
            setRounds(response.data.items);
            if (!isRefreshing) {
              setSelectedRound(null);
              setContestants([]);
            }
          } else {
            setError(
              `Không tìm thấy vòng đấu ${roundTypeLabels[selectedRoundType]}`
            );
          }
        } catch (error) {
          console.error("Lỗi khi lấy danh sách vòng đấu:", error);
          setError(
            `Đã xảy ra lỗi khi tải vòng đấu ${roundTypeLabels[selectedRoundType]}`
          );
        } finally {
          if (!isRefreshing) setLoading(false);
          if (isRefreshing && !selectedRound) setRefreshing(false);
        }
      },
      [selectedCategory, selectedRoundType, roundTypeLabels, selectedRound]
    )
  );

  useEffect(() => {
    if (selectedCategory && selectedRoundType) {
      fetchRounds();
    }
  }, [selectedCategory, selectedRoundType, fetchRounds]);

  // Lấy danh sách thí sinh khi chọn vòng đấu
  // Override the initial empty implementation
  Object.assign(
    fetchContestants,
    useCallback(
      async (isRefreshing = false) => {
        if (!selectedRound) return;

        if (!isRefreshing) setLoading(true);
        setError(null);
        try {
          const response = await getContestants(selectedRound);
          if (response?.data?.items) {
            setContestants(response.data.items);
            if (response.data.items.length === 0) {
              setError("Chưa có thí sinh nào trong vòng đấu này");
            }
          } else {
            setError("Không thể tải danh sách thí sinh");
          }
        } catch (error) {
          console.error("Lỗi khi lấy danh sách thí sinh:", error);
          setError("Đã xảy ra lỗi khi tải danh sách thí sinh");
        } finally {
          if (!isRefreshing) setLoading(false);
          if (isRefreshing) setRefreshing(false);
        }
      },
      [selectedRound]
    )
  );

  useEffect(() => {
    if (selectedRound) {
      fetchContestants();
    }
  }, [selectedRound, fetchContestants]);

  // Tính số trang
  const totalPages = Math.ceil(contestants.length / itemsPerPage);

  // Lấy dữ liệu cho trang hiện tại
  const getCurrentPageData = () => {
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    return contestants.slice(start, end);
  };

  // Xử lý chuyển trang
  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Xử lý khi cuối hồi danh sách
  const handleFetchEnd = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Hiển thị chi tiết thí sinh
  const handleContestantPress = (contestant: KoiContestant) => {
    console.log("Contestant pressed:", contestant.id);
    setSelectedContestant(contestant);
    setActiveMediaIndex(0); // Reset về media đầu tiên
    setActiveTabInModal("info"); // Reset tab về info khi mở modal
    setShowModal(true);
  };

  // Chọn hạng mục
  const handleCategorySelect = (categoryId: string, categoryName: string) => {
    setSelectedCategory(categoryId);
    setSelectedCategoryName(categoryName);
    setSelectedRoundType(null);
    setSelectedRound(null);
    setContestants([]);
  };

  // Thêm hàm xử lý sự kiện khi click vào nút "Xem thêm"
  const handleShowMoreContestants = () => {
    setShowAllContestants(true);
  };

  // Render hạng mục
  const renderCategoryItem = ({ item }: { item: CompetitionCategory }) => (
    <TouchableOpacity
      style={[
        styles.categoryCard,
        selectedCategory === item.id && styles.selectedCard,
      ]}
      onPress={() => handleCategorySelect(item.id, item.name)}>
      <Text
        style={[
          styles.categoryName,
          selectedCategory === item.id && styles.selectedText,
        ]}>
        {item.name}
      </Text>
      <Text style={styles.categorySize}>
        {item.sizeMin}-{item.sizeMax}cm
      </Text>
    </TouchableOpacity>
  );

  // Render loại vòng đấu
  const renderRoundTypeItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.roundTypeCard,
        selectedRoundType === item && styles.selectedCard,
        // Thêm style nổi bật hơn
        {
          backgroundColor: selectedRoundType === item ? "#3B82F6" : "#f0f0f0",
          padding: 12,
          borderRadius: 8,
          marginHorizontal: 5,
          minWidth: 100,
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 2,
        },
      ]}
      onPress={() => {
        console.log(
          `[DEBUG] Round type selected: ${item}, label: ${roundTypeLabels[item]}`
        );

        // Đặt trạng thái loading ngay lập tức để người dùng biết đang xử lý
        setLoading(true);

        // Cập nhật state
        setSelectedRoundType(item);
        setSelectedRound(null);
        setContestants([]);

        // Gọi API để lấy danh sách vòng đấu phụ
        if (selectedCategory) {
          console.log(
            `[DEBUG] Calling API for rounds with categoryId=${selectedCategory}, roundType=${item}`
          );

          // Gọi API để lấy danh sách vòng đấu phụ
          getRounds(selectedCategory, item)
            .then((response: any) => {
              console.log(
                `[DEBUG] API response status: ${response.statusCode || 200}`
              );

              // Xử lý dữ liệu từ API
              if (response?.data?.items && response.data.items.length > 0) {
                setRounds(response.data.items);
                setError(null);
                console.log(
                  `[DEBUG] Found ${response.data.items.length} rounds for ${roundTypeLabels[item]}`
                );
              } else {
                setRounds([]);
                setError(`Không tìm thấy vòng đấu ${roundTypeLabels[item]}`);
                console.log(
                  `[DEBUG] No rounds found for ${roundTypeLabels[item]}`
                );
              }
            })
            .catch((error: any) => {
              console.error(`[DEBUG] API error:`, error);
              setRounds([]);
              setError(
                `Đã xảy ra lỗi khi tải vòng đấu ${roundTypeLabels[item]}`
              );
            })
            .finally(() => {
              setLoading(false);
            });
        }
      }}>
      <Text
        style={[
          styles.roundTypeName,
          selectedRoundType === item && styles.selectedText,
          {
            color: selectedRoundType === item ? "white" : "#333",
            fontWeight: selectedRoundType === item ? "bold" : "normal",
            fontSize: 16,
          },
        ]}>
        {roundTypeLabels[item]}
      </Text>
    </TouchableOpacity>
  );

  // Render vòng đấu phụ
  const renderRoundItem = ({ item }: { item: Round }) => (
    <TouchableOpacity
      style={[
        styles.roundCard,
        selectedRound === item.id && styles.selectedCard,
        // Thêm style nổi bật hơn
        {
          backgroundColor: selectedRound === item.id ? "#3B82F6" : "#f0f0f0",
          padding: 12,
          borderRadius: 8,
          marginHorizontal: 5,
          minWidth: 120,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 2,
        },
      ]}
      onPress={() => {
        console.log(`[DEBUG] Round selected: ${item.id}, name: ${item.name}`);

        // Đặt trạng thái loading ngay lập tức để người dùng biết đang xử lý
        setLoading(true);

        // Cập nhật state
        setSelectedRound(item.id);
        setContestants([]);

        // Gọi API để lấy danh sách thí sinh
        console.log(
          `[DEBUG] Calling API for contestants with roundId=${item.id}`
        );

        // Gọi API để lấy danh sách thí sinh
        getContestants(item.id)
          .then((response: any) => {
            console.log(
              `[DEBUG] API response status: ${response.statusCode || 200}`
            );

            // Xử lý dữ liệu từ API
            if (response?.data?.items) {
              console.log(
                `[DEBUG] Found ${response.data.items.length} contestants`
              );
              setContestants(response.data.items);
              setError(null);

              if (response.data.items.length === 0) {
                setError("Chưa có thí sinh nào trong vòng đấu này");
              }
            } else {
              console.log(`[DEBUG] No contestants found`);
              setContestants([]);
              setError("Không thể tải danh sách thí sinh");
            }
          })
          .catch((error: any) => {
            console.error(`[DEBUG] API error:`, error);
            setContestants([]);
            setError("Đã xảy ra lỗi khi tải danh sách thí sinh");
          })
          .finally(() => {
            setLoading(false);
          });
      }}>
      <Text
        style={[
          styles.roundName,
          selectedRound === item.id && styles.selectedText,
          {
            color: selectedRound === item.id ? "white" : "#333",
            fontWeight: selectedRound === item.id ? "bold" : "normal",
            fontSize: 14,
            marginBottom: 8,
          },
        ]}>
        {item.name}
      </Text>
      <View style={styles.roundStatusContainer}>
        <Text
          style={[
            styles.roundStatus,
            item.status === "completed"
              ? styles.completedStatus
              : item.status === "active"
              ? styles.activeStatus
              : styles.upcomingStatus,
            {
              fontSize: 12,
              fontWeight: "500",
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 12,
              overflow: "hidden",
              color: selectedRound === item.id ? "white" : undefined,
            },
          ]}>
          {translateStatus(item.status)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Render một thí sinh
  const renderContestantItem = ({ item }: { item: KoiContestant }) => {
    const imageMedia = item.registration.koiMedia.find(
      (m) => m.mediaType === "Image"
    );
    const hasVideo = item.registration.koiMedia.some(
      (m) => m.mediaType === "Video"
    );

    // Lấy kết quả thi đấu mới nhất nếu có
    const latestResult =
      item.roundResults && item.roundResults.length > 0
        ? item.roundResults[item.roundResults.length - 1]
        : null;

    // Xác định loại vòng đấu
    const roundType = selectedRoundType;

    return (
      <View style={styles.contestantCard}>
        <TouchableOpacity
          style={styles.contestantCardContent}
          onPress={() => handleContestantPress(item)}>
          <View style={styles.contestantImageContainer}>
            {imageMedia ? (
              <Image
                source={{ uri: imageMedia.mediaUrl }}
                style={styles.contestantImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.noImageContainer}>
                <Ionicons name="fish" size={32} color="#cccccc" />
              </View>
            )}
            {hasVideo && (
              <View style={styles.videoIndicator}>
                <MaterialIcons
                  name="play-circle-filled"
                  size={24}
                  color="#ffffff"
                />
              </View>
            )}

            {/* Hiển thị xếp hạng nếu có */}
            {item.rank && (
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{item.rank}</Text>
              </View>
            )}

            {/* Hiển thị mã đăng ký */}
            {(item.registration.registrationNumber || item.id) && (
              <View style={styles.registrationBadge}>
                <Text style={styles.registrationText}>
                  #
                  {item.registration.registrationNumber ||
                    item.id.substring(0, 8)}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.contestantInfo}>
            <Text style={styles.contestantName} numberOfLines={1}>
              {item.registration.koiProfile.name}
            </Text>
            <Text style={styles.contestantVariety} numberOfLines={1}>
              {item.registration.koiProfile.variety.name}
            </Text>
            <View style={styles.contestantDetailRow}>
              <Text style={styles.contestantDetail}>
                {item.registration.koiSize}cm
              </Text>
              <Text style={styles.contestantDetail}>
                {item.registration.koiProfile.gender}
              </Text>
            </View>

            {/* Hiển thị điểm tổng và trạng thái trên cùng một hàng */}
            {latestResult && (
              <View style={styles.scoreStatusContainer}>
                {/* Hiển thị điểm tổng cho vòng Evaluation và Final */}
                {(roundType === "Evaluation" || roundType === "Final") &&
                  latestResult.totalScore !== undefined && (
                    <View style={styles.scoreContainer}>
                      <MaterialIcons name="star" size={14} color="#f39c12" />
                      <Text style={styles.scoreText}>
                        {latestResult.totalScore.toFixed(2)}
                      </Text>
                    </View>
                  )}

                {/* Hiển thị trạng thái */}
                <View
                  style={[
                    styles.contestantStatusBadge,
                    latestResult.status === "Pass"
                      ? styles.advancedStatus
                      : latestResult.status === "Fail"
                      ? styles.eliminatedStatus
                      : styles.pendingStatus,
                  ]}>
                  <Text
                    style={[
                      styles.contestantStatusText,
                      latestResult.status === "Pass"
                        ? { color: "#27ae60" }
                        : latestResult.status === "Fail"
                        ? { color: "#e74c3c" }
                        : { color: "#3498db" },
                    ]}>
                    {translateStatus(latestResult.status)}
                  </Text>
                </View>
              </View>
            )}

            {item.tankName && (
              <View style={styles.tankNameContainer}>
                <MaterialIcons name="pool" size={14} color="#3498db" />
                <Text style={styles.tankName}>{item.tankName}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3B82F6"]}
            tintColor="#3B82F6"
          />
        }>
        {/* Breadcrumb navigation */}
        <View style={styles.breadcrumbContainer}>
          <Text style={styles.breadcrumbText}>
            {selectedCategoryName}
            {selectedRoundType
              ? ` > ${roundTypeLabels[selectedRoundType]}`
              : ""}
            {selectedRound && rounds.find((r) => r.id === selectedRound)
              ? ` > ${rounds.find((r) => r.id === selectedRound)?.name}`
              : ""}
          </Text>
        </View>

        {/* Danh sách hạng mục */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Hạng mục thi đấu</Text>
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={renderCategoryItem}
            contentContainerStyle={styles.horizontalListContent}
            nestedScrollEnabled={true}
          />
        </View>

        {/* Danh sách loại vòng đấu */}
        {selectedCategory && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Vòng đấu</Text>
            <FlatList
              data={roundTypes}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item}
              renderItem={renderRoundTypeItem}
              contentContainerStyle={styles.horizontalListContent}
              nestedScrollEnabled={true}
            />
          </View>
        )}

        {/* Danh sách vòng đấu phụ */}
        {selectedRoundType && (
          <View
            style={[
              styles.sectionContainer,
              { marginBottom: 24, paddingBottom: 12 },
            ]}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}>
              <Text style={styles.sectionTitle}>Vòng đấu phụ</Text>
              <Text style={{ color: "#666", fontSize: 14 }}>
                {rounds.length > 0
                  ? `${rounds.length} vòng đấu`
                  : "Đang tải..."}
              </Text>
            </View>

            {loading ? (
              <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text style={{ marginTop: 8, color: "#666" }}>
                  Đang tải danh sách vòng đấu...
                </Text>
              </View>
            ) : rounds.length > 0 ? (
              <FlatList
                data={rounds}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                renderItem={renderRoundItem}
                contentContainerStyle={styles.horizontalListContent}
                nestedScrollEnabled={true}
              />
            ) : (
              <View
                style={{
                  padding: 20,
                  alignItems: "center",
                  backgroundColor: "#f8f8f8",
                  borderRadius: 8,
                }}>
                <MaterialIcons name="info-outline" size={24} color="#666" />
                <Text
                  style={{ marginTop: 8, color: "#666", textAlign: "center" }}>
                  {error ||
                    `Không tìm thấy vòng đấu ${
                      roundTypeLabels[selectedRoundType] || ""
                    }`}
                </Text>
                <TouchableOpacity
                  style={{
                    marginTop: 12,
                    backgroundColor: "#3B82F6",
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 5,
                  }}
                  onPress={() => {
                    console.log(
                      `[DEBUG] Retry button pressed for roundType: ${selectedRoundType}`
                    );
                    setLoading(true);
                    getRounds(selectedCategory || "", selectedRoundType || "")
                      .then((response: any) => {
                        if (
                          response?.data?.items &&
                          response.data.items.length > 0
                        ) {
                          setRounds(response.data.items);
                          setError(null);
                        } else {
                          setRounds([]);
                          setError(
                            `Không tìm thấy vòng đấu ${roundTypeLabels[selectedRoundType]}`
                          );
                        }
                      })
                      .catch(() => {
                        setRounds([]);
                        setError(
                          `Đã xảy ra lỗi khi tải vòng đấu ${roundTypeLabels[selectedRoundType]}`
                        );
                      })
                      .finally(() => {
                        setLoading(false);
                      });
                  }}>
                  <Text style={{ color: "white", fontWeight: "bold" }}>
                    Thử lại
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Danh sách thí sinh */}
        {selectedRound && (
          <View style={styles.contestantsContainer}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}>
              <Text style={styles.contestantsTitle}>
                Thí sinh{" "}
                {contestants.length > 0 ? `(${contestants.length})` : ""}
              </Text>
              {contestants.length > 0 && (
                <TouchableOpacity
                  style={{
                    backgroundColor: "#3B82F6",
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 5,
                    marginRight: 10,
                  }}
                  onPress={() => {
                    console.log(
                      `[DEBUG] Refresh contestants button pressed for roundId: ${selectedRound}`
                    );
                    setLoading(true);
                    getContestants(selectedRound)
                      .then((response: any) => {
                        if (response?.data?.items) {
                          setContestants(response.data.items);
                          setError(null);
                        } else {
                          setContestants([]);
                          setError("Không thể tải danh sách thí sinh");
                        }
                      })
                      .catch(() => {
                        setContestants([]);
                        setError("Đã xảy ra lỗi khi tải danh sách thí sinh");
                      })
                      .finally(() => {
                        setLoading(false);
                      });
                  }}>
                  <Text style={{ color: "white", fontWeight: "bold" }}>
                    Tải lại
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {loading ? (
              <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text style={{ marginTop: 8, color: "#666" }}>
                  Đang tải danh sách thí sinh...
                </Text>
              </View>
            ) : contestants.length > 0 ? (
              <View style={styles.carouselContainer}>
                <FlatList
                  data={getCurrentPageData()}
                  renderItem={renderContestantItem}
                  keyExtractor={(item) => item.id}
                  horizontal={true}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.carouselContent}
                  ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
                  snapToAlignment="start"
                  decelerationRate="fast"
                  snapToInterval={Dimensions.get("window").width * 0.7 + 16}
                  initialNumToRender={4}
                  maxToRenderPerBatch={4}
                  windowSize={5}
                  getItemLayout={(_data, index) => ({
                    length: Dimensions.get("window").width * 0.7,
                    offset: (Dimensions.get("window").width * 0.7 + 16) * index,
                    index,
                  })}
                />

                {/* Pagination */}
                <View style={styles.paginationContainer}>
                  <TouchableOpacity
                    style={[
                      styles.pageButton,
                      currentPage === 0 && styles.pageButtonDisabled,
                    ]}
                    onPress={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}>
                    <MaterialIcons
                      name="chevron-left"
                      size={24}
                      color={currentPage === 0 ? "#ccc" : "#000"}
                    />
                  </TouchableOpacity>

                  <View style={styles.pageIndicatorContainer}>
                    {Array.from({ length: totalPages }).map((_, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.pageIndicator,
                          currentPage === index && styles.activePageIndicator,
                        ]}
                        onPress={() => handlePageChange(index)}>
                        <Text
                          style={[
                            styles.pageIndicatorText,
                            currentPage === index &&
                              styles.activePageIndicatorText,
                          ]}>
                          {index + 1}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.pageButton,
                      currentPage === totalPages - 1 &&
                        styles.pageButtonDisabled,
                    ]}
                    onPress={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages - 1}>
                    <MaterialIcons
                      name="chevron-right"
                      size={24}
                      color={currentPage === totalPages - 1 ? "#ccc" : "#000"}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View
                style={{
                  padding: 20,
                  alignItems: "center",
                  backgroundColor: "#f8f8f8",
                  borderRadius: 8,
                }}>
                <MaterialIcons name="info-outline" size={24} color="#666" />
                <Text
                  style={{ marginTop: 8, color: "#666", textAlign: "center" }}>
                  {error || "Chưa có thí sinh nào trong vòng đấu này"}
                </Text>
                <TouchableOpacity
                  style={{
                    marginTop: 12,
                    backgroundColor: "#3B82F6",
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 5,
                  }}
                  onPress={() => {
                    console.log(
                      `[DEBUG] Retry button pressed for roundId: ${selectedRound}`
                    );
                    setLoading(true);
                    getContestants(selectedRound)
                      .then((response: any) => {
                        if (response?.data?.items) {
                          setContestants(response.data.items);
                          setError(null);
                        } else {
                          setContestants([]);
                          setError("Không thể tải danh sách thí sinh");
                        }
                      })
                      .catch(() => {
                        setContestants([]);
                        setError("Đã xảy ra lỗi khi tải danh sách thí sinh");
                      })
                      .finally(() => {
                        setLoading(false);
                      });
                  }}>
                  <Text style={{ color: "white", fontWeight: "bold" }}>
                    Thử lại
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal */}
      <Modal
        visible={showModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowModal(false)}>
              <MaterialIcons name="close" size={24} color="#000000" />
            </TouchableOpacity>

            {selectedContestant ? (
              <View style={styles.fullDetailsContainer}>
                {/* Tab Navigation */}
                <View style={styles.modalTabContainer}>
                  <TouchableOpacity
                    style={[
                      styles.modalTabButton,
                      activeTabInModal === "info" &&
                        styles.activeModalTabButton,
                    ]}
                    onPress={() => setActiveTabInModal("info")}>
                    <MaterialIcons
                      name="info-outline"
                      size={18}
                      color={
                        activeTabInModal === "info" ? "#2196F3" : "#777777"
                      }
                    />
                    <Text
                      style={[
                        styles.modalTabText,
                        activeTabInModal === "info" &&
                          styles.activeModalTabText,
                      ]}>
                      Thông tin chi tiết
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalTabButton,
                      activeTabInModal === "media" &&
                        styles.activeModalTabButton,
                    ]}
                    onPress={() => setActiveTabInModal("media")}>
                    <MaterialIcons
                      name="photo-library"
                      size={18}
                      color={
                        activeTabInModal === "media" ? "#2196F3" : "#777777"
                      }
                    />
                    <Text
                      style={[
                        styles.modalTabText,
                        activeTabInModal === "media" &&
                          styles.activeModalTabText,
                      ]}>
                      Hình ảnh & Video
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Tab Content */}
                <View style={styles.modalTabContentContainer}>
                  {activeTabInModal === "info" ? (
                    <ScrollView style={styles.modalScrollContent}>
                      <View style={styles.infoContainer}>
                        <InfoRow
                          label="Mã Đăng Ký"
                          value={
                            selectedContestant.registration
                              .registrationNumber ||
                            selectedContestant.id.substring(0, 8)
                          }
                        />
                        <InfoRow
                          label="Tên Người Đăng Ký"
                          value={
                            selectedContestant.registration.registerName ||
                            "Không có thông tin"
                          }
                        />
                        <InfoRow
                          label="Tên Cá Koi"
                          value={
                            selectedContestant.registration.koiProfile.name
                          }
                        />
                        <InfoRow
                          label="Giống"
                          value={
                            selectedContestant.registration.koiProfile.variety
                              .name
                          }
                        />
                        <InfoRow
                          label="Kích Thước"
                          value={`${selectedContestant.registration.koiSize} cm`}
                        />
                        <InfoRow
                          label="Tuổi Cá"
                          value={`${
                            Math.floor(
                              selectedContestant.registration.koiAge / 12
                            ) || 0
                          } năm`}
                        />
                        <InfoRow
                          label="Dòng máu"
                          value={
                            selectedContestant.registration.koiProfile
                              .bloodline || "Không có thông tin"
                          }
                        />
                        <InfoRow
                          label="Hạng Mục"
                          value={selectedCategoryName}
                        />
                        {/* Removed registration fee display */}
                        {/* Removed status display */}
                        <InfoRow
                          label="Bể"
                          value={selectedContestant.tankName || "Chưa gán bể"}
                        />
                        <InfoRow
                          label="Thời gian check in"
                          value={
                            selectedContestant.checkInTime
                              ? new Date(
                                  selectedContestant.checkInTime
                                ).toLocaleString("vi-VN")
                              : "Chưa check in"
                          }
                        />

                        {/* Hiển thị kết quả thi đấu */}
                        {selectedContestant.roundResults &&
                          selectedContestant.roundResults.length > 0 && (
                            <View style={styles.resultSection}>
                              <Text style={styles.resultSectionTitle}>
                                Kết quả thi đấu:
                              </Text>
                              {selectedContestant.roundResults.map(
                                (result, index) => {
                                  // Xác định loại vòng đấu
                                  const roundType = selectedRoundType;

                                  return (
                                    <View
                                      key={`result-${index}`}
                                      style={styles.resultItem}>
                                      <View
                                        style={styles.resultDetailsContainer}>
                                        {/* Hiển thị xếp hạng cho tất cả các loại vòng đấu */}
                                        <View style={styles.resultDetail}>
                                          <Text style={styles.resultLabel}>
                                            Xếp hạng:
                                          </Text>
                                          <Text style={styles.resultValue}>
                                            {selectedContestant.rank ||
                                              "Chưa xếp hạng"}
                                          </Text>
                                        </View>

                                        {/* Hiển thị điểm tổng và trạng thái trên cùng một hàng */}
                                        <View style={styles.resultDetailRow}>
                                          {/* Hiển thị điểm tổng cho vòng Evaluation và Final */}
                                          {(roundType === "Evaluation" ||
                                            roundType === "Final") && (
                                            <View
                                              style={styles.resultDetailHalf}>
                                              <Text style={styles.resultLabel}>
                                                Điểm tổng:
                                              </Text>
                                              <Text style={styles.resultValue}>
                                                {result.totalScore.toFixed(2)}
                                              </Text>
                                            </View>
                                          )}

                                          {/* Hiển thị trạng thái cho tất cả các loại vòng đấu */}
                                          <View style={styles.resultDetailHalf}>
                                            <Text style={styles.resultLabel}>
                                              Trạng thái:
                                            </Text>
                                            <View
                                              style={[
                                                styles.resultStatusBadge,
                                                result.status === "Pass"
                                                  ? styles.advancedStatus
                                                  : result.status === "Fail"
                                                  ? styles.eliminatedStatus
                                                  : styles.pendingStatus,
                                              ]}>
                                              <Text
                                                style={styles.resultStatusText}>
                                                {translateStatus(result.status)}
                                              </Text>
                                            </View>
                                          </View>
                                        </View>
                                      </View>
                                    </View>
                                  );
                                }
                              )}
                            </View>
                          )}

                        {selectedContestant.registration.notes && (
                          <View style={styles.notesSection}>
                            <Text style={styles.notesSectionTitle}>
                              Ghi chú:
                            </Text>
                            <Text style={styles.notesContent}>
                              {selectedContestant.registration.notes}
                            </Text>
                          </View>
                        )}
                      </View>
                    </ScrollView>
                  ) : (
                    <View style={styles.mediaTabContent}>
                      {/* Carousel */}
                      <View style={styles.mediaCarouselContainer}>
                        {selectedContestant.registration.koiMedia.length >
                          0 && (
                          <View style={styles.mediaContainer}>
                            {selectedContestant.registration.koiMedia[
                              activeMediaIndex
                            ].mediaType === "Image" ? (
                              <Image
                                source={{
                                  uri: selectedContestant.registration.koiMedia[
                                    activeMediaIndex
                                  ].mediaUrl,
                                }}
                                style={styles.modalImage}
                                resizeMode="contain"
                              />
                            ) : (
                              <Video
                                source={{
                                  uri: selectedContestant.registration.koiMedia[
                                    activeMediaIndex
                                  ].mediaUrl,
                                }}
                                style={styles.modalVideo}
                                useNativeControls
                                resizeMode={ResizeMode.CONTAIN}
                                isLooping
                                shouldPlay
                              />
                            )}
                          </View>
                        )}

                        {selectedContestant.registration.koiMedia.length >
                          1 && (
                          <View style={styles.mediaDots}>
                            {selectedContestant.registration.koiMedia.map(
                              (_, index: number) => (
                                <TouchableOpacity
                                  key={index}
                                  style={[
                                    styles.mediaDot,
                                    index === activeMediaIndex &&
                                      styles.activeMediaDot,
                                  ]}
                                  onPress={() => setActiveMediaIndex(index)}
                                />
                              )
                            )}
                          </View>
                        )}
                      </View>

                      {/* Thumbnails */}
                      <ScrollView style={styles.mediaListScrollContainer}>
                        <View style={styles.mediaListContainer}>
                          <Text style={styles.mediaListTitle}>
                            Tất cả hình ảnh và video
                          </Text>
                          <View style={styles.thumbnailGrid}>
                            {selectedContestant.registration.koiMedia.map(
                              (item, index) => (
                                <TouchableOpacity
                                  key={`media-${index}`}
                                  style={[
                                    styles.mediaThumbnailContainer,
                                    activeMediaIndex === index &&
                                      styles.activeThumbnail,
                                  ]}
                                  onPress={() => setActiveMediaIndex(index)}>
                                  <Image
                                    source={{ uri: item.mediaUrl }}
                                    style={styles.mediaThumbnail}
                                    resizeMode="cover"
                                  />
                                  {item.mediaType === "Video" && (
                                    <View style={styles.videoOverlay}>
                                      <MaterialIcons
                                        name="play-circle-outline"
                                        size={24}
                                        color="#FFFFFF"
                                      />
                                    </View>
                                  )}
                                </TouchableOpacity>
                              )
                            )}
                          </View>
                        </View>
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#000000" />
                <Text style={styles.loadingText}>Đang tải thông tin...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Component hiển thị một dòng thông tin
const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: string | React.ReactNode;
}) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    {typeof value === "string" ? (
      <Text style={styles.infoValue}>{value}</Text>
    ) : (
      value
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 120,
  },
  breadcrumbContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f0f0f0",
  },
  breadcrumbText: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },
  sectionContainer: {
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333333",
  },
  horizontalListContent: {
    paddingBottom: 16,
  },
  categoryCard: {
    backgroundColor: "#ffffff",
    padding: 12,
    marginRight: 12,
    borderRadius: 8,
    minWidth: 140,
    maxWidth: 160,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  selectedCard: {
    borderColor: "#000000",
    backgroundColor: "#f8f8f8",
    borderWidth: 2,
  },
  selectedText: {
    color: "#000000",
    fontWeight: "700",
  },
  categoryName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
    color: "#333333",
  },
  categorySize: {
    fontSize: 13,
    color: "#666666",
  },
  roundTypeCard: {
    backgroundColor: "#ffffff",
    padding: 12,
    marginRight: 12,
    borderRadius: 8,
    minWidth: 100,
    maxWidth: 120,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  roundTypeName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333333",
  },
  roundCard: {
    backgroundColor: "#ffffff",
    padding: 12,
    marginRight: 12,
    borderRadius: 8,
    minWidth: 180,
    maxWidth: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  roundName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333333",
  },
  roundStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  roundStatus: {
    fontSize: 12,
    fontWeight: "500",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    overflow: "hidden",
  },
  completedStatus: {
    backgroundColor: "#e6f7ef",
    color: "#2ecc71",
  },
  activeStatus: {
    backgroundColor: "#e6f0ff",
    color: "#3498db",
  },
  upcomingStatus: {
    backgroundColor: "#f7f7f7",
    color: "#95a5a6",
  },
  loadingContainer: {
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: "#666666",
  },
  errorContainer: {
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    marginTop: 16,
    fontSize: 14,
    color: "#e74c3c",
    textAlign: "center",
  },
  contestantsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
    position: "relative",
    flex: 1,
  },
  contestantsWrapper: {
    maxHeight: 460, // Tăng lên để hiển thị hai hàng đầy đủ
    overflow: "hidden",
  },
  contestantsWrapperExpanded: {
    maxHeight: undefined,
  },
  contestantsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333333",
    paddingHorizontal: 16,
  },
  contestantsGrid: {
    paddingBottom: 16,
  },
  contestantCard: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    overflow: "hidden",
    width: Dimensions.get("window").width * 0.6, // Adjusted width
    marginVertical: 8, // Adjusted margin
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    height: 320, // Increased height to show more content
  },
  contestantCardContent: {
    flex: 1,
  },
  contestantImageContainer: {
    height: 160, // Adjusted height
    width: "100%",
    position: "relative",
  },
  contestantImage: {
    width: "100%",
    height: "100%",
  },
  noImageContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  videoIndicator: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 4,
  },
  contestantInfo: {
    padding: 12, // Increased padding for better spacing
    flex: 1, // Use all available space
  },
  contestantName: {
    fontSize: 14, // Adjusted font size
    fontWeight: "600",
    marginBottom: 2,
    color: "#000000",
  },
  contestantVariety: {
    fontSize: 12, // Adjusted font size
    color: "#666666",
    marginBottom: 4,
  },
  contestantDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  contestantDetail: {
    fontSize: 11, // Adjusted font size
    color: "#888888",
  },
  tankNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    backgroundColor: "#f0f7ff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  tankName: {
    fontSize: 11, // Adjusted font size
    color: "#3498db",
    marginLeft: 4,
  },
  rankBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rankText: {
    color: "#ffffff",
    fontSize: 11, // Adjusted font size
    fontWeight: "700",
  },
  scoreStatusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  scoreText: {
    fontSize: 11, // Adjusted font size
    color: "#f39c12",
    fontWeight: "600",
    marginLeft: 4,
  },
  contestantStatusBadge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  contestantStatusText: {
    fontSize: 10, // Adjusted font size
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    width: "100%",
    maxHeight: "90%",
    height: 600,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    padding: 6,
  },
  fullDetailsContainer: {
    flex: 1,
    paddingTop: 40,
  },
  modalTabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTabButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    justifyContent: "center",
  },
  activeModalTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: "#2196F3",
  },
  modalTabText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "500",
    color: "#777777",
  },
  activeModalTabText: {
    color: "#2196F3",
    fontWeight: "600",
  },
  modalTabContentContainer: {
    flex: 1,
  },
  modalScrollContent: {
    flex: 1,
  },
  infoContainer: {
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 14,
    color: "#666666",
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  statusBadge: {
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: "#43a047",
    fontSize: 12,
    fontWeight: "500",
  },
  notesSection: {
    marginTop: 16,
    backgroundColor: "#fff8e1",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#ffc107",
  },
  notesSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#795548",
    marginBottom: 8,
  },
  notesContent: {
    fontSize: 14,
    color: "#333333",
    lineHeight: 20,
  },
  mediaTabContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  mediaListScrollContainer: {
    flex: 1,
  },
  mediaListContainer: {
    padding: 16,
  },
  mediaListTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 12,
  },
  thumbnailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  mediaCarouselContainer: {
    height: 250,
    backgroundColor: "#f0f0f0",
    position: "relative",
  },
  mediaContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },
  modalVideo: {
    width: "100%",
    height: "100%",
  },
  mediaDots: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
  },
  mediaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.4)",
    marginHorizontal: 4,
  },
  activeMediaDot: {
    backgroundColor: "#ffffff",
  },
  showMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3498db",
    marginRight: 4,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  mediaThumbnailContainer: {
    width: "31%",
    aspectRatio: 1,
    marginBottom: 8,
    marginRight: "2%",
    marginLeft: "0%",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  activeThumbnail: {
    borderWidth: 2,
    borderColor: "#2196F3",
  },
  mediaThumbnail: {
    width: "100%",
    height: "100%",
  },
  // Styles cho phần kết quả thi đấu
  resultSection: {
    marginTop: 16,
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#3498db",
  },
  resultSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 12,
  },
  resultItem: {
    marginBottom: 12,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  resultRoundName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 40,
  },
  resultDetailsContainer: {
    marginTop: 4,
  },
  resultDetail: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  resultDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  resultDetailHalf: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flex: 1,
    paddingRight: 8,
  },
  resultLabel: {
    fontSize: 13,
    color: "#666666",
    flex: 1,
  },
  resultValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333333",
    flex: 1,
    textAlign: "right",
  },
  resultStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: "flex-end",
  },
  advancedStatus: {
    backgroundColor: "#e8f5e9",
  },
  eliminatedStatus: {
    backgroundColor: "#ffebee",
  },
  pendingStatus: {
    backgroundColor: "#e3f2fd",
  },
  resultStatusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  carouselContainer: {
    paddingVertical: 16,
    marginBottom: 16,
    position: "relative",
    minHeight: 380,
    paddingBottom: 60,
  },
  carouselContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    position: "absolute",
    bottom: 0,
    left: 16,
    right: 16,
    zIndex: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginTop: 16,
  },
  pageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f8f8f8",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  pageButtonDisabled: {
    backgroundColor: "#f0f0f0",
    shadowOpacity: 0,
    elevation: 0,
  },
  pageIndicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    flexWrap: "wrap",
    maxWidth: 200,
    gap: 4,
    paddingHorizontal: 8,
  },
  pageIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f8f8f8",
    justifyContent: "center",
    alignItems: "center",
    margin: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  activePageIndicator: {
    backgroundColor: "#2196F3",
    shadowColor: "#1976D2",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  pageIndicatorText: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },
  activePageIndicatorText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  registrationBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  registrationText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
});

export default KoiContestants;
