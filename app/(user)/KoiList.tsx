import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import { BlurView } from "expo-blur";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  createKoiProfile,
  getKoiProfiles,
  getVarieties,
  KoiProfile,
  Variety,
} from "../../services/koiProfileService";

// Thêm hằng số kích thước màn hình
const { width, height } = Dimensions.get("window");

// Define a default image URL
const DEFAULT_KOI_IMAGE = "https://via.placeholder.com/100";

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
  const [selectedKoi, setSelectedKoi] = useState<KoiProfile | null>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState<boolean>(false);
  const [previewMedia, setPreviewMedia] = useState<{
    uri: string;
    type: "image" | "video";
  } | null>(null);

  const [newKoi, setNewKoi] = useState<{
    name: string;
    age: number;
    size: number;
    variety: string;
    gender: string;
    bloodline: string;
    images: any[];
    videos: any[];
  }>({
    name: "",
    age: 0,
    size: 0,
    variety: "",
    gender: "Đực",
    bloodline: "",
    images: [],
    videos: [],
  });

  // State để quản lý section nào đang được chọn
  const [activeTab, setActiveTab] = useState<"myKoi" | "addNewKoi">("myKoi");

  // Animation values
  const myKoiHeaderOpacity = useState(new Animated.Value(1))[0];
  const addNewKoiHeaderOpacity = useState(new Animated.Value(0.5))[0];

  // Helper function to find the first image URL in the media array
  const findFirstImage = (mediaArray: any[]): string | null => {
    if (!mediaArray || !Array.isArray(mediaArray) || mediaArray.length === 0) {
      return null;
    }
    // Find the first item that has mediaType 'Image'
    const firstImage = mediaArray.find(
      (media) => media && media.mediaType === "Image"
    );
    return firstImage ? firstImage.mediaUrl : null;
  };

  // Toggle section
  const toggleSection = (section: "myKoi" | "addNewKoi") => {
    if (section === activeTab) return;

    setActiveTab(section);

    // Animation
    if (section === "myKoi") {
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

  // Render koi card (Updated version based on FlatList renderItem)
  const renderKoiCard = ({ item }: { item: KoiProfile }) => {
    // Lấy ảnh đầu tiên nếu có, nếu không dùng ảnh mặc định
    const imageUrl = findFirstImage(item.koiMedia) || DEFAULT_KOI_IMAGE;

    // Chuẩn bị các giá trị text để tránh lỗi text ngoài <Text>
    const ageText = `${item.age} năm`;
    const varietyText = item.variety?.name || "Không có";
    const sizeText = `${item.size}cm`;
    const bloodlineText = item.bloodline || "Không có";
    const genderText = item.gender;

    return (
      <View style={styles.koiCardContainer}>
        <TouchableOpacity
          style={styles.koiCardModern}
          onPress={() => {
            console.log(`Navigating to KoiInformation with ID: ${item.id}`);
            router.push({
              pathname: "/(user)/KoiInformation",
              params: { id: item.id },
            });
          }}>
          <View style={styles.koiCardContent}>
            {/* Cột 1: Ảnh */}
            <View style={styles.koiImageColumn}>
              <Image
                source={{ uri: imageUrl }}
                style={styles.koiImage}
                resizeMode="cover"
              />
            </View>
            
            {/* Cột 2: Thông tin */}
            <View style={styles.koiInfoColumn}>
              <Text style={styles.koiNameHorizontal} numberOfLines={1}>
                {item.name}
              </Text>
              
              <View style={styles.koiInfoHeader}>
                <View style={[
                  styles.koiTagModern,
                  genderText === "Đực" ? styles.maleTagModern : styles.femaleTagModern,
                ]}>
                  <Text style={styles.koiTagTextModern}>{genderText}</Text>
                </View>
                
                <View style={styles.koiSizeTag}>
                  <Text style={styles.koiSizeText}>{sizeText}</Text>
                </View>
              </View>
              
              <View style={styles.koiDetailsContainer}>
                <View style={styles.koiDetailItemModern}>
                  <Text style={styles.koiDetailLabelModern}>Tuổi</Text>
                  <Text style={styles.koiDetailValueModern}>{ageText}</Text>
                </View>
                
                <View style={styles.koiDetailItemModern}>
                  <Text style={styles.koiDetailLabelModern}>Giống</Text>
                  <Text style={styles.koiDetailValueModern} numberOfLines={1}>
                    {varietyText}
                  </Text>
                </View>
                
                <View style={styles.koiDetailItemModern}>
                  <Text style={styles.koiDetailLabelModern}>Dòng máu</Text>
                  <Text style={styles.koiDetailValueModern} numberOfLines={1}>
                    {bloodlineText}
                  </Text>
                </View>
              </View>
              
              <View style={styles.viewDetailsButton}>
                <Text style={styles.viewDetailsText}>Xem chi tiết</Text>
                <Ionicons name="chevron-forward" size={16} color="#5664F5" />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // Fetch koi profiles với retry logic
  const fetchKoiProfiles = useCallback(
    async (refresh = false, retryCount = 0) => {
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
          size: 10000,
          name: searchName || undefined,
          varietyIds:
            selectedVarietyIds.length > 0 ? selectedVarietyIds : undefined,
          startSize,
          endSize,
        });

        const response = await getKoiProfiles({
          page: currentPage,
          size: 10000,
          name: searchName || undefined,
          varietyIds:
            selectedVarietyIds.length > 0 ? selectedVarietyIds : undefined,
          startSize,
          endSize,
        });

        if (response.statusCode === 200) {
          console.log(`Nhận được ${response.data.items.length} cá Koi từ API`);
          const newKoiList = response.data.items;
          
          // Lọc bỏ các ID trùng lặp trước khi cập nhật state
          if (refresh || currentPage === 1) {
            // Đảm bảo không có ID trùng lặp trong danh sách mới
            const uniqueKoiList = Array.from(new Map(newKoiList.map(item => [item.id, item])).values());
            console.log(`Sau khi lọc còn ${uniqueKoiList.length} cá Koi duy nhất`);
            setKoiList(uniqueKoiList);
          } else {
            // Kết hợp danh sách cũ và mới, loại bỏ trùng lặp
            setKoiList((prev) => {
              const combinedList = [...prev, ...newKoiList];
              const uniqueCombinedList = Array.from(new Map(combinedList.map(item => [item.id, item])).values());
              console.log(`Sau khi kết hợp và lọc còn ${uniqueCombinedList.length} cá Koi duy nhất`);
              return uniqueCombinedList;
            });
          }
          
          setTotalPages(response.data.totalPages);
          setError(null);
        } else {
          console.error("API trả về lỗi:", response);
          setError(
            `Không thể tải danh sách cá Koi: ${
              response.message || "Lỗi không xác định"
            }`
          );
        }
      } catch (err: unknown) {
        console.error("Lỗi khi fetch Koi profiles:", err);

        // Thử lại nếu thất bại và chưa đạt đến giới hạn retry
        if (retryCount < 2) {
          console.log(`Đang thử lại lần ${retryCount + 1}...`);
          setTimeout(() => fetchKoiProfiles(refresh, retryCount + 1), 1000);
          return;
        }

        setError(
          `Đã xảy ra lỗi khi tải danh sách cá Koi: ${
            err instanceof Error ? err.message : "Lỗi không xác định"
          }`
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [page, searchName, selectedVarietyIds, startSize, endSize]
  );

  // Fetch varieties với retry logic
  const fetchVarieties = useCallback(async (retryCount = 0) => {
    try {
      console.log("Đang gọi API lấy danh sách giống cá Koi...");
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
      setPage((prevPage) => prevPage + 1);
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
    console.log(
      "Dữ liệu cá Koi trước khi validation:",
      JSON.stringify(newKoi, null, 2)
    );

    // Basic validation
    if (!newKoi.name || !newKoi.variety || newKoi.size <= 0) {
      console.log("DEBUG: Validation thất bại - Thiếu thông tin bắt buộc");
      console.log(`Tên: ${newKoi.name ? "OK" : "Thiếu"}`);
      console.log(`Giống: ${newKoi.variety ? "OK" : "Thiếu"}`);
      console.log(
        `Kích thước: ${newKoi.size > 0 ? "OK" : "Thiếu hoặc không hợp lệ"}`
      );

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

    // Hiển thị cảnh báo về các trường không thể thay đổi sau khi tạo
    Alert.alert(
      "Lưu ý quan trọng",
      "Sau khi tạo, các thông tin: Tên, Giới tính và Dòng máu sẽ KHÔNG THỂ thay đổi. Bạn có chắc chắn muốn tiếp tục?",
      [
        {
          text: "Xem lại",
          style: "cancel",
        },
        {
          text: "Tiếp tục",
          onPress: () => confirmAddKoi(),
        },
      ]
    );
    return;
  };

  // Hàm xác nhận thêm Koi sau khi đã cảnh báo
  const confirmAddKoi = () => {
    // Create a new FormData instance
    const formData = new FormData();
    formData.append("Name", newKoi.name);
    formData.append("Age", newKoi.age.toString());
    formData.append("Size", newKoi.size.toString());
    formData.append("VarietyId", newKoi.variety);
    formData.append("Gender", newKoi.gender);
    formData.append("Bloodline", newKoi.bloodline);

    // Thêm trường Status với giá trị mặc định là "active"
    formData.append("Status", "active");
    console.log("DEBUG: Đã thêm trường Status với giá trị 'active'");

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
      formData._parts.forEach((part) => {
        const [key, value] = part;
        if (typeof value === "object" && value !== null) {
          formDataKeys.push(`${key}: ${value.name || "Object"}`);
        } else {
          formDataKeys.push(`${key}: ${value}`);
        }
      });
    }
    console.log("FormData keys:", formDataKeys);

    Alert.alert("Xác nhận", "Bạn có chắc chắn muốn thêm cá Koi này?", [
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
            console.log(
              `DEBUG: API request hoàn thành trong ${endTime - startTime}ms`
            );

            console.log(
              "DEBUG: Kết quả từ API:",
              JSON.stringify(response, null, 2)
            );

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
                images: [],
                videos: [],
              });

              // Refresh the koi list
              onRefresh();

              // Show success message
              Alert.alert("Thành công", "Cá Koi đã được thêm!");
            } else {
              console.error("DEBUG: API trả về lỗi:", response.message);
              Alert.alert(
                "Lỗi",
                `Không thể thêm cá Koi: ${
                  response.message || "Lỗi không xác định"
                }`
              );
            }
          } catch (error: unknown) {
            console.error("DEBUG: Lỗi khi thêm cá Koi:", error);
            console.error(
              "DEBUG: Chi tiết lỗi:",
              error instanceof Error ? error.stack : "Không có stack trace"
            );

            // Log thêm thông tin về response nếu có
            if (error && typeof error === "object" && "response" in error) {
              const errorWithResponse = error as {
                response?: { status?: number; data?: any };
              };
              if (errorWithResponse.response) {
                console.error(
                  "DEBUG: Response status:",
                  errorWithResponse.response.status
                );
                console.error(
                  "DEBUG: Response data:",
                  JSON.stringify(errorWithResponse.response.data, null, 2)
                );
              }
            }

            Alert.alert(
              "Lỗi",
              `Đã xảy ra lỗi khi thêm cá Koi: ${
                error instanceof Error ? error.message : "Lỗi không xác định"
              }`
            );
          }
        },
      },
    ]);
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
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log("DEBUG: Kết quả yêu cầu quyền:", permissionResult);

      if (!permissionResult.granted) {
        console.log(
          "DEBUG: Người dùng từ chối cấp quyền truy cập thư viện ảnh"
        );
        Alert.alert(
          "Cần quyền truy cập",
          "Vui lòng cấp quyền truy cập vào thư viện ảnh."
        );
        return;
      }

      console.log("DEBUG: Mở thư viện ảnh để chọn");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      console.log(
        "DEBUG: Kết quả chọn ảnh:",
        result.canceled ? "Đã hủy" : "Đã chọn"
      );

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        console.log("DEBUG: Thông tin ảnh đã chọn:", {
          uri: selectedAsset.uri,
          width: selectedAsset.width,
          height: selectedAsset.height,
          type: selectedAsset.type,
          fileSize: selectedAsset.fileSize,
        });

        // Thêm ảnh mới vào mảng ảnh
        const newImage = {
          uri: selectedAsset.uri,
          type: "image/jpeg",
          name: `new-image-${Date.now()}.jpg`,
        };

        setNewKoi({
          ...newKoi,
          images: [...newKoi.images, newImage],
        });

        console.log("DEBUG: Đã thêm ảnh mới vào mảng ảnh:", newImage);
      }
    } catch (error: unknown) {
      console.error("DEBUG: Lỗi khi chọn ảnh:", error);
      console.error(
        "DEBUG: Chi tiết lỗi:",
        error instanceof Error ? error.stack : "Không có stack trace"
      );
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
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log("DEBUG: Kết quả yêu cầu quyền:", permissionResult);

      if (!permissionResult.granted) {
        console.log(
          "DEBUG: Người dùng từ chối cấp quyền truy cập thư viện ảnh"
        );
        Alert.alert(
          "Cần quyền truy cập",
          "Vui lòng cấp quyền truy cập vào thư viện ảnh."
        );
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

      console.log(
        "DEBUG: Kết quả chọn video:",
        result.canceled ? "Đã hủy" : "Đã chọn"
      );

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        console.log("DEBUG: Thông tin video đã chọn:", {
          uri: selectedAsset.uri,
          width: selectedAsset.width,
          height: selectedAsset.height,
          type: selectedAsset.type,
          duration: selectedAsset.duration,
          fileSize: selectedAsset.fileSize,
        });

        // Kiểm tra kích thước (chỉ có thể thực hiện trên một số nền tảng)
        if (Platform.OS !== "web") {
          try {
            console.log("DEBUG: Kiểm tra kích thước file video");
            const fileInfo = await FileSystem.getInfoAsync(selectedAsset.uri);
            console.log("DEBUG: Thông tin file:", fileInfo);

            // Kiểm tra fileInfo.size có tồn tại không trước khi sử dụng
            if (fileInfo && "size" in fileInfo) {
              const fileSizeMB = fileInfo.size / (1024 * 1024);
              console.log(`DEBUG: Kích thước file: ${fileSizeMB.toFixed(2)}MB`);

              if (fileInfo.size > 100 * 1024 * 1024) {
                // Kiểm tra xem có lớn hơn 100MB không
                console.log("DEBUG: File quá lớn, vượt quá 100MB");
                Alert.alert(
                  "Video quá lớn",
                  "Video không được vượt quá 100MB. Vui lòng chọn video nhỏ hơn."
                );
                return;
              }
            } else {
              console.log(
                "DEBUG: Không thể lấy kích thước file, fileInfo:",
                fileInfo
              );
            }
          } catch (error: unknown) {
            console.error("DEBUG: Không thể kiểm tra kích thước file:", error);
            console.error(
              "DEBUG: Chi tiết lỗi:",
              error instanceof Error ? error.stack : "Không có stack trace"
            );
            // Tiếp tục mặc dù không thể kiểm tra kích thước
          }
        }

        // Thêm video mới vào mảng videos
        const newVideo = {
          uri: selectedAsset.uri,
          type: "video/mp4",
          name: `new-video-${Date.now()}.mp4`,
        };

        setNewKoi({
          ...newKoi,
          videos: [...newKoi.videos, newVideo],
        });

        console.log("DEBUG: Đã thêm video mới vào mảng videos:", newVideo);
      }
    } catch (error: unknown) {
      console.error("DEBUG: Lỗi khi chọn video:", error);
      console.error(
        "DEBUG: Chi tiết lỗi:",
        error instanceof Error ? error.stack : "Không có stack trace"
      );
      Alert.alert("Lỗi", "Không thể tải video. Vui lòng thử lại.");
    }
  };

  // Hàm xóa ảnh
  const handleRemoveImage = (index: number) => {
    const updatedImages = [...newKoi.images];
    updatedImages.splice(index, 1);
    setNewKoi({
      ...newKoi,
      images: updatedImages,
    });
  };

  // Hàm xóa video
  const handleRemoveVideo = (index: number) => {
    const updatedVideos = [...newKoi.videos];
    updatedVideos.splice(index, 1);
    setNewKoi({
      ...newKoi,
      videos: updatedVideos,
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
      onPress={() => selectVariety(item.id)}>
      <Text style={styles.varietyName}>{item.name}</Text>
      <Text style={styles.varietyDescription}>{item.description}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Danh sách cá Koi</Text>
          <View style={{ width: 24 }} />
        </View>
        {isLoading && !isRefreshing && !isLoadingMore ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFA500" />
            <Text style={styles.loadingText}>Đang tải thông tin...</Text>
          </View>
        ) : (
          <>
            {/* Section Headers with better animation */}
            <View style={styles.sectionToggleContainer}>
              <TouchableOpacity
                style={styles.sectionToggleButton}
                onPress={() => toggleSection("myKoi")}>
                <Animated.Text
                  style={[
                    styles.sectionToggleText,
                    {
                      opacity: myKoiHeaderOpacity,
                      color: activeTab === "myKoi" ? "#FFA500" : "#8190A5",
                      fontWeight: activeTab === "myKoi" ? "700" : "500",
                    },
                  ]}>
                  Cá Koi của tôi
                </Animated.Text>
                {activeTab === "myKoi" && (
                  <Animated.View
                    style={[
                      styles.activeIndicator,
                      {
                        opacity: myKoiHeaderOpacity,
                      },
                    ]}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sectionToggleButton}
                onPress={() => toggleSection("addNewKoi")}>
                <Animated.Text
                  style={[
                    styles.sectionToggleText,
                    {
                      opacity: addNewKoiHeaderOpacity,
                      color: activeTab === "addNewKoi" ? "#FFA500" : "#8190A5",
                      fontWeight: activeTab === "addNewKoi" ? "700" : "500",
                    },
                  ]}>
                  Thêm cá Koi mới
                </Animated.Text>
                {activeTab === "addNewKoi" && (
                  <Animated.View
                    style={[
                      styles.activeIndicator,
                      {
                        opacity: addNewKoiHeaderOpacity,
                      },
                    ]}
                  />
                )}
              </TouchableOpacity>
            </View>

            {/* Search Filters - Only show in My Koi section */}
            {activeTab === "myKoi" && (
              <View style={styles.filterShadow}>
                <View style={styles.filterContainer}>
                  <View style={styles.searchInputContainer}>
                    <Ionicons name="search-outline" size={18} color="#8190A5" />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Tìm kiếm theo tên"
                      value={searchName}
                      onChangeText={setSearchName}
                      placeholderTextColor="#8190A5"
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.filterButton}
                    onPress={applyFilters}>
                    <Text style={styles.filterButtonText}>Tìm</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={{
                    alignSelf: "flex-end",
                    paddingVertical: 8,
                    marginTop: 8,
                  }}
                  onPress={resetFilters}>
                  <Text
                    style={{
                      color: "#FFA500",
                      fontWeight: "500",
                      fontSize: 14,
                    }}>
                    Đặt lại bộ lọc
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Content Based on Active Tab */}
            {activeTab === "myKoi" ? (
              <View style={{ flex: 1 }}>
                {error ? (
                  <View style={styles.centerContainer}>
                    <Image
                      source={{
                        uri: "https://illustatus.herokuapp.com/?title=Oops!&fill=%234f46e5",
                      }}
                      style={styles.errorImage}
                    />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={() => fetchKoiProfiles(true)}>
                      <Text style={styles.retryButtonText}>Thử lại</Text>
                    </TouchableOpacity>
                  </View>
                ) : koiList.length === 0 ? (
                  <View style={styles.centerContainer}>
                    <Image
                      source={{
                        uri: "https://illustatus.herokuapp.com/?title=No%20Koi&fill=%23FFA500",
                      }}
                      style={styles.emptyImage}
                    />
                    <Text style={styles.messageText}>
                      Bạn chưa có cá Koi nào. Hãy thêm cá Koi mới!
                    </Text>
                    <TouchableOpacity
                      style={styles.addNewButton}
                      onPress={() => toggleSection("addNewKoi")}>
                      <Text style={styles.addNewButtonText}>
                        Thêm cá Koi mới
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <FlatList
                    data={koiList}
                    renderItem={renderKoiCard}
                    keyExtractor={(item, index) => `${item.id}_${index}`}
                    contentContainerStyle={styles.koiListContainer}
                    refreshControl={
                      <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        colors={["#FFA500"]}
                        tintColor="#FFA500"
                      />
                    }
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                      isLoadingMore ? (
                        <View style={styles.loadingMore}>
                          <ActivityIndicator size="small" color="#FFA500" />
                          <Text style={styles.loadingMoreText}>
                            Đang tải thêm...
                          </Text>
                        </View>
                      ) : null
                    }
                  />
                )}
              </View>
            ) : (
              // Add New Koi Form in a ScrollView with improved styling
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 20} // Thêm offset để tránh bị bàn phím che
              >
                <ScrollView
                  style={styles.formContainerEnhanced}
                  showsVerticalScrollIndicator={false}>
                  <View style={styles.formCardShadow}>
                    <View style={styles.formCard}>
                      <Text style={styles.formSectionTitle}>
                        Thông tin cơ bản
                      </Text>

                      {/* Thêm thông báo cảnh báo */}
                      <View style={styles.warningContainer}>
                        <Ionicons
                          name="warning-outline"
                          size={18}
                          color="#FFA500"
                        />
                        <Text style={styles.warningText}>
                          Lưu ý: Sau khi tạo, các thông tin Tên, Giới tính và
                          Dòng máu sẽ KHÔNG THỂ thay đổi.
                        </Text>
                      </View>

                      <View style={styles.formGroup}>
                        <Text style={styles.labelEnhanced}>
                          Tên cá Koi <Text style={styles.requiredField}>*</Text>
                        </Text>
                        <View style={styles.inputContainer}>
                          <TextInput
                            style={styles.inputEnhanced}
                            placeholder="Nhập tên cá Koi"
                            placeholderTextColor="#8190A5"
                            value={newKoi.name}
                            onChangeText={(text) =>
                              handleInputChange("name", text)
                            }
                          />
                        </View>
                      </View>

                      <View style={styles.row}>
                        <View style={[styles.formGroup, styles.halfWidth]}>
                          <Text style={styles.labelEnhanced}>Tuổi (năm)</Text>
                          <View style={styles.inputContainer}>
                            <TextInput
                              style={styles.inputEnhanced}
                              placeholder="Nhập tuổi"
                              placeholderTextColor="#8190A5"
                              value={
                                newKoi.age > 0 ? newKoi.age.toString() : ""
                              }
                              onChangeText={(text) =>
                                handleInputChange("age", text)
                              }
                              keyboardType="numeric"
                            />
                          </View>
                        </View>

                        <View style={[styles.formGroup, styles.halfWidth]}>
                          <Text style={styles.labelEnhanced}>
                            Kích thước (cm){" "}
                            <Text style={styles.requiredField}>*</Text>
                          </Text>
                          <View style={styles.inputContainer}>
                            <TextInput
                              style={styles.inputEnhanced}
                              placeholder="Nhập kích thước"
                              placeholderTextColor="#8190A5"
                              value={
                                newKoi.size > 0 ? newKoi.size.toString() : ""
                              }
                              onChangeText={(text) =>
                                handleInputChange("size", text)
                              }
                              keyboardType="numeric"
                            />
                          </View>
                        </View>
                      </View>

                      <View style={styles.formGroup}>
                        <Text style={styles.labelEnhanced}>
                          Giống cá Koi{" "}
                          <Text style={styles.requiredField}>*</Text>
                        </Text>
                        <TouchableOpacity
                          style={styles.dropdownInputEnhanced}
                          activeOpacity={0.7}
                          onPress={openVarietyModal}>
                          <Text
                            style={[
                              styles.dropdownText,
                              newKoi.variety ? { color: "#1A2138" } : {},
                            ]}>
                            {varieties.find((v) => v.id === newKoi.variety)
                              ?.name || "Chọn giống cá Koi"}
                          </Text>
                          <Ionicons
                            name="chevron-down"
                            size={20}
                            color="#8190A5"
                          />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.formGroup}>
                        <Text style={styles.labelEnhanced}>Giới tính</Text>
                        <View style={styles.genderContainerEnhanced}>
                          <TouchableOpacity
                            style={[
                              styles.genderOptionEnhanced,
                              newKoi.gender === "Đực" &&
                                styles.selectedGenderEnhanced,
                            ]}
                            onPress={() => handleInputChange("gender", "Đực")}>
                            <Text
                              style={[
                                styles.genderTextEnhanced,
                                newKoi.gender === "Đực" &&
                                  styles.selectedGenderTextEnhanced,
                              ]}>
                              Đực
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.genderOptionEnhanced,
                              newKoi.gender === "Cái" &&
                                styles.selectedGenderEnhanced,
                            ]}
                            onPress={() => handleInputChange("gender", "Cái")}>
                            <Text
                              style={[
                                styles.genderTextEnhanced,
                                newKoi.gender === "Cái" &&
                                  styles.selectedGenderTextEnhanced,
                              ]}>
                              Cái
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.formGroup}>
                        <Text style={styles.labelEnhanced}>Dòng máu</Text>
                        <View style={styles.inputContainer}>
                          <TextInput
                            style={styles.inputEnhanced}
                            placeholder="Nhập dòng máu cá Koi"
                            placeholderTextColor="#8190A5"
                            value={newKoi.bloodline}
                            onChangeText={(text) =>
                              handleInputChange("bloodline", text)
                            }
                          />
                        </View>
                      </View>

                      <Text style={styles.infoTextEnhanced}>
                        <Ionicons
                          name="information-circle-outline"
                          size={14}
                          color="#5664F5"
                        />{" "}
                        Thông tin sẽ được ban tổ chức xác minh.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.formCardShadow}>
                    <View style={styles.formCard}>
                      <Text style={styles.formSectionTitle}>
                        Hình ảnh và Video
                      </Text>

                      <View style={styles.formGroup}>
                        <Text style={styles.labelEnhanced}>
                          Tải ảnh cá Koi{" "}
                          <Text style={styles.requiredField}>*</Text>
                        </Text>
                        {newKoi.images.length > 0 ? (
                          <View style={styles.uploadedMediaContainer}>
                            {newKoi.images.map((image, index) => (
                              <View
                                key={`image-${index}`}
                                style={styles.uploadedMediaItemEnhanced}>
                                <Image
                                  source={{ uri: image.uri }}
                                  style={styles.uploadedImageEnhanced}
                                  resizeMode="cover"
                                />
                                <TouchableOpacity
                                  style={styles.removeMediaButtonEnhanced}
                                  onPress={() => handleRemoveImage(index)}>
                                  <Ionicons
                                    name="close"
                                    size={16}
                                    color="#FFFFFF"
                                  />
                                </TouchableOpacity>
                              </View>
                            ))}

                            {newKoi.images.length < 3 && (
                              <TouchableOpacity
                                style={styles.addMoreMediaButtonEnhanced}
                                onPress={handleImageUpload}>
                                <LinearGradient
                                  colors={["#FFA500", "#FFD700"]}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 0 }}
                                  style={styles.addMoreMediaGradient}>
                                  <Text
                                    style={
                                      styles.addMoreMediaButtonTextEnhanced
                                    }>
                                    <Ionicons
                                      name="add"
                                      size={16}
                                      color="#FFFFFF"
                                    />{" "}
                                    Thêm ảnh
                                  </Text>
                                </LinearGradient>
                              </TouchableOpacity>
                            )}
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={styles.uploadBoxEnhanced}
                            onPress={handleImageUpload}>
                            <Ionicons
                              name="image-outline"
                              size={36}
                              color="#5664F5"
                            />
                            <Text style={styles.uploadText}>
                              Tải ảnh cá Koi lên
                            </Text>
                          </TouchableOpacity>
                        )}

                        <Text style={styles.helperTextEnhanced}>
                          <Ionicons
                            name="information-circle-outline"
                            size={14}
                            color="#8190A5"
                          />{" "}
                          Nên chụp ảnh dọc và ảnh chất lượng cao. Chấp nhận file
                          jpg hoặc png. Kích thước tối thiểu: 320px x 500px. Tối
                          đa 3 ảnh.
                        </Text>
                      </View>

                      <View style={styles.formGroup}>
                        <Text style={styles.labelEnhanced}>
                          Tải video cá Koi
                        </Text>
                        {newKoi.videos.length > 0 ? (
                          <View style={styles.uploadedMediaContainer}>
                            {newKoi.videos.map((video, index) => (
                              <View
                                key={`video-${index}`}
                                style={styles.videoContainer}>
                                <View style={styles.videoUploadedEnhanced}>
                                  <Ionicons
                                    name="videocam"
                                    size={24}
                                    color="#5664F5"
                                  />
                                  <View style={styles.videoInfoContainer}>
                                    <Text
                                      style={styles.videoUploadedTextEnhanced}>
                                      Video đã tải lên
                                    </Text>
                                    <Text
                                      style={styles.videoUploadedNameEnhanced}
                                      numberOfLines={1}
                                      ellipsizeMode="middle">
                                      {video.name}
                                    </Text>
                                  </View>
                                </View>
                                <TouchableOpacity
                                  style={styles.removeMediaButtonEnhanced}
                                  onPress={() => handleRemoveVideo(index)}>
                                  <Ionicons
                                    name="close"
                                    size={16}
                                    color="#FFFFFF"
                                  />
                                </TouchableOpacity>
                              </View>
                            ))}

                            {newKoi.videos.length < 2 && (
                              <TouchableOpacity
                                style={styles.addMoreMediaButtonEnhanced}
                                onPress={handleVideoUpload}>
                                <LinearGradient
                                  colors={["#FFA500", "#FFD700"]}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 0 }}
                                  style={styles.addMoreMediaGradient}>
                                  <Text
                                    style={
                                      styles.addMoreMediaButtonTextEnhanced
                                    }>
                                    <Ionicons
                                      name="add"
                                      size={16}
                                      color="#FFFFFF"
                                    />{" "}
                                    Thêm video
                                  </Text>
                                </LinearGradient>
                              </TouchableOpacity>
                            )}
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={styles.uploadBoxEnhanced}
                            onPress={handleVideoUpload}>
                            <Ionicons
                              name="videocam-outline"
                              size={36}
                              color="#5664F5"
                            />
                            <Text style={styles.uploadText}>
                              Tải video cá Koi lên
                            </Text>
                          </TouchableOpacity>
                        )}

                        <Text style={styles.helperTextEnhanced}>
                          <Ionicons
                            name="information-circle-outline"
                            size={14}
                            color="#8190A5"
                          />{" "}
                          Video được chấp nhận tối đa 10 phút và không quá
                          100MB. Tối đa 2 video.
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={styles.addButtonEnhanced}
                      onPress={handleAddKoi}>
                      <LinearGradient
                        colors={["#FFA500", "#FFD700"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.buttonGradient}>
                        <Text style={styles.addButtonTextEnhanced}>
                          Thêm cá Koi
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cancelButtonEnhanced}
                      onPress={() => toggleSection("myKoi")}>
                      <Text style={styles.cancelButtonTextEnhanced}>Hủy</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </KeyboardAvoidingView>
            )}

            {/* Modal cho việc chọn giống cá Koi với BlurView */}
            <Modal
              visible={showVarietyModal}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowVarietyModal(false)}>
              <BlurView intensity={90} style={styles.modalOverlayEnhanced}>
                <View style={styles.modalContainerEnhanced}>
                  <View style={styles.modalHeaderEnhanced}>
                    <Text style={styles.modalTitleEnhanced}>
                      Chọn giống cá Koi
                    </Text>
                    <TouchableOpacity
                      style={styles.closeButtonContainer}
                      onPress={() => setShowVarietyModal(false)}>
                      <Ionicons name="close" size={16} color="#8190A5" />
                    </TouchableOpacity>
                  </View>

                  <FlatList
                    data={varieties}
                    renderItem={renderVarietyItem}
                    keyExtractor={(item, index) => `${item.id}_${index}`}
                    contentContainerStyle={styles.varietyListEnhanced}
                    showsVerticalScrollIndicator={true}
                  />
                </View>
              </BlurView>
            </Modal>

            {/* Image Preview Modal */}
            <Modal
              visible={isPreviewVisible}
              transparent={true}
              onRequestClose={() => setIsPreviewVisible(false)}>
              <BlurView
                intensity={90}
                style={styles.previewModalContainerEnhanced}>
                <TouchableOpacity
                  style={styles.previewCloseButtonEnhanced}
                  onPress={() => setIsPreviewVisible(false)}>
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                {previewMedia && (
                  <View style={styles.previewContentEnhanced}>
                    {previewMedia.type === "image" ? (
                      <Image
                        source={{ uri: previewMedia.uri }}
                        style={styles.previewImageEnhanced}
                        resizeMode="contain"
                      />
                    ) : (
                      <Video
                        source={{ uri: previewMedia.uri }}
                        style={styles.previewVideoEnhanced}
                        useNativeControls
                        resizeMode={ResizeMode.CONTAIN}
                        isLooping
                        shouldPlay
                      />
                    )}
                  </View>
                )}
              </BlurView>
            </Modal>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
  },
  header: {
    width: "100%",
    height: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#333333",
    textAlign: "center",
    marginLeft: 24, // Điều chỉnh để căn giữa chính xác, bù trừ cho nút back
  },
  headerGradient: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: Platform.OS === "ios" ? 0 : 20,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F2FF",
  },
  searchIcon: {
    width: 18,
    height: 18,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    position: "relative",
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  profileBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    padding: 4,
    borderRadius: 12,
    backgroundColor: "#5664F5",
  },
  profileBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FF",
  },
  loadingText: {
    fontSize: 16,
    color: "#64748b",
    marginTop: 16,
  },
  sectionToggleContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  sectionToggleButton: {
    flex: 1,
    paddingVertical: 12,
    position: "relative",
    alignItems: "center",
  },
  sectionToggleText: {
    fontSize: 16,
    textAlign: "center",
  },
  activeIndicator: {
    position: "absolute",
    bottom: 0,
    left: 8,
    right: 8,
    height: 3,
    backgroundColor: "#FFA500",
    borderRadius: 1.5,
  },
  filterShadow: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E3F5",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 12,
  },
  searchInputIcon: {
    width: 18,
    height: 18,
    marginRight: 8,
    tintColor: "#8190A5",
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: "#1A2138",
  },
  filterButton: {
    backgroundColor: "#FFA500",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 8,
  },
  filterButtonText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
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
    marginLeft: 8,
  },
  resetButtonText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  koiListContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  koiCardContainer: {
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  koiCardModern: {
    flexDirection: 'column',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E3F5',
  },
  koiCardContent: {
    flexDirection: 'row',
    height: 200,
  },
  koiImageColumn: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F0F2FF',
  },
  koiInfoColumn: {
    flex: 2,
    padding: 16,
  },
  koiImage: {
    width: '100%',
    height: '100%',
  },
  koiNameHorizontal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2138',
    marginBottom: 10,
  },
  koiInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  koiDetailsContainer: {
    borderRadius: 8,
    backgroundColor: '#F8F9FF',
    padding: 10,
    marginBottom: 12,
  },
  koiTagModern: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  maleTagModern: {
    backgroundColor: 'rgba(34, 161, 240, 0.15)',
  },
  femaleTagModern: {
    backgroundColor: 'rgba(255, 165, 0, 0.15)',
  },
  koiTagTextModern: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A2138',
  },
  koiSizeTag: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#F0F2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  koiSizeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5664F5',
  },
  koiDetailItemModern: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  koiDetailLabelModern: {
    fontSize: 14,
    color: '#8190A5',
    fontWeight: '500',
  },
  koiDetailValueModern: {
    fontSize: 14,
    color: '#1A2138',
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5664F5',
    marginRight: 4,
  },
  formContainerEnhanced: {
    padding: 16,
    backgroundColor: "#F8F9FF",
  },
  formCardShadow: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  formCard: {
    borderRadius: 12,
    padding: 16,
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A2138",
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  labelEnhanced: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A2138",
    marginBottom: 8,
  },
  inputContainer: {
    height: 48,
    borderWidth: 1,
    borderColor: "#E0E3F5",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
  },
  inputEnhanced: {
    flex: 1,
    height: 48,
    fontSize: 14,
    color: "#1A2138",
  },
  row: {
    flexDirection: "row",
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
  dropdownInputEnhanced: {
    height: 48,
    borderWidth: 1,
    borderColor: "#E0E3F5",
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
  },
  dropdownText: {
    color: "#8190A5",
    fontSize: 14,
  },
  genderContainerEnhanced: {
    flexDirection: "row",
    gap: 12,
  },
  genderOptionEnhanced: {
    flex: 1,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E3F5",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  selectedGenderEnhanced: {
    backgroundColor: "#5664F5",
    borderColor: "#5664F5",
  },
  genderTextEnhanced: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1A2138",
  },
  selectedGenderTextEnhanced: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  textAreaContainer: {
    height: 120,
    borderWidth: 1,
    borderColor: "#E0E3F5",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#FFFFFF",
  },
  textAreaEnhanced: {
    flex: 1,
    height: 120,
    fontSize: 14,
    color: "#1A2138",
    textAlignVertical: "top",
  },
  uploadedMediaContainer: {
    width: "100%",
    marginBottom: 8,
  },
  uploadedMediaItemEnhanced: {
    position: "relative",
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
    height: 200,
    backgroundColor: "#F0F2FF",
  },
  uploadedImageEnhanced: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  videoContainer: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F0F2FF",
  },
  videoUploadedEnhanced: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: 70,
    backgroundColor: "#F0F2FF",
    borderRadius: 12,
    padding: 16,
  },
  videoInfoContainer: {
    marginLeft: 12,
    flex: 1,
  },
  videoUploadedTextEnhanced: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A2138",
    marginBottom: 4,
  },
  videoUploadedNameEnhanced: {
    fontSize: 12,
    color: "#8190A5",
  },
  removeMediaButtonEnhanced: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  removeMediaButtonTextEnhanced: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  addMoreMediaButtonEnhanced: {
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    overflow: "hidden",
  },
  addMoreMediaGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  addMoreMediaButtonTextEnhanced: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    marginBottom: 80, // Tăng khoảng cách dưới cùng để tránh bị footer che mất
    paddingBottom: Platform.OS === "ios" ? 20 : 30, // Thêm padding dưới cùng cho các thiết bị khác nhau
  },
  buttonGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonEnhanced: {
    flex: 2,
    height: 50,
    borderRadius: 8,
    overflow: "hidden",
  },
  addButtonTextEnhanced: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cancelButtonEnhanced: {
    flex: 1,
    height: 50,
    backgroundColor: "#F0F2FF",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E3F5",
  },
  cancelButtonTextEnhanced: {
    fontSize: 16,
    fontWeight: "600",
  },
  warningContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF8E1",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: "flex-start",
    borderLeftWidth: 4,
    borderLeftColor: "#FFA500",
  },
  warningText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#5A3E00",
    lineHeight: 20,
  },
  modalOverlayEnhanced: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainerEnhanced: {
    width: width * 0.9,
    maxHeight: height * 0.7,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeaderEnhanced: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  modalTitleEnhanced: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A2138",
  },
  closeButtonContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F0F2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonEnhanced: {
    fontSize: 18,
    fontWeight: "700",
    color: "#8190A5",
  },
  varietyListEnhanced: {
    padding: 8,
  },
  varietyItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  varietyName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A2138",
    marginBottom: 4,
  },
  varietyDescription: {
    fontSize: 14,
    color: "#8190A5",
  },
  previewModalContainerEnhanced: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  previewCloseButtonEnhanced: {
    position: "absolute",
    top: 40,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  previewCloseButtonTextEnhanced: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 22,
  },
  previewContentEnhanced: {
    width: width * 0.9,
    height: height * 0.7,
    backgroundColor: "#000000",
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  previewImageEnhanced: {
    width: "100%",
    height: "100%",
  },
  previewVideoEnhanced: {
    width: "100%",
    height: "100%",
  },
  uploadBoxEnhanced: {
    height: 150,
    borderWidth: 1,
    borderColor: "#E0E3F5",
    borderRadius: 12,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    backgroundColor: "#F0F2FF",
  },
  uploadIconEnhanced: {
    width: 36,
    height: 36,
    marginBottom: 12,
    tintColor: "#5664F5",
  },
  uploadText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#5664F5",
  },
  helperTextEnhanced: {
    fontSize: 12,
    color: "#8190A5",
    marginTop: 8,
    lineHeight: 16,
  },
  infoIcon: {
    width: 14,
    height: 14,
    marginRight: 4,
  },
  infoTextEnhanced: {
    fontSize: 12,
    color: "#8190A5",
    marginTop: 16,
    marginBottom: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorImage: {
    width: 150,
    height: 150,
    marginBottom: 16,
    borderRadius: 75,
  },
  errorText: {
    fontSize: 16,
    color: "#e53e3e",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#FFA500",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  emptyImage: {
    width: 180,
    height: 180,
    marginBottom: 24,
  },
  messageText: {
    fontSize: 16,
    color: "#8190A5",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  addNewButton: {
    backgroundColor: "#FFA500",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  addNewButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  requiredField: {
    color: "#e53e3e",
    fontWeight: "700",
  },
  loadingMore: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  loadingMoreText: {
    fontSize: 14,
    color: "#8190A5",
    marginLeft: 8,
  },
});

export default KoiList;
