import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { Video, ResizeMode } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from "react-native";
import WebView from "react-native-webview";
import {
  KoiProfile,
  Variety,
  getKoiProfileById,
  getKoiProfiles,
  getVarieties,
  createKoiProfile
} from "../../../services/koiProfileService";
import {
  findSuitableCategory,
  createRegistration,
  getCompetitionCategories,
  CompetitionCategory,
  checkoutRegistration,
} from "../../../services/registrationService";
import { getKoiShowById } from "../../../services/showService";

// Media item for registration
interface MediaItem {
  id: string;
  mediaUrl: string;
  mediaType: "Image" | "Video";
  // For newly added items that aren't from the profile
  isNew?: boolean;
  // For local files
  fileUri?: string;
}

// Skeleton Component
const Skeleton = ({ width, height, style }: { width: number | string; height: number; style?: any }) => {
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: "#E2E8F0",
          opacity,
          borderRadius: 4,
        },
        style,
      ]}
    />
  );
};

// PaymentModal component
const PaymentModal = ({ 
  visible, 
  paymentUrl, 
  onClose, 
  paymentTimeoutId,
  setPaymentTimeoutId
}: { 
  visible: boolean; 
  paymentUrl: string | null; 
  onClose: () => void;
  paymentTimeoutId: NodeJS.Timeout | null;
  setPaymentTimeoutId: React.Dispatch<React.SetStateAction<NodeJS.Timeout | null>>;
}) => (
  <Modal
    animationType="slide"
    transparent={false}
    visible={visible}
    onRequestClose={onClose}>
    <SafeAreaView style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Hoàn tất thanh toán</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>Đóng</Text>
        </TouchableOpacity>
      </View>
      {paymentUrl ? (
        <WebView
          source={{ uri: paymentUrl }}
          style={styles.webView}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingWebView}>
              <ActivityIndicator size="large" color="#0000ff" />
            </View>
          )}
          onNavigationStateChange={(navState) => {
            console.log("Navigation URL:", navState.url);
            
            try {
              // Check if this is our custom scheme deep link
              if (navState.url.includes('ksms://app/')) {
                onClose();
                
                // Clear the payment timeout
                if (paymentTimeoutId) {
                  clearTimeout(paymentTimeoutId);
                  setPaymentTimeoutId(null);
                }
                
                // Parse status parameter from URL
                const urlObj = new URL(navState.url);
                const status = urlObj.searchParams.get('status') || '';
                const isSuccess = navState.url.includes('/success');
                
                // Navigate to appropriate screen
                if (isSuccess) {
                  router.push({
                    pathname: "/(payments)/PaymentSuccess",
                    params: { status }
                  });
                } else {
                  router.push({
                    pathname: "/(payments)/PaymentFailed", 
                    params: { status }
                  });
                }
                
                return false; // Prevent default navigation
              }
              
              // Handle web URLs
              if (navState.url.includes('ksms.news/app/') || 
                  navState.url.includes('localhost:5173/')) {
                onClose();
                
                // Clear the payment timeout
                if (paymentTimeoutId) {
                  clearTimeout(paymentTimeoutId);
                  setPaymentTimeoutId(null);
                }
                
                const isSuccess = navState.url.includes('/success');
                
                // Try to extract status from URL if present
                let status = '';
                try {
                  const urlObj = new URL(navState.url);
                  status = urlObj.searchParams.get('status') || '';
                } catch (e) {
                  console.log("Error parsing URL parameters:", e);
                }
                
                // Navigate based on success/failure path
                if (isSuccess) {
                  router.push({
                    pathname: "/(payments)/PaymentSuccess",
                    params: { status }
                  });
                } else {
                  router.push({
                    pathname: "/(payments)/PaymentFailed",
                    params: { status }
                  });
                }
                
                return false;
              }
            } catch (e) {
              console.error("Error handling navigation:", e);
            }
          }}
        />
      ) : (
        <View style={styles.loadingWebView}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}
    </SafeAreaView>
  </Modal>
);

