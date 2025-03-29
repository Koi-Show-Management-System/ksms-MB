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
  const [activeSection, setActiveSection] = useState<'myKoi' | 'addNewKoi'>('myKoi');
  
  // Animation values
  const myKoiHeaderOpacity = useState(new Animated.Value(1))[0];
  const addNewKoiHeaderOpacity = useState(new Animated.Value(0.5))[0];
  
  // Toggle section
  const toggleSection = (section: 'myKoi' | 'addNewKoi') => {
    if (section === activeSection) return;
    
    setActiveSection(section);
    
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        {/* Header with gradient background */}
        <LinearGradient
          colors={['#5664F5', '#7D8BFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.push("/")}
            >
              <Text style={styles.headerTitle}>Trang chủ</Text>
            </TouchableOpacity>
            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => alert("Đang phát triển tính năng tìm kiếm")}
              >
                <Image
                  source={{
                    uri: "https://dashboard.codeparrot.ai/api/image/Z79CVK7obB3a4bxY/frame-2.png",
                  }}
                  style={styles.searchIcon}
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.profileButton}
                onPress={() => router.push("/UserProfile")}
              >
                <Image
                  source={{
                    uri: "https://dashboard.codeparrot.ai/api/image/Z79CVK7obB3a4bxY/group-8.png",
                  }}
                  style={styles.profileIcon}
                />
                <BlurView intensity={50} style={styles.profileBadge}>
                  <Text style={styles.profileBadgeText}>Pro</Text>
                </BlurView>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Section Headers with better animation */}
        <View style={styles.sectionToggleContainer}>
          <TouchableOpacity 
            style={styles.sectionToggleButton} 
            onPress={() => toggleSection('myKoi')}
          >
            <Animated.Text 
              style={[
                styles.sectionToggleText, 
                { 
                  opacity: myKoiHeaderOpacity, 
                  color: activeSection === 'myKoi' ? '#5664F5' : '#94a3b8',
                  fontWeight: activeSection === 'myKoi' ? '700' : '400',
                }
              ]}
            >
              Cá Koi của tôi
            </Animated.Text>
            {activeSection === 'myKoi' && (
              <Animated.View 
                style={[
                  styles.activeIndicator,
                  {
                    opacity: myKoiHeaderOpacity
                  }
                ]} 
              />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.sectionToggleButton} 
            onPress={() => toggleSection('addNewKoi')}
          >
            <Animated.Text 
              style={[
                styles.sectionToggleText, 
                { 
                  opacity: addNewKoiHeaderOpacity,
                  color: activeSection === 'addNewKoi' ? '#5664F5' : '#94a3b8',
                  fontWeight: activeSection === 'addNewKoi' ? '700' : '400',
                }
              ]}
            >
              Thêm cá Koi mới
            </Animated.Text>
            {activeSection === 'addNewKoi' && (
              <Animated.View 
                style={[
                  styles.activeIndicator,
                  {
                    opacity: addNewKoiHeaderOpacity
                  }
                ]} 
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Search Filters - Only show in My Koi section */}
        {activeSection === 'myKoi' && (
          <View style={styles.filterShadow}>
            <View style={styles.filterContainer}>
              <View style={styles.searchInputContainer}>
                <Image
                  source={{
                    uri: "https://dashboard.codeparrot.ai/api/image/Z79CVK7obB3a4bxY/frame-2.png",
                  }}
                  style={styles.searchInputIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Tìm kiếm theo tên"
                  value={searchName}
                  onChangeText={setSearchName}
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <TouchableOpacity style={styles.filterButton} onPress={applyFilters}>
                <Text style={styles.filterButtonText}>Tìm</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
                <Text style={styles.resetButtonText}>Đặt lại</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* My Koi Section */}
        {activeSection === 'myKoi' ? (
          <>
            {/* Loading, Error, and Empty States */}
            {isLoading && !isRefreshing && !isLoadingMore ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#5664F5" />
                <Text style={styles.messageText}>Đang tải...</Text>
              </View>
            ) : error ? (
              <View style={styles.centerContainer}>
                <Image 
                  source={{ uri: "https://illustatus.herokuapp.com/?title=Oops!&fill=%234f46e5" }}
                  style={styles.errorImage} 
                />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => fetchKoiProfiles(true)}>
                  <Text style={styles.retryButtonText}>Thử lại</Text>
                </TouchableOpacity>
              </View>
            ) : koiList.length === 0 ? (
              <View style={styles.centerContainer}>
                <Image 
                  source={{ uri: "https://illustatus.herokuapp.com/?title=No%20Koi&fill=%234f46e5" }}
                  style={styles.emptyImage} 
                />
                <Text style={styles.messageText}>Bạn chưa có cá Koi nào. Hãy thêm cá Koi mới!</Text>
                <TouchableOpacity 
                  style={styles.addNewButton}
                  onPress={() => toggleSection('addNewKoi')}
                >
                  <Text style={styles.addNewButtonText}>Thêm cá Koi mới</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Koi List with FlatList for better performance
              <FlatList
                data={koiList}
                renderItem={({ item }) => {
                  // Find the first image media
                  const imageMedia = item.koiMedia?.find(media => media.mediaType === "Image");
                  const imageUrl = imageMedia?.mediaUrl || "https://via.placeholder.com/100";
                  
                  return (
                    <View style={styles.koiCardShadow}>
                      <TouchableOpacity 
                        style={styles.koiCard}
                        onPress={() => {
                          try {
                            // Chuyển sang KoiInformation.tsx với id của cá Koi
                            router.push({
                              pathname: "/KoiInformation",
                              params: { id: item.id }
                            });
                          } catch (error) {
                            console.error("Lỗi khi chuyển trang:", error);
                            Alert.alert("Lỗi", "Không thể mở chi tiết cá Koi");
                          }
                        }}
                      >
                        <Image 
                          source={{ uri: imageUrl }} 
                          style={styles.koiImage}
                          resizeMode="cover"
                        />
                        <View style={styles.koiInfo}>
                          <Text style={styles.koiName}>{item.name}</Text>
                          <View style={styles.koiDetailRow}>
                            <Text style={styles.koiDetailLabel}>Tuổi:</Text>
                            <Text style={styles.koiDetailValue}>{item.age} năm</Text>
                          </View>
                          <View style={styles.koiDetailRow}>
                            <Text style={styles.koiDetailLabel}>Giống:</Text>
                            <Text style={styles.koiDetailValue}>{item.variety?.name}</Text>
                          </View>
                          <View style={styles.koiDetailRow}>
                            <Text style={styles.koiDetailLabel}>Kích thước:</Text>
                            <Text style={styles.koiDetailValue}>{item.size}cm</Text>
                          </View>
                          <View style={styles.koiDetailRow}>
                            <Text style={styles.koiDetailLabel}>Dòng máu:</Text>
                            <Text style={styles.koiDetailValue}>{item.bloodline || "Không có"}</Text>
                          </View>
                          <View style={styles.koiTags}>
                            <View style={[styles.koiTag, item.gender === "Đực" ? styles.maleTag : styles.femaleTag]}>
                              <Text style={styles.koiTagText}>{item.gender}</Text>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                }}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.koiListContainer}
                refreshControl={
                  <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={onRefresh}
                    colors={["#5664F5"]}
                    tintColor="#5664F5"
                  />
                }
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                  isLoadingMore ? (
                    <View style={styles.loadingMore}>
                      <ActivityIndicator size="small" color="#5664F5" />
                      <Text style={styles.loadingMoreText}>Đang tải thêm...</Text>
                    </View>
                  ) : null
                }
              />
            )}
          </>
        ) : (
          // Add New Koi Form (in a ScrollView for forms)
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.formCardShadow}>
                <View style={styles.formCard}>
                  <Text style={styles.formSectionTitle}>Thông tin cơ bản</Text>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Tên cá Koi <Text style={styles.requiredField}>*</Text></Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="Nhập tên cá Koi"
                        placeholderTextColor="#94a3b8"
                        value={newKoi.name}
                        onChangeText={(text) => handleInputChange("name", text)}
                      />
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.formGroup, styles.halfWidth]}>
                      <Text style={styles.label}>Tuổi (năm)</Text>
                      <View style={styles.inputContainer}>
                        <TextInput
                          style={styles.input}
                          placeholder="Nhập tuổi"
                          placeholderTextColor="#94a3b8"
                          value={newKoi.age > 0 ? newKoi.age.toString() : ""}
                          onChangeText={(text) => handleInputChange("age", text)}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                    
                    <View style={[styles.formGroup, styles.halfWidth]}>
                      <Text style={styles.label}>Kích thước (cm) <Text style={styles.requiredField}>*</Text></Text>
                      <View style={styles.inputContainer}>
                        <TextInput
                          style={styles.input}
                          placeholder="Nhập kích thước"
                          placeholderTextColor="#94a3b8"
                          value={newKoi.size > 0 ? newKoi.size.toString() : ""}
                          onChangeText={(text) => handleInputChange("size", text)}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Giống cá Koi <Text style={styles.requiredField}>*</Text></Text>
                    <TouchableOpacity
                      style={styles.dropdownInput}
                      activeOpacity={0.7}
                      onPress={openVarietyModal}
                    >
                      <Text style={[
                        styles.dropdownText,
                        newKoi.variety ? { color: "#0f172a" } : {}
                      ]}>
                        {varieties.find(v => v.id === newKoi.variety)?.name || "Chọn giống cá Koi"}
                      </Text>
                      <Image
                        source={{
                          uri: "https://dashboard.codeparrot.ai/api/image/Z79CVK7obB3a4bxY/frame-4.png",
                        }}
                        style={styles.dropdownIcon}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Giới tính</Text>
                    <View style={styles.genderContainer}>
                      <TouchableOpacity
                        style={[
                          styles.genderOption,
                          newKoi.gender === "Đực" && styles.selectedGender,
                        ]}
                        onPress={() => handleInputChange("gender", "Đực")}>
                        <Text
                          style={[
                            styles.genderText,
                            newKoi.gender === "Đực" && styles.selectedGenderText,
                          ]}>
                          Đực
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.genderOption,
                          newKoi.gender === "Cái" && styles.selectedGender,
                        ]}
                        onPress={() => handleInputChange("gender", "Cái")}>
                        <Text
                          style={[
                            styles.genderText,
                            newKoi.gender === "Cái" && styles.selectedGenderText,
                          ]}>
                          Cái
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Dòng máu</Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="Nhập dòng máu cá Koi"
                        placeholderTextColor="#94a3b8"
                        value={newKoi.bloodline}
                        onChangeText={(text) => handleInputChange("bloodline", text)}
                      />
                    </View>
                  </View>

                  <Text style={styles.infoText}>
                    <Image 
                      source={{ uri: "https://img.icons8.com/material-rounded/24/5664F5/info.png" }}
                      style={styles.infoIcon}
                    />
                    Thông tin sẽ được ban tổ chức xác minh.
                  </Text>
                </View>
              </View>

              <View style={styles.formCardShadow}>
                <View style={styles.formCard}>
                  <Text style={styles.formSectionTitle}>Mô tả chi tiết</Text>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Mô tả cá Koi</Text>
                    <View style={styles.textAreaContainer}>
                      <TextInput
                        style={styles.textArea}
                        multiline
                        numberOfLines={4}
                        placeholder="Mô tả về cá Koi của bạn"
                        placeholderTextColor="#94a3b8"
                        value={newKoi.description}
                        onChangeText={(text) => handleInputChange("description", text)}
                        textAlignVertical="top"
                      />
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.formCardShadow}>
                <View style={styles.formCard}>
                  <Text style={styles.formSectionTitle}>Hình ảnh và Video</Text>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Tải ảnh cá Koi <Text style={styles.requiredField}>*</Text></Text>
                    {newKoi.images.length > 0 ? (
                      <View style={styles.uploadedMediaContainer}>
                        {newKoi.images.map((image, index) => (
                          <View key={`image-${index}`} style={styles.uploadedMediaItem}>
                            <Image
                              source={{ uri: image.uri }}
                              style={styles.uploadedImage}
                              resizeMode="cover"
                            />
                            <TouchableOpacity 
                              style={styles.removeMediaButton}
                              onPress={() => handleRemoveImage(index)}
                            >
                              <Text style={styles.removeMediaButtonText}>×</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                        
                        {newKoi.images.length < 3 && (
                          <TouchableOpacity 
                            style={styles.addMoreMediaButton}
                            onPress={handleImageUpload}
                          >
                            <LinearGradient
                              colors={['#5664F5', '#7D8BFF']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={styles.addMoreMediaGradient}
                            >
                              <Text style={styles.addMoreMediaButtonText}>Thêm ảnh</Text>
                            </LinearGradient>
                          </TouchableOpacity>
                        )}
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.uploadBox}
                        onPress={handleImageUpload}
                      >
                        <Image
                          source={{
                            uri: "https://dashboard.codeparrot.ai/api/image/Z79CVK7obB3a4bxY/frame-3.png",
                          }}
                          style={styles.uploadIcon}
                        />
                        <Text style={styles.uploadText}>Tải ảnh cá Koi lên</Text>
                      </TouchableOpacity>
                    )}
                    
                    <Text style={styles.helperText}>
                      <Image 
                        source={{ uri: "https://img.icons8.com/material-rounded/24/5664F5/info.png" }}
                        style={[styles.infoIcon, { marginRight: 4 }]}
                      />
                      Nên chụp ảnh dọc và ảnh chất lượng cao. Chấp nhận file jpg hoặc png. Kích thước tối thiểu: 320px x 500px. Tối đa 3 ảnh.
                    </Text>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Tải video cá Koi</Text>
                    {newKoi.videos.length > 0 ? (
                      <View style={styles.uploadedMediaContainer}>
                        {newKoi.videos.map((video, index) => (
                          <View key={`video-${index}`} style={styles.videoContainer}>
                            <View style={styles.videoUploaded}>
                              <Image
                                source={{ uri: "https://img.icons8.com/material-rounded/24/5664F5/video.png" }}
                                style={styles.videoIcon}
                              />
                              <View style={styles.videoInfoContainer}>
                                <Text style={styles.videoUploadedText}>Video đã tải lên</Text>
                                <Text style={styles.videoUploadedName} numberOfLines={1} ellipsizeMode="middle">
                                  {video.name}
                                </Text>
                              </View>
                            </View>
                            <TouchableOpacity 
                              style={styles.removeMediaButton}
                              onPress={() => handleRemoveVideo(index)}
                            >
                              <Text style={styles.removeMediaButtonText}>×</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                        
                        {newKoi.videos.length < 2 && (
                          <TouchableOpacity 
                            style={styles.addMoreMediaButton}
                            onPress={handleVideoUpload}
                          >
                            <LinearGradient
                              colors={['#5664F5', '#7D8BFF']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={styles.addMoreMediaGradient}
                            >
                              <Text style={styles.addMoreMediaButtonText}>Thêm video</Text>
                            </LinearGradient>
                          </TouchableOpacity>
                        )}
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.uploadBox}
                        onPress={handleVideoUpload}
                      >
                        <Image
                          source={{
                            uri: "https://dashboard.codeparrot.ai/api/image/Z79CVK7obB3a4bxY/frame-8.png",
                          }}
                          style={styles.uploadIcon}
                        />
                        <Text style={styles.uploadText}>Tải video cá Koi lên</Text>
                      </TouchableOpacity>
                    )}
                    
                    <Text style={styles.helperText}>
                      <Image 
                        source={{ uri: "https://img.icons8.com/material-rounded/24/5664F5/info.png" }}
                        style={[styles.infoIcon, { marginRight: 4 }]}
                      />
                      Video được chấp nhận tối đa 10 phút và không quá 100MB. Tối đa 2 video.
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.addButton} onPress={handleAddKoi}>
                  <LinearGradient
                    colors={['#5664F5', '#7D8BFF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.addButtonText}>Thêm</Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => toggleSection('myKoi')}
                >
                  <Text style={styles.cancelButtonText}>Hủy</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        )}

        {/* Modal cho việc chọn giống cá Koi */}
        <Modal
          visible={showVarietyModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowVarietyModal(false)}
        >
          <BlurView intensity={90} style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chọn giống cá Koi</Text>
                <TouchableOpacity 
                  style={styles.closeButtonContainer}
                  onPress={() => setShowVarietyModal(false)}
                >
                  <Text style={styles.closeButton}>×</Text>
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={varieties}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.varietyItem}
                    onPress={() => selectVariety(item.id)}
                  >
                    <Text style={styles.varietyName}>{item.name}</Text>
                    <Text style={styles.varietyDescription}>{item.description}</Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.varietyList}
                showsVerticalScrollIndicator={true}
              />
            </View>
          </BlurView>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#F7F9FC", // Sử dụng màu nền sáng hơn
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchIcon: {
    width: 18,
    height: 18,
    tintColor: '#FFFFFF',
  },
  profileButton: {
    position: 'relative',
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  profileBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionToggleContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionToggleButton: {
    paddingVertical: 16,
    marginRight: 24,
    position: 'relative',
  },
  sectionToggleText: {
    fontFamily: "Lexend Deca",
    fontSize: 16,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#5664F5',
    borderRadius: 1.5,
  },
  filterShadow: {
    width: '100%',
    marginTop: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginHorizontal: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInputIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
    tintColor: '#94a3b8',
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontFamily: "Lexend Deca",
    fontSize: 14,
    color: '#1e293b',
  },
  filterButton: {
    backgroundColor: "#5664F5",
    height: 40,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginRight: 8,
    elevation: 2,
    shadowColor: '#5664F5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  filterButtonText: {
    fontFamily: "Lexend Deca",
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: "#f8fafc",
    height: 40,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  resetButtonText: {
    fontFamily: "Lexend Deca",
    fontSize: 14,
    color: "#64748b",
    fontWeight: '600',
  },
  koiListContainer: {
    padding: 16,
    paddingBottom: 80, // Thêm padding để tránh bị che bởi footer
  },
  koiCardShadow: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    backgroundColor: '#FFFFFF', // Thêm màu nền cho Android elevation
  },
  koiCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  koiImage: {
    width: 120,
    height: 160,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  koiInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  koiName: {
    fontFamily: "Lexend Deca",
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 10,
  },
  koiDetailRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  koiDetailLabel: {
    fontFamily: "Lexend Deca",
    fontSize: 13,
    color: "#64748b",
    width: 80,
  },
  koiDetailValue: {
    fontFamily: "Lexend Deca",
    fontSize: 13,
    fontWeight: '500',
    color: "#334155",
    flex: 1,
  },
  koiTags: {
    flexDirection: 'row',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  koiTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  maleTag: {
    backgroundColor: '#dbeafe',
  },
  femaleTag: {
    backgroundColor: '#fce7f3',
  },
  koiTagText: {
    fontFamily: "Lexend Deca",
    fontSize: 12,
    fontWeight: '600',
    color: '#1e3a8a',
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorImage: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  emptyImage: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  messageText: {
    fontFamily: "Lexend Deca",
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginVertical: 16,
    lineHeight: 22,
  },
  errorText: {
    fontFamily: "Lexend Deca",
    fontSize: 16,
    color: "#ef4444",
    textAlign: "center",
    marginVertical: 16,
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#5664F5",
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#5664F5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  retryButtonText: {
    fontFamily: "Lexend Deca",
    fontSize: 14,
    fontWeight: '600',
    color: "#FFFFFF",
  },
  loadingMore: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  loadingMoreText: {
    fontFamily: "Lexend Deca",
    fontSize: 14,
    color: "#64748b",
    marginLeft: 8,
  },
  addNewButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#5664F5',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#5664F5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  addNewButtonText: {
    fontFamily: "Lexend Deca",
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  footerBlur: {
    flex: 1,
    overflow: 'hidden',
  },
  footer: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  footerItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  footerIcon: {
    width: 24,
    height: 24,
    tintColor: '#64748b',
  },
  footerText: {
    fontFamily: "Lexend Deca",
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  footerCameraButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerCameraCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#5664F5',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#5664F5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  footerCameraIcon: {
    width: 24,
    height: 24,
    tintColor: '#FFFFFF',
  },
  formContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  formCardShadow: {
    width: '100%',
    marginBottom: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    backgroundColor: '#FFFFFF', // Thêm màu nền cho Android elevation
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  formSectionTitle: {
    fontFamily: "Lexend Deca",
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: -6,
  },
  halfWidth: {
    width: '50%',
    paddingHorizontal: 6,
  },
  label: {
    fontFamily: "Lexend Deca",
    fontSize: 14,
    fontWeight: '500',
    color: "#334155",
    marginBottom: 8,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: "#D0D3F5",
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  input: {
    height: 40,
    paddingHorizontal: 12,
    fontFamily: "Lexend Deca",
    fontSize: 14,
    color: "#0f172a",
  },
  dropdownInput: {
    height: 40,
    borderWidth: 1,
    borderColor: "#D0D3F5",
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: '#FFFFFF',
  },
  dropdownText: {
    fontFamily: "Lexend Deca",
    fontSize: 14,
    color: "#94a3b8",
  },
  dropdownIcon: {
    width: 14,
    height: 14,
    tintColor: '#64748b',
  },
  textAreaContainer: {
    borderWidth: 1,
    borderColor: "#D0D3F5",
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 100,
    paddingHorizontal: 12,
    paddingTop: 12,
    fontFamily: "Lexend Deca",
    fontSize: 14,
    color: "#0f172a",
  },
  infoText: {
    fontFamily: "Lexend Deca",
    fontSize: 12,
    color: "#5664F5",
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    width: 14,
    height: 14,
    marginRight: 6,
  },
  genderContainer: {
    flexDirection: "row",
  },
  genderOption: {
    flex: 1,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D0D3F5",
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  genderText: {
    fontFamily: "Lexend Deca",
    fontSize: 14,
    color: "#64748b",
    fontWeight: '500',
  },
  selectedGender: {
    backgroundColor: "#5664F5",
    borderColor: "#5664F5",
  },
  selectedGenderText: {
    color: "#FFFFFF",
    fontWeight: '600',
  },
  uploadBox: {
    height: 150,
    borderWidth: 1,
    borderColor: "#D0D3F5",
    borderRadius: 12,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    overflow: 'hidden',
  },
  uploadIcon: {
    width: 40,
    height: 40,
    tintColor: '#5664F5',
    marginBottom: 12,
  },
  uploadText: {
    fontFamily: "Lexend Deca",
    fontSize: 14,
    color: "#64748b",
  },
  helperText: {
    fontFamily: "Lexend Deca",
    fontSize: 12,
    color: "#5664F5",
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadedMediaContainer: {
    width: '100%',
  },
  uploadedMediaItem: {
    position: 'relative',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    height: 200,
    backgroundColor: '#f1f1f1',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  videoContainer: {
    position: 'relative',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  videoUploaded: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  videoIcon: {
    width: 32,
    height: 32,
    marginRight: 12,
    tintColor: '#5664F5',
  },
  videoInfoContainer: {
    flex: 1,
  },
  videoUploadedText: {
    fontFamily: "Lexend Deca",
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 4,
  },
  videoUploadedName: {
    fontFamily: "Lexend Deca",
    fontSize: 14,
    color: "#64748b",
  },
  removeMediaButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  removeMediaButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  addMoreMediaButton: {
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
  },
  addMoreMediaGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMoreMediaButtonText: {
    fontFamily: "Lexend Deca",
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonContainer: {
    marginTop: 16,
    marginBottom: 40,
  },
  addButton: {
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#5664F5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontFamily: "Lexend Deca",
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cancelButton: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cancelButtonText: {
    fontFamily: "Lexend Deca",
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
  },
  requiredField: {
    color: '#ef4444',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
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
  closeButtonContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  closeButton: {
    fontFamily: "Lexend Deca",
    fontSize: 22,
    fontWeight: '700',
    color: '#64748b',
    lineHeight: 26,
  },
  varietyList: {
    padding: 8,
  },
  varietyItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  varietyName: {
    fontFamily: "Lexend Deca",
    fontSize: 16,
    fontWeight: '600',
    color: "#334155",
    marginBottom: 4,
  },
  varietyDescription: {
    fontFamily: "Lexend Deca",
    fontSize: 14,
    color: '#64748b',
  },
});

export default KoiList;
