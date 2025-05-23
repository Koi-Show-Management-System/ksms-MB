import {
  FontAwesome,
  FontAwesome5,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import React, { memo, useCallback, useEffect, useState } from "react";
import { Dimensions } from "react-native";
import { TabBar, TabView } from "react-native-tab-view";
import { useAuth } from "../../../context/AuthContext";

import {
  ActivityIndicator,
  Alert,
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
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import KoiContestants from "./KoiContestants";
import KoiShowResults from "./KoiShowResults";
import KoiShowVoting from "./KoiShowVoting";

import { KoiShowProvider, useKoiShow } from "../../../context/KoiShowContext";
import {
  CategoryCriteria,
  CompetitionCategoryDetail,
  getCompetitionCategoryDetail,
} from "../../../services/competitionService";
import {
  getAllLivestreamsForShow,
  LivestreamInfo,
} from "../../../services/livestreamService";
import { CompetitionCategory } from "../../../services/registrationService";
import { ShowStatus } from "../../../services/showService";

// Skeleton Component (unchanged)
const SkeletonLoader = () => {
  return (
    <ScrollView style={styles.scrollView}>
      {/* Banner Skeleton */}
      <View style={[styles.bannerContainer, styles.skeletonBanner]} />

      {/* Title Skeleton */}
      <View style={styles.titleContainer}>
        <View style={styles.skeletonTitle} />
        <View style={styles.quickInfoContainer}>
          <View style={styles.quickInfoItem}>
            <View style={styles.skeletonIcon} />
            <View style={styles.skeletonText} />
          </View>
          <View style={styles.quickInfoItem}>
            <View style={styles.skeletonIcon} />
            <View style={styles.skeletonText} />
          </View>
        </View>
      </View>

      {/* Event Details Section Skeleton */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderContent}>
            <View style={styles.skeletonIcon} />
            <View style={[styles.skeletonText, { width: 120 }]} />
          </View>
        </View>
        <View style={styles.sectionContent}>
          <View style={[styles.skeletonText, { width: "100%", height: 80 }]} />
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <View style={styles.skeletonIcon} />
              <View>
                <View style={[styles.skeletonText, { width: 100 }]} />
                <View style={[styles.skeletonText, { width: 150 }]} />
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Categories Section Skeleton */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderContent}>
            <View style={styles.skeletonIcon} />
            <View style={[styles.skeletonText, { width: 120 }]} />
          </View>
        </View>
        <View style={styles.sectionContent}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[1, 2, 3].map((item) => (
              <View
                key={item}
                style={[styles.categoryCard, styles.skeletonCard]}>
                <View
                  style={[styles.skeletonText, { width: "80%", height: 20 }]}
                />
                <View
                  style={[styles.skeletonText, { width: "60%", height: 16 }]}
                />
                <View
                  style={[styles.skeletonText, { width: "40%", height: 16 }]}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Footer Skeleton */}
      <View style={styles.footer}>
        <View
          style={[styles.actionButton, styles.skeletonButton, { flex: 1 }]}
        />
        <View
          style={[styles.actionButton, styles.skeletonButton, { flex: 1 }]}
        />
      </View>
    </ScrollView>
  );
};

// Wrapper component
const KoiShowInformation = () => {
  const params = useLocalSearchParams();
  const id = params.id as string;

  return (
    <KoiShowProvider showId={id}>
      <KoiShowInformationContent />
    </KoiShowProvider>
  );
};

// Memoized CategoryItem - Updated to add the criteria button and modal
const CategoryItem = memo(
  ({
    item,
    detailedCategory,
    isLoadingDetails,
  }: {
    item: CompetitionCategory;
    detailedCategory?: CompetitionCategoryDetail;
    isLoadingDetails: boolean;
  }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [roundsModalVisible, setRoundsModalVisible] = useState(false);
    
    // Group criteria by round type
    const criteriaByRound: Record<string, CategoryCriteria[]> = {};
    
    // Process criteria and organize by round if available
    if (detailedCategory?.criteriaCompetitionCategories) {
      detailedCategory.criteriaCompetitionCategories.forEach(criteria => {
        if (!criteriaByRound[criteria.roundType]) {
          criteriaByRound[criteria.roundType] = [];
        }
        criteriaByRound[criteria.roundType].push(criteria);
      });
    }
    
    // Thêm vòng sơ khảo mặc định nếu không có
    if (!criteriaByRound["Preliminary"]) {
      criteriaByRound["Preliminary"] = [];
    }
    
    // Sắp xếp các vòng theo thứ tự (sơ khảo -> đánh giá chính -> chung kết)
    const sortedRounds = Object.keys(criteriaByRound).sort((a, b) => {
      const roundOrder: Record<string, number> = {
        "Preliminary": 1,
        "Evaluation": 2,
        "SemiFinal": 2, // Cả hai đều là vòng đánh giá chính
        "Final": 3
      };
      return (roundOrder[a] || 99) - (roundOrder[b] || 99);
    });
    
    // Calculate total weight for each round
    const roundTotals: Record<string, number> = {};
    Object.entries(criteriaByRound).forEach(([roundType, criteria]) => {
      roundTotals[roundType] = criteria.reduce((sum, item) => sum + item.weight, 0);
    });
    
    // Sort criteria by weight in each round (from high to low)
    Object.keys(criteriaByRound).forEach(roundType => {
      criteriaByRound[roundType].sort((a, b) => b.weight - a.weight);
    });
    
    // Get color for round type
    const getRoundColor = (roundType: string): string => {
      switch (roundType) {
        case "Preliminary":
          return "#FF9800"; // Cam nhạt - Vòng sơ khảo
        case "Evaluation":
        case "SemiFinal":
          return "#00BCD4"; // Xanh nước - Vòng đánh giá chính/bán kết
        case "Final":
          return "#4CAF50"; // Xanh lá - Vòng chung kết
        default:
          return "#4CAF50"; // Xanh lá - Mặc định
      }
    };
    
    // Chuẩn hóa tên hiển thị vòng
    const getRoundDisplayName = (roundType: string): string => {
      switch (roundType) {
        case "Preliminary":
          return "Vòng sơ khảo";
        case "Evaluation":
        case "SemiFinal":
          return "Vòng đánh giá chính";
        case "Final":
          return "Vòng chung kết";
        default:
          return roundType;
      }
    };

    const renderCriteriaModal = () => (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tiêu chí chấm điểm</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>
            
            {Object.keys(criteriaByRound).length > 0 ? (
              <ScrollView style={styles.modalContent}>
                {sortedRounds.map((roundType, roundIndex) => (
                  <View key={roundIndex} style={styles.roundSection}>
                    <View style={[
                      styles.roundHeader, 
                      { backgroundColor: `${getRoundColor(roundType)}20` }
                    ]}>
                      <View style={[
                        styles.roundDot, 
                        { backgroundColor: getRoundColor(roundType) }
                      ]} />
                      <Text style={[
                        styles.roundTitle,
                        { color: getRoundColor(roundType) }
                      ]}>
                        {getRoundDisplayName(roundType)}
                      </Text>
                    </View>
                    
                    {roundType === "Preliminary" ? (
                      // Hiển thị thông tin cố định cho vòng sơ khảo
                      <View style={styles.fixedInfoContainer}>
                        <View style={styles.fixedInfoContent}>
                          <Text style={styles.fixedInfoText}>
                            <Text style={styles.fixedInfoTitle}>Vòng Sơ Khảo </Text>
                            chỉ áp dụng hình thức chấm đạt/không đạt (Pass/Fail). Trong tài sẽ đánh giá các cá thể có đủ điều kiện tham gia vòng tiếp theo hay không.
                          </Text>
                        </View>                        
                      </View>
                    ) : (
                      // Hiển thị bảng tiêu chí cho các vòng khác
                      <View style={styles.criteriaTable}>
                        <View style={styles.tableHeader}>
                          <Text style={styles.tableHeaderText}>Tiêu chí</Text>
                          <Text style={[styles.tableHeaderText, styles.weightColumn]}>Trọng số</Text>
                        </View>
                        
                        {criteriaByRound[roundType].map((criterion, critIndex) => (
                          <View 
                            key={critIndex} 
                            style={[
                              styles.criterionRow,
                              critIndex % 2 === 0 ? styles.evenRow : styles.oddRow,
                              critIndex === criteriaByRound[roundType].length - 1 && styles.lastRow,
                            ]}
                          >
                            <View style={styles.criterionInfo}>
                              <Text style={styles.criterionName}>{criterion.criteria.name}</Text>
                              {criterion.criteria.description && (
                                <Text style={styles.criterionDescription}>{criterion.criteria.description}</Text>
                              )}
                            </View>
                            <View style={styles.criterionWeight}>
                              <Text style={styles.weightValue}>
                                {roundTotals[roundType] > 0 
                                  ? `${Math.round((criterion.weight / roundTotals[roundType]) * 100)}%` 
                                  : "0%"}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyModalContent}>
                <MaterialIcons name="info-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyStateText}>
                  Chưa có tiêu chí chấm điểm nào được thiết lập
                </Text>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
    
    // Tạo modal mới cho vòng thi quy định
    const renderRoundsModal = () => {
      // Tổ chức các vòng theo loại
      const preliminaryRounds = detailedCategory?.rounds?.filter(round => round.roundType === "Preliminary") || [];
      const evaluationRounds = detailedCategory?.rounds?.filter(round => round.roundType === "Evaluation") || [];
      const finalRounds = detailedCategory?.rounds?.filter(round => round.roundType === "Final") || [];
      
      // Sắp xếp các vòng theo thứ tự
      const sortedPreliminaryRounds = [...preliminaryRounds].sort((a, b) => a.roundOrder - b.roundOrder);
      const sortedEvaluationRounds = [...evaluationRounds].sort((a, b) => a.roundOrder - b.roundOrder);
      const sortedFinalRounds = [...finalRounds].sort((a, b) => a.roundOrder - b.roundOrder);
      
      return (
        <Modal
          animationType="slide"
          transparent={true}
          visible={roundsModalVisible}
          onRequestClose={() => setRoundsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Vòng thi quy định</Text>
                <TouchableOpacity onPress={() => setRoundsModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color="#000000" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalContent}>
                {/* Vòng sơ khảo */}
                <View style={styles.roundSection}>
                  <View style={[
                    styles.roundHeader, 
                    { backgroundColor: "#FF980020" }
                  ]}>
                    <View style={[
                      styles.roundDot, 
                      { backgroundColor: "#FF9800" }
                    ]} />
                    <Text style={[
                      styles.roundTitle,
                      { color: "#FF9800" }
                    ]}>
                      Vòng sơ khảo
                    </Text>
                  </View>
                  <View style={styles.fixedInfoContainer}>
                    <View style={styles.fixedInfoContent}>
                      <Text style={styles.fixedInfoText}>
                        <Text style={styles.fixedInfoTitle}>
                          {sortedPreliminaryRounds.length > 0 
                            ? `${sortedPreliminaryRounds[0].name} `
                            : "Vòng 1 "}
                        </Text>
                        Ban giám khảo sẽ lựa chọn các cá thể đạt tiêu chuẩn tham gia vòng tiếp theo. Hình thức chấm Pass/Fail (Đạt/Không đạt).
                      </Text>
                    </View>
                    {sortedPreliminaryRounds.length > 0 && sortedPreliminaryRounds[0].numberOfRegistrationToAdvance && (
                      <View style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: 8,
                        backgroundColor: "#FFFDE7",
                        padding: 8,
                        borderRadius: 4,
                      }}>
                        <MaterialIcons name="info-outline" size={20} color="#FF9800" />
                        <Text style={{
                          fontSize: 12,
                          color: "#666666",
                          marginLeft: 4,
                          flex: 1,
                        }}>
                          Số cá qua vòng là {sortedPreliminaryRounds[0].numberOfRegistrationToAdvance}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Vòng đánh giá chính */}
                {sortedEvaluationRounds.length > 0 && sortedEvaluationRounds.map((evalRound, index) => (
                  <View key={evalRound.id} style={styles.roundSection}>
                    <View style={[
                      styles.roundHeader, 
                      { backgroundColor: "#00BCD420" }
                    ]}>
                      <View style={[
                        styles.roundDot, 
                        { backgroundColor: "#00BCD4" }
                      ]} />
                      <Text style={[
                        styles.roundTitle,
                        { color: "#00BCD4" }
                      ]}>
                        {index === 0 ? "Vòng đánh giá chính" : `Vòng đánh giá ${index + 1}`}
                      </Text>
                    </View>
                    <View style={styles.fixedInfoContainer}>
                      <View style={styles.fixedInfoContent}>
                        <Text style={styles.fixedInfoText}>
                          <Text style={styles.fixedInfoTitle}>{evalRound.name} </Text>
                          Ban giám khảo sẽ chấm điểm chi tiết theo các tiêu chí quy định. Mỗi cá sẽ được chấm trên thang điểm 100.
                        </Text>
                      </View>
                      {evalRound.numberOfRegistrationToAdvance && (
                        <View style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginTop: 8,
                          backgroundColor: "#FFFDE7",
                          padding: 8,
                          borderRadius: 4,
                        }}>
                          <MaterialIcons name="info-outline" size={20} color="#00BCD4" />
                          <Text style={{
                            fontSize: 12,
                            color: "#666666",
                            marginLeft: 4,
                            flex: 1,
                          }}>
                            Số cá qua vòng là {evalRound.numberOfRegistrationToAdvance}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}

                {/* Nếu không có dữ liệu vòng đánh giá, hiển thị mặc định */}
                {sortedEvaluationRounds.length === 0 && (
                  <View style={styles.roundSection}>
                    <View style={[
                      styles.roundHeader, 
                      { backgroundColor: "#00BCD420" }
                    ]}>
                      <View style={[
                        styles.roundDot, 
                        { backgroundColor: "#00BCD4" }
                      ]} />
                      <Text style={[
                        styles.roundTitle,
                        { color: "#00BCD4" }
                      ]}>
                        Vòng đánh giá chính
                      </Text>
                    </View>
                    <View style={styles.fixedInfoContainer}>
                      <View style={styles.fixedInfoContent}>
                        <Text style={styles.fixedInfoText}>
                          <Text style={styles.fixedInfoTitle}>Vòng 2 </Text>
                          Ban giám khảo sẽ chấm điểm chi tiết theo các tiêu chí quy định. Mỗi cá sẽ được chấm trên thang điểm 100.
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Vòng chung kết */}
                <View style={styles.roundSection}>
                  <View style={[
                    styles.roundHeader, 
                    { backgroundColor: "#4CAF5020" }
                  ]}>
                    <View style={[
                      styles.roundDot, 
                      { backgroundColor: "#4CAF50" }
                    ]} />
                    <Text style={[
                      styles.roundTitle,
                      { color: "#4CAF50" }
                    ]}>
                      Vòng chung kết
                    </Text>
                  </View>
                  <View style={styles.fixedInfoContainer}>
                    <View style={styles.fixedInfoContent}>
                      <Text style={styles.fixedInfoText}>
                        <Text style={styles.fixedInfoTitle}>
                          {sortedFinalRounds.length > 0 
                            ? `${sortedFinalRounds[0].name} `
                            : "Vòng 3 "}
                        </Text>
                        Các cá xuất sắc nhất sẽ tranh tài để giành giải cao nhất. Ban giám khảo sẽ chấm điểm chi tiết và quyết định thứ hạng cuối cùng.
                      </Text>
                    </View>
                    {/* Hiển thị số cá xuất sắc nhất dựa trên số lượng giải thưởng */}
                    {detailedCategory?.awards && detailedCategory.awards.length > 0 ? (
                      <View style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: 8,
                        backgroundColor: "#FFFDE7",
                        padding: 8,
                        borderRadius: 4,
                      }}>
                        <MaterialIcons name="info-outline" size={20} color="#4CAF50" />
                        <Text style={{
                          fontSize: 12,
                          color: "#666666",
                          marginLeft: 4,
                          flex: 1,
                        }}>
                          {detailedCategory.awards.length === 1 
                            ? "Tuyển chọn ra cá xuất sắc nhất" 
                            : `Xếp hạng ${detailedCategory.awards.length} cá xuất sắc nhất`}
                        </Text>
                      </View>
                    ) : (
                      <View style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: 8,
                        backgroundColor: "#FFFDE7",
                        padding: 8,
                        borderRadius: 4,
                      }}>
                        <MaterialIcons name="info-outline" size={20} color="#4CAF50" />
                        <Text style={{
                          fontSize: 12,
                          color: "#666666",
                          marginLeft: 4,
                          flex: 1,
                        }}>
                          Xếp hạng các cá xuất sắc nhất
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </ScrollView>
              
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setRoundsModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      );
    };
    
    return (
      <View style={styles.categoryCard}>
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryName}>{item.name}</Text>
          {item.status === "cancelled" && (
            <View style={styles.cancelledStatusBadge}>
              <Text style={styles.cancelledStatusText}>Bị huỷ</Text>
            </View>
          )}
        </View>

        <View style={styles.categoryFeeContainer}>
          <Text style={styles.categoryFeeLabel}>Phí đăng ký:</Text>
          <Text style={styles.categoryFee}>
            {item.registrationFee.toLocaleString("vi-VN")} đ
          </Text>
        </View>

        <View style={styles.categoryDetailsContainer}>
          <View style={styles.categoryDetailItem}>
            <Text style={styles.categoryDetailLabel}>Kích thước:</Text>
            <Text style={styles.categoryDetailValue}>
              {item.sizeMin} - {item.sizeMax} cm
            </Text>
          </View>

          <View style={styles.categoryDetailItem}>
            <Text style={styles.categoryDetailLabel}>Số lượng tối đa:</Text>
            <Text style={styles.categoryDetailValue}>{item.maxEntries} Koi</Text>
          </View>
        </View>

        {item.description && (
          <Text style={styles.categoryDescription}>{item.description}</Text>
        )}

        {/* Nút Tiêu chí chấm điểm */}
        <TouchableOpacity 
          style={[
            styles.criteriaButton,
            (isLoadingDetails || (!detailedCategory && !criteriaByRound["Preliminary"])) && styles.criteriaButtonDisabled
          ]}
          onPress={() => setModalVisible(true)}
          disabled={isLoadingDetails || (!detailedCategory && !criteriaByRound["Preliminary"])}
        >
          <MaterialIcons name="assessment" size={16} color="#FFFFFF" />
          <Text style={styles.criteriaButtonText}>Tiêu chí chấm điểm</Text>
        </TouchableOpacity>
        
        {/* Thêm nút Vòng thi quy định */}
        <TouchableOpacity 
          style={[
            styles.criteriaButton,
            styles.roundsButton,
          ]}
          onPress={() => setRoundsModalVisible(true)}
        >
          <MaterialIcons name="timeline" size={16} color="#FFFFFF" />
          <Text style={styles.criteriaButtonText}>Vòng thi quy định</Text>
        </TouchableOpacity>

        {item.varieties && item.varieties.length > 0 && (
          <View style={styles.varietiesContainer}>
            <Text style={styles.varietiesTitle}>Giống Koi được phép:</Text>
            <View style={styles.varietiesList}>
              {item.varieties.map((variety, index) => (
                <View key={index} style={styles.varietyTag}>
                  <Text style={styles.varietyTagText}>{variety}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Awards Section */}
        {isLoadingDetails ? (
          <ActivityIndicator
            size="small"
            color="#666"
            style={styles.awardsLoading}
          />
        ) : detailedCategory?.awards && detailedCategory.awards.length > 0 ? (
          <View style={styles.awardsContainer}>
            <Text style={styles.awardsTitle}>Giải thưởng</Text>
            {[...detailedCategory.awards]
              .sort((a, b) => {
                // Định nghĩa thứ tự ưu tiên cho các loại giải
                const awardOrder = {
                  first: 1, // Giải nhất
                  second: 2, // Giải nhì
                  third: 3, // Giải ba
                  honorable: 4, // Giải khuyến khích
                };

                // Lấy thứ tự ưu tiên của mỗi giải, nếu không có trong danh sách thì đặt ở cuối
                const orderA =
                  awardOrder[a.awardType as keyof typeof awardOrder] || 999;
                const orderB =
                  awardOrder[b.awardType as keyof typeof awardOrder] || 999;

                // Sắp xếp tăng dần theo thứ tự ưu tiên
                return orderA - orderB;
              })
              .map((award) => (
                <View key={award.id} style={styles.awardItem}>
                  <FontAwesome name="trophy" size={16} color="#FFD700" />
                  <View style={styles.awardDetails}>
                    <Text style={styles.awardName}>{award.name}</Text>
                    <Text style={styles.awardPrize}>
                      {award.prizeValue.toLocaleString("vi-VN")} VNĐ
                    </Text>
                  </View>
                </View>
              ))}
          </View>
        ) : (
          !isLoadingDetails && (
            <Text style={styles.noAwardsText}>Chưa có thông tin giải thưởng</Text>
          )
        )}
        
        {/* Hiển thị các modal */}
        {renderCriteriaModal()}
        {renderRoundsModal()}
      </View>
    );
  }
);

// Info Tab Content Component
interface InfoTabContentProps {
  showData: any;
  categories: any[];
  expandedSections: {
    eventDetails: boolean;
    categories: boolean;
    criteria: boolean;
    rules: boolean;
    timeline: boolean;
  };
  toggleSection: (
    section: "eventDetails" | "categories" | "criteria" | "rules" | "timeline"
  ) => void;
  formatDateAndTime: (startDate: string, endDate: string) => string;
  formatRuleContent: (rule: any) => string;
  formatCriterionContent: (criterion: any) => string;
  formatTimelineContent: (content: any) => string;
  getTimelineItemColor: (description: string) => string;
  detailedCategories: Record<string, CompetitionCategoryDetail>;
  isCategoryDetailsLoading: boolean;
  categoryDetailsError: string | null;
  renderCategoryItem: ({
    item,
  }: {
    item: CompetitionCategory;
  }) => React.ReactElement;
  ItemSeparator: () => React.ReactElement;
  refetch: () => Promise<void>;
}

const InfoTabContent: React.FC<InfoTabContentProps> = ({
  showData,
  categories,
  expandedSections,
  toggleSection,
  formatDateAndTime,
  formatRuleContent,
  formatCriterionContent,
  formatTimelineContent,
  getTimelineItemColor,
  detailedCategories,
  isCategoryDetailsLoading,
  categoryDetailsError,
  renderCategoryItem,
  ItemSeparator,
  refetch,
}) => {
  const [refreshing, setRefreshing] = React.useState(false);
  const [expandedTimelineCategories, setExpandedTimelineCategories] =
    React.useState({
      upcoming: true,
      ongoing: true,
      published: true,
      finished: true,
    });

  const toggleTimelineCategory = (
    category: "upcoming" | "ongoing" | "published" | "finished"
  ) => {
    setExpandedTimelineCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      // Call the actual refetch function from context
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return (
    <View style={{ flex: 1 }}>
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3B82F6"]}
            tintColor="#3B82F6"
          />
        }>
        {/* Chi tiết sự kiện */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity
            style={[
              styles.sectionHeader,
              expandedSections.eventDetails && styles.sectionHeaderExpanded,
            ]}
            onPress={() => toggleSection("eventDetails")}>
            <View style={styles.sectionHeaderContent}>
              <MaterialIcons name="info-outline" size={22} color="#000000" />
              <Text style={styles.sectionTitle}>Chi tiết sự kiện</Text>
            </View>
            <MaterialIcons
              name={
                expandedSections.eventDetails ? "expand-less" : "expand-more"
              }
              size={24}
              color="#000000"
            />
          </TouchableOpacity>

          {expandedSections.eventDetails && (
            <View style={styles.sectionContent}>
              <Text style={styles.descriptionText}>
                {showData?.description || "Chưa có thông tin chi tiết"}
              </Text>

              {/* Event details grid removed as requested */}

              {/* Add Ticket Types Section */}
              <View style={styles.fullWidthSection}>
                <MaterialIcons
                  name="confirmation-number"
                  size={20}
                  color="#3498db"
                />
                <View>
                  <Text style={styles.detailLabel}>Loại vé</Text>
                  {showData?.ticketTypes && showData.ticketTypes.length > 0 ? (
                    <ScrollView
                      horizontal={true}
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.ticketsCarouselContainer}>
                      {showData.ticketTypes.map((ticket: any) => (
                        <View key={ticket.id} style={styles.ticketCard}>
                          <Text style={styles.ticketNameDetail}>
                            {ticket.name}
                          </Text>
                          <Text style={styles.ticketPriceDetail}>
                            {ticket.price.toLocaleString("vi-VN")} VNĐ
                          </Text>
                          <View style={styles.ticketAvailability}>
                            <MaterialIcons
                              name="event-seat"
                              size={16}
                              color="#3498db"
                            />
                            <Text style={styles.ticketQuantityDetail}>
                              Còn {ticket.availableQuantity} vé
                            </Text>
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                  ) : (
                    <Text style={styles.emptyText}>Chưa có thông tin vé</Text>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Categories Section - Sử dụng FlatList với performance optimization */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity
            style={[
              styles.sectionHeader,
              expandedSections.categories && styles.sectionHeaderExpanded,
            ]}
            onPress={() => toggleSection("categories")}>
            <View style={styles.sectionHeaderContent}>
              <MaterialIcons name="category" size={22} color="#000000" />
              <Text style={styles.sectionTitle}>Hạng mục thi đấu</Text>
            </View>
            <MaterialIcons
              name={expandedSections.categories ? "expand-less" : "expand-more"}
              size={24}
              color="#000000"
            />
          </TouchableOpacity>

          {expandedSections.categories && (
            <View style={styles.sectionContent}>
              {categories.length > 0 ? (
                <FlatList
                  data={categories}
                  renderItem={renderCategoryItem}
                  keyExtractor={(item) => item.id}
                  horizontal={true}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoriesContainer}
                  ItemSeparatorComponent={ItemSeparator}
                  initialNumToRender={3}
                  maxToRenderPerBatch={5}
                  windowSize={5}
                  removeClippedSubviews={true}
                />
              ) : (
                <View style={styles.emptyStateContainer}>
                  <MaterialIcons name="category" size={48} color="#d1d5db" />
                  <Text style={styles.emptyStateText}>
                    Chưa có hạng mục thi đấu nào được thêm vào cuộc thi này
                  </Text>
                </View>
              )}
              {categoryDetailsError && (
                <Text style={styles.categoryErrorText}>
                  {categoryDetailsError}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Rules & Regulations Section */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection("rules")}>
            <View style={styles.sectionHeaderContent}>
              <MaterialIcons name="gavel" size={22} color="#000000" />
              <Text style={styles.sectionTitle}>Quy định & Điều lệ</Text>
            </View>
            <MaterialIcons
              name={expandedSections.rules ? "expand-less" : "expand-more"}
              size={24}
              color="#000000"
            />
          </TouchableOpacity>

          {expandedSections.rules && (
            <View style={styles.sectionContent}>
              {showData?.showRules && showData.showRules.length > 0 ? (
                showData.showRules.map((rule: any, index: number) => (
                  <View key={index} style={styles.ruleContainer}>
                    <Text style={styles.ruleNumber}>{index + 1}</Text>
                    <Text style={styles.ruleText}>
                      {formatRuleContent(rule)}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyStateContainer}>
                  <MaterialIcons name="info" size={40} color="#bdc3c7" />
                  <Text style={styles.emptyStateText}>
                    Chưa có quy định nào được đăng tải
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Criteria Section */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection("criteria")}>
            <View style={styles.sectionHeaderContent}>
              <MaterialIcons name="star" size={22} color="#000000" />
              <Text style={styles.sectionTitle}>Tiêu chí đánh giá</Text>
            </View>
            <MaterialIcons
              name={expandedSections.criteria ? "expand-less" : "expand-more"}
              size={24}
              color="#000000"
            />
          </TouchableOpacity>

          {expandedSections.criteria && (
            <View style={styles.sectionContent}>
              {showData?.criteria && showData.criteria.length > 0 ? (
                showData.criteria.map((criterion: any, index: number) => (
                  <View key={index} style={styles.criterionContainer}>
                    <View style={styles.criterionBullet}>
                      <Text style={styles.criterionBulletText}>
                        {index + 1}
                      </Text>
                    </View>
                    <Text style={styles.criterionText}>
                      {formatCriterionContent(criterion)}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyStateContainer}>
                  <MaterialIcons name="info" size={40} color="#bdc3c7" />
                  <Text style={styles.emptyStateText}>
                    Chưa có tiêu chí nào được đăng tải
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Event Timeline Section */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection("timeline")}>
            <View style={styles.sectionHeaderContent}>
              <MaterialIcons name="timeline" size={22} color="#000000" />
              <Text style={styles.sectionTitle}>Lịch trình sự kiện</Text>
            </View>
            <MaterialIcons
              name={expandedSections.timeline ? "expand-less" : "expand-more"}
              size={24}
              color="#000000"
            />
          </TouchableOpacity>

          {expandedSections.timeline && (
            <View style={styles.sectionContent}>
              {showData?.showStatuses && showData.showStatuses.length > 0 ? (
                <View style={styles.timelineContainer}>
                  {(() => {
                    // Sort statuses by start date
                    const sortedStatuses = [...showData.showStatuses].sort(
                      (a, b) =>
                        new Date(a.startDate).getTime() -
                        new Date(b.startDate).getTime()
                    );

                    // Helper functions to categorize stages
                    const isRegistrationStage = (status: ShowStatus) => {
                      // Kiểm tra xem giai đoạn có phải là giai đoạn đăng ký không
                      return status.statusName === "RegistrationOpen";
                    };

                    const isFinishedStage = (status: ShowStatus) => {
                      const now = new Date();
                      const endDate = new Date(status.endDate);
                      return now > endDate;
                    };

                    const isOngoingStage = (status: ShowStatus) => {
                      // Hiển thị tất cả các giai đoạn có statusName khác "RegistrationOpen"
                      return status.statusName !== "RegistrationOpen";
                    };

                    const isUpcomingStage = (status: ShowStatus) => {
                      // Chỉ trả về true nếu là giai đoạn đăng ký
                      return isRegistrationStage(status);
                    };

                    // Group stages into categories
                    const registrationStages = sortedStatuses.filter((status) =>
                      isRegistrationStage(status)
                    );

                    // upcomingStages bây giờ chỉ chứa các giai đoạn có statusName là "RegistrationOpen"
                    const upcomingStages = sortedStatuses.filter((status) =>
                      isUpcomingStage(status)
                    );

                    const ongoingStages = sortedStatuses.filter((status) =>
                      isOngoingStage(status)
                    );

                    const finishedStages = sortedStatuses.filter((status) =>
                      isFinishedStage(status)
                    );

                    const publishedStages = sortedStatuses.filter(
                      (status) =>
                        !isRegistrationStage(status) &&
                        !isUpcomingStage(status) &&
                        !isOngoingStage(status) &&
                        !isFinishedStage(status)
                    );

                    // Check if we have any stages in each category
                    const hasUpcomingStages = upcomingStages.length > 0;
                    const hasOngoingStages = ongoingStages.length > 0;
                    const hasRegistrationStages = registrationStages.length > 0;
                    const hasFinishedStages = finishedStages.length > 0;
                    const hasPublishedStages = publishedStages.length > 0;

                    // Check status to highlight the appropriate section
                    const showStatusLower = showData?.status?.toLowerCase();

                    // Highlight "Sắp diễn ra" when status is "upcoming"
                    const isUpcomingActive = showStatusLower === "upcoming";

                    // Highlight "Đang diễn ra" when status is "inprogress"
                    const isOngoingActive = showStatusLower === "inprogress";

                    // Highlight "Đã công bố" when status is "published"
                    const isPublishedActive = showStatusLower === "published";

                    // Highlight "Đã kết thúc" when status is "finished" or "completed"
                    const isFinishedActive =
                      showStatusLower === "finished" ||
                      showStatusLower === "completed";

                    return (
                      <>
                        {/* Published Section - Đã công bố */}
                        <View style={styles.timelineCategorySection}>
                          <TouchableOpacity
                            style={[
                              styles.timelineCategoryHeader,
                              isPublishedActive &&
                                styles.timelineCategoryHeaderActive,
                            ]}
                            onPress={() => toggleTimelineCategory("published")}>
                            <View style={styles.timelineCategoryHeaderContent}>
                              <MaterialIcons
                                name="check-circle"
                                size={18}
                                color={
                                  isPublishedActive ? "#2E7D32" : "#4CAF50"
                                }
                              />
                              <Text
                                style={[
                                  styles.timelineCategoryTitle,
                                  {
                                    color: isPublishedActive
                                      ? "#2E7D32"
                                      : "#4CAF50",
                                  },
                                  isPublishedActive &&
                                    styles.timelineCategoryTitleActive,
                                ]}>
                                Đã công bố
                              </Text>
                            </View>
                            <MaterialIcons
                              name={
                                expandedTimelineCategories.published
                                  ? "expand-less"
                                  : "expand-more"
                              }
                              size={20}
                              color={isPublishedActive ? "#2E7D32" : "#4CAF50"}
                            />
                          </TouchableOpacity>
                        </View>

                        {/* Upcoming Stages Section - Luôn hiển thị dù có giai đoạn hay không */}
                        <View style={styles.timelineCategorySection}>
                          <TouchableOpacity
                            style={[
                              styles.timelineCategoryHeader,
                              isUpcomingActive &&
                                styles.timelineCategoryHeaderActive,
                            ]}
                            onPress={() => toggleTimelineCategory("upcoming")}>
                            <View style={styles.timelineCategoryHeaderContent}>
                              <MaterialIcons
                                name="event-available"
                                size={18}
                                color={isUpcomingActive ? "#0056a8" : "#0a7ea4"}
                              />
                              <Text
                                style={[
                                  styles.timelineCategoryTitle,
                                  {
                                    color: isUpcomingActive
                                      ? "#0056a8"
                                      : "#0a7ea4",
                                  },
                                  isUpcomingActive &&
                                    styles.timelineCategoryTitleActive,
                                ]}>
                                Sắp diễn ra
                              </Text>
                            </View>
                            <MaterialIcons
                              name={
                                expandedTimelineCategories.upcoming
                                  ? "expand-less"
                                  : "expand-more"
                              }
                              size={20}
                              color={isUpcomingActive ? "#0056a8" : "#0a7ea4"}
                            />
                          </TouchableOpacity>

                          {expandedTimelineCategories.upcoming &&
                            upcomingStages.length > 0 &&
                            upcomingStages.map((status) => {
                              const statusDescription = formatTimelineContent(
                                status.description
                              );
                              const dotColor =
                                getTimelineItemColor(statusDescription);

                              // Không highlight các giai đoạn bên trong nữa
                              const isCurrentStage = false;

                              return (
                                <View key={status.id}>
                                  <View style={styles.timelineItemContainer}>
                                    <View style={styles.timelineCenterColumn}>
                                      <View
                                        style={[
                                          styles.timelineLine,
                                          {
                                            backgroundColor: dotColor,
                                            opacity: isCurrentStage ? 1 : 0.6,
                                          },
                                        ]}
                                      />
                                    </View>

                                    <View style={styles.timelineRightColumn}>
                                      <View
                                        style={styles.timelineTitleContainer}>
                                        <Text style={styles.timelineTitle}>
                                          {statusDescription}
                                        </Text>
                                      </View>
                                      <Text
                                        style={styles.timelineDateTimeOutside}>
                                        {(() => {
                                          try {
                                            const start = new Date(
                                              status.startDate
                                            );
                                            const end = new Date(
                                              status.endDate
                                            );
                                            const startDay = start
                                              .getDate()
                                              .toString()
                                              .padStart(2, "0");
                                            const startMonth = (
                                              start.getMonth() + 1
                                            )
                                              .toString()
                                              .padStart(2, "0");
                                            const startYear =
                                              start.getFullYear();
                                            const startTime =
                                              start.toLocaleTimeString(
                                                "vi-VN",
                                                {
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                }
                                              );
                                            const endTime =
                                              end.toLocaleTimeString("vi-VN", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                              });

                                            const isSameDay =
                                              start.getDate() ===
                                                end.getDate() &&
                                              start.getMonth() ===
                                                end.getMonth() &&
                                              start.getFullYear() ===
                                                end.getFullYear();

                                            if (isSameDay) {
                                              return `${startDay}/${startMonth}/${startYear}, ${startTime} - ${endTime}`;
                                            } else {
                                              const endDay = end
                                                .getDate()
                                                .toString()
                                                .padStart(2, "0");
                                              const endMonth = (
                                                end.getMonth() + 1
                                              )
                                                .toString()
                                                .padStart(2, "0");
                                              const endYear = end.getFullYear();
                                              return `${startDay}/${startMonth}/${startYear}, ${startTime} - ${endDay}/${endMonth}/${endYear}, ${endTime}`;
                                            }
                                          } catch (e) {
                                            console.error(
                                              "Error formatting timeline date:",
                                              e
                                            );
                                            return formatDateAndTime(
                                              status.startDate,
                                              status.endDate
                                            );
                                          }
                                        })()}
                                      </Text>
                                    </View>
                                  </View>
                                </View>
                              );
                            })}

                          {expandedTimelineCategories.upcoming &&
                            upcomingStages.length === 0 && (
                              <View style={styles.emptyStateContainer}>
                                <Text style={styles.emptyStateText}>
                                  Không có giai đoạn sắp diễn ra nào
                                </Text>
                              </View>
                            )}
                        </View>

                        {/* Ongoing Stages Section - Luôn hiển thị dù có giai đoạn hay không */}
                        <View style={styles.timelineCategorySection}>
                          <TouchableOpacity
                            style={[
                              styles.timelineCategoryHeader,
                              isOngoingActive &&
                                styles.timelineCategoryHeaderActive,
                            ]}
                            onPress={() => toggleTimelineCategory("ongoing")}>
                            <View style={styles.timelineCategoryHeaderContent}>
                              <MaterialIcons
                                name="play-circle-filled"
                                size={18}
                                color={isOngoingActive ? "#7B1FA2" : "#9C27B0"}
                              />
                              <Text
                                style={[
                                  styles.timelineCategoryTitle,
                                  {
                                    color: isOngoingActive
                                      ? "#7B1FA2"
                                      : "#9C27B0",
                                  },
                                  isOngoingActive &&
                                    styles.timelineCategoryTitleActive,
                                ]}>
                                Đang diễn ra
                              </Text>
                            </View>
                            <MaterialIcons
                              name={
                                expandedTimelineCategories.ongoing
                                  ? "expand-less"
                                  : "expand-more"
                              }
                              size={20}
                              color={isOngoingActive ? "#7B1FA2" : "#9C27B0"}
                            />
                          </TouchableOpacity>

                          {expandedTimelineCategories.ongoing &&
                            ongoingStages.length > 0 &&
                            ongoingStages.map((status) => {
                              const statusDescription = formatTimelineContent(
                                status.description
                              );
                              const dotColor =
                                getTimelineItemColor(statusDescription);

                              // Không highlight các giai đoạn bên trong nữa
                              const isCurrentStage = false;

                              return (
                                <View key={status.id}>
                                  <View style={styles.timelineItemContainer}>
                                    <View style={styles.timelineCenterColumn}>
                                      <View
                                        style={[
                                          styles.timelineLine,
                                          {
                                            backgroundColor: dotColor,
                                            opacity: isCurrentStage ? 1 : 0.6,
                                          },
                                        ]}
                                      />
                                    </View>

                                    <View
                                      style={[
                                        styles.timelineRightColumn,
                                        isCurrentStage &&
                                          styles.timelineRightColumnActive,
                                      ]}>
                                      <View
                                        style={styles.timelineTitleContainer}>
                                        <Text
                                          style={[
                                            styles.timelineTitle,
                                            isCurrentStage &&
                                              styles.timelineTitleActive,
                                          ]}>
                                          {statusDescription}
                                        </Text>
                                      </View>
                                      <Text
                                        style={[
                                          styles.timelineDateTimeOutside,
                                          isCurrentStage &&
                                            styles.timelineDateTimeOutsideActive,
                                        ]}>
                                        {(() => {
                                          try {
                                            const start = new Date(
                                              status.startDate
                                            );
                                            const end = new Date(
                                              status.endDate
                                            );
                                            const startDay = start
                                              .getDate()
                                              .toString()
                                              .padStart(2, "0");
                                            const startMonth = (
                                              start.getMonth() + 1
                                            )
                                              .toString()
                                              .padStart(2, "0");
                                            const startYear =
                                              start.getFullYear();
                                            const startTime =
                                              start.toLocaleTimeString(
                                                "vi-VN",
                                                {
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                }
                                              );
                                            const endTime =
                                              end.toLocaleTimeString("vi-VN", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                              });

                                            const isSameDay =
                                              start.getDate() ===
                                                end.getDate() &&
                                              start.getMonth() ===
                                                end.getMonth() &&
                                              start.getFullYear() ===
                                                end.getFullYear();

                                            if (isSameDay) {
                                              return `${startDay}/${startMonth}/${startYear}, ${startTime} - ${endTime}`;
                                            } else {
                                              const endDay = end
                                                .getDate()
                                                .toString()
                                                .padStart(2, "0");
                                              const endMonth = (
                                                end.getMonth() + 1
                                              )
                                                .toString()
                                                .padStart(2, "0");
                                              const endYear = end.getFullYear();
                                              return `${startDay}/${startMonth}/${startYear}, ${startTime} - ${endDay}/${endMonth}/${endYear}, ${endTime}`;
                                            }
                                          } catch (e) {
                                            console.error(
                                              "Error formatting timeline date:",
                                              e
                                            );
                                            return formatDateAndTime(
                                              status.startDate,
                                              status.endDate
                                            );
                                          }
                                        })()}
                                      </Text>
                                    </View>
                                  </View>
                                </View>
                              );
                            })}

                          {expandedTimelineCategories.ongoing &&
                            ongoingStages.length === 0 && (
                              <View style={styles.emptyStateContainer}>
                                <Text style={styles.emptyStateText}>
                                  Không có giai đoạn đang diễn ra nào
                                </Text>
                              </View>
                            )}
                        </View>

                        {/* Finished Section - Đã kết thúc */}
                        <View style={styles.timelineCategorySection}>
                          <TouchableOpacity
                            style={[
                              styles.timelineCategoryHeader,
                              isFinishedActive &&
                                styles.timelineCategoryHeaderActive,
                            ]}
                            onPress={() => toggleTimelineCategory("finished")}>
                            <View style={styles.timelineCategoryHeaderContent}>
                              <MaterialIcons
                                name="done-all"
                                size={18}
                                color={isFinishedActive ? "#C62828" : "#F44336"}
                              />
                              <Text
                                style={[
                                  styles.timelineCategoryTitle,
                                  {
                                    color: isFinishedActive
                                      ? "#C62828"
                                      : "#F44336",
                                  },
                                  isFinishedActive &&
                                    styles.timelineCategoryTitleActive,
                                ]}>
                                Đã kết thúc
                              </Text>
                            </View>
                            <MaterialIcons
                              name={
                                expandedTimelineCategories.finished
                                  ? "expand-less"
                                  : "expand-more"
                              }
                              size={20}
                              color={isFinishedActive ? "#C62828" : "#F44336"}
                            />
                          </TouchableOpacity>
                        </View>

                        {/* Đã xóa thông báo "Không có giai đoạn sắp diễn ra hoặc đang diễn ra" để nó luôn hiện các danh mục */}
                      </>
                    );
                  })()}
                </View>
              ) : (
                <View style={styles.emptyStateContainer}>
                  <MaterialIcons name="info" size={40} color="#bdc3c7" />
                  <Text style={styles.emptyStateText}>
                    Chưa có lịch trình nào được đăng tải
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
};

// Add new lazy loaded component for Voting
const LazyKoiShowVoting = ({ showId }: { showId: string | undefined }) => {
  const [isTabMounted, setIsTabMounted] = useState(false);

  useEffect(() => {
    // Set the component as mounted when it's rendered for the first time
    setIsTabMounted(true);
  }, []);

  if (!showId) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Không tìm thấy thông tin cuộc thi</Text>
      </View>
    );
  }

  // Only render the actual component when the tab has been visited
  if (!isTabMounted) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 16, color: "#666" }}>
          Đang tải dữ liệu bình chọn...
        </Text>
      </View>
    );
  }

  return <KoiShowVoting showId={showId} />;
};

// Main content component
const KoiShowInformationContent = () => {
  const { showData, categories, isLoading, error, refetch } = useKoiShow();
  const { isGuest } = useAuth();
  const [expandedSections, setExpandedSections] = useState({
    eventDetails: true,
    categories: true,
    criteria: false,
    rules: false,
    timeline: true,
  });
  const [index, setIndex] = useState(0);
  const [routes] = useState(() => {
    const baseRoutes = [
      { key: "info", title: "Chi tiết" },
      { key: "contestants", title: "Thí sinh" },
      { key: "results", title: "Kết quả" },
    ];

    // Only add voting tab for authenticated users
    if (!isGuest()) {
      baseRoutes.push({ key: "vote", title: "Bình chọn" });
    }

    return baseRoutes;
  });
  const [livestreamInfo, setLivestreamInfo] = useState<LivestreamInfo | null>(
    null
  );
  const [isLivestreamLoading, setIsLivestreamLoading] =
    useState<boolean>(false);
  const [detailedCategories, setDetailedCategories] = useState<
    Record<string, CompetitionCategoryDetail>
  >({});
  const [isCategoryDetailsLoading, setIsCategoryDetailsLoading] =
    useState<boolean>(false);
  const [categoryDetailsError, setCategoryDetailsError] = useState<
    string | null
  >(null);

  // Animation values for sticky header
  const scrollY = useSharedValue(0);
  const BANNER_HEIGHT = 200;

  // Scroll handler for banner animation
  useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Banner animation
  const bannerAnimatedStyles = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        scrollY.value,
        [0, BANNER_HEIGHT * 0.8],
        [1, 0],
        Extrapolation.CLAMP
      ),
    };
  });

  // Toggle section expansion
  const toggleSection = useCallback(
    (section: keyof typeof expandedSections) => {
      setExpandedSections((prev) => ({
        ...prev,
        [section]: !prev[section],
      }));
    },
    []
  );

  // Format date function to display in a nicer way
  const formatDateAndTime = useCallback(
    (startDate: string, endDate: string) => {
      try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const isSameDay =
          start.getDate() === end.getDate() &&
          start.getMonth() === end.getMonth() &&
          start.getFullYear() === end.getFullYear();

        if (isSameDay) {
          // Same day format: từ [time] đến [time]/[date]
          const date = start.toLocaleDateString("vi-VN", {
            day: "numeric",
            month: "numeric",
            year: "numeric",
          });
          const startTime = start.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          });
          const endTime = end.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          });
          return `${startTime} - ${endTime} / ${date}`;
        } else {
          // Different days format
          return `${start.toLocaleDateString(
            "vi-VN"
          )} - ${end.toLocaleDateString("vi-VN")}`;
        }
      } catch (error) {
        console.error("Date/Time formatting error:", error);
        return `${startDate} - ${endDate}`;
      }
    },
    []
  );

  // Removed unused isToday function

  // Format timeline content để đảm bảo là string
  const formatTimelineContent = useCallback((content: any): string => {
    if (typeof content === "string") return content;
    if (content && typeof content === "object") {
      if (content.title && content.content) {
        return `${content.title}: ${content.content}`;
      }
      return JSON.stringify(content);
    }
    return String(content || "");
  }, []);

  // Determine color for timeline item based on description
  const getTimelineItemColor = useCallback((description: string): string => {
    const desc = description.toLowerCase();

    if (desc.includes("đăng ký")) return "#0a7ea4"; // Xanh dương
    if (desc.includes("check-in cá") || desc.includes("checkin cá"))
      return "#00BCD4"; // Xanh ngọc
    if (desc.includes("check-in vé") || desc.includes("checkin vé"))
      return "#FF5252"; // Đỏ
    if (desc.includes("sơ khảo")) return "#4CAF50"; // Xanh lá
    if (desc.includes("đánh giá chính") || desc.includes("chính"))
      return "#9C27B0"; // Tím
    if (desc.includes("chung kết")) return "#FFC107"; // Vàng
    if (desc.includes("triển lãm")) return "#00BCD4"; // Xanh ngọc
    if (desc.includes("công bố kết quả")) return "#FFEB3B"; // Vàng nhạt
    if (desc.includes("trao giải")) return "#000000"; // Đen
    if (desc.includes("kết thúc")) return "#FF5722"; // Cam đỏ

    return "#aaaaaa"; // Màu mặc định
  }, []);

  // Format rule content để đảm bảo là string
  const formatRuleContent = useCallback((rule: any): string => {
    if (typeof rule === "string") return rule;
    if (rule && typeof rule === "object") {
      if (rule.id && rule.title && rule.content) {
        return `${rule.title}: ${rule.content}`;
      } else if (rule.title && rule.content) {
        return `${rule.title}: ${rule.content}`;
      }
      return JSON.stringify(rule);
    }
    return String(rule || "");
  }, []);

  // Format criterion content để đảm bảo là string
  const formatCriterionContent = useCallback((criterion: any): string => {
    if (typeof criterion === "string") return criterion;
    if (criterion && typeof criterion === "object") {
      if (criterion.id && criterion.title && criterion.content) {
        return `${criterion.title}: ${criterion.content}`;
      } else if (criterion.title && criterion.content) {
        return `${criterion.title}: ${criterion.content}`;
      }
      return JSON.stringify(criterion);
    }
    return String(criterion || "");
  }, []);

  // Memoized renderItem function for FlatList
  const renderCategoryItem = useCallback(
    ({ item }: { item: CompetitionCategory }) => (
      <CategoryItem
        item={item}
        detailedCategory={detailedCategories[item.id]}
        isLoadingDetails={isCategoryDetailsLoading}
      />
    ),
    [detailedCategories, isCategoryDetailsLoading]
  );

  // Spacer component for FlatList
  const ItemSeparator = useCallback(() => <View style={{ width: 12 }} />, []);

  // --- Fetch Livestream Status ---
  useEffect(() => {
    async function fetchLivestreamStatus() {
      if (!showData?.id) return;

      setIsLivestreamLoading(true);
      setLivestreamInfo(null);

      try {
        const response = await getAllLivestreamsForShow(showData.id);
        const activeStream = response.data.find(
          (stream) => stream.status === "active"
        );
        if (activeStream) {
          setLivestreamInfo(activeStream);
        } else {
          setLivestreamInfo(null);
          console.log(`No active livestream found for show ${showData.id}`);
        }
      } catch (error) {
        console.error("Error fetching livestream status in component:", error);
        setLivestreamInfo(null);
      } finally {
        setIsLivestreamLoading(false);
      }
    }

    fetchLivestreamStatus();
  }, [showData?.id]);

  // --- Fetch Category Details (including awards) ---
  useEffect(() => {
    const fetchAllCategoryDetails = async () => {
      if (!categories || categories.length === 0) {
        setDetailedCategories({});
        return;
      }

      setIsCategoryDetailsLoading(true);
      setCategoryDetailsError(null);
      const detailsMap: Record<string, CompetitionCategoryDetail> = {};

      try {
        const detailPromises = categories.map((category) =>
          getCompetitionCategoryDetail(category.id)
        );
        const results = await Promise.allSettled(detailPromises);

        results.forEach((result, index) => {
          const categoryId = categories[index].id;
          if (result.status === "fulfilled") {
            detailsMap[categoryId] = result.value;
          } else {
            console.error(
              `Lỗi khi lấy chi tiết hạng mục ${categoryId}:`,
              result.reason
            );
          }
        });

        setDetailedCategories(detailsMap);
      } catch (error) {
        console.error("Lỗi nghiêm trọng khi lấy chi tiết các hạng mục:", error);
        setCategoryDetailsError(
          "Không thể tải đầy đủ thông tin giải thưởng cho các hạng mục."
        );
      } finally {
        setIsCategoryDetailsLoading(false);
      }
    };

    fetchAllCategoryDetails();
  }, [categories]);

  // --- Handle Navigation to Livestream ---
  const handleViewLivestream = useCallback(() => {
    if (!livestreamInfo) return;

    const apiKey = "z87auffz2r8y";
    console.log("--- Navigating to Livestream --- ");
    console.log("Livestream Info:", JSON.stringify(livestreamInfo, null, 2));
    console.log("Show Name:", showData?.name);
    console.log("API Key:", apiKey);
    console.log("Navigating to livestream...");
    console.log("Livestream ID:", livestreamInfo.id);
    console.log("Call ID:", livestreamInfo.callId);
    console.log("API Key:", apiKey);

    router.push({
      pathname: "/(tabs)/shows/LivestreamViewer",
      params: {
        livestreamId: livestreamInfo.id,
        callId: livestreamInfo.callId,
        apiKey: apiKey,
        showName: showData?.name || "Livestream",
      },
    });
  }, [livestreamInfo, router, showData?.name]);

  // Define the scene renderers for TabView - modify to use the lazy loaded voting component
  const renderScene = useCallback(
    ({ route }: { route: { key: string } }) => {
      switch (route.key) {
        case "info":
          return (
            <InfoTabContent
              showData={showData}
              categories={categories}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
              formatDateAndTime={formatDateAndTime}
              formatRuleContent={formatRuleContent}
              formatCriterionContent={formatCriterionContent}
              formatTimelineContent={formatTimelineContent}
              getTimelineItemColor={getTimelineItemColor}
              detailedCategories={detailedCategories}
              isCategoryDetailsLoading={isCategoryDetailsLoading}
              categoryDetailsError={categoryDetailsError}
              renderCategoryItem={renderCategoryItem}
              ItemSeparator={ItemSeparator}
              refetch={refetch}
            />
          );
        case "contestants":
          return showData?.id ? <KoiContestants showId={showData.id} /> : null;
        case "results":
          return showData?.id ? <KoiShowResults showId={showData.id} /> : null;
        case "vote":
          // Only render the voting component when this tab is selected (lazy loading)
          return showData?.id ? (
            <LazyKoiShowVoting showId={showData.id} />
          ) : null;
        default:
          return null;
      }
    },
    [
      showData,
      categories,
      expandedSections,
      toggleSection,
      formatDateAndTime,
      formatRuleContent,
      formatCriterionContent,
      formatTimelineContent,
      getTimelineItemColor,
      detailedCategories,
      isCategoryDetailsLoading,
      categoryDetailsError,
      renderCategoryItem,
      ItemSeparator,
    ]
  );

  // Custom tab bar renderer
  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      style={styles.tabBar}
      indicatorStyle={styles.tabIndicator}
      labelStyle={styles.tabLabel}
      activeColor="#007bff"
      inactiveColor="#6c757d"
    />
  );

  // Nếu đang loading, hiển thị skeleton
  if (isLoading) {
    return <SkeletonLoader />;
  }

  // Nếu có lỗi, hiển thị thông báo lỗi
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={64} color="#e74c3c" />
        <Text style={styles.errorText}>{error.message}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Nếu không có dữ liệu
  if (!showData) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="info-outline" size={64} color="#3498db" />
        <Text style={styles.errorText}>Không tìm thấy thông tin cuộc thi</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Banner */}
      <View style={styles.bannerContainer}>
        <Animated.View
          style={[styles.bannerImageContainer, bannerAnimatedStyles]}>
          {showData?.imgUrl ? (
            <Image
              source={{ uri: showData.imgUrl }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.bannerImage, styles.placeholderBanner]}>
              <Ionicons name="fish" size={64} color="#ffffff" />
            </View>
          )}

          {/* Event info overlay on banner */}
          <View style={styles.eventInfoOverlay}>
            <Text style={styles.eventTitle}>{showData?.name}</Text>
            <View style={styles.eventInfoRow}>
              <MaterialIcons name="location-on" size={18} color="#ffffff" />
              <Text style={styles.eventInfoText}>{showData?.location}</Text>
            </View>
            <View style={styles.eventInfoRow}>
              <MaterialIcons name="date-range" size={18} color="#ffffff" />
              <Text style={styles.eventInfoText}>
                {formatDateAndTime(
                  showData?.startDate || "",
                  showData?.endDate || ""
                )}
              </Text>
            </View>
          </View>

          <View style={styles.overlay}>
            <View style={styles.statusBadge}>
              {/* <Text style={styles.statusText}>
                {showData?.status === "upcoming"
                  ? "Sắp diễn ra"
                  : showData?.status === "active"
                  ? "Đang diễn ra"
                  : showData?.status === "completed"
                  ? "Đã kết thúc"
                  : "Đã lên lịch"}
              </Text> */}
            </View>
          </View>
        </Animated.View>

        {/* Tab Bar - Modified to use the callback renderScene instead of SceneMap */}
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{ width: Dimensions.get("window").width }}
          renderTabBar={renderTabBar}
          style={styles.tabView}
          lazy={true}
        />
      </View>

      {/* Livestream Button - Floating */}
      {isLivestreamLoading ? (
        <View style={styles.livestreamButtonContainer}>
          <ActivityIndicator
            size="small"
            color="#FFFFFF"
            style={styles.livestreamLoadingIndicator}
          />
        </View>
      ) : livestreamInfo && livestreamInfo.status === "active" ? (
        <TouchableOpacity
          style={styles.livestreamButtonContainer}
          onPress={handleViewLivestream}>
          <MaterialCommunityIcons name="video" size={18} color="#FFFFFF" />
          <Text style={styles.livestreamButtonText}>Xem Livestream</Text>
        </TouchableOpacity>
      ) : null}

      {/* Footer với 2 nút: đăng ký thi đấu và mua vé */}
      <View style={styles.footer}>
        {/* Nút đăng ký thi đấu - hiển thị khi show có status là Published hoặc Upcoming */}
        {(showData?.status === "upcoming" ||
          showData?.status === "Upcoming" ||
          showData?.status === "published" ||
          showData?.status === "Published") && (
          <TouchableOpacity
            style={[styles.actionButton, styles.registerButton]}
            onPress={() => {
              if (isGuest()) {
                Alert.alert(
                  "Yêu cầu đăng nhập",
                  "Bạn cần phải login để đăng ký thi đấu",
                  [
                    {
                      text: "Đăng nhập",
                      onPress: () => router.push("/(auth)/signIn"),
                    },
                    {
                      text: "Hủy",
                      style: "cancel",
                    },
                  ]
                );
              } else {
                router.push({
                  pathname: "/(tabs)/shows/KoiRegistration",
                  params: { showId: showData.id },
                });
              }
            }}>
            <FontAwesome5 name="fish" size={18} color="#FFFFFF" />
            <Text style={styles.buttonText}>Đăng ký thi đấu</Text>
          </TouchableOpacity>
        )}

        {/* Nút mua vé tham dự - hiển thị khi show có status là Published, InProgress hoặc Upcoming */}
        {(showData?.status === "published" ||
          showData?.status === "Published" ||
          showData?.status === "upcoming" ||
          showData?.status === "Upcoming" ||
          showData?.status === "inprogress" ||
          showData?.status === "InProgress") && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.ticketButton,
              // Nếu không có nút đăng ký thi đấu, nút mua vé sẽ chiếm toàn bộ chiều rộng
              !(
                showData?.status === "upcoming" ||
                showData?.status === "Upcoming" ||
                showData?.status === "published" ||
                showData?.status === "Published"
              ) && { flex: 2 },
            ]}
            onPress={() => {
              if (isGuest()) {
                Alert.alert(
                  "Yêu cầu đăng nhập",
                  "Bạn cần phải login để mua vé tham dự",
                  [
                    {
                      text: "Đăng nhập",
                      onPress: () => router.push("/(auth)/signIn"),
                    },
                    {
                      text: "Hủy",
                      style: "cancel",
                    },
                  ]
                );
              } else {
                router.push({
                  pathname: "/(tabs)/shows/BuyTickets",
                  params: { showId: showData.id },
                });
              }
            }}>
            <MaterialIcons
              name="confirmation-number"
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.buttonText}>Mua vé tham dự</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  bannerContainer: {
    flex: 1,
  },
  bannerImageContainer: {
    height: 200,
    width: "100%",
    position: "relative",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  placeholderBanner: {
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  // Event info overlay on banner
  eventInfoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 8,
  },
  eventInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  eventInfoText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#ffffff",
  },
  overlay: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  statusBadge: {
    backgroundColor: "#000000",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  // Tab Bar styles
  tabView: {
    backgroundColor: "#ffffff",
  },
  tabBar: {
    backgroundColor: "#ffffff",
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tabIndicator: {
    backgroundColor: "#007bff",
    height: 3,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "500",
    textTransform: "none",
  },
  // Title and content styles
  titleContainer: {
    padding: 16,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2c3e50",
  },
  quickInfoContainer: {
    marginTop: 8,
  },
  quickInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  quickInfoText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#7f8c8d",
  },
  // Livestream button
  livestreamButtonContainer: {
    position: "absolute",
    top: 160, // Position below banner but above tabs
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e53935",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    zIndex: 10,
  },
  livestreamButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 5,
  },
  livestreamLoadingIndicator: {
    marginLeft: 8,
  },
  // ScrollView styles
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100, // Đảm bảo đủ không gian cho nội dung cuối cùng
  },
  // Section styles
  sectionContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1.0,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 0,
    borderBottomColor: "#f0f0f0",
  },
  sectionHeaderExpanded: {
    borderBottomWidth: 1,
  },
  sectionHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginLeft: 8,
  },
  sectionContent: {
    padding: 16,
    backgroundColor: "#ffffff",
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#34495e",
    marginBottom: 16,
  },
  detailsGrid: {
    marginTop: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    marginLeft: 12,
  },
  detailValue: {
    fontSize: 14,
    color: "#2c3e50",
    fontWeight: "500",
    marginLeft: 12,
    marginTop: 2,
  },
  // Timeline styles
  timelineContainer: {
    paddingLeft: 8,
    backgroundColor: "#ffffff",
  },
  timelineCategorySection: {
    marginBottom: 16,
  },
  timelineCategoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    borderRadius: 8,
  },
  timelineCategoryHeaderActive: {
    backgroundColor: "#f8f4ff",
    borderWidth: 1,
    borderColor: "#e1d8f0",
    shadowColor: "#9C27B0",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  timelineCategoryHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  timelineCategoryTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  timelineCategoryTitleActive: {
    fontWeight: "700",
  },
  timelineItemContainer: {
    flexDirection: "row",
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
  },
  timelineItemContainerActive: {
    backgroundColor: "#edf8ff",
    borderWidth: 1,
    borderColor: "#c7e6ff",
    shadowColor: "#4285F4",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
    marginHorizontal: 4,
    marginVertical: 4,
  },
  timelineCenterColumn: {
    alignItems: "center",
    width: 4,
    marginRight: 8,
  },
  timelineLine: {
    width: 4,
    flex: 1,
    backgroundColor: "#e0e0e0",
  },
  timelineRightColumn: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: "center",
    paddingVertical: 8,
    paddingRight: 8,
    borderRadius: 8,
  },
  timelineRightColumnActive: {
    backgroundColor: "transparent",
    borderLeftWidth: 4,
    borderLeftColor: "#4285F4",
    borderRadius: 8,
    marginRight: 8,
  },
  timelineTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 4,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333333",
    marginBottom: 4,
  },
  timelineTitleActive: {
    fontWeight: "700",
    color: "#000000",
  },
  activeStatusBadgeContainer: {
    marginLeft: 8,
  },
  activeStatusBadge: {
    color: "#FF5252",
    fontWeight: "700",
    fontSize: 12,
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#FFCDD2",
    shadowColor: "#FF5252",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  timelineDateTimeOutside: {
    fontSize: 13,
    color: "#666666",
  },
  timelineDateTimeOutsideActive: {
    color: "#333333",
    fontWeight: "500",
  },
  // Rules styles
  ruleContainer: {
    flexDirection: "row",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  ruleNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#000000",
    color: "white",
    textAlign: "center",
    lineHeight: 24,
    marginRight: 12,
    fontSize: 12,
    fontWeight: "bold",
  },
  ruleText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: "#34495e",
  },
  // Criteria styles
  criterionContainer: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-start",
  },
  criterionBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  criterionBulletText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  criterionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: "#34495e",
  },
  // Category styles
  categoriesContainer: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  categoryCard: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    width: 270,
    borderWidth: 1,
    borderColor: "#dadada",
    marginVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryName: {
    fontFamily: "Lexend Deca",
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  categoryFeeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#FEF2F2",
    padding: 8,
    borderRadius: 6,
  },
  categoryFeeLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#991B1B",
    marginRight: 4,
  },
  categoryFee: {
    fontFamily: "Roboto",
    fontSize: 16,
    color: "#EF4444",
    fontWeight: "600",
  },
  categoryDescription: {
    fontFamily: "Roboto",
    fontSize: 14,
    color: "#333333",
    marginBottom: 10,
  },
  categoryDetailsContainer: {
    backgroundColor: "#F9FAFB",
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  categoryDetailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  categoryDetailLabel: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "500",
  },
  categoryDetailValue: {
    fontSize: 13,
    color: "#000000",
    fontWeight: "500",
  },
  varietiesContainer: {
    marginTop: 8,
  },
  varietiesTitle: {
    fontFamily: "Lexend Deca",
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  varietiesList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  varietyTag: {
    padding: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 6,
    backgroundColor: "#F9FAFB",
  },
  varietyTagText: {
    fontFamily: "Roboto",
    fontSize: 13,
    color: "#000000",
  },
  // Awards styles
  awardsContainer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  awardsTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  awardItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  awardDetails: {
    marginLeft: 8,
  },
  awardName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#444",
  },
  awardPrize: {
    fontSize: 13,
    color: "#e74c3c",
    fontWeight: "500",
  },
  awardsLoading: {
    marginTop: 10,
  },
  noAwardsText: {
    fontSize: 13,
    color: "#888",
    fontStyle: "italic",
    marginTop: 10,
    textAlign: "center",
  },
  // Ticket styles
  fullWidthSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingHorizontal: 10,
    width: "100%",
  },
  ticketCard: {
    backgroundColor: "#f0f8ff",
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 180,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e1ecf4",
  },
  ticketNameDetail: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 8,
    color: "#2c3e50",
  },
  ticketPriceDetail: {
    color: "#e74c3c",
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 10,
  },
  ticketAvailability: {
    flexDirection: "row",
    alignItems: "center",
  },
  ticketQuantityDetail: {
    marginLeft: 5,
    color: "#7f8c8d",
    fontSize: 14,
  },
  ticketsCarouselContainer: {
    paddingVertical: 10,
    paddingRight: 16,
  },
  // Empty state styles
  emptyStateContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  emptyStateText: {
    marginTop: 8,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    fontStyle: "italic",
  },
  categoryErrorText: {
    fontSize: 13,
    color: "red",
    fontStyle: "italic",
    marginTop: 10,
    textAlign: "center",
  },
  // Footer styles
  footer: {
    backgroundColor: "#ffffff",
    padding: 8, // Khôi phục padding để nút có đủ không gian
    paddingHorizontal: 12, // Tăng padding ngang để nút không quá sát cạnh
    paddingBottom: 8, // Khôi phục padding dưới
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: 10, // Tăng gap giữa các nút
    justifyContent: "space-between",
    position: "absolute",
    bottom: 0,
    marginBottom: 0, // Loại bỏ margin âm để footer không bị đẩy xuống quá thấp
    left: 0,
    right: 0,
    zIndex: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  actionButton: {
    borderRadius: 8,
    paddingVertical: 12, // Tăng padding để nút có đủ chiều cao
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    height: 44, // Tăng chiều cao cố định cho nút
  },
  ticketButton: {
    backgroundColor: "#1e88e5",
  },
  registerButton: {
    backgroundColor: "#e53935",
    borderRadius: 6,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 14, // Tăng lại kích thước font để dễ đọc
    fontWeight: "600",
    marginLeft: 6, // Tăng lại khoảng cách với icon
  },
  // Error and loading styles
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f6fa",
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: "#e74c3c",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: "#000000",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Cancelled status badge styles
  cancelledStatusBadge: {
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#FECACA",
    marginLeft: 8,
  },
  cancelledStatusText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "600",
  },
  // Skeleton styles
  skeletonBanner: {
    backgroundColor: "#e0e0e0",
  },
  skeletonTitle: {
    height: 24,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginBottom: 8,
    width: "80%",
  },
  skeletonIcon: {
    width: 24,
    height: 24,
    backgroundColor: "#e0e0e0",
    borderRadius: 12,
  },
  skeletonText: {
    height: 16,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginLeft: 8,
    width: 120,
  },
  skeletonCard: {
    backgroundColor: "#f5f5f5",
    marginRight: 12,
    padding: 16,
    width: 270,
    height: 180,
    justifyContent: "space-between",
  },
  skeletonButton: {
    backgroundColor: "#e0e0e0",
    height: 48,
  },
  criteriaButton: {
    backgroundColor: "#FFC107", // Đổi từ #FFD54F sang #FFC107 để đồng bộ với roundsButton
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  criteriaButtonDisabled: {
    backgroundColor: "#FFE082", // Vàng nhạt hơn
    opacity: 0.7,
  },
  criteriaButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 10,
    width: "90%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
  },
  modalContent: {
    width: "100%",
    marginBottom: 20,
    maxHeight: "70%",
  },
  roundSection: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  roundHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  roundDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  roundTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  criteriaTable: {
    width: "100%",
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f9f9f9",
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666666",
  },
  weightColumn: {
    width: 80,
    textAlign: "right",
  },
  criterionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  evenRow: {
    backgroundColor: "#ffffff",
  },
  oddRow: {
    backgroundColor: "#f9f9f9",
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  criterionInfo: {
    flex: 1,
    paddingRight: 8,
  },
  criterionName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
  },
  criterionDescription: {
    fontSize: 12,
    color: "#666666",
    marginTop: 2,
  },
  criterionWeight: {
    width: 80,
    alignItems: "flex-end",
  },
  weightValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
  },
  weightPercent: {
    fontSize: 12,
    color: "#666666",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderTopWidth: 1,
    borderTopColor: "#eeeeee",
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  closeButton: {
    backgroundColor: "#FFD54F", // Vàng nhạt (cùng màu với nút Tiêu chí chấm điểm)
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: "center",
    width: "50%",
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyModalContent: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    height: 200,
  },
  fixedInfoContainer: {
    padding: 16,
    backgroundColor: "#ffffff",
  },
  fixedInfoContent: {
    marginBottom: 24,
    backgroundColor: "#FFF3E0", // Màu nền cam nhạt phù hợp với màu vòng sơ khảo
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800", // Màu cam cho viền bên trái
  },
  fixedInfoText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#333333",
  },
  fixedInfoTitle: {
    fontWeight: "700",
    color: "#F57C00", // Màu cam đậm hơn cho tiêu đề
    fontSize: 15,
  },
  noCriteriaContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  noCriteriaIconContainer: {
    marginBottom: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 50,
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  noCriteriaText: {
    fontSize: 14,
    color: "#666666",
    marginTop: 8,
  },
  roundsButton: {
    backgroundColor: "#FFC107", // Vàng nhạt
  },
});

export default KoiShowInformation;
