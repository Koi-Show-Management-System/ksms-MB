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
} from "react-native";
import { getKoiProfiles, KoiProfile, getVarieties, Variety, createKoiProfile } from "../../services/koiProfileService";
import { router, useRouter } from "expo-router";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

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

  // Render koi card
  const renderKoiCard = ({ item }: { item: KoiProfile }) => {
    // Find the first image media
    const imageMedia = item.koiMedia?.find(media => media.mediaType === "Image");
    const imageUrl = imageMedia?.mediaUrl || "https://via.placeholder.com/100";
    
    return (
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
        <Image source={{ uri: imageUrl }} style={styles.koiImage} />
        <View style={styles.koiInfo}>
          <Text style={styles.koiName}>{item.name}</Text>
          <Text style={styles.koiDetail}>Tuổi: {item.age} năm</Text>
          <Text style={styles.koiDetail}>Giống: {item.variety?.name}</Text>
          <Text style={styles.koiDetail}>Kích thước: {item.size}cm</Text>
          <Text style={styles.koiDetail}>Dòng máu: {item.bloodline}</Text>
          <Text style={styles.koiDetail}>Giới tính: {item.gender}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/")}>
          <Text style={styles.headerTitle}>Trang chủ</Text>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => alert("Đang phát triển tính năng tìm kiếm")}>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z79CVK7obB3a4bxY/frame-2.png",
              }}
              style={styles.searchIcon}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/UserProfile")}>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z79CVK7obB3a4bxY/group-8.png",
              }}
              style={styles.profileIcon}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Section Headers */}
      <View style={styles.sectionToggleContainer}>
        <TouchableOpacity 
          style={styles.sectionToggleButton} 
          onPress={() => toggleSection('myKoi')}
        >
          <Animated.Text 
            style={[
              styles.sectionToggleText, 
              { opacity: myKoiHeaderOpacity, 
                color: activeSection === 'myKoi' ? '#5664F5' : '#666',
                fontWeight: activeSection === 'myKoi' ? '700' : '400',
              }
            ]}
          >
            Cá Koi của tôi
          </Animated.Text>
          {activeSection === 'myKoi' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.sectionToggleButton} 
          onPress={() => toggleSection('addNewKoi')}
        >
          <Animated.Text 
            style={[
              styles.sectionToggleText, 
              { opacity: addNewKoiHeaderOpacity,
                color: activeSection === 'addNewKoi' ? '#5664F5' : '#666',
                fontWeight: activeSection === 'addNewKoi' ? '700' : '400',
              }
            ]}
          >
            Thêm cá Koi mới
          </Animated.Text>
          {activeSection === 'addNewKoi' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Search Filters - Only show in My Koi section */}
      {activeSection === 'myKoi' && (
        <View style={styles.filterContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm theo tên"
            value={searchName}
            onChangeText={setSearchName}
          />
          <TouchableOpacity style={styles.filterButton} onPress={applyFilters}>
            <Text style={styles.filterButtonText}>Tìm</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
            <Text style={styles.resetButtonText}>Đặt lại</Text>
          </TouchableOpacity>
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
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => fetchKoiProfiles(true)}>
                <Text style={styles.retryButtonText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : koiList.length === 0 ? (
            <View style={styles.centerContainer}>
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
              renderItem={renderKoiCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.koiListContainer}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={onRefresh}
                  colors={["#5664F5"]}
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
        <ScrollView style={styles.formContainer}>
          <Text style={styles.label}>Tên cá Koi</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập tên cá Koi"
            placeholderTextColor="#94a3b8"
            value={newKoi.name}
            onChangeText={(text) => handleInputChange("name", text)}
          />

          <Text style={styles.label}>Tuổi cá Koi</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập tuổi (năm)"
            placeholderTextColor="#94a3b8"
            value={newKoi.age > 0 ? newKoi.age.toString() : ""}
            onChangeText={(text) => handleInputChange("age", text)}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Kích thước cá Koi (cm)</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập kích thước cá Koi (cm)"
            placeholderTextColor="#94a3b8"
            value={newKoi.size > 0 ? newKoi.size.toString() : ""}
            onChangeText={(text) => handleInputChange("size", text)}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Giống cá Koi <Text style={styles.requiredField}>*</Text></Text>
          <TouchableOpacity
            style={styles.dropdownInput}
            activeOpacity={0.7}
            onPress={openVarietyModal}
          >
            <Text style={[
              styles.placeholderText,
              newKoi.variety ? { color: "#030303" } : {}
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

          <Text style={styles.label}>Dòng máu</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập dòng máu cá Koi"
            placeholderTextColor="#94a3b8"
            value={newKoi.bloodline}
            onChangeText={(text) => handleInputChange("bloodline", text)}
          />

          <Text style={styles.infoText}>
            Thông tin sẽ được ban tổ chức xác minh.
          </Text>

          <Text style={styles.label}>Mô tả cá Koi</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={4}
            placeholder="Mô tả về cá Koi của bạn"
            placeholderTextColor="#94a3b8"
            value={newKoi.description}
            onChangeText={(text) => handleInputChange("description", text)}
          />

          <Text style={styles.label}>Tải ảnh cá Koi</Text>
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
                    <Text style={styles.removeMediaButtonText}>X</Text>
                  </TouchableOpacity>
                </View>
              ))}
              
              {newKoi.images.length < 3 && (
                <TouchableOpacity 
                  style={styles.addMoreMediaButton}
                  onPress={handleImageUpload}
                >
                  <Text style={styles.addMoreMediaButtonText}>Thêm ảnh</Text>
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
            </TouchableOpacity>
          )}
          
          <Text style={styles.helperText}>
            Nên chụp ảnh dọc và ảnh chất lượng cao. Chấp nhận file jpg hoặc png. Kích thước tối thiểu: 320px x 500px. Tối đa 3 ảnh.
          </Text>

          <Text style={styles.label}>Tải video cá Koi</Text>
          {newKoi.videos.length > 0 ? (
            <View style={styles.uploadedMediaContainer}>
              {newKoi.videos.map((video, index) => (
                <View key={`video-${index}`} style={styles.uploadedMediaItem}>
                  <View style={styles.videoUploaded}>
                    <Text style={styles.videoUploadedText}>Video đã tải lên</Text>
                    <Text style={styles.videoUploadedName}>{video.name}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.removeMediaButton}
                    onPress={() => handleRemoveVideo(index)}
                  >
                    <Text style={styles.removeMediaButtonText}>X</Text>
                  </TouchableOpacity>
                </View>
              ))}
              
              {newKoi.videos.length < 2 && (
                <TouchableOpacity 
                  style={styles.addMoreMediaButton}
                  onPress={handleVideoUpload}
                >
                  <Text style={styles.addMoreMediaButtonText}>Thêm video</Text>
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
            </TouchableOpacity>
          )}
          
          <Text style={styles.helperText}>
            Video được chấp nhận tối đa 10 phút và không quá 100MB. Tối đa 2 video.
          </Text>

          <TouchableOpacity style={styles.addButton} onPress={handleAddKoi}>
            <Text style={styles.addButtonText}>Thêm</Text>
          </TouchableOpacity>
          
          {/* Thành công thêm mới thì chuyển qua tab My Koi */}
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={() => toggleSection('myKoi')}
          >
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Modal cho việc chọn giống cá Koi */}
      <Modal
        visible={showVarietyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowVarietyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn giống cá Koi</Text>
              <TouchableOpacity onPress={() => setShowVarietyModal(false)}>
                <Text style={styles.closeButton}>X</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={varieties}
              renderItem={renderVarietyItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.varietyList}
              showsVerticalScrollIndicator={true}
            />
          </View>
        </View>
      </Modal>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => router.push("/")}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z79CVK7obB3a4bxY/frame-5.png",
            }}
            style={styles.footerIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/Notification")}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z79CVK7obB3a4bxY/frame-7.png",
            }}
            style={styles.footerIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => alert("Đang phát triển tính năng camera")}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z79CVK7obB3a4bxY/frame-6.png",
            }}
            style={styles.footerIcon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#FFFFFF",
  },
  header: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 20, // Add top margin
  },
  headerTitle: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "700",
    color: "#030303",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  searchIcon: {
    width: 18, // Increased
    height: 18, // Increased
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  sectionToggleContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    marginBottom: 16,
  },
  sectionToggleButton: {
    paddingVertical: 12,
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
  koiList: {
    paddingHorizontal: 16,
    gap: 16,
  },
  koiCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  koiImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  koiInfo: {
    marginLeft: 16,
    justifyContent: "center",
    flex: 1, // Allow text to take up remaining space
  },
  koiName: {
    fontFamily: "Lexend Deca",
    fontSize: 18,
    fontWeight: "700",
    color: "#030303",
  },
  koiDetail: {
    fontFamily: "Lexend Deca",
    fontSize: 14,
    color: "#030303",
    marginTop: 4,
  },
  formContainer: {
    padding: 16,
  },
  formTitle: {
    fontFamily: "Poppins",
    fontSize: 24,
    fontWeight: "400",
    color: "#030303",
    marginBottom: 24,
  },
  label: {
    fontFamily: "Lexend Deca",
    fontSize: 14,
    color: "#030303",
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: "#D0D3F5",
    borderRadius: 8, // Increased border radius
    paddingHorizontal: 12,
    marginBottom: 16,
    fontFamily: "Lexend Deca",
    fontSize: 14,
    color: "#030303", // Changed text color
  },
  dropdownInput: {
    height: 40,
    borderWidth: 1,
    borderColor: "#D0D3F5",
    borderRadius: 8, // Increased border radius
    paddingHorizontal: 12,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  placeholderText: {
    color: "#A9A9A9",
    fontFamily: "Lexend Deca",
    fontSize: 14,
  },
  dropdownIcon: {
    width: 14,
    height: 14,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  infoText: {
    fontFamily: "Roboto",
    fontSize: 10,
    color: "#5664F5",
    marginBottom: 16,
  },
  uploadBox: {
    height: 150,
    borderWidth: 1,
    borderColor: "#D0D3F5",
    borderRadius: 8, // Increased border radius
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    backgroundColor: "#f8f8f8", // Light background
    overflow: 'hidden',
  },
  uploadedImage: {
    width: '100%',
    height: '100%', // Sử dụng 100% của parent container
    borderRadius: 8,
  },
  uploadIcon: {
    width: 30,
    height: 30,
  },
  helperText: {
    fontFamily: "Roboto",
    fontSize: 10,
    color: "#5664F5",
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: "#000000",
    borderRadius: 8, // Increased border radius
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 32,
  },
  addButtonText: {
    fontFamily: "Lexend Deca",
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  footer: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  footerIcon: {
    width: 28, // Increased
    height: 28, // Increased
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  messageText: {
    fontFamily: "Lexend Deca",
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
  },
  errorText: {
    fontFamily: "Lexend Deca",
    fontSize: 16,
    color: "#e53e3e",
    textAlign: "center",
    marginTop: 10,
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#5664F5",
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: "Lexend Deca",
    fontSize: 14,
    color: "#FFFFFF",
  },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
    marginTop: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#D0D3F5",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    fontFamily: "Lexend Deca",
    fontSize: 14,
  },
  filterButton: {
    backgroundColor: "#5664F5",
    height: 40,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginRight: 8,
  },
  filterButtonText: {
    fontFamily: "Lexend Deca",
    fontSize: 14,
    color: "#FFFFFF",
  },
  resetButton: {
    backgroundColor: "#f3f4f6",
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
  },
  koiListContainer: {
    padding: 16,
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
    color: "#666",
    marginLeft: 8,
  },
  genderContainer: {
    flexDirection: "row",
    marginBottom: 16,
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
  },
  genderText: {
    fontFamily: "Lexend Deca",
    fontSize: 14,
    color: "#666",
  },
  selectedGender: {
    backgroundColor: "#5664F5",
    borderColor: "#5664F5",
  },
  selectedGenderText: {
    color: "#FFFFFF",
  },
  videoUploaded: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 120, // Thêm chiều cao cố định cho video container
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    padding: 16,
  },
  videoUploadedText: {
    fontFamily: "Lexend Deca",
    fontSize: 16,
    fontWeight: "700",
    color: "#5664F5",
    marginBottom: 8,
  },
  videoUploadedName: {
    fontFamily: "Lexend Deca",
    fontSize: 14,
    color: "#666",
  },
  addNewButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#5664F5',
    borderRadius: 8,
  },
  addNewButtonText: {
    fontFamily: "Lexend Deca",
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
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
    color: '#e53e3e',
    fontWeight: '700',
  },
  // Styles cho modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
    maxHeight: height * 0.7,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  modalTitle: {
    fontFamily: "Lexend Deca",
    fontSize: 18,
    fontWeight: '600',
    color: '#030303',
  },
  closeButton: {
    fontFamily: "Lexend Deca",
    fontSize: 18,
    fontWeight: '700',
    color: '#666',
    padding: 5,
  },
  varietyList: {
    padding: 16,
  },
  varietyItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  varietyName: {
    fontFamily: "Lexend Deca",
    fontSize: 16,
    fontWeight: '600',
    color: '#030303',
    marginBottom: 4,
  },
  varietyDescription: {
    fontFamily: "Lexend Deca",
    fontSize: 14,
    color: '#666',
  },
  uploadedMediaContainer: {
    width: '100%',
    marginBottom: 8,
  },
  uploadedMediaItem: {
    position: 'relative',
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    height: 200, // Thêm chiều cao cố định
    backgroundColor: '#f1f1f1',
  },
  removeMediaButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1, // Đảm bảo nút xóa luôn ở trên cùng
  },
  removeMediaButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  addMoreMediaButton: {
    height: 48,
    backgroundColor: '#000000',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  addMoreMediaButtonText: {
    fontFamily: "Lexend Deca",
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default KoiList;
