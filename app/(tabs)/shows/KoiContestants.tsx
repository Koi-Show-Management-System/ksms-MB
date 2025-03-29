// Tạo file mới: app/(tabs)/shows/KoiContestants.tsx
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
    
    return (
      <TouchableOpacity
        style={styles.contestantCard}
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
              <MaterialIcons name="play-circle-filled" size={24} color="#ffffff" />
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
          {item.tankName && (
            <View style={styles.tankNameContainer}>
              <MaterialIcons name="pool" size={14} color="#3498db" />
              <Text style={styles.tankName}>{item.tankName}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
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
            <View style={[
              styles.contestantsWrapper, 
              showAllContestants && styles.contestantsWrapperExpanded
            ]}>
              <FlatList
                data={contestants}
                numColumns={2}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.contestantsGrid}
                renderItem={renderContestantItem}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
                scrollEnabled={false}
              />
            </View>
            
            {!showAllContestants && contestants.length > 6 && (
              <TouchableOpacity 
                style={styles.showMoreButton}
                onPress={handleShowMoreContestants}>
                <Text style={styles.showMoreText}>Xem thêm</Text>
                <MaterialIcons name="keyboard-arrow-down" size={20} color="#3498db" />
              </TouchableOpacity>
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
    paddingBottom: 80, // Add padding to prevent footer overlap
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
  },
  contestantsWrapper: {
    maxHeight: 400,
    overflow: 'hidden',
  },
  contestantsWrapperExpanded: {
    maxHeight: undefined,
  },
  contestantsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333333',
  },
  contestantsGrid: {
    paddingBottom: 16,
  },
  contestantCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    marginHorizontal: 6,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  contestantImageContainer: {
    height: 160,
    width: '100%',
    position: 'relative',
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
});

export default KoiContestants;