const KoiRegistrationScreen: React.FC = () => {
  // Get showId from route params
  const params = useLocalSearchParams();
  const showId = params.showId as string;

  // Refs để theo dõi giá trị thực tế của state
  const profileRef = useRef<KoiProfile | null>(null);
  const showIdRef = useRef<string>(showId);

  // Basic form states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  // Form data states
  const [koiName, setKoiName] = useState("");
  const [koiSize, setKoiSize] = useState("");
  const [koiVariety, setKoiVariety] = useState("");
  const [koiDescription, setKoiDescription] = useState("");

  // Media and API states
  const [koiProfiles, setKoiProfiles] = useState<KoiProfile[]>([]);
  const [selectedKoiProfile, setSelectedKoiProfile] =
    useState<KoiProfile | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState<string>("");

  // Categories state
  const [categories, setCategories] = useState<CompetitionCategory[]>([]);
  const [showCategories, setShowCategories] = useState(true);
  const [showBanner, setShowBanner] = useState(true);

  // Form validation states
  const [formErrors, setFormErrors] = useState({
    size: '',
    category: ''
  });

  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingCategory, setIsLoadingCategory] = useState(false);

  // Payment states
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentTimeoutId, setPaymentTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // New profile creation states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [selectedVariety, setSelectedVariety] = useState<Variety | null>(null);
  const [isVarietyDropdownOpen, setIsVarietyDropdownOpen] = useState(false);
  const [newKoiName, setNewKoiName] = useState("");
  const [newKoiSize, setNewKoiSize] = useState("");
  const [newKoiAge, setNewKoiAge] = useState("");
  const [newKoiGender, setNewKoiGender] = useState("Đực");
  const [newKoiBloodline, setNewKoiBloodline] = useState("");
  const [newKoiMedia, setNewKoiMedia] = useState<MediaItem[]>([]);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);


  // Thêm state cho thông tin cuộc thi
  const [showInfo, setShowInfo] = useState({
    name: "",
    location: "",
    date: "",
    description: "",
    imgUrl: null as string | null
  });

  // Đảm bảo khi state cập nhật, refs cũng cập nhật theo
  useEffect(() => {
    profileRef.current = selectedKoiProfile;
  }, [selectedKoiProfile]);

  useEffect(() => {
    showIdRef.current = showId;
  }, [showId]);

  // Fetch koi profiles and categories when component mounts
  useEffect(() => {
    loadKoiProfiles();
    loadVarieties();
    loadCategories();
    loadShowInfo();
  }, []);

  // Kiểm tra showId khi component được mount
  useEffect(() => {
    if (!showId) {
      Alert.alert(
        "Lỗi",
        "Không tìm thấy thông tin cuộc thi. Vui lòng quay lại và thử lại.",
        [
          {
            text: "Quay lại",
            onPress: () => router.back()
          }
        ]
      );
    }
  }, [showId]);

  // Thêm hàm để tải thông tin cuộc thi từ API
  const loadShowInfo = async () => {
    if (!showId) return;
    
    try {
      setLoading(true);
      setProcessingStep("Đang tải thông tin cuộc thi...");
      
      const response = await getKoiShowById(showId);
      if (response) {
        // Format date range
        const startDate = new Date(response.startDate);
        const endDate = new Date(response.endDate);
        const formattedStartDate = startDate.toLocaleDateString('vi-VN');
        const formattedEndDate = endDate.toLocaleDateString('vi-VN');
        
        setShowInfo({
          name: response.name || "Cuộc Thi Koi",
          location: response.location || "Chưa có thông tin",
          date: `${formattedStartDate} - ${formattedEndDate}`,
          description: response.description || "Chưa có mô tả chi tiết",
          imgUrl: response.imgUrl || null
        });
        
        console.log('Loaded show info:', {
          name: response.name,
          imgUrl: response.imgUrl
        });
      }
    } catch (error) {
      console.error("Failed to fetch show information:", error);
      // Fallback to default values if API fails
      setShowInfo({
        name: "Cuộc Thi Koi",
        location: "Không có thông tin",
        date: "Không có thông tin",
        description: "Không có thông tin chi tiết",
        imgUrl: null
      });
    } finally {
      setLoading(false);
    }
  };

  const loadKoiProfiles = async () => {
    try {
      setLoading(true);
      const response = await getKoiProfiles();
      setKoiProfiles(response.data.items);
    } catch (error) {
      console.error("Failed to fetch koi profiles:", error);
      Alert.alert(
        "Lỗi",
        "Không thể tải danh sách koi. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  // Load varieties for new koi profile
  const loadVarieties = async () => {
    try {
      const response = await getVarieties();
      setVarieties(response.data?.items || []);
    } catch (error) {
      console.error("Failed to fetch varieties:", error);
      Alert.alert(
        "Lỗi",
        "Không thể tải danh sách giống koi. Vui lòng thử lại."
      );
    }
  };

  // Load competition categories
  const loadCategories = async () => {
    try {
      if (!showId) {
        console.error("Missing showId for loadCategories");
        return;
      }
      
      setProcessingStep("Đang tải danh sách hạng mục...");
      const response = await getCompetitionCategories(showId);
      if (response && response.data && response.data.items) {
        setCategories(response.data.items);
        console.log(`Loaded ${response.data.items.length} categories`);
      } else {
        console.error("Invalid response format in loadCategories:", response);
      }
    } catch (error) {
      console.error("Failed to fetch competition categories:", error);
    } finally {
      setProcessingStep("");
    }
  };


  // Hàm riêng để tìm category phù hợp
  const findCategory = async (varietyId: string, size: string) => {
    if (!showIdRef.current) {
      console.log('Missing showId for finding category');
      setSelectedCategory(null); // Reset khi không có showId
      setFormErrors(prev => ({ 
        ...prev, 
        category: 'Không tìm thấy ID cuộc thi, vui lòng thử lại sau.' 
      }));
      return null;
    }

    try {
      setIsLoadingCategory(true);
      setProcessingStep("Đang tìm hạng mục phù hợp...");
      
      console.log('Finding suitable category with params:', {
        showId: showIdRef.current,
        varietyId,
        size
      });
      
      const categoryResponse = await findSuitableCategory(
        showIdRef.current,
        varietyId,
        size
      );
      
      console.log('Category API Response:', categoryResponse);
      
      if (!categoryResponse || !categoryResponse.data) {
        console.log('No category data received');
        // Reset selected category
        setSelectedCategory(null);
        setFormErrors(prev => ({ 
          ...prev, 
          category: 'Không tìm thấy hạng mục phù hợp với kích thước và giống Koi của bạn.' 
        }));
        
        Alert.alert(
          "Không tìm thấy hạng mục phù hợp",
          "Không có hạng mục nào phù hợp với kích thước và giống Koi này. Vui lòng chọn Koi khác hoặc điều chỉnh kích thước hoặc chọn giống loài khác.",
          [{ text: "Đã hiểu" }]
        );
        
        return null;
      }

      const category = categoryResponse.data;
      setSelectedCategory(category);
      setFormErrors(prev => ({ ...prev, category: '' }));
      return category;
    } catch (error: any) {
      console.error("Failed to find suitable category:", error);
      
      // Reset selected category
      setSelectedCategory(null);
      
      // Hiển thị thông báo chi tiết hơn về lỗi
      let errorMessage = 'Lỗi khi tìm hạng mục phù hợp, vui lòng thử lại sau.';
      
      // Nếu là lỗi 400 - Không tìm thấy hạng mục phù hợp
      if (error.response && error.response.status === 400) {
        errorMessage = 'Không tìm thấy hạng mục phù hợp với kích thước và giống Koi của bạn.';
        console.error('Error response:', error.response.data);
        
        // Hiển thị thông báo cho người dùng
        Alert.alert(
          "Không tìm thấy hạng mục phù hợp",
          "Không có hạng mục nào phù hợp với kích thước và giống Koi này. Vui lòng chọn Koi khác hoặc điều chỉnh kích thước.",
          [{ text: "Đã hiểu" }]
        );
      }
      
      setFormErrors(prev => ({ 
        ...prev, 
        category: errorMessage
      }));
      
      return null;
    } finally {
      setIsLoadingCategory(false);
      setProcessingStep("");
    }
  };

  // Fetch koi profile details when a profile is selected
  const handleKoiSelection = async (id: string) => {
    try {
      setIsLoadingProfile(true);
      setLoading(true);
      setProcessingStep("Đang tải thông tin koi...");
      
      // Reset selectedCategory mỗi khi chọn profile mới
      setSelectedCategory(null);
      setShowCategories(false);
      
      // Lấy thông tin profile
      const response = await getKoiProfileById(id);
      if (!response || !response.data) {
        throw new Error("Không thể tải thông tin koi");
      }
      
      const profile = response.data;
      
      // Cập nhật state và ref đồng thời
      profileRef.current = profile;
      setSelectedKoiProfile(profile);
      setKoiName(profile.name);
      setKoiSize(profile.size.toString());
      setKoiVariety(profile.variety.name);
      setKoiDescription(profile.bloodline);
      setMediaItems(
        profile.koiMedia.map((media: any) => ({
          id: media.id,
          mediaUrl: media.mediaUrl,
          mediaType: media.mediaType,
        }))
      );
      
      setIsDropdownOpen(false);
      
      // Sử dụng trực tiếp profile object thay vì dựa vào state đã được cập nhật
      const category = await findCategory(profile.variety.id, profile.size.toString());
      if (category) {
        // Tự động mở danh sách hạng mục để người dùng có thể xem hạng mục đã được chọn
        setShowCategories(true);
      }
      
    } catch (error) {
      console.error("Failed to fetch koi profile details:", error);
      // Reset selectedCategory khi có lỗi xảy ra
      setSelectedCategory(null);
      Alert.alert("Lỗi", "Không thể tải thông tin koi. Vui lòng thử lại.");
    } finally {
      setIsLoadingProfile(false);
      setLoading(false);
    }
  };

  const handleSizeChange = async (size: string) => {
    // Loại bỏ ký tự không phải số và dấu chấm
    const cleanSize = size.replace(/[^\d.]/g, '');
    
    // Giới hạn chỉ có một dấu chấm
    const parts = cleanSize.split('.');
    let validSize = parts[0];
    if (parts.length > 1) {
      validSize += '.' + parts[1];
    }
    
    setKoiSize(validSize);
    setFormErrors(prev => ({ ...prev, size: '' }));
    
    // Sử dụng ref để lấy giá trị hiện tại của profile
    const currentProfile = profileRef.current;
    
    if (!currentProfile) {
      console.log('Missing profile for size change:', { currentProfile, size });
      // Reset selectedCategory khi không có profile
      setSelectedCategory(null);
      return;
    }

    // Validate size
    const sizeNumber = parseFloat(validSize);
    if (isNaN(sizeNumber) || sizeNumber <= 0) {
      console.log('Invalid size:', validSize);
      setFormErrors(prev => ({ ...prev, size: 'Vui lòng nhập kích thước hợp lệ' }));
      // Reset selectedCategory khi size không hợp lệ
      setSelectedCategory(null);
      return;
    }

    // Validate size range (15-75)
    if (sizeNumber < 15 || sizeNumber > 75) {
      console.log('Size out of range:', sizeNumber);
      setFormErrors(prev => ({ 
        ...prev, 
        size: 'Kích thước phải từ 15 đến 75 cm' 
      }));
      // Reset selectedCategory khi size ngoài phạm vi cho phép
      setSelectedCategory(null);
      return;
    }
    
    // Gọi hàm tìm category
    setLoading(true);
    const category = await findCategory(currentProfile.variety.id, sizeNumber.toString());
    setLoading(false);
    
    // Nếu tìm thấy hạng mục phù hợp, tự động mở danh sách hạng mục
    if (category) {
      setShowCategories(true);
    } else {
      // Nếu không tìm thấy hạng mục phù hợp, đảm bảo reset selectedCategory
      setSelectedCategory(null);
    }
  };

  // Handle adding images
  const handleAddImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photos to upload images."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newId = `new-image-${Date.now()}`;

        setMediaItems((prevItems) => [
          ...prevItems,
          {
            id: newId,
            mediaUrl: asset.uri,
            mediaType: "Image",
            isNew: true,
            fileUri: asset.uri,
          },
        ]);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to add image. Please try again.");
    }
  };

  // Handle adding videos
  const handleAddVideo = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photos to upload videos."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newId = `new-video-${Date.now()}`;

        setMediaItems((prevItems) => [
          ...prevItems,
          {
            id: newId,
            mediaUrl: asset.uri,
            mediaType: "Video",
            isNew: true,
            fileUri: asset.uri,
          },
        ]);
      }
    } catch (error) {
      console.error("Error picking video:", error);
      Alert.alert("Error", "Failed to add video. Please try again.");
    }
  };

  // Handle removing media
  const handleRemoveMedia = (id: string) => {
    Alert.alert(
      "Remove Media",
      "Are you sure you want to remove this media item from your registration?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setMediaItems((prevItems) =>
              prevItems.filter((item) => item.id !== id)
            );
          },
        },
      ]
    );
  };

  // Preview media in fullscreen
  const handlePreviewMedia = (item: MediaItem) => {
    setPreviewMedia(item);
    setShowPreview(true);
  };

  // Submit registration
  const handleSubmit = async () => {
    // Validation
    if (!isChecked) {
      Alert.alert("Cần xác nhận", "Vui lòng chấp nhận điều khoản để tiếp tục");
      return;
    }

    if (!selectedKoiProfile) {
      Alert.alert("Cần lựa chọn", "Vui lòng chọn hoặc tạo một koi profile");
      return;
    }

    if (!showId) {
      Alert.alert("Lỗi", "ID cuộc thi không tồn tại. Vui lòng quay lại và thử lại.");
      return;
    }

    if (!selectedCategory) {
      Alert.alert("Lỗi", "Không tìm thấy hạng mục phù hợp cho koi của bạn");
      return;
    }

    // Kiểm tra có ít nhất một ảnh và một video
    const hasImages = mediaItems.some(item => item.mediaType === 'Image');
    const hasVideos = mediaItems.some(item => item.mediaType === 'Video');

    if (!hasImages || !hasVideos) {
      Alert.alert(
        "Thiếu media",
        `Đăng ký cần có ít nhất một ${!hasImages ? 'ảnh' : ''}${(!hasImages && !hasVideos) ? ' và ' : ''}${!hasVideos ? 'video' : ''}.`
      );
      return;
    }

    if (mediaItems.length === 0) {
      Alert.alert(
        "Cần media",
        "Cần ít nhất một hình ảnh hoặc video để đăng ký"
      );
      return;
    }

    try {
      setLoading(true);
      setUploadProgress(0);
      setProcessingStep("Đang chuẩn bị đăng ký...");

      // Create form data
      const formData = new FormData();
      formData.append('KoiShowId', showId);
      formData.append('CompetitionCategoryId', selectedCategory.id);
      formData.append('KoiProfileId', selectedKoiProfile.id);
      formData.append('RegisterName', koiName);
      formData.append('Notes', koiDescription);

      // Log registration parameters
      console.log('Registration Parameters:', {
        KoiShowId: showId,
        CompetitionCategoryId: selectedCategory.id,
        KoiProfileId: selectedKoiProfile.id,
        RegisterName: koiName,
        Notes: koiDescription,
        Size: koiSize,
        Category: selectedCategory.name,
        MediaItems: mediaItems.map(item => ({
          id: item.id,
          type: item.mediaType,
          isNew: item.isNew,
          url: item.mediaUrl
        }))
      });

      // Xử lý media files
      setProcessingStep("Đang xử lý media...");
      
      // Lưu số lượng media để tính tiến trình
      const totalMediaItems = mediaItems.length;
      let processedItems = 0;
      
      // Theo dõi việc có thêm đủ ảnh và video không
      let addedImages = 0;
      let addedVideos = 0;
      
      for (const item of mediaItems) {
        try {
          if (item.isNew && item.fileUri) {
            // Nếu là file mới được thêm vào
            if (item.mediaType === 'Image') {
              formData.append('RegistrationImages', {
                uri: item.fileUri,
                type: 'image/jpeg',
                name: `image_${item.id}.jpg`
              } as any);
              addedImages++;
              console.log(`Added new image: ${item.id} (${addedImages} images total)`);
            } else {
              formData.append('RegistrationVideos', {
                uri: item.fileUri,
                type: 'video/mp4',
                name: `video_${item.id}.mp4`
              } as any);
              addedVideos++;
              console.log(`Added new video: ${item.id} (${addedVideos} videos total)`);
            }
          } else {
            try {
              // Nếu là file từ profile, tải về và chuyển đổi thành file
              setProcessingStep(`Đang tải ${item.mediaType.toLowerCase()} từ profile...`);
              
              const response = await fetch(item.mediaUrl);
              if (!response.ok) {
                throw new Error(`Failed to fetch media: ${response.status} ${response.statusText}`);
              }
              
              const blob = await response.blob();
              
              if (item.mediaType === 'Image') {
                formData.append('RegistrationImages', {
                  uri: item.mediaUrl,
                  type: 'image/jpeg',
                  name: `image_${item.id}.jpg`
                } as any);
                addedImages++;
                console.log(`Added profile image: ${item.id} (${addedImages} images total)`);
              } else {
                formData.append('RegistrationVideos', {
                  uri: item.mediaUrl,
                  type: 'video/mp4',
                  name: `video_${item.id}.mp4`
                } as any);
                addedVideos++;
                console.log(`Added profile video: ${item.id} (${addedVideos} videos total)`);
              }
            } catch (mediaError) {
              console.error(`Error processing media from profile (${item.id}):`, mediaError);
              Alert.alert(
                "Cảnh báo",
                `Không thể tải ${item.mediaType === 'Image' ? 'ảnh' : 'video'} từ profile. Bạn có muốn tiếp tục mà không có nó không?`,
                [
                  { 
                    text: "Hủy đăng ký", 
                    style: "cancel",
                    onPress: () => {
                      setLoading(false);
                      setProcessingStep("");
                      setUploadProgress(0);
                    }
                  },
                  { text: "Tiếp tục", onPress: () => console.log("Continuing without media") }
                ]
              );
              // Vẫn tiếp tục với các item khác nếu người dùng chọn "Tiếp tục"
              continue;
            }
          }
          
          // Cập nhật tiến trình
          processedItems++;
          setUploadProgress((processedItems / totalMediaItems) * 50); // Dành 50% cho xử lý media
          
        } catch (error) {
          console.error(`Error processing media item ${item.id}:`, error);
        }
      }

      // Kiểm tra một lần nữa xem đã thêm đủ ảnh và video chưa
      if (addedImages === 0 || addedVideos === 0) {
        setLoading(false);
        setProcessingStep("");
        setUploadProgress(0);
        Alert.alert(
          "Thiếu media",
          `Không thể hoàn thành đăng ký vì ${addedImages === 0 ? 'không có ảnh' : ''}${(addedImages === 0 && addedVideos === 0) ? ' và ' : ''}${addedVideos === 0 ? 'không có video' : ''}.`,
          [{ text: "OK" }]
        );
        return;
      }

      // Log FormData contents
      console.log('FormData contents:', {
        KoiShowId: formData.get('KoiShowId'),
        CompetitionCategoryId: formData.get('CompetitionCategoryId'),
        KoiProfileId: formData.get('KoiProfileId'),
        RegisterName: formData.get('RegisterName'),
        Notes: formData.get('Notes'),
        RegistrationImages: formData.getAll('RegistrationImages'),
        RegistrationVideos: formData.getAll('RegistrationVideos')
      });

      // Submit registration
      setProcessingStep("Đang tạo đăng ký...");
      setUploadProgress(60);
      
      const registerResponse = await createRegistration(formData);
      console.log('Registration response:', registerResponse);
      
      setUploadProgress(80);
      setProcessingStep("Đăng ký thành công, đang chuẩn bị thanh toán...");

      // Tiến hành thanh toán sau khi đăng ký thành công
      if (registerResponse?.data?.id) {
        try {
          const registrationId = registerResponse.data.id;
          
          // Gọi API thanh toán
          const checkoutResponse = await checkoutRegistration(registrationId);
          console.log('Checkout response:', checkoutResponse);
          
          if (checkoutResponse?.data?.url) {
            // Hiển thị modal thanh toán với URL nhận được
            setPaymentUrl(checkoutResponse.data.url);
            setPaymentModalVisible(true);
            
            // Đặt timeout cho phiên thanh toán (15 phút)
            const paymentTimeout = setTimeout(() => {
              if (paymentModalVisible) {
                setPaymentModalVisible(false);
                Alert.alert(
                  "Phiên thanh toán hết hạn",
                  "Phiên thanh toán của bạn đã hết hạn. Vui lòng thử lại."
                );
              }
            }, 15 * 60 * 1000);
            
            // Lưu ID timeout để có thể xóa nếu cần
            setPaymentTimeoutId(paymentTimeout);
          } else {
            throw new Error('Không nhận được URL thanh toán');
          }
        } catch (paymentError) {
          console.error('Payment error:', paymentError);
          Alert.alert(
            "Lỗi thanh toán",
            "Không thể khởi tạo thanh toán. Vui lòng thử lại sau."
          );
        }
      } else {
        // Nếu không có ID đăng ký, hiển thị thông báo thành công nhưng không thanh toán
        Alert.alert(
          "Đăng ký thành công",
          "Koi của bạn đã được đăng ký tham gia cuộc thi, nhưng không thể khởi tạo thanh toán.",
          [
            {
              text: "OK",
              onPress: () => router.push("/(tabs)/shows/ConfirmRegister"),
            },
          ]
        );
      }
      
      setUploadProgress(100);
    } catch (error) {
      console.error("Đăng ký thất bại", error);
      
      // Mặc định thông báo lỗi
      let errorMessage = "Không thể hoàn tất đăng ký. Vui lòng thử lại.";
      
      // Cố gắng trích xuất thông báo lỗi cụ thể từ đối tượng lỗi
      try {
        // Chuyển đổi error thành any để truy cập các thuộc tính
        const err = error as any;
        
        // Kiểm tra các dạng lỗi khác nhau
        if (err.response?.data?.Error) {
          // Định dạng: {StatusCode: 400, Error: "...", TimeStamp: "..."}
          errorMessage = err.response.data.Error;
        } else if (err.response?.data?.errors) {
          // Định dạng: {errors: {...}} (từ validation)
          const errorValues = Object.values(err.response.data.errors);
          if (Array.isArray(errorValues) && errorValues.length > 0) {
            const flatErrors = errorValues.flat();
            if (flatErrors.length > 0) {
              errorMessage = flatErrors.join('\n');
            }
          }
        } else if (err.response?.data?.message) {
          // Định dạng: {message: "..."}
          errorMessage = err.response.data.message;
        } else if (typeof err.response?.data === 'string') {
          // Định dạng: string trực tiếp
          errorMessage = err.response.data;
        } else if (err.message) {
          // Lỗi JavaScript thông thường
          errorMessage = err.message;
        }
        
        console.log('Thông báo lỗi đã xử lý:', errorMessage);
      } catch (parseError) {
        console.error('Lỗi khi xử lý thông báo lỗi:', parseError);
        // Giữ nguyên thông báo lỗi mặc định
      }
      
      Alert.alert(
        "Đăng ký thất bại",
        errorMessage
      );
    } finally {
      setLoading(false);
      setProcessingStep("");
      setUploadProgress(0);
    }
  };

  // Render dropdown items for koi selection
  const renderKoiDropdownItems = () => {
    if (koiProfiles.length === 0) {
      return <Text style={styles.dropdownText}>Không có hồ sơ koi nào</Text>;
    }

    return (
      <ScrollView nestedScrollEnabled={true} style={{maxHeight: 200}}>
        {koiProfiles.map((profile) => (
          <TouchableOpacity
            key={profile.id}
            style={styles.dropdownItem}
            onPress={() => handleKoiSelection(profile.id)}>
            <View style={styles.dropdownItemContent}>
              {profile.koiMedia && profile.koiMedia.length > 0 && profile.koiMedia[0].mediaType === "Image" ? (
                <Image 
                  source={{ uri: profile.koiMedia[0].mediaUrl }} 
                  style={styles.dropdownItemImage}
                />
              ) : (
                <View style={styles.dropdownItemImagePlaceholder}>
                  <Text style={styles.dropdownItemImagePlaceholderText}>Koi</Text>
                </View>
              )}
              <View style={styles.dropdownItemDetails}>
                <Text style={styles.dropdownItemName}>{profile.name}</Text>
                <Text style={styles.dropdownItemInfo}>{profile.variety.name}, {profile.size}cm</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  // Render media item for the list
  const renderMediaItem = ({ item }: { item: MediaItem }) => (
    <View style={styles.mediaItemContainer}>
      <TouchableOpacity
        style={styles.mediaThumbnail}
        onPress={() => handlePreviewMedia(item)}>
        {item.mediaType === "Image" ? (
          <Image
            source={{ uri: item.mediaUrl }}
            style={styles.mediaThumbnailImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.videoThumbnailContainer}>
            <Image
              source={{ uri: item.mediaUrl }}
              style={styles.mediaThumbnailImage}
              resizeMode={ResizeMode.CONTAIN}
            />
            <View style={styles.videoPlayIconOverlay}>
              <Text style={styles.videoPlayIcon}>▶</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.mediaItemDetails}>
        <Text style={styles.mediaItemType}>
          {item.mediaType} {item.isNew ? "(New)" : ""}
        </Text>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveMedia(item.id)}>
          <Text style={styles.removeButtonText}>Xóa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render media list manually to avoid nesting FlatList in ScrollView
  const renderMediaList = () => {
    // Kiểm tra có ảnh và video
    const hasImages = mediaItems.some(item => item.mediaType === 'Image');
    const hasVideos = mediaItems.some(item => item.mediaType === 'Video');
    
    if (mediaItems.length === 0) {
      return (
        <View>
          <Text style={styles.noMediaText}>
            Chưa có ảnh hoặc video. Vui lòng thêm.
          </Text>
          <Text style={styles.mediaRequirement}>
            * Đăng ký cần có ít nhất một ảnh và một video của Koi
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.mediaList}>
        <View style={styles.mediaRequirementContainer}>
          <Text style={[styles.mediaRequirement, {color: hasImages ? '#4CAF50' : '#F44336'}]}>
            {hasImages ? '✓ Đã có ít nhất một ảnh' : '✗ Cần thêm ít nhất một ảnh'}
          </Text>
          <Text style={[styles.mediaRequirement, {color: hasVideos ? '#4CAF50' : '#F44336'}]}>
            {hasVideos ? '✓ Đã có ít nhất một video' : '✗ Cần thêm ít nhất một video'}
          </Text>
        </View>
        <FlatList
          data={mediaItems}
          renderItem={renderMediaItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ListFooterComponent={<View style={{ height: 10 }} />}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      </View>
    );
  };

  // Render category info
  const renderCategoryInfo = () => {
    if (!selectedCategory) {
      // Hiển thị lỗi nếu không tìm thấy hạng mục phù hợp và có thông báo lỗi
      if (formErrors.category) {
        return (
          <View style={styles.categoryInfoError}>
            <Text style={styles.categoryTitleError}>Thông báo</Text>
            <Text style={styles.categoryErrorText}>{formErrors.category}</Text>
            <View style={styles.categoryErrorTips}>
              <Text style={styles.categoryErrorTipsText}>Gợi ý: Bạn có thể điều chỉnh kích thước Koi để tìm hạng mục phù hợp khác.</Text>
            </View>
          </View>
        );
      }
      return null;
    }
    
    return (
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryTitle}>Hạng Mục Phù Hợp</Text>
        <View style={styles.categoryContent}>
          <View style={styles.categoryRow}>
            <Text style={styles.categoryLabel}>Tên hạng mục:</Text>
            <Text style={styles.categoryValue}>{selectedCategory.name}</Text>
          </View>
          <View style={styles.categoryRow}>
            <Text style={styles.categoryLabel}>Kích thước:</Text>
            <Text style={styles.categoryValue}>{selectedCategory.sizeMin} - {selectedCategory.sizeMax} cm</Text>
          </View>
          <View style={styles.categoryRow}>
            <Text style={styles.categoryLabel}>Phí đăng ký:</Text>
            <Text style={styles.categoryValueFee}>{selectedCategory.registrationFee.toLocaleString('vi-VN')} đ</Text>
          </View>
          <View style={styles.categorySuitableIndicator}>
            <Text style={styles.categorySuitableText}>✓ Phù hợp với Koi của bạn</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render skeleton loading states
  const renderSkeleton = () => {
    if (!isLoadingProfile) return null;

    return (
      <View style={styles.section}>
        <Skeleton width="100%" height={50} style={styles.skeletonInput} />
        <Skeleton width="100%" height={50} style={styles.skeletonInput} />
        <Skeleton width="100%" height={50} style={styles.skeletonInput} />
        <Skeleton width="100%" height={120} style={styles.skeletonInput} />
      </View>
    );
  };

  // Render category skeleton
  const renderCategorySkeleton = () => {
    if (!isLoadingCategory) return null;

    return (
      <View style={styles.categoryInfo}>
        <Skeleton width={200} height={24} style={styles.skeletonTitle} />
        <Skeleton width="100%" height={20} style={styles.skeletonText} />
        <Skeleton width="100%" height={20} style={styles.skeletonText} />
        <Skeleton width="100%" height={20} style={styles.skeletonText} />
      </View>
    );
  };

  // Handle adding images for new koi profile
  const handleAddNewImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          "Yêu cầu quyền truy cập",
          "Vui lòng cho phép truy cập thư viện ảnh để tải lên hình ảnh."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newId = `new-image-${Date.now()}`;

        setNewKoiMedia((prevItems) => [
          ...prevItems,
          {
            id: newId,
            mediaUrl: asset.uri,
            mediaType: "Image",
            isNew: true,
            fileUri: asset.uri,
          },
        ]);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Lỗi", "Không thể thêm hình ảnh. Vui lòng thử lại.");
    }
  };

  // Handle adding videos for new koi profile
  const handleAddNewVideo = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          "Yêu cầu quyền truy cập",
          "Vui lòng cho phép truy cập thư viện ảnh để tải lên video."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newId = `new-video-${Date.now()}`;

        setNewKoiMedia((prevItems) => [
          ...prevItems,
          {
            id: newId,
            mediaUrl: asset.uri,
            mediaType: "Video",
            isNew: true,
            fileUri: asset.uri,
          },
        ]);
      }
    } catch (error) {
      console.error("Error picking video:", error);
      Alert.alert("Lỗi", "Không thể thêm video. Vui lòng thử lại.");
    }
  };

  // Handle removing media for new koi profile
  const handleRemoveNewMedia = (id: string) => {
    Alert.alert(
      "Xóa",
      "Bạn có chắc chắn muốn xóa mục này?",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => {
            setNewKoiMedia((prevItems) =>
              prevItems.filter((item) => item.id !== id)
            );
          },
        },
      ]
    );
  };

  // Validate new profile data
  const validateNewProfile = () => {
    // Tạo một object chứa lỗi
    const errors: { [key: string]: string } = {};
    let isValid = true;
    
    if (!selectedVariety) {
      errors.variety = "Vui lòng chọn giống koi";
      isValid = false;
    }
    
    if (!newKoiName.trim()) {
      errors.name = "Vui lòng nhập tên koi";
      isValid = false;
    }
    
    const size = parseFloat(newKoiSize);
    if (isNaN(size) || size <= 0) {
      errors.size = "Kích thước phải là số dương";
      isValid = false;
    } else if (size < 15 || size > 75) {
      errors.size = "Kích thước phải từ 15 đến 75 cm";
      isValid = false;
    }
    
    const age = parseInt(newKoiAge);
    if (isNaN(age) || age <= 0) {
      errors.age = "Tuổi phải là số nguyên dương";
      isValid = false;
    }
    
    if (!newKoiGender) {
      errors.gender = "Vui lòng chọn giới tính koi";
      isValid = false;
    }
    
    if (!newKoiBloodline.trim()) {
      errors.bloodline = "Vui lòng nhập dòng máu koi";
      isValid = false;
    }
    
    if (newKoiMedia.length === 0) {
      errors.media = "Vui lòng thêm ít nhất một ảnh hoặc video";
      isValid = false;
    }
    
    // Nếu có lỗi, hiển thị cảnh báo với thông tin cụ thể
    if (!isValid) {
      // Tạo thông báo lỗi từ object errors
      const errorMessages = Object.values(errors).join('\n');
      Alert.alert("Thông tin không hợp lệ", errorMessages);
    }
    
    return isValid;
  };

  // Create new koi profile
  const handleCreateProfile = async () => {
    if (!validateNewProfile()) return;
    
    try {
      setIsCreatingProfile(true);
      setLoading(true);
      setProcessingStep("Đang tạo hồ sơ koi mới...");
      
      // Create form data
      const formData = new FormData();
      formData.append('VarietyId', selectedVariety!.id);
      formData.append('Name', newKoiName);
      formData.append('Size', newKoiSize);
      formData.append('Age', newKoiAge);
      formData.append('Gender', newKoiGender);
      formData.append('Bloodline', newKoiBloodline);
      formData.append('Status', 'Active');
      
      // Add media files
      for (const item of newKoiMedia) {
        if (item.fileUri) {
          if (item.mediaType === 'Image') {
            formData.append('KoiImages', {
              uri: item.fileUri,
              type: 'image/jpeg',
              name: `image_${item.id}.jpg`
            } as any);
          } else {
            formData.append('KoiVideos', {
              uri: item.fileUri,
              type: 'video/mp4',
              name: `video_${item.id}.mp4`
            } as any);
          }
        }
      }
      
      // Create profile
      console.log('Calling createKoiProfile API with form data');
      const response = await createKoiProfile(formData);
      console.log('Created profile:', response);
      
      if (response.data) {
        const profile = response.data;
        
        // Cập nhật cả ref và state
        profileRef.current = profile;
        
        // Cập nhật state với dữ liệu từ profile
        setSelectedKoiProfile(profile);
        setKoiName(profile.name);
        setKoiSize(profile.size.toString());
        setKoiVariety(profile.variety?.name || '');
        setKoiDescription(profile.bloodline || '');
        
        // Kiểm tra trước khi cập nhật media
        if (profile.koiMedia && Array.isArray(profile.koiMedia)) {
          setMediaItems(
            profile.koiMedia.map((media: any) => ({
              id: media.id,
              mediaUrl: media.mediaUrl,
              mediaType: media.mediaType,
            }))
          );
        }
        
        // Đợi state cập nhật (tăng thời gian đợi)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Log state sau khi cập nhật
        console.log('Updated profile ref:', profileRef.current);
        console.log('Updated size:', profile.size.toString());
        console.log('Updated variety:', profile.variety.id);
        
        // Tìm category phù hợp cho profile mới
        setProcessingStep("Đang tìm category phù hợp...");
        setIsLoadingCategory(true);
        
        console.log('Calling findSuitableCategory with params:', {
          koiShowId: showIdRef.current,
          varietyId: profile.variety.id,
          size: profile.size.toString()
        });
        
        try {
          const categoryResponse = await findSuitableCategory(
            showIdRef.current,
            profile.variety.id,
            profile.size.toString()
          );
          
          console.log('Category response for new profile:', categoryResponse);
          
          if (categoryResponse && categoryResponse.data) {
            setSelectedCategory(categoryResponse.data);
            setFormErrors(prev => ({ ...prev, category: '' }));
          } else {
            console.log('No suitable category found for new profile');
            setFormErrors(prev => ({ 
              ...prev, 
              category: 'Không tìm thấy category phù hợp cho koi mới' 
            }));
          }
        } catch (categoryError: any) {
          console.error('Error finding category for new profile:', categoryError);
          if (categoryError.response) {
            console.error('Error response:', categoryError.response.data);
          }
          setFormErrors(prev => ({ 
            ...prev, 
            category: 'Lỗi khi tìm category phù hợp cho koi mới' 
          }));
        } finally {
          setIsLoadingCategory(false);
        }
        
        // Reset new profile form
        setShowCreateForm(false);
        setSelectedVariety(null);
        setNewKoiName("");
        setNewKoiSize("");
        setNewKoiAge("");
        setNewKoiGender("Đực");
        setNewKoiBloodline("");
        setNewKoiMedia([]);
        
        Alert.alert(
          "Thành công",
          "Đã tạo hồ sơ koi mới. Bạn có thể tiếp tục đăng ký thi đấu."
        );
      }
    } catch (error) {
      console.error("Error creating koi profile:", error);
      Alert.alert(
        "Lỗi",
        "Không thể tạo hồ sơ koi. Vui lòng thử lại."
      );
    } finally {
      setIsCreatingProfile(false);
      setLoading(false);
      setProcessingStep("");
    }
  };

  // Toggle show create form
  const toggleCreateForm = () => {
    setShowCreateForm(!showCreateForm);
    if (!showCreateForm && varieties.length === 0) {
      loadVarieties();
    }
  };

  // Render dropdown items for variety selection
  const renderVarietyDropdownItems = () => {
    if (varieties.length === 0) {
      return <Text style={styles.dropdownText}>Không có dữ liệu</Text>;
    }

    return (
      <ScrollView nestedScrollEnabled={true} style={{maxHeight: 200}}>
        {varieties.map((variety) => (
          <TouchableOpacity
            key={variety.id}
            style={styles.dropdownItem}
            onPress={() => {
              setSelectedVariety(variety);
              setIsVarietyDropdownOpen(false);
            }}>
            <Text style={styles.dropdownText}>{variety.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  // Render dropdown items for gender selection
  const renderGenderDropdownItems = () => {
    const genders = ["Đực", "Cái"];
    return (
      <ScrollView nestedScrollEnabled={true}>
        {genders.map((gender) => (
          <TouchableOpacity
            key={gender}
            style={styles.dropdownItem}
            onPress={() => {
              setNewKoiGender(gender);
              setIsGenderDropdownOpen(false);
            }}>
            <Text style={styles.dropdownText}>{gender}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  // Render new koi media list
  const renderNewKoiMediaList = () => {
    if (newKoiMedia.length === 0) {
      return (
        <Text style={styles.noMediaText}>
          Chưa có ảnh hoặc video. Vui lòng thêm.
        </Text>
      );
    }

    return (
      <View style={styles.mediaList}>
        <FlatList
          data={newKoiMedia}
          renderItem={({ item }) => (
            <View key={item.id} style={styles.mediaItemContainer}>
              <TouchableOpacity
                style={styles.mediaThumbnail}
                onPress={() => handlePreviewMedia(item)}>
                {item.mediaType === "Image" ? (
                  <Image
                    source={{ uri: item.mediaUrl }}
                    style={styles.mediaThumbnailImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.videoThumbnailContainer}>
                    <Image
                      source={{ uri: item.mediaUrl }}
                      style={styles.mediaThumbnailImage}
                      resizeMode={ResizeMode.CONTAIN}
                    />
                    <View style={styles.videoPlayIconOverlay}>
                      <Text style={styles.videoPlayIcon}>▶</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.mediaItemDetails}>
                <Text style={styles.mediaItemType}>{item.mediaType}</Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveNewMedia(item.id)}>
                  <Text style={styles.removeButtonText}>Xóa</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ListFooterComponent={<View style={{ height: 10 }} />}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      </View>
    );
  };

  // Render create koi profile form
  const renderCreateProfileForm = () => {
    if (!showCreateForm) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tạo hồ sơ Koi mới</Text>
        
        {/* Variety Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Giống Koi</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setIsVarietyDropdownOpen(!isVarietyDropdownOpen)}
            disabled={isCreatingProfile}>
            <Text style={styles.dropdownText}>
              {selectedVariety ? selectedVariety.name : "Chọn giống Koi"}
            </Text>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z6I0Rqvsm-LWpeaP/frame-7.png",
              }}
              style={styles.dropdownIcon}
            />
          </TouchableOpacity>
          
          {isVarietyDropdownOpen && (
            <View style={styles.dropdownMenu}>
              {renderVarietyDropdownItems()}
            </View>
          )}
          
          {selectedVariety && (
            <Text style={styles.descriptionText}>{selectedVariety.description}</Text>
          )}
        </View>
        
        {/* Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tên Koi</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập tên Koi"
            placeholderTextColor="#94a3b8"
            value={newKoiName}
            onChangeText={setNewKoiName}
            editable={!isCreatingProfile}
          />
        </View>
        
        {/* Size */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Kích thước (cm)</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập kích thước"
            placeholderTextColor="#94a3b8"
            value={newKoiSize}
            onChangeText={setNewKoiSize}
            keyboardType="numeric"
            editable={!isCreatingProfile}
          />
        </View>
        
        {/* Age */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tuổi</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập tuổi"
            placeholderTextColor="#94a3b8"
            value={newKoiAge}
            onChangeText={setNewKoiAge}
            keyboardType="numeric"
            editable={!isCreatingProfile}
          />
        </View>
        
        {/* Gender */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Giới tính</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setIsGenderDropdownOpen(!isGenderDropdownOpen)}
            disabled={isCreatingProfile}>
            <Text style={styles.dropdownText}>{newKoiGender}</Text>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z6I0Rqvsm-LWpeaP/frame-7.png",
              }}
              style={styles.dropdownIcon}
            />
          </TouchableOpacity>
          
          {isGenderDropdownOpen && (
            <View style={styles.dropdownMenu}>
              {renderGenderDropdownItems()}
            </View>
          )}
        </View>
        
        {/* Bloodline */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Dòng máu</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập dòng máu"
            placeholderTextColor="#94a3b8"
            value={newKoiBloodline}
            onChangeText={setNewKoiBloodline}
            editable={!isCreatingProfile}
          />
        </View>
        
        {/* Media Gallery */}
        <View style={styles.mediaSection}>
          <Text style={styles.label}>Thư viện ảnh/video</Text>
          
          {renderNewKoiMediaList()}
          
          <View style={styles.mediaButtonsContainer}>
            <TouchableOpacity
              style={styles.mediaButton}
              onPress={handleAddNewImage}
              disabled={isCreatingProfile}>
              <Text style={styles.mediaButtonText}>Thêm ảnh</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.mediaButton}
              onPress={handleAddNewVideo}
              disabled={isCreatingProfile}>
              <Text style={styles.mediaButtonText}>Thêm video</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.createButton,
            isCreatingProfile && styles.submitButtonDisabled,
          ]}
          onPress={handleCreateProfile}
          disabled={isCreatingProfile}>
          <Text style={styles.createButtonText}>
            {isCreatingProfile ? "Đang xử lý..." : "Tạo hồ sơ Koi"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render banner
  const renderBanner = () => {
    if (!showBanner) return null;
    
    // Hiển thị skeleton loader khi đang tải
    if (!showInfo.name) {
      return (
        <View style={styles.bannerContainer}>
          <View style={styles.bannerImageSkeleton}>
            <Skeleton width="100%" height={200} />
          </View>
        </View>
      );
    }
    
    // Sử dụng hình ảnh mặc định nếu không có imgUrl từ API
    const bannerImageSource = showInfo.imgUrl 
      ? { uri: showInfo.imgUrl } 
      : { uri: "https://images.pexels.com/photos/219794/pexels-photo-219794.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" };
    
    return (
      <View style={styles.bannerContainer}>
        <Image
          source={bannerImageSource}
          style={styles.bannerImage}
          resizeMode="cover"
        />
        <View style={styles.bannerOverlay}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>{showInfo.name}</Text>
            <Text style={styles.bannerSubtitle}>{showInfo.location}</Text>
            <Text style={styles.bannerDate}>{showInfo.date}</Text>
            <Text style={styles.bannerDescription}>{showInfo.description}</Text>
            
            <TouchableOpacity 
              style={styles.bannerButton}
              onPress={() => setShowCategories(!showCategories)}
            >
              <Text style={styles.bannerButtonText}>
                {showCategories ? "Ẩn hạng mục" : "Xem hạng mục"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Render categories list - Thay đổi thành cuộn ngang
  const renderCategories = () => {
    if (!showCategories || categories.length === 0) return null;
    
    return (
      <View style={styles.categoriesContainer}>
        <View style={styles.categoriesHeader}>
          <Text style={styles.categoriesTitle}>Các Hạng Mục Thi Đấu</Text>
          <Text style={styles.categoriesSubtitle}>
            Tự động chọn hạng mục phù hợp theo kích thước và giống Koi
          </Text>
        </View>
        
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item: category }) => {
            // Kiểm tra xem hạng mục có phải là hạng mục được chọn không
            const isSelected = selectedCategory && selectedCategory.id === category.id;
            
            return (
              <View 
                style={[
                  styles.categoryCard,
                  isSelected && styles.categoryCardSelected
                ]}
              >
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                </View>
                
                <View style={styles.categoryFeeContainer}>
                  <Text style={styles.categoryFeeLabel}>Phí:</Text>
                  <Text style={styles.categoryFee}>{category.registrationFee.toLocaleString('vi-VN')} đ</Text>
                </View>
                
                <View style={styles.categoryDetailsContainer}>
                  <View style={styles.categoryDetailItem}>
                    <Text style={styles.categoryDetailLabel}>Kích thước:</Text>
                    <Text style={styles.categoryDetailValue}>{category.sizeMin} - {category.sizeMax} cm</Text>
                  </View>
                  
                  <View style={styles.categoryDetailItem}>
                    <Text style={styles.categoryDetailLabel}>Số lượng tối đa:</Text>
                    <Text style={styles.categoryDetailValue}>{category.maxEntries} Koi</Text>
                  </View>
                </View>
                
                {category.description && (
                  <Text style={styles.categoryDescription}>{category.description}</Text>
                )}
                
                {category.varieties && category.varieties.length > 0 && (
                  <View style={styles.varietiesContainer}>
                    <Text style={styles.varietiesTitle}>Giống Koi được phép:</Text>
                    <View style={styles.varietiesList}>
                      {category.varieties.map((variety, index) => (
                        <View key={index} style={styles.varietyTag}>
                          <Text style={styles.varietyTagText}>{variety}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                
                {isSelected && (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>Đã chọn</Text>
                  </View>
                )}
              </View>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      </View>
    );
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (paymentTimeoutId) {
        clearTimeout(paymentTimeoutId);
      }
    };
  }, [paymentTimeoutId]);

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.leftSection}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.rightSection}>
            <TouchableOpacity style={styles.searchIconContainer}>
              <Image
                source={{
                  uri: "https://dashboard.codeparrot.ai/api/image/Z6I0Rqvsm-LWpeaP/frame-3.png",
                }}
                style={styles.searchIcon}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileContainer}>
              <Image
                source={{
                  uri: "https://dashboard.codeparrot.ai/api/image/Z6I0Rqvsm-LWpeaP/group-6.png",
                }}
                style={styles.profileImage}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Banner */}
        {renderBanner()}

        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#5664F5" />
              <Text style={styles.loadingText}>
                {processingStep || "Đang tải..."}
              </Text>
              {uploadProgress > 0 && (
                <View style={styles.progressContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${uploadProgress}%` },
                    ]}
                  />
                  <Text style={styles.progressText}>{`${Math.round(
                    uploadProgress
                  )}%`}</Text>
                </View>
              )}
              {uploadProgress === 100 && (
                <View style={styles.successIndicator}>
                  <Text style={styles.successText}>✓</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Đăng ký Koi tham gia thi đấu</Text>
          </View>

          {/* Categories List */}
          {renderCategories()}

          {/* Koi Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chọn Koi của bạn</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={isLoadingProfile}>
              <Text style={styles.dropdownText}>
                {selectedKoiProfile ? selectedKoiProfile.name : "Chọn một Koi"}
              </Text>
              <Image
                source={{
                  uri: "https://dashboard.codeparrot.ai/api/image/Z6I0Rqvsm-LWpeaP/frame-7.png",
                }}
                style={styles.dropdownIcon}
              />
            </TouchableOpacity>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <View style={styles.dropdownMenu}>
                {renderKoiDropdownItems()}
              </View>
            )}

            <TouchableOpacity onPress={toggleCreateForm}>
              <Text style={styles.addNewText}>
                {showCreateForm ? "Ẩn form tạo Koi mới" : "Hoặc tạo Koi mới"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Create Profile Form */}
          {renderCreateProfileForm()}

          {/* Koi Details - only show if a profile is selected and create form is hidden */}
          {selectedKoiProfile && !showCreateForm && (
            <>
              {isLoadingProfile ? (
                renderSkeleton()
              ) : (
                <View style={styles.section}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Tên Koi</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Tên Koi của bạn"
                      placeholderTextColor="#94a3b8"
                      value={koiName}
                      onChangeText={setKoiName}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Kích thước Koi</Text>
                    <View style={styles.formRow}>
                      <View style={styles.sizeInputContainer}>
                        <TextInput
                          style={styles.sizeInput}
                          placeholder="Nhập kích thước"
                          placeholderTextColor="#94a3b8"
                          value={koiSize}
                          onChangeText={setKoiSize}
                          onBlur={() => handleSizeChange(koiSize)}
                          keyboardType="numeric"
                        />
                        <View style={styles.sizeUnit}>
                          <Text style={styles.sizeUnitText}>cm</Text>
                        </View>
                      </View>
                    </View>
                    {formErrors.size ? (
                      <Text style={styles.errorText}>{formErrors.size}</Text>
                    ) : (
                      <Text style={styles.sizeHint}>Kích thước hợp lệ: 15-75 cm</Text>
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Giống Koi</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Giống"
                      placeholderTextColor="#94a3b8"
                      value={koiVariety}
                      onChangeText={setKoiVariety}
                      editable={false}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Mô tả Koi</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      multiline={true}
                      numberOfLines={4}
                      placeholder="Nhập mô tả"
                      placeholderTextColor="#94a3b8"
                      value={koiDescription}
                      onChangeText={setKoiDescription}
                    />
                  </View>
                </View>
              )}

              {/* Media Management Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Thư viện ảnh/video</Text>
                {renderMediaList()}
                <View style={styles.mediaButtonsContainer}>
                  <TouchableOpacity
                    style={styles.mediaButton}
                    onPress={handleAddImage}>
                    <Text style={styles.mediaButtonText}>Thêm ảnh</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.mediaButton}
                    onPress={handleAddVideo}>
                    <Text style={styles.mediaButtonText}>Thêm video</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Category Info */}
              {isLoadingCategory ? (
                renderCategorySkeleton()
              ) : (
                renderCategoryInfo()
              )}
            </>
          )}

          {/* Agreement Section - only show if a profile is selected */}
          {selectedKoiProfile && (
            <View style={styles.section}>
              <View style={styles.rulesContainer}>
                <Text style={styles.rulesText}>
                  Read the full details of all rules and regulations
                </Text>
              </View>

              <View style={styles.agreementContainer}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setIsChecked(!isChecked)}>
                  {isChecked && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>

                <Text style={styles.termsText}>
                  By clicking register, you confirm that you have read and will
                  comply with our rules.
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!isChecked ||
                    !selectedKoiProfile ||
                    loading ||
                    mediaItems.length === 0) &&
                    styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={
                  !isChecked ||
                  !selectedKoiProfile ||
                  loading ||
                  mediaItems.length === 0
                }>
                <Text style={styles.submitText}>
                  {loading ? "Processing..." : "Submit Registration"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Media Preview Modal */}
        <Modal
          visible={showPreview}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowPreview(false)}>
          <View style={styles.previewModal}>
            <TouchableOpacity
              style={styles.closePreviewButton}
              onPress={() => setShowPreview(false)}>
              <Text style={styles.closePreviewText}>✕</Text>
            </TouchableOpacity>

            {previewMedia?.mediaType === "Image" ? (
              <Image
                source={{ uri: previewMedia.mediaUrl }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            ) : previewMedia?.mediaType === "Video" ? (
              <Video
                source={{ uri: previewMedia.mediaUrl }}
                style={styles.previewVideo}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
                isLooping
              />
            ) : null}
          </View>
        </Modal>

        {/* Payment Modal */}
        <PaymentModal
          visible={paymentModalVisible}
          paymentUrl={paymentUrl}
          onClose={() => setPaymentModalVisible(false)}
          paymentTimeoutId={paymentTimeoutId}
          setPaymentTimeoutId={setPaymentTimeoutId}
        />

      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  backText: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "700",
    color: "#030303",
  },
  searchIconContainer: {
    marginRight: 8,
    padding: 4,
  },
  searchIcon: {
    width: 13,
    height: 13,
  },
  profileContainer: {
    padding: 4,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  titleSection: {
    padding: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    marginBottom: 16,
  },
  title: {
    fontFamily: "Lexend Deca",
    fontSize: 22,
    fontWeight: "700",
    color: "#000000",
  },
  mainContent: {
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionTitle: {
    fontFamily: "Lexend Deca",
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 12,
  },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 50,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  dropdownText: {
    fontFamily: "Roboto",
    fontSize: 14,
    color: "#64748B",
  },
  dropdownIcon: {
    width: 20,
    height: 20,
  },
  dropdownMenu: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#D0D3F5",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    maxHeight: 200,
    zIndex: 1000,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  dropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownItemImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  dropdownItemImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dropdownItemImagePlaceholderText: {
    fontSize: 12,
    color: '#64748B',
  },
  dropdownItemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  dropdownItemName: {
    fontFamily: "Roboto",
    fontSize: 14,
    fontWeight: '500',
    color: "#030303",
  },
  dropdownItemInfo: {
    fontFamily: "Roboto",
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  addNewText: {
    fontFamily: "Roboto",
    fontSize: 12,
    color: "#5664F5",
    marginTop: 8,
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: "Roboto",
    fontSize: 15,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 8,
  },
  input: {
    height: 50,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    fontFamily: "Roboto",
    fontSize: 14,
    color: "#000000",
  },
  textArea: {
    height: 120,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: "top",
  },
  // Media list styles
  mediaList: {
    marginBottom: 16,
  },
  noMediaText: {
    fontFamily: "Roboto",
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 10,
  },
  mediaItemContainer: {
    flexDirection: "row",
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  mediaThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
  },
  mediaThumbnailImage: {
    width: "100%",
    height: "100%",
  },
  videoThumbnailContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  videoPlayIconOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  videoPlayIcon: {
    color: "#FFFFFF",
    fontSize: 24,
  },
  mediaItemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  mediaItemType: {
    fontFamily: "Roboto",
    fontSize: 14,
    fontWeight: "500",
    color: "#030303",
  },
  removeButton: {
    alignSelf: "flex-start",
    padding: 6,
    backgroundColor: "#EF4444",
    borderRadius: 4,
  },
  removeButtonText: {
    fontFamily: "Roboto",
    fontSize: 12,
    color: "#FFFFFF",
  },
  // Media buttons
  mediaButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  mediaButton: {
    flex: 1,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#5664F5",
    borderRadius: 8,
    marginHorizontal: 4,
  },
  mediaButtonText: {
    fontFamily: "Roboto",
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  // Preview modal
  previewModal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height * 0.8,
  },
  previewVideo: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height * 0.5,
  },
  closePreviewButton: {
    position: "absolute",
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  closePreviewText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  // Agreement section
  rulesContainer: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#D0D3F5",
    borderRadius: 8,
    backgroundColor: "#F8F9FA",
    marginBottom: 16,
  },
  rulesText: {
    fontFamily: "Roboto",
    fontSize: 14,
    color: "#5664F5",
    textAlign: "center",
  },
  agreementContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#5664F5",
    borderRadius: 4,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  checkmark: {
    color: "#5664F5",
    fontWeight: "bold",
  },
  termsText: {
    flex: 1,
    fontFamily: "Roboto",
    fontSize: 12,
    color: "#030303",
  },
  submitButton: {
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#5664F5",
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#A0A0A0",
  },
  submitText: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // Footer
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  iconContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  iconWrapper: {
    padding: 8,
  },
  footerIcon: {
    width: 24,
    height: 24,
  },
  // Loading overlay styles
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingContainer: {
    padding: 20,
    borderRadius: 8,
    backgroundColor: "white",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minWidth: 200,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#333",
    textAlign: "center",
  },
  progressContainer: {
    marginTop: 10,
    width: "100%",
    height: 10,
    backgroundColor: "#E0E0E0",
    borderRadius: 5,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#5664F5",
  },
  progressText: {
    marginTop: 5,
    fontSize: 12,
    color: "#333",
    textAlign: "center",
  },
  successIndicator: {
    marginTop: 10,
    width: 40,
    height: 40, 
    borderRadius: 20,
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
  },
  successText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  // Category info styles
  categoryInfo: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  categoryTitle: {
    fontFamily: "Lexend Deca",
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 12,
  },
  errorText: {
    color: "#EF4444",
    fontFamily: "Roboto",
    fontSize: 12,
    marginTop: 4,
  },
  skeletonInput: {
    marginBottom: 16,
  },
  skeletonTitle: {
    marginBottom: 12,
  },
  skeletonText: {
    marginBottom: 8,
  },
  // New styles for the creation form
  descriptionText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
    fontStyle: "italic",
  },
  mediaSection: {
    marginTop: 16,
  },
  createButton: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#22C55E",
    marginTop: 20,
  },
  createButtonText: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  bannerContainer: {
    position: "relative",
    height: 200,
  },
  bannerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  bannerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  bannerContent: {
    padding: 16,
  },
  bannerTitle: {
    fontFamily: "Lexend Deca",
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 10,
  },
  bannerSubtitle: {
    fontFamily: "Roboto",
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  bannerDate: {
    fontFamily: "Roboto",
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  bannerDescription: {
    fontFamily: "Roboto",
    fontSize: 14,
    color: "#FFFFFF",
  },
  bannerButton: {
    padding: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    marginTop: 12,
  },
  bannerButtonText: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "600",
    color: "#5664F5",
  },
  categoriesContainer: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  categoriesHeader: {
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#5664F5",
    paddingLeft: 10,
  },
  categoriesTitle: {
    fontFamily: "Lexend Deca",
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  categoryCard: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    width: 270,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginVertical: 4,
  },
  categoryCardSelected: {
    borderColor: "#5664F5",
    borderWidth: 2,
    backgroundColor: "#F9FAFF",
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 6,
  },
  categoryFeeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#991B1B',
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
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  categoryDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  categoryDetailLabel: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  categoryDetailValue: {
    fontSize: 13,
    color: '#000000',
    fontWeight: '500',
  },
  varietiesContainer: {
    marginTop: 8,
  },
  varietiesTitle: {
    fontFamily: "Lexend Deca",
    fontSize: 16,
    fontWeight: "600",
    color: "#030303",
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
  selectionModeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  selectionModeLabel: {
    fontFamily: "Roboto",
    fontSize: 14,
    fontWeight: "500",
    color: "#030303",
    marginRight: 8,
  },
  selectionModeOptions: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectionModeOption: {
    padding: 8,
    borderWidth: 1,
    borderColor: "#D0D3F5",
    borderRadius: 4,
    marginRight: 4,
  },
  selectionModeOptionActive: {
    backgroundColor: "#5664F5",
    borderColor: "#5664F5",
  },
  selectionModeOptionText: {
    fontFamily: "Roboto",
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
  },
  selectionModeOptionTextActive: {
    color: "#FFFFFF",
  },
  selectedBadge: {
    padding: 6,
    backgroundColor: "#5664F5",
    borderRadius: 4,
    marginTop: 12,
    alignItems: "center",
  },
  selectedBadgeText: {
    fontFamily: "Roboto",
    fontSize: 12,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  categoryInfoError: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#EF4444",
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
    marginBottom: 16,
  },
  categoryTitleError: {
    fontFamily: "Lexend Deca",
    fontSize: 18,
    fontWeight: "600",
    color: "#B91C1C",
    marginBottom: 12,
  },
  categoryErrorText: {
    fontFamily: "Roboto",
    fontSize: 14,
    color: "#B91C1C",
    marginBottom: 12,
  },
  manualSelectionButton: {
    backgroundColor: "#5664F5",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  manualSelectionButtonText: {
    fontFamily: "Roboto",
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  bannerImageSkeleton: {
    width: "100%",
    height: 200,
    backgroundColor: "#E2E8F0",
  },
  categorySelectionInfo: {
    fontSize: 14,
    color: "#64748B",
    fontStyle: "italic",
    marginBottom: 16,
    backgroundColor: "#f0f9ff",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#3498db",
  },
  categoryContent: {
    marginTop: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
  },
  categoryLabel: {
    color: '#64748B',
    fontSize: 14,
    fontFamily: 'Roboto',
  },
  categoryValue: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Roboto',
  },
  categoryValueFee: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Roboto',
  },
  categorySuitableIndicator: {
    backgroundColor: '#ECFDF5',
    padding: 8,
    borderRadius: 6,
    marginTop: 12,
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  categorySuitableText: {
    color: '#16A34A',
    fontWeight: '500',
    fontSize: 14,
  },
  categoriesSubtitle: {
    color: '#64748B',
    fontSize: 14,
    fontStyle: 'italic',
  },
  categoryErrorTips: {
    backgroundColor: '#FEF9C3', 
    padding: 10,
    borderRadius: 6,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FBBF24',
  },
  categoryErrorTipsText: {
    color: '#92400E',
    fontSize: 12,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sizeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    overflow: 'hidden',
    width: '60%',
    height: 38,
  },
  sizeInput: {
    flex: 1,
    height: 38,
    paddingHorizontal: 10,
    fontFamily: "Roboto",
    fontSize: 13,
    color: "#000000",
  },
  sizeUnit: {
    backgroundColor: '#F3F4F6',
    height: '100%',
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  sizeUnitText: {
    color: '#4B5563',
    fontWeight: '500',
    fontSize: 12,
  },
  sizeHint: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    backgroundColor: "#FFFFFF",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#030303",
  },
  closeButton: {
    fontSize: 16,
    color: "#3498db",
    fontWeight: "600",
  },
  webView: {
    flex: 1,
  },
  loadingWebView: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  mediaRequirementContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  mediaRequirement: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default KoiRegistrationScreen;
