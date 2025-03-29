// KoiList.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Platform,
  Animated,
  Modal,
  Dimensions,
  StatusBar,
  SafeAreaView,
  KeyboardAvoidingView,
} from "react-native";
import { getKoiProfiles, KoiProfile, getVarieties, Variety, createKoiProfile } from "../../services/koiProfileService";
import { router, useRouter } from "expo-router";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Video } from 'expo-av';

// Thêm hằng số kích thước màn hình
const { width, height } = Dimensions.get('window');

const KoiList: React.FC = () => {
  const [koiList, setKoiList] = useState<KoiProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [searchName, setSearchName] = useState<string>("");
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [selectedVarietyIds, setSelectedVarietyIds] = useState<string[]>([]);
  const [startSize, setStartSize] = useState<number | undefined>(undefined);
  const [endSize, setEndSize] = useState<number | undefined>(undefined);

  const [newKoi, setNewKoi] = useState<{
    name: string;
    age: number;
    size: number;
    variety: string;
    gender: string;
    bloodline: string;
    description: string;
    images: any[];
    videos: any[];
  }>({
    name: "",
    age: 0,
    size: 0,
    variety: "",
    gender: "Đực",
    bloodline: "",
    description: "",
    images: [],
    videos: [],
  });

  // State để quản lý section nào đang được chọn
  const [activeTab, setActiveTab] = useState<'myKoi' | 'addNewKoi'>('myKoi');
  
  // Animation values
  const myKoiHeaderOpacity = useState(new Animated.Value(1))[0];
  const addNewKoiHeaderOpacity = useState(new Animated.Value(0.5))[0];
  
  // Toggle section
  const toggleSection = (section: 'myKoi' | 'addNewKoi') => {
    if (section === activeTab) return;
    
    setActiveTab(section);
    
    // Animation
    if (section === 'myKoi') {
      Animated.parallel([
        Animated.timing(myKoiHeaderOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(addNewKoiHeaderOpacity, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(myKoiHeaderOpacity, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(addNewKoiHeaderOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  // Thêm state cho modal
  const [showVarietyModal, setShowVarietyModal] = useState<boolean>(false);

  // Fetch koi profiles với retry logic
  const fetchKoiProfiles = useCallback(async (refresh = false, retryCount = 0) => {
    try {
      const currentPage = refresh ? 1 : page;
      if (refresh) {
        setIsRefreshing(true);
      } else if (!refresh && page > 1) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      
      console.log("Đang fetch Koi profiles với tham số:", {
        page: currentPage,
        size: 10,
        name: searchName || undefined,
        varietyIds: selectedVarietyIds.length > 0 ? selectedVarietyIds : undefined,
        startSize,
        endSize,
      });
      
      const response = await getKoiProfiles({
        page: currentPage,
        size: 10,
        name: searchName || undefined,
        varietyIds: selectedVarietyIds.length > 0 ? selectedVarietyIds : undefined,
        startSize,
        endSize,
      });
      
      if (response.statusCode === 200) {
        console.log(`Nhận được ${response.data.items.length} cá Koi từ API`);
        const newKoiList = response.data.items;
        if (refresh || currentPage === 1) {
          setKoiList(newKoiList);
        } else {
          setKoiList(prev => [...prev, ...newKoiList]);
        }
        setTotalPages(response.data.totalPages);
        setError(null);
      } else {
        console.error("API trả về lỗi:", response);
        setError(`Không thể tải danh sách cá Koi: ${response.message || 'Lỗi không xác định'}`);
      }
    } catch (err: unknown) {
      console.error("Lỗi khi fetch Koi profiles:", err);
      
      // Thử lại nếu thất bại và chưa đạt đến giới hạn retry
      if (retryCount < 2) {
        console.log(`Đang thử lại lần ${retryCount + 1}...`);
        setTimeout(() => fetchKoiProfiles(refresh, retryCount + 1), 1000);
        return;
      }
      
      setError(`Đã xảy ra lỗi khi tải danh sách cá Koi: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [page, searchName, selectedVarietyIds, startSize, endSize]);

  // Fetch varieties với retry logic
  const fetchVarieties = useCallback(async (retryCount = 0) => {
    try {
      console.log('Đang gọi API lấy danh sách giống cá Koi...');
      const response = await getVarieties();
      if (response.statusCode === 200) {
        console.log(`Nhận được ${response.data.items.length} giống cá Koi`);
        setVarieties(response.data.items);
      } else {
        console.error("API trả về lỗi:", response);
      }
    } catch (err: unknown) {
      console.error("Lỗi khi tải danh sách giống cá:", err);
      
      // Thử lại nếu thất bại và chưa đạt đến giới hạn retry
      if (retryCount < 2) {
        console.log(`Đang thử lại lần ${retryCount + 1}...`);
        setTimeout(() => fetchVarieties(retryCount + 1), 1000);
      }
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    fetchKoiProfiles();
    fetchVarieties();
  }, []);

  // Load more when page changes
  useEffect(() => {
    if (page > 1) {
      fetchKoiProfiles();
    }
  }, [page]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setPage(1);
    fetchKoiProfiles(true);
  }, [fetchKoiProfiles]);

  // Load more
  const loadMore = () => {
    if (page < totalPages && !isLoadingMore) {
      setPage(prevPage => prevPage + 1);
    }
  };

  // Apply search filters
  const applyFilters = () => {
    setPage(1);
    fetchKoiProfiles(true);
  };

  // Reset search filters
  const resetFilters = () => {
    setSearchName("");
    setSelectedVarietyIds([]);
    setStartSize(undefined);
    setEndSize(undefined);
    setPage(1);
    fetchKoiProfiles(true);
  };

  const handleInputChange = (field: string, value: string | number) => {
    if (field === "age" || field === "size") {
      setNewKoi({ ...newKoi, [field]: Number(value) });
    } else {
      setNewKoi({ ...newKoi, [field]: value });
    }
  };

  const handleAddKoi = () => {
    // Log dữ liệu trước khi validation
    console.log("=== DEBUG: handleAddKoi ===");
    console.log("Dữ liệu cá Koi trước khi validation:", JSON.stringify(newKoi, null, 2));
    
    // Basic validation
    if (!newKoi.name || !newKoi.variety || newKoi.size <= 0) {
      console.log("DEBUG: Validation thất bại - Thiếu thông tin bắt buộc");
      console.log(`Tên: ${newKoi.name ? "OK" : "Thiếu"}`);
      console.log(`Giống: ${newKoi.variety ? "OK" : "Thiếu"}`);
      console.log(`Kích thước: ${newKoi.size > 0 ? "OK" : "Thiếu hoặc không hợp lệ"}`);
      
      Alert.alert(
        "Lỗi",
        "Vui lòng điền đầy đủ thông tin bắt buộc (Tên, Giống, Kích thước)."
      );
      return;
    }
    
    if (newKoi.images.length === 0) {
      console.log("DEBUG: Validation thất bại - Thiếu ảnh cá Koi");
      Alert.alert("Lỗi", "Vui lòng tải lên ít nhất một ảnh của cá Koi.");
      return;
    }

    // Create a new FormData instance
    const formData = new FormData();
    formData.append('Name', newKoi.name);
    formData.append('Age', newKoi.age.toString());
    formData.append('Size', newKoi.size.toString());
    formData.append('VarietyId', newKoi.variety);
    formData.append('Gender', newKoi.gender);
    formData.append('Bloodline', newKoi.bloodline);
    
    // Thêm trường Status với giá trị mặc định là "Owned"
    formData.append('Status', 'Owned');
    console.log("DEBUG: Đã thêm trường Status với giá trị 'Owned'");
    
    if (newKoi.description) {
      formData.append('Description', newKoi.description);
    }
    
    // Append all images
    newKoi.images.forEach((image, index) => {
      console.log(`DEBUG: Thông tin ảnh ${index + 1} được tải lên:`, {
        uri: image.uri,
        type: image.type,
        name: image.name,
      });
      formData.append(`KoiImages`, image);
    });
    
    // Append all videos
    newKoi.videos.forEach((video, index) => {
      console.log(`DEBUG: Thông tin video ${index + 1} được tải lên:`, {
        uri: video.uri,
        type: video.type,
        name: video.name,
      });
      formData.append(`KoiVideos`, video);
    });
    
    console.log("DEBUG: FormData đã được tạo với các key:");
    
    // Log tất cả các key của FormData (vì không thể log trực tiếp tất cả các giá trị)
    const formDataKeys: string[] = [];
    // @ts-ignore - Sử dụng _parts để debug (không khuyến khích trong production)
    if (formData._parts) {
      // @ts-ignore
      formData._parts.forEach(part => {
        const [key, value] = part;
        if (typeof value === 'object' && value !== null) {
          formDataKeys.push(`${key}: ${value.name || 'Object'}`);
        } else {
          formDataKeys.push(`${key}: ${value}`);
        }
      });
    }
    console.log("FormData keys:", formDataKeys);
    
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc chắn muốn thêm cá Koi này?",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Thêm",
          onPress: async () => {
            try {
              console.log("DEBUG: Bắt đầu gửi dữ liệu cá Koi mới...");
              // Log thời điểm bắt đầu request
              const startTime = new Date().getTime();
              
              // Call API to create new Koi profile
              const response = await createKoiProfile(formData);
              
              // Log thời gian hoàn thành request
              const endTime = new Date().getTime();
              console.log(`DEBUG: API request hoàn thành trong ${endTime - startTime}ms`);
              
              console.log("DEBUG: Kết quả từ API:", JSON.stringify(response, null, 2));
              
              if (response.statusCode === 200 || response.statusCode === 201) {
                console.log("DEBUG: Thêm cá Koi thành công!");
                // Clear the form
                setNewKoi({
                  name: "",
                  age: 0,
                  size: 0,
                  variety: "",
                  gender: "Đực",
                  bloodline: "",
                  description: "",
                  images: [],
                  videos: [],
                });

                // Refresh the koi list
                onRefresh();
                
                // Show success message
                Alert.alert("Thành công", "Cá Koi đã được thêm!");
              } else {
                console.error("DEBUG: API trả về lỗi:", response.message);
                Alert.alert("Lỗi", `Không thể thêm cá Koi: ${response.message || 'Lỗi không xác định'}`);
              }
            } catch (error: unknown) {
              console.error("DEBUG: Lỗi khi thêm cá Koi:", error);
              console.error("DEBUG: Chi tiết lỗi:", error instanceof Error ? error.stack : "Không có stack trace");
              
              // Log thêm thông tin về response nếu có
              if (error && typeof error === 'object' && 'response' in error) {
                const errorWithResponse = error as { response?: { status?: number, data?: any } };
                if (errorWithResponse.response) {
                  console.error("DEBUG: Response status:", errorWithResponse.response.status);
                  console.error("DEBUG: Response data:", JSON.stringify(errorWithResponse.response.data, null, 2));
                }
              }
              
              Alert.alert("Lỗi", `Đã xảy ra lỗi khi thêm cá Koi: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
            }
          },
        },
      ]
    );
  };

  const handleImageUpload = async () => {
    try {
      console.log("DEBUG: Bắt đầu quá trình upload ảnh");
      
      // Kiểm tra giới hạn số lượng ảnh
      if (newKoi.images.length >= 3) {
        Alert.alert("Giới hạn đạt", "Bạn chỉ có thể tải lên tối đa 3 ảnh.");
        return;
      }
      
      // Yêu cầu quyền truy cập vào thư viện ảnh
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log("DEBUG: Kết quả yêu cầu quyền:", permissionResult);
      
      if (!permissionResult.granted) {
        console.log("DEBUG: Người dùng từ chối cấp quyền truy cập thư viện ảnh");
        Alert.alert("Cần quyền truy cập", "Vui lòng cấp quyền truy cập vào thư viện ảnh.");
        return;
      }
      
      console.log("DEBUG: Mở thư viện ảnh để chọn");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });
      
      console.log("DEBUG: Kết quả chọn ảnh:", result.canceled ? "Đã hủy" : "Đã chọn");
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        console.log("DEBUG: Thông tin ảnh đã chọn:", {
          uri: selectedAsset.uri,
          width: selectedAsset.width,
          height: selectedAsset.height,
          type: selectedAsset.type,
          fileSize: selectedAsset.fileSize
        });
        
        // Thêm ảnh mới vào mảng ảnh
        const newImage = {
          uri: selectedAsset.uri,
          type: 'image/jpeg',
          name: `new-image-${Date.now()}.jpg`,
        };
        
        setNewKoi({
          ...newKoi,
          images: [...newKoi.images, newImage]
        });
        
        console.log("DEBUG: Đã thêm ảnh mới vào mảng ảnh:", newImage);
      }
    } catch (error: unknown) {
      console.error("DEBUG: Lỗi khi chọn ảnh:", error);
      console.error("DEBUG: Chi tiết lỗi:", error instanceof Error ? error.stack : "Không có stack trace");
      Alert.alert("Lỗi", "Không thể tải ảnh. Vui lòng thử lại.");
    }
  };

  const handleVideoUpload = async () => {
    try {
      console.log("DEBUG: Bắt đầu quá trình upload video");
      
      // Kiểm tra giới hạn số lượng video
      if (newKoi.videos.length >= 2) {
        Alert.alert("Giới hạn đạt", "Bạn chỉ có thể tải lên tối đa 2 video.");
        return;
      }
      
      // Yêu cầu quyền truy cập vào thư viện ảnh
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log("DEBUG: Kết quả yêu cầu quyền:", permissionResult);
      
      if (!permissionResult.granted) {
        console.log("DEBUG: Người dùng từ chối cấp quyền truy cập thư viện ảnh");
        Alert.alert("Cần quyền truy cập", "Vui lòng cấp quyền truy cập vào thư viện ảnh.");
        return;
      }
      
      console.log("DEBUG: Mở thư viện để chọn video");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        videoMaxDuration: 600, // 10 phút tối đa
      });
      
      console.log("DEBUG: Kết quả chọn video:", result.canceled ? "Đã hủy" : "Đã chọn");
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        console.log("DEBUG: Thông tin video đã chọn:", {
          uri: selectedAsset.uri,
          width: selectedAsset.width,
          height: selectedAsset.height,
          type: selectedAsset.type,
          duration: selectedAsset.duration,
          fileSize: selectedAsset.fileSize
        });
        
        // Kiểm tra kích thước (chỉ có thể thực hiện trên một số nền tảng)
        if (Platform.OS !== 'web') {
          try {
            console.log("DEBUG: Kiểm tra kích thước file video");
            const fileInfo = await FileSystem.getInfoAsync(selectedAsset.uri);
            console.log("DEBUG: Thông tin file:", fileInfo);
            
            // Kiểm tra fileInfo.size có tồn tại không trước khi sử dụng
            if (fileInfo && 'size' in fileInfo) {
              const fileSizeMB = fileInfo.size / (1024 * 1024);
              console.log(`DEBUG: Kích thước file: ${fileSizeMB.toFixed(2)}MB`);
              
              if (fileInfo.size > 100 * 1024 * 1024) { // Kiểm tra xem có lớn hơn 100MB không
                console.log("DEBUG: File quá lớn, vượt quá 100MB");
                Alert.alert("Video quá lớn", "Video không được vượt quá 100MB. Vui lòng chọn video nhỏ hơn.");
                return;
              }
            } else {
              console.log("DEBUG: Không thể lấy kích thước file, fileInfo:", fileInfo);
            }
          } catch (error: unknown) {
            console.error("DEBUG: Không thể kiểm tra kích thước file:", error);
            console.error("DEBUG: Chi tiết lỗi:", error instanceof Error ? error.stack : "Không có stack trace");
            // Tiếp tục mặc dù không thể kiểm tra kích thước
          }
        }
        
        // Thêm video mới vào mảng videos
        const newVideo = {
          uri: selectedAsset.uri,
          type: 'video/mp4',
          name: `new-video-${Date.now()}.mp4`,
        };
        
        setNewKoi({
          ...newKoi,
          videos: [...newKoi.videos, newVideo]
        });
        
        console.log("DEBUG: Đã thêm video mới vào mảng videos:", newVideo);
      }
    } catch (error: unknown) {
      console.error("DEBUG: Lỗi khi chọn video:", error);
      console.error("DEBUG: Chi tiết lỗi:", error instanceof Error ? error.stack : "Không có stack trace");
      Alert.alert("Lỗi", "Không thể tải video. Vui lòng thử lại.");
    }
  };

  // Hàm xóa ảnh
  const handleRemoveImage = (index: number) => {
    const updatedImages = [...newKoi.images];
    updatedImages.splice(index, 1);
    setNewKoi({
      ...newKoi,
      images: updatedImages
    });
  };
  
  // Hàm xóa video
  const handleRemoveVideo = (index: number) => {
    const updatedVideos = [...newKoi.videos];
    updatedVideos.splice(index, 1);
    setNewKoi({
      ...newKoi,
      videos: updatedVideos
    });
  };

  // Hàm mở modal chọn giống cá Koi
  const openVarietyModal = () => {
    if (varieties.length > 0) {
      setShowVarietyModal(true);
    } else {
      Alert.alert("Thông báo", "Đang tải danh sách giống cá Koi...");
      fetchVarieties();
    }
  };

  // Hàm chọn giống cá Koi từ modal
  const selectVariety = (varietyId: string) => {
    handleInputChange("variety", varietyId);
    setShowVarietyModal(false);
  };

  // Render item cho danh sách giống cá Koi trong modal
  const renderVarietyItem = ({ item }: { item: Variety }) => (
    <TouchableOpacity
      style={styles.varietyItem}
      onPress={() => selectVariety(item.id)}
    >
      <Text style={styles.varietyName}>{item.name}</Text>
      <Text style={styles.varietyDescription}>{item.description}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5664F5" />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      ) : (
        <>
          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <Animated.View
              style={[
                styles.tabItem,
                activeTab === "myKoi" && styles.activeTabItem,
                {
                  opacity: myKoiHeaderOpacity,
                  transform: [
                    {
                      translateY: myKoiHeaderOpacity.interpolate({
                        inputRange: [0.5, 1],
                        outputRange: [10, 0],
                        extrapolate: "clamp",
                      }),
                    },
                  ],
                },
              ]}>
              <TouchableOpacity
                style={styles.tabButton}
                onPress={() => setActiveTab("myKoi")}>
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "myKoi" && styles.activeTabText,
                  ]}>
                  Koi của tôi
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View
              style={[
                styles.tabItem,
                activeTab === "addNewKoi" && styles.activeTabItem,
                {
                  opacity: addNewKoiHeaderOpacity,
                  transform: [
                    {
                      translateY: addNewKoiHeaderOpacity.interpolate({
                        inputRange: [0.5, 1],
                        outputRange: [10, 0],
                        extrapolate: "clamp",
                      }),
                    },
                  ],
                },
              ]}>
              <TouchableOpacity
                style={styles.tabButton}
                onPress={() => setActiveTab("addNewKoi")}>
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "addNewKoi" && styles.activeTabText,
                  ]}>
                  Thêm Koi mới
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Content Based on Active Tab */}
          {activeTab === "myKoi" ? renderMyKoiTab() : renderAddNewKoiTab()}
        </>
      )}

      {/* Add/Edit Koi Modal */}
      <Modal
        visible={showVarietyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVarietyModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedKoi ? "Chỉnh sửa thông tin Koi" : "Thêm Koi mới"}
              </Text>
              <TouchableOpacity onPress={() => setShowVarietyModal(false)}>
                <Text style={styles.closeButton}>Đóng</Text>
              </TouchableOpacity>
            </View>
            {/* Modal content... */}
          </View>
        </View>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        visible={isPreviewVisible}
        transparent={true}
        onRequestClose={() => setIsPreviewVisible(false)}>
        <View style={styles.previewModalContainer}>
          <TouchableOpacity
            style={styles.previewCloseButton}
            onPress={() => setIsPreviewVisible(false)}>
            <Text style={styles.previewCloseButtonText}>✕</Text>
          </TouchableOpacity>
          {previewMedia && (
            <View style={styles.previewContent}>
              {previewMedia.type === "image" ? (
                <Image
                  source={{ uri: previewMedia.uri }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              ) : (
                <Video
                  source={{ uri: previewMedia.uri }}
                  style={styles.previewVideo}
                  useNativeControls
                  resizeMode="contain"
                  isLooping
                  shouldPlay
                />
              )}
            </View>
          )}
        </View>
      </Modal>
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
  },
  loadingText: {
    fontFamily: "Lexend Deca",
    fontSize: 16,
    color: "#64748b",
    marginTop: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 16,
    position: 'relative',
  },
  activeTabItem: {
    borderBottomWidth: 2,
    borderBottomColor: '#5664F5',
  },
  tabButton: {
    alignItems: 'center',
  },
  tabText: {
    fontFamily: "Lexend Deca",
    fontSize: 16,
  },
  activeTabText: {
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.85,
    maxHeight: height * 0.7,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  modalTitle: {
    fontFamily: "Lexend Deca",
    fontSize: 18,
    fontWeight: '700',
    color: "#0f172a",
  },
  closeButton: {
    fontFamily: "Lexend Deca",
    fontSize: 22,
    fontWeight: '700',
    color: '#64748b',
    lineHeight: 26,
  },
  previewModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewCloseButtonText: {
    fontFamily: "Lexend Deca",
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 26,
  },
  previewContent: {
    width: width * 0.85,
    height: height * 0.7,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  previewVideo: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
});

export default KoiList;
