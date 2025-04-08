import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, Image, Modal, ScrollView,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { router } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { getCompetitionCategories, getRounds, getContestants, CompetitionCategory, Round, KoiContestant } from '../../../services/contestantService';

interface KoiContestantsProps {
  showId: string;
}

const KoiContestants: React.FC<KoiContestantsProps> = ({ showId }) => {
  const [categories, setCategories] = useState<CompetitionCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>("");
  const [roundTypes] = useState<string[]>(['Preliminary', 'Evaluation', 'Final']);
  const [roundTypeLabels] = useState<Record<string, string>>({
    'Preliminary': 'Sơ khảo',
    'Evaluation': 'Đánh giá',
    'Final': 'Chung kết'
  });
  const [selectedRoundType, setSelectedRoundType] = useState<string | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [selectedRound, setSelectedRound] = useState<string | null>(null);
  const [contestants, setContestants] = useState<KoiContestant[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedContestant, setSelectedContestant] = useState<KoiContestant | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showAllContestants, setShowAllContestants] = useState(false);
  const [activeTabInModal, setActiveTabInModal] = useState('info');
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 4;

  // Lấy danh sách hạng mục thi đấu
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getCompetitionCategories(showId);
        if (response?.data?.items) {
          setCategories(response.data.items);
          if (response.data.items.length > 0) {
            setSelectedCategory(response.data.items[0].id);
            setSelectedCategoryName(response.data.items[0].name);
          }
        } else {
          setError("Không tìm thấy hạng mục thi đấu");
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh sách hạng mục:', error);
        setError("Đã xảy ra lỗi khi tải danh sách hạng mục");
      } finally {
        setLoading(false);
      }
    };

    if (showId) {
      fetchCategories();
    }
  }, [showId]);

  // Lấy danh sách vòng đấu khi chọn hạng mục và loại vòng
  useEffect(() => {
    const fetchRounds = async () => {
      if (!selectedCategory || !selectedRoundType) return;
      
      setLoading(true);
      setError(null);
      try {
        const response = await getRounds(selectedCategory, selectedRoundType);
        if (response?.data?.items) {
          setRounds(response.data.items);
          setSelectedRound(null);
          setContestants([]);
        } else {
          setError(`Không tìm thấy vòng đấu ${roundTypeLabels[selectedRoundType]}`);
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh sách vòng đấu:', error);
        setError(`Đã xảy ra lỗi khi tải vòng đấu ${roundTypeLabels[selectedRoundType]}`);
      } finally {
        setLoading(false);
      }
    };

    if (selectedCategory && selectedRoundType) {
      fetchRounds();
    }
  }, [selectedCategory, selectedRoundType, roundTypeLabels]);

  // Lấy danh sách thí sinh khi chọn vòng đấu
  useEffect(() => {
    const fetchContestants = async () => {
      if (!selectedRound) return;
      
      setLoading(true);
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
        console.error('Lỗi khi lấy danh sách thí sinh:', error);
        setError("Đã xảy ra lỗi khi tải danh sách thí sinh");
      } finally {
        setLoading(false);
      }
    };

    if (selectedRound) {
      fetchContestants();
    }
  }, [selectedRound]);

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
    setActiveTabInModal('info'); // Reset tab về info khi mở modal
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
      <Text style={[
        styles.categoryName,
        selectedCategory === item.id && styles.selectedText
      ]}>
        {item.name}
      </Text>
      <Text style={styles.categorySize}>{item.sizeMin}-{item.sizeMax}cm</Text>
    </TouchableOpacity>
  );

  // Render loại vòng đấu
  const renderRoundTypeItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.roundTypeCard,
        selectedRoundType === item && styles.selectedCard,
      ]}
      onPress={() => {
        setSelectedRoundType(item);
        setSelectedRound(null);
        setContestants([]);
      }}>
      <Text style={[
        styles.roundTypeName,
        selectedRoundType === item && styles.selectedText
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
      ]}
      onPress={() => setSelectedRound(item.id)}>
      <Text style={[
        styles.roundName,
        selectedRound === item.id && styles.selectedText
      ]}>
        {item.name}
      </Text>
      <View style={styles.roundStatusContainer}>
        <Text style={[
          styles.roundStatus,
          item.status === 'completed' ? styles.completedStatus :
          item.status === 'active' ? styles.activeStatus :
          styles.upcomingStatus
        ]}>
          {item.status === 'completed' ? 'Đã kết thúc' :
           item.status === 'active' ? 'Đang diễn ra' : 'Sắp diễn ra'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Render một thí sinh
  const renderContestantItem = ({ item }: { item: KoiContestant }) => {
    const imageMedia = item.registration.koiMedia.find(m => m.mediaType === 'Image');
    const hasVideo = item.registration.koiMedia.some(m => m.mediaType === 'Video');
    
    // Lấy kết quả thi đấu mới nhất nếu có
    const latestResult = item.roundResults && item.roundResults.length > 0 
      ? item.roundResults[item.roundResults.length - 1] 
      : null;
    
    // Xác định loại vòng đấu
    const roundType = selectedRoundType;
    
    return (
      <View style={styles.contestantCard}>
        <TouchableOpacity
          style={styles.contestantCardContent}
          onPress={() => handleContestantPress(item)}
          activeOpacity={0.7}
          >
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
                <MaterialIcons name="play-circle-filled" size={24} color="#ffffff" />
              </View>
            )}
            
            {/* Hiển thị xếp hạng nếu có */}
            {item.rank && (
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{item.rank}</Text>
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
                {(roundType === 'Evaluation' || roundType === 'Final') && latestResult.totalScore !== undefined && (
                  <View style={styles.scoreContainer}>
                    <MaterialIcons name="star" size={14} color="#f39c12" />
                    <Text style={styles.scoreText}>{latestResult.totalScore.toFixed(2)}</Text>
                  </View>
                )}
                
                {/* Hiển thị trạng thái */}
                <View style={[
                  styles.contestantStatusBadge,
                  latestResult.status === 'Pass' ? styles.advancedStatus :
                  latestResult.status === 'Fail' ? styles.eliminatedStatus :
                  styles.pendingStatus
                ]}>
                  <Text style={[
                    styles.contestantStatusText,
                    latestResult.status === 'Pass' ? {color: '#27ae60'} :
                    latestResult.status === 'Fail' ? {color: '#e74c3c'} :
                    {color: '#3498db'}
                  ]}>
                    {latestResult.status === 'Pass' ? 'Đạt' :
                     latestResult.status === 'Fail' ? 'Không đạt' :
                     latestResult.status}
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
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContentContainer}>
        {/* Breadcrumb navigation */}
        <View style={styles.breadcrumbContainer}>
          <Text style={styles.breadcrumbText}>
            {selectedCategoryName}
            {selectedRoundType ? ` > ${roundTypeLabels[selectedRoundType]}` : ''}
            {selectedRound && rounds.find(r => r.id === selectedRound) ? 
              ` > ${rounds.find(r => r.id === selectedRound)?.name}` : ''}
          </Text>
        </View>

        {/* Danh sách hạng mục */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Hạng mục thi đấu</Text>
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.id}
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
              keyExtractor={item => item}
              renderItem={renderRoundTypeItem}
              contentContainerStyle={styles.horizontalListContent}
              nestedScrollEnabled={true}
            />
          </View>
        )}

        {/* Danh sách vòng đấu phụ */}
        {selectedRoundType && rounds.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Vòng đấu phụ</Text>
            <FlatList
              data={rounds}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={item => item.id}
              renderItem={renderRoundItem}
              contentContainerStyle={styles.horizontalListContent}
              nestedScrollEnabled={true}
            />
          </View>
        )}

        {/* Loading indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        )}

        {/* Error message */}
        {!loading && error && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={40} color="#e74c3c" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Danh sách thí sinh */}
        {!loading && !error && contestants.length > 0 && (
          <View style={styles.contestantsContainer}>
            <Text style={styles.contestantsTitle}>
              Thí sinh ({contestants.length})
            </Text>
            <View style={styles.carouselContainer}>
              <FlatList
                data={getCurrentPageData()}
                renderItem={renderContestantItem}
                keyExtractor={item => item.id}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carouselContent}
                ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
                snapToAlignment="start"
                decelerationRate="fast"
                snapToInterval={Dimensions.get('window').width * 0.7 + 16}
                initialNumToRender={4}
                maxToRenderPerBatch={4}
                windowSize={5}
                getItemLayout={(data, index) => ({
                  length: Dimensions.get('window').width * 0.7,
                  offset: (Dimensions.get('window').width * 0.7 + 16) * index,
                  index,
                })}
              />
              
              {/* Pagination */}
              <View style={styles.paginationContainer}>
                <TouchableOpacity 
                  style={[styles.pageButton, currentPage === 0 && styles.pageButtonDisabled]}
                  onPress={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}>
                  <MaterialIcons name="chevron-left" size={24} color={currentPage === 0 ? "#ccc" : "#000"} />
                </TouchableOpacity>
                
                <View style={styles.pageIndicatorContainer}>
                  {Array.from({ length: totalPages }).map((_, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.pageIndicator, currentPage === index && styles.activePageIndicator]}
                      onPress={() => handlePageChange(index)}>
                      <Text style={[
                        styles.pageIndicatorText,
                        currentPage === index && styles.activePageIndicatorText
                      ]}>
                        {index + 1}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity 
                  style={[styles.pageButton, currentPage === totalPages - 1 && styles.pageButtonDisabled]}
                  onPress={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages - 1}>
                  <MaterialIcons name="chevron-right" size={24} color={currentPage === totalPages - 1 ? "#ccc" : "#000"} />
                </TouchableOpacity>
              </View>
            </View>
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
                      activeTabInModal === 'info' && styles.activeModalTabButton
                    ]}
                    onPress={() => setActiveTabInModal('info')}>
                    <MaterialIcons 
                      name="info-outline" 
                      size={18} 
                      color={activeTabInModal === 'info' ? "#2196F3" : "#777777"} 
                    />
                    <Text style={[
                      styles.modalTabText, 
                      activeTabInModal === 'info' && styles.activeModalTabText
                    ]}>
                      Thông tin chi tiết
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.modalTabButton,
                      activeTabInModal === 'media' && styles.activeModalTabButton
                    ]}
                    onPress={() => setActiveTabInModal('media')}>
                    <MaterialIcons 
                      name="photo-library" 
                      size={18} 
                      color={activeTabInModal === 'media' ? "#2196F3" : "#777777"} 
                    />
                    <Text style={[
                      styles.modalTabText,
                      activeTabInModal === 'media' && styles.activeModalTabText
                    ]}>
                      Hình ảnh & Video
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Tab Content */}
                <View style={styles.modalTabContentContainer}>
                  {activeTabInModal === 'info' ? (
                    <ScrollView style={styles.modalScrollContent}>
                      <View style={styles.infoContainer}>
                        <InfoRow 
                          label="Mã Đăng Ký" 
                          value={selectedContestant.id.substring(0, 8)} 
                        />
                        <InfoRow 
                          label="Tên Người Đăng Ký" 
                          value={selectedContestant.registration.registerName || "Không có thông tin"} 
                        />
                        <InfoRow 
                          label="Tên Cá Koi" 
                          value={selectedContestant.registration.koiProfile.name} 
                        />
                        <InfoRow 
                          label="Giống" 
                          value={selectedContestant.registration.koiProfile.variety.name} 
                        />
                        <InfoRow 
                          label="Kích Thước" 
                          value={`${selectedContestant.registration.koiSize} cm`} 
                        />
                        <InfoRow 
                          label="Tuổi Cá" 
                          value={`${Math.floor(selectedContestant.registration.koiAge / 12) || 0} năm`} 
                        />
                        <InfoRow 
                          label="Dòng máu" 
                          value={selectedContestant.registration.koiProfile.bloodline || "Không có thông tin"} 
                        />
                        <InfoRow 
                          label="Hạng Mục" 
                          value={selectedCategoryName} 
                        />
                        <InfoRow 
                          label="Phí Đăng Ký" 
                          value={`${selectedContestant.registration.registrationFee?.toLocaleString('vi-VN') || 0} VND`} 
                        />
                        <InfoRow 
                          label="Trạng Thái" 
                          value={
                            <View style={styles.statusBadge}>
                              <Text style={styles.statusBadgeText}>
                                {selectedContestant.status === "active" ? "Đã công khai" : 
                                 selectedContestant.status === "pending" ? "Chờ duyệt" : 
                                 "Đã huỷ"}
                              </Text>
                            </View>
                          } 
                        />
                        <InfoRow 
                          label="Bể" 
                          value={selectedContestant.tankName || "Chưa gán bể"} 
                        />
                        <InfoRow 
                          label="Thời gian check in" 
                          value={selectedContestant.checkInTime ? new Date(selectedContestant.checkInTime).toLocaleString('vi-VN') : "Chưa check in"} 
                        />
                        
                        {/* Hiển thị kết quả thi đấu */}
                        {selectedContestant.roundResults && selectedContestant.roundResults.length > 0 && (
                          <View style={styles.resultSection}>
                            <Text style={styles.resultSectionTitle}>Kết quả thi đấu:</Text>
                            {selectedContestant.roundResults.map((result, index) => {
                              // Xác định loại vòng đấu
                              const roundType = selectedRoundType;
                              
                              return (
                                <View key={`result-${index}`} style={styles.resultItem}>
                                  <View style={styles.resultDetailsContainer}>
                                    {/* Hiển thị xếp hạng cho tất cả các loại vòng đấu */}
                                    <View style={styles.resultDetail}>
                                      <Text style={styles.resultLabel}>Xếp hạng:</Text>
                                      <Text style={styles.resultValue}>
                                        {selectedContestant.rank || "Chưa xếp hạng"}
                                      </Text>
                                    </View>
                                    
                                    {/* Hiển thị điểm tổng và trạng thái trên cùng một hàng */}
                                    <View style={styles.resultDetailRow}>
                                      {/* Hiển thị điểm tổng cho vòng Evaluation và Final */}
                                      {(roundType === 'Evaluation' || roundType === 'Final') && (
                                        <View style={styles.resultDetailHalf}>
                                          <Text style={styles.resultLabel}>Điểm tổng:</Text>
                                          <Text style={styles.resultValue}>{result.totalScore.toFixed(2)}</Text>
                                        </View>
                                      )}
                                      
                                      {/* Hiển thị trạng thái cho tất cả các loại vòng đấu */}
                                      <View style={styles.resultDetailHalf}>
                                        <Text style={styles.resultLabel}>Trạng thái:</Text>
                                        <View style={[
                                          styles.resultStatusBadge,
                                          result.status === 'Pass' ? styles.advancedStatus :
                                          result.status === 'Fail' ? styles.eliminatedStatus :
                                          styles.pendingStatus
                                        ]}>
                                          <Text style={styles.resultStatusText}>
                                            {result.status === 'Pass' ? 'Đạt' :
                                             result.status === 'Fail' ? 'Không đạt' :
                                             result.status}
                                          </Text>
                                        </View>
                                      </View>
                                    </View>
                                  </View>
                                </View>
                              );
                            })}
                          </View>
                        )}
                        
                        {selectedContestant.registration.notes && (
                          <View style={styles.notesSection}>
                            <Text style={styles.notesSectionTitle}>Ghi chú:</Text>
                            <Text style={styles.notesContent}>{selectedContestant.registration.notes}</Text>
                          </View>
                        )}
                      </View>
                    </ScrollView>
                  ) : (
                    <View style={styles.mediaTabContent}>
                      {/* Carousel */}
                      <View style={styles.mediaCarouselContainer}>
                        {selectedContestant.registration.koiMedia.length > 0 && (
                          <View style={styles.mediaContainer}>
                            {selectedContestant.registration.koiMedia[activeMediaIndex].mediaType === 'Image' ? (
                              <Image 
                                source={{ uri: selectedContestant.registration.koiMedia[activeMediaIndex].mediaUrl }}
                                style={styles.modalImage}
                                resizeMode="contain"
                              />
                            ) : (
                              <Video
                                source={{ uri: selectedContestant.registration.koiMedia[activeMediaIndex].mediaUrl }}
                                style={styles.modalVideo}
                                useNativeControls
                                resizeMode={ResizeMode.CONTAIN}
                                isLooping
                                shouldPlay
                              />
                            )}
                          </View>
                        )}
                        
                        {selectedContestant.registration.koiMedia.length > 1 && (
                          <View style={styles.mediaDots}>
                            {selectedContestant.registration.koiMedia.map((_, index: number) => (
                              <TouchableOpacity 
                                key={index}
                                style={[
                                  styles.mediaDot,
                                  index === activeMediaIndex && styles.activeMediaDot
                                ]}
                                onPress={() => setActiveMediaIndex(index)}
                              />
                            ))}
                          </View>
                        )}
                      </View>
                      
                      {/* Thumbnails */}
                      <ScrollView style={styles.mediaListScrollContainer}>
                        <View style={styles.mediaListContainer}>
                          <Text style={styles.mediaListTitle}>Tất cả hình ảnh và video</Text>
                          <View style={styles.thumbnailGrid}>
                            {selectedContestant.registration.koiMedia.map((item, index) => (
                              <TouchableOpacity 
                                key={`media-${index}`}
                                style={[
                                  styles.mediaThumbnailContainer,
                                  activeMediaIndex === index && styles.activeThumbnail
                                ]}
                                onPress={() => setActiveMediaIndex(index)}
                              >
                                <Image 
                                  source={{ uri: item.mediaUrl }} 
                                  style={styles.mediaThumbnail} 
                                  resizeMode="cover"
                                />
                                {item.mediaType === 'Video' && (
                                  <View style={styles.videoOverlay}>
                                    <MaterialIcons name="play-circle-outline" size={24} color="#FFFFFF" />
                                  </View>
                                )}
                              </TouchableOpacity>
                            ))}
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
const InfoRow = ({ label, value }: { label: string, value: string | React.ReactNode }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    {typeof value === 'string' ? (
      <Text style={styles.infoValue}>{value}</Text>
    ) : (
      value
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 120, // Tăng padding bottom để tránh bị footer che phủ
  },
  breadcrumbContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
  },
  breadcrumbText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  sectionContainer: {
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333333',
  },
  horizontalListContent: {
    paddingBottom: 4,
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    padding: 12,
    marginRight: 12,
    borderRadius: 8,
    minWidth: 140,
    maxWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedCard: {
    borderColor: '#000000',
    backgroundColor: '#f8f8f8',
    borderWidth: 2,
  },
  selectedText: {
    color: '#000000',
    fontWeight: '700',
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333333',
  },
  categorySize: {
    fontSize: 13,
    color: '#666666',
  },
  roundTypeCard: {
    backgroundColor: '#ffffff',
    padding: 12,
    marginRight: 12,
    borderRadius: 8,
    minWidth: 100,
    maxWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  roundTypeName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  roundCard: {
    backgroundColor: '#ffffff',
    padding: 12,
    marginRight: 12,
    borderRadius: 8,
    minWidth: 180,
    maxWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  roundName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333333',
  },
  roundStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roundStatus: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  completedStatus: {
    backgroundColor: '#e6f7ef',
    color: '#2ecc71',
  },
  activeStatus: {
    backgroundColor: '#e6f0ff',
    color: '#3498db',
  },
  upcomingStatus: {
    backgroundColor: '#f7f7f7',
    color: '#95a5a6',
  },
  loadingContainer: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666666',
  },
  errorContainer: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 14,
    color: '#e74c3c',
    textAlign: 'center',
  },
  contestantsContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
    position: 'relative',
    paddingBottom: 80, // Tăng paddingBottom để tạo thêm khoảng cách
    flex: 1,
  },
  contestantsWrapper: {
    maxHeight: 460, // Tăng lên để hiển thị hai hàng đầy đủ
    overflow: 'hidden',
  },
  contestantsWrapperExpanded: {
    maxHeight: undefined,
  },
  contestantsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333333',
    paddingHorizontal: 16,
  },
  contestantsGrid: {
    paddingBottom: 16,
  },
  contestantCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    overflow: 'hidden',
    width: Dimensions.get('window').width * 0.7,
    marginVertical: 12, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    height: 280, // Giảm chiều cao xuống một chút để tránh bị che
  },
  contestantCardContent: {
    flex: 1,
  },
  contestantImageContainer: {
    height: 160,
    width: '100%',
    position: 'relative',
    backgroundColor: '#f0f0f0',
  },
  contestantImage: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 4,
  },
  contestantInfo: {
    padding: 12,
    flex: 1,
  },
  contestantName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
    color: '#000000',
  },
  contestantVariety: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 4,
  },
  contestantDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  contestantDetail: {
    fontSize: 12,
    color: '#888888',
  },
  tankNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  tankName: {
    fontSize: 12,
    color: '#3498db',
    marginLeft: 4,
  },
  rankBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rankText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  scoreStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 12,
    color: '#f39c12',
    fontWeight: '600',
    marginLeft: 4,
  },
  contestantStatusBadge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  contestantStatusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: '100%',
    maxHeight: '90%',
    height: 600,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 6,
  },
  fullDetailsContainer: {
    flex: 1,
    paddingTop: 40,
  },
  modalTabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    justifyContent: 'center',
  },
  activeModalTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  modalTabText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#777777',
  },
  activeModalTabText: {
    color: '#2196F3',
    fontWeight: '600',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  statusBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#43a047',
    fontSize: 12,
    fontWeight: '500',
  },
  notesSection: {
    marginTop: 16,
    backgroundColor: '#fff8e1',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107',
  },
  notesSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#795548',
    marginBottom: 8,
  },
  notesContent: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  mediaTabContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  mediaListScrollContainer: {
    flex: 1,
  },
  mediaListContainer: {
    padding: 16,
  },
  mediaListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  thumbnailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  mediaCarouselContainer: {
    height: 250,
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  mediaContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalVideo: {
    width: '100%',
    height: '100%',
  },
  mediaDots: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  mediaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 4,
  },
  activeMediaDot: {
    backgroundColor: '#ffffff',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3498db',
    marginRight: 4,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaThumbnailContainer: {
    width: '31%',
    aspectRatio: 1,
    marginBottom: 8,
    marginRight: '2%',
    marginLeft: '0%',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeThumbnail: {
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  mediaThumbnail: {
    width: '100%',
    height: '100%',
  },
  // Styles cho phần kết quả thi đấu
  resultSection: {
    marginTop: 16,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3498db',
  },
  resultSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  resultItem: {
    marginBottom: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  resultRoundName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 4,
  },
  resultDetailsContainer: {
    marginTop: 4,
  },
  resultDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  resultDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  resultDetailHalf: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  resultLabel: {
    fontSize: 13,
    color: '#666666',
    flex: 1,
  },
  resultValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
    textAlign: 'right',
  },
  resultStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-end',
  },
  advancedStatus: {
    backgroundColor: '#e8f5e9',
  },
  eliminatedStatus: {
    backgroundColor: '#ffebee',
  },
  pendingStatus: {
    backgroundColor: '#e3f2fd',
  },
  resultStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  carouselContainer: {
    paddingVertical: 12,
    marginBottom: 80, // Tăng marginBottom để tạo thêm khoảng cách với phần phân trang
    minHeight: 350, 
  },
  carouselContent: {
    paddingHorizontal: 16,
    paddingBottom: 60, // Tăng paddingBottom để tạo khoảng cách với phần phân trang
    alignItems: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  pageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  pageButtonDisabled: {
    backgroundColor: '#f0f0f0',
    shadowOpacity: 0,
    elevation: 0,
  },
  pageIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    flexWrap: 'wrap', // Cho phép xuống dòng nếu có quá nhiều trang
    maxWidth: 300, // Giới hạn chiều rộng để tránh tràn
  },
  pageIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  activePageIndicator: {
    backgroundColor: '#2196F3',
    shadowColor: '#1976D2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  pageIndicatorText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  activePageIndicatorText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default KoiContestants;