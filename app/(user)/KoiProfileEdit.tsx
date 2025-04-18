// app/(user)/KoiProfileEdit.tsx
import {
  Variety,
  getKoiProfileById,
  getVarieties,
  updateKoiProfile,
} from "@/services/koiProfileService";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Định nghĩa interfaces cho media
interface ExistingMedia {
  id: string;
  url: string;
  isNew: boolean;
  type: "Image" | "Video";
}

interface NewMedia {
  uri: string;
  assetId?: string;
  index: number;
  isNew: boolean;
  type: "Image" | "Video";
}

type CombinedMedia = ExistingMedia | NewMedia;

// Define state interface
interface KoiEditData {
  varietyId: string;
  size: string; // Keep as string for input
  age: string; // Keep as string for input
  status: string;
  // Read-only fields
  name: string;
  gender: string;
  bloodline: string;
  // Media
  koiImages: ImagePicker.ImagePickerAsset[];
  koiVideos: ImagePicker.ImagePickerAsset[];
  existingImages: { id: string; url: string }[];
  existingVideos: { id: string; url: string }[];
}

const KoiProfileEdit: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const koiId = params.id as string;

  const [koiData, setKoiData] = useState<KoiEditData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [varieties, setVarieties] = useState<Variety[]>([]); // State for varieties
  const [processingStep, setProcessingStep] = useState<string>(""); // Hiển thị bước đang xử lý
  const [uploadProgress, setUploadProgress] = useState<number>(0); // Tiến trình tải lên

  // Fetch varieties on mount
  useEffect(() => {
    const fetchVarieties = async () => {
      try {
        const response = await getVarieties();
        if (response.statusCode === 200 && response.data?.items) {
          setVarieties(response.data.items);
        } else {
          console.error("Failed to fetch varieties:", response.message);
        }
      } catch (err) {
        console.error("Error fetching varieties:", err);
      }
    };
    fetchVarieties();
  }, []);

  // Fetch Koi data on mount
  useEffect(() => {
    const fetchKoiData = async () => {
      if (!koiId) {
        setError("Không tìm thấy ID cá Koi.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const response = await getKoiProfileById(koiId);
        if (response.statusCode === 200) {
          const fetchedData = response.data;
          setKoiData({
            varietyId: fetchedData.variety?.id || "",
            size: fetchedData.size?.toString() || "",
            age: fetchedData.age?.toString() || "",
            status: fetchedData.status || "",
            name: fetchedData.name || "N/A",
            gender: fetchedData.gender || "N/A",
            bloodline: fetchedData.bloodline || "N/A",
            koiImages: [], // Start with empty new images
            koiVideos: [], // Start with empty new videos
            existingImages:
              fetchedData.koiMedia
                ?.filter((m) => m.mediaType === "Image")
                .map((m) => ({ id: m.id, url: m.mediaUrl })) || [],
            existingVideos:
              fetchedData.koiMedia
                ?.filter((m) => m.mediaType === "Video")
                .map((m) => ({ id: m.id, url: m.mediaUrl })) || [],
          });
        } else {
          setError(`Lỗi tải dữ liệu: ${response.message}`);
        }
      } catch (err) {
        setError("Đã xảy ra lỗi khi tải thông tin cá Koi.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchKoiData();
  }, [koiId]);

  const handleInputChange = (
    field: keyof KoiEditData,
    value: string | number | ImagePicker.ImagePickerAsset[]
  ) => {
    if (koiData) {
      setKoiData({ ...koiData, [field]: value });
    }
  };

  const handleImageSelect = async (type: "Image" | "Video") => {
    if (!koiData) return;

    // Request permissions first
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(
        "Quyền truy cập",
        "Bạn cần cấp quyền truy cập thư viện ảnh/video để chọn."
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        type === "Image"
          ? ImagePicker.MediaTypeOptions.Images
          : ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: true, // Allow multiple selections
      quality: 0.8, // Adjust quality as needed
    });

    if (!result.canceled) {
      if (type === "Image") {
        setKoiData({
          ...koiData,
          koiImages: [...koiData.koiImages, ...result.assets],
        });
      } else {
        setKoiData({
          ...koiData,
          koiVideos: [...koiData.koiVideos, ...result.assets],
        });
      }
    }
  };

  // Function to remove a newly selected image/video
  const removeNewMedia = (index: number, type: "Image" | "Video") => {
    if (!koiData) return;
    if (type === "Image") {
      const updatedImages = [...koiData.koiImages];
      updatedImages.splice(index, 1);
      setKoiData({ ...koiData, koiImages: updatedImages });
    } else {
      const updatedVideos = [...koiData.koiVideos];
      updatedVideos.splice(index, 1);
      setKoiData({ ...koiData, koiVideos: updatedVideos });
    }
  };

  // Function to remove an existing image/video (will be handled on submit)
  const removeExistingMedia = (id: string, type: "Image" | "Video") => {
    if (!koiData) return;
    // Mark for removal or handle differently? API might need specific handling.
    // For now, let's just remove from the display list. The submit logic needs refinement.
    if (type === "Image") {
      setKoiData({
        ...koiData,
        existingImages: koiData.existingImages.filter((img) => img.id !== id),
      });
    } else {
      setKoiData({
        ...koiData,
        existingVideos: koiData.existingVideos.filter((vid) => vid.id !== id),
      });
    }
    Alert.alert(
      "Lưu ý",
      "Hình ảnh/Video hiện có sẽ bị xóa khi bạn lưu thay đổi."
    );
  };

  const handleSubmit = async () => {
    if (!koiData || !koiId) {
      Alert.alert("Lỗi", "Dữ liệu Koi không hợp lệ.");
      return;
    }

    // Kiểm tra hợp lệ chi tiết hơn
    if (!koiData.varietyId) {
      Alert.alert("Thiếu thông tin", "Vui lòng chọn giống cá cho cá Koi.");
      return;
    }

    if (!koiData.size) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng nhập kích thước (Size) cho cá Koi."
      );
      return;
    }

    if (!koiData.age) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tuổi (Age) cho cá Koi.");
      return;
    }

    if (!koiData.status) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng chọn trạng thái (Status) cho cá Koi."
      );
      return;
    }

    // Kiểm tra giá trị số hợp lệ
    const sizeNum = parseFloat(koiData.size);
    const ageNum = parseFloat(koiData.age);

    if (isNaN(sizeNum) || sizeNum <= 0) {
      Alert.alert("Giá trị không hợp lệ", "Kích thước phải là số dương.");
      return;
    }

    if (isNaN(ageNum) || ageNum <= 0) {
      Alert.alert("Giá trị không hợp lệ", "Tuổi phải là số dương.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setProcessingStep("Đang chuẩn bị cập nhật...");
    setUploadProgress(0);

    const formData = new FormData();

    // Chỉ thêm các trường được phép cập nhật
    // KHÔNG thêm name, gender, bloodline vào formData
    formData.append("VarietyId", koiData.varietyId);
    formData.append("Size", koiData.size);
    formData.append("Age", koiData.age);
    formData.append("Status", koiData.status);

    // Theo dõi việc có thêm đủ ảnh và video không
    let addedImages = 0;
    let addedVideos = 0;

    // Tính tổng số media cần xử lý để tính tiến trình
    const totalMediaItems =
      koiData.koiImages.length +
      koiData.koiVideos.length +
      koiData.existingImages.length +
      koiData.existingVideos.length;
    let processedItems = 0;

    // Xử lý hình ảnh mới
    setProcessingStep("Đang xử lý hình ảnh mới...");
    for (const image of koiData.koiImages) {
      const fileType = image.uri.split(".").pop() || "jpg"; // Mặc định là jpg nếu không tìm thấy phần mở rộng
      const mimeType = image.mimeType ?? `image/${fileType}`;

      formData.append("KoiImages", {
        uri: image.uri,
        name: `photo_${Date.now()}_${addedImages}.${fileType}`,
        type: mimeType,
      } as any);
      addedImages++;
      processedItems++;
      setUploadProgress((processedItems / totalMediaItems) * 50); // Dành 50% cho xử lý media
      console.log(`Đã thêm ảnh mới: ${addedImages} ảnh`);
    }

    // Xử lý video mới
    setProcessingStep("Đang xử lý video mới...");
    for (const video of koiData.koiVideos) {
      const fileType = video.uri.split(".").pop() || "mp4"; // Mặc định là mp4 nếu không tìm thấy phần mở rộng
      const mimeType = video.mimeType ?? `video/${fileType}`;

      formData.append("KoiVideos", {
        uri: video.uri,
        name: `video_${Date.now()}_${addedVideos}.${fileType}`,
        type: mimeType,
      } as any);
      addedVideos++;
      processedItems++;
      setUploadProgress((processedItems / totalMediaItems) * 50);
      console.log(`Đã thêm video mới: ${addedVideos} video`);
    }

    // Xử lý hình ảnh hiện có - Tải ảnh từ URL và chuyển đổi thành file
    setProcessingStep("Đang xử lý ảnh hiện có...");
    for (const image of koiData.existingImages) {
      try {
        setProcessingStep(`Đang tải ảnh hiện có: ${image.id}...`);
        console.log(`Đang xử lý ảnh hiện có: ${image.id}`);

        // Tải ảnh từ URL
        const response = await fetch(image.url);
        if (!response.ok) {
          throw new Error(
            `Không thể tải ảnh: ${response.status} ${response.statusText}`
          );
        }

        // Chuyển đổi thành blob
        const blob = await response.blob();

        // Thêm vào formData
        formData.append("KoiImages", {
          uri: image.url,
          type: "image/jpeg",
          name: `image_${image.id}.jpg`,
        } as any);
        addedImages++;
        processedItems++;
        setUploadProgress((processedItems / totalMediaItems) * 50);
        console.log(
          `Đã thêm ảnh hiện có: ${image.id} (tổng ${addedImages} ảnh)`
        );
      } catch (mediaError) {
        console.error(`Lỗi xử lý ảnh hiện có (${image.id}):`, mediaError);
        Alert.alert(
          "Cảnh báo",
          `Không thể tải ảnh từ server. Bạn có muốn tiếp tục mà không có nó không?`,
          [
            {
              text: "Hủy cập nhật",
              style: "cancel",
              onPress: () => {
                setIsSaving(false);
                setProcessingStep("");
                setUploadProgress(0);
                return;
              },
            },
            {
              text: "Tiếp tục",
              onPress: () => console.log("Tiếp tục mà không có ảnh"),
            },
          ]
        );
        // Vẫn tính là đã xử lý một item
        processedItems++;
        setUploadProgress((processedItems / totalMediaItems) * 50);
      }
    }

    // Xử lý video hiện có - Tải video từ URL và chuyển đổi thành file
    setProcessingStep("Đang xử lý video hiện có...");
    for (const video of koiData.existingVideos) {
      try {
        setProcessingStep(`Đang tải video hiện có: ${video.id}...`);
        console.log(`Đang xử lý video hiện có: ${video.id}`);

        // Tải video từ URL
        const response = await fetch(video.url);
        if (!response.ok) {
          throw new Error(
            `Không thể tải video: ${response.status} ${response.statusText}`
          );
        }

        // Chuyển đổi thành blob
        const blob = await response.blob();

        // Thêm vào formData
        formData.append("KoiVideos", {
          uri: video.url,
          type: "video/mp4",
          name: `video_${video.id}.mp4`,
        } as any);
        addedVideos++;
        processedItems++;
        setUploadProgress((processedItems / totalMediaItems) * 50);
        console.log(
          `Đã thêm video hiện có: ${video.id} (tổng ${addedVideos} video)`
        );
      } catch (mediaError) {
        console.error(`Lỗi xử lý video hiện có (${video.id}):`, mediaError);
        Alert.alert(
          "Cảnh báo",
          `Không thể tải video từ server. Bạn có muốn tiếp tục mà không có nó không?`,
          [
            {
              text: "Hủy cập nhật",
              style: "cancel",
              onPress: () => {
                setIsSaving(false);
                setProcessingStep("");
                setUploadProgress(0);
                return;
              },
            },
            {
              text: "Tiếp tục",
              onPress: () => console.log("Tiếp tục mà không có video"),
            },
          ]
        );
        // Vẫn tính là đã xử lý một item
        processedItems++;
        setUploadProgress((processedItems / totalMediaItems) * 50);
      }
    }

    // Kiểm tra xem có ít nhất một ảnh và một video không
    if (addedImages === 0 || addedVideos === 0) {
      setIsSaving(false);
      setProcessingStep("");
      setUploadProgress(0);
      Alert.alert(
        "Thiếu media",
        `Không thể hoàn thành cập nhật vì ${
          addedImages === 0 ? "không có ảnh" : ""
        }${addedImages === 0 && addedVideos === 0 ? " và " : ""}${
          addedVideos === 0 ? "không có video" : ""
        }.`,
        [{ text: "OK" }]
      );
      return;
    }

    try {
      setProcessingStep("Đang gửi dữ liệu lên server...");
      setUploadProgress(70);
      console.log("Đang cập nhật thông tin cho Koi ID:", koiId);

      // Hiển thị dữ liệu gửi đi để debug (chỉ trong môi trường phát triển)
      if (__DEV__) {
        formData.forEach((value, key) => {
          console.log(`${key}:`, value);
        });
      }

      const response = await updateKoiProfile(koiId, formData);
      setUploadProgress(100);
      setProcessingStep("Hoàn tất cập nhật!");

      if (response.statusCode === 200) {
        Alert.alert(
          "Thành công",
          "Thông tin cá Koi đã được cập nhật thành công.",
          [
            {
              text: "OK",
              onPress: () =>
                router.replace(`/(user)/KoiInformation?id=${koiId}`),
            },
          ]
        );
      } else {
        const errorMsg =
          response.message || "Không thể cập nhật thông tin cá Koi.";
        setError(`Cập nhật thất bại: ${errorMsg}`);
        Alert.alert("Lỗi", `Cập nhật thất bại: ${errorMsg}`);
      }
    } catch (err: unknown) {
      console.error("Lỗi khi cập nhật:", err);

      let errorMessage = "Đã xảy ra lỗi khi cập nhật. Vui lòng thử lại sau.";

      // Xử lý lỗi chi tiết hơn
      if (axios.isAxiosError(err)) {
        const axiosError = err;

        // Log chi tiết lỗi để debug
        console.error("Chi tiết lỗi từ server:", axiosError.response?.data);
        console.error("Mã trạng thái:", axiosError.response?.status);

        // Hiển thị thông báo lỗi cụ thể hơn cho người dùng
        if (axiosError.response) {
          const statusCode = axiosError.response.status;
          const responseData = axiosError.response.data;

          if (statusCode === 400) {
            errorMessage =
              "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.";
            if (responseData.message) {
              errorMessage += ` Chi tiết: ${responseData.message}`;
            }
          } else if (statusCode === 401) {
            errorMessage =
              "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
          } else if (statusCode === 403) {
            errorMessage = "Bạn không có quyền thực hiện thao tác này.";
          } else if (statusCode === 404) {
            errorMessage = "Không tìm thấy thông tin cá Koi.";
          } else if (statusCode >= 500) {
            errorMessage = "Lỗi máy chủ. Vui lòng thử lại sau.";
          }
        } else if (axiosError.request) {
          errorMessage =
            "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.";
        }
      } else if (err instanceof Error) {
        console.error("Thông báo lỗi:", err.message);
        errorMessage = `Lỗi: ${err.message}`;
      }

      setError(errorMessage);
      Alert.alert("Lỗi", errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <ActivityIndicator size="large" style={styles.centered} />;
  }

  if (isSaving) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.processingText}>{processingStep}</Text>
        {uploadProgress > 0 && (
          <View style={styles.progressContainer}>
            <View
              style={[styles.progressBar, { width: `${uploadProgress}%` }]}
            />
            <Text style={styles.progressText}>
              {Math.round(uploadProgress)}%
            </Text>
          </View>
        )}
      </View>
    );
  }

  if (error && !koiData) {
    // Show error only if data couldn't be loaded initially
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.button}>
          <Text style={styles.buttonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!koiData) {
    return (
      <View style={styles.centered}>
        <Text>Không thể tải dữ liệu Koi.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.button}>
          <Text style={styles.buttonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
          <Text style={styles.headerText}>Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa thông tin Koi</Text>
      </View>

      {error && <Text style={[styles.errorText, { margin: 15 }]}>{error}</Text>}

      <View style={styles.form}>
        {/* Phần thông tin cố định - không thể chỉnh sửa */}
        <View style={styles.readOnlySection}>
          <Text style={styles.sectionTitle}>
            Thông tin cố định (không thể chỉnh sửa)
          </Text>

          <View style={styles.readOnlyField}>
            <Text style={styles.label}>Tên</Text>
            <View style={styles.readOnlyContainer}>
              <Text style={styles.readOnlyText}>{koiData.name}</Text>
              <View style={styles.lockIconContainer}>
                <Text style={styles.lockIcon}>🔒</Text>
              </View>
            </View>
          </View>

          <View style={styles.readOnlyField}>
            <Text style={styles.label}>Giới tính</Text>
            <View style={styles.readOnlyContainer}>
              <Text style={styles.readOnlyText}>{koiData.gender}</Text>
              <View style={styles.lockIconContainer}>
                <Text style={styles.lockIcon}>🔒</Text>
              </View>
            </View>
          </View>

          <View style={styles.readOnlyField}>
            <Text style={styles.label}>Dòng máu</Text>
            <View style={styles.readOnlyContainer}>
              <Text style={styles.readOnlyText}>{koiData.bloodline}</Text>
              <View style={styles.lockIconContainer}>
                <Text style={styles.lockIcon}>🔒</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Thông tin có thể chỉnh sửa</Text>

        {/* Editable fields */}
        <Text style={styles.label}>Giống cá</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={koiData.varietyId}
            style={styles.picker}
            onValueChange={(itemValue) =>
              handleInputChange("varietyId", itemValue)
            }
            mode="dropdown">
            <Picker.Item label="-- Chọn giống --" value="" />
            {varieties.map((variety) => (
              <Picker.Item
                key={variety.id}
                label={variety.name}
                value={variety.id}
              />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Kích thước (cm)</Text>
        <TextInput
          style={styles.input}
          value={koiData.size}
          placeholder="Nhập kích thước"
          keyboardType="numeric"
          onChangeText={(text) => handleInputChange("size", text)}
        />

        <Text style={styles.label}>Tuổi</Text>
        <TextInput
          style={styles.input}
          value={koiData.age}
          placeholder="Nhập tuổi"
          keyboardType="numeric"
          onChangeText={(text) => handleInputChange("age", text)}
        />

        <Text style={styles.label}>Trạng thái</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={koiData.status}
            style={styles.picker}
            onValueChange={(itemValue) =>
              handleInputChange("status", itemValue)
            }
            mode="dropdown">
            <Picker.Item label="-- Chọn trạng thái --" value="" />
            <Picker.Item label="Hoạt động" value="active" />
            <Picker.Item label="Không hoạt động" value="Inactive" />
          </Picker>
        </View>

        {/* ----- PHẦN HIỂN THỊ TẤT CẢ HÌNH ẢNH ----- */}
        <Text style={styles.label}>Hình ảnh</Text>
        <TouchableOpacity
          onPress={() => handleImageSelect("Image")}
          style={[styles.button, styles.selectMediaButton]} 
        >
          <Ionicons name="images-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Chọn/Thêm ảnh</Text>
        </TouchableOpacity>
        <View style={styles.mediaContainer}>
          {
            // Kết hợp ảnh cũ và mới để render
            [
              // Map qua ảnh cũ, đánh dấu là không mới (isNew: false)
              ...koiData.existingImages.map((img) => ({
                ...img,
                isNew: false,
                type: "Image" as const,
              })),
              // Map qua ảnh mới, đánh dấu là mới (isNew: true), lấy thông tin cần thiết và index
              ...koiData.koiImages.map((img, index) => ({
                uri: img.uri,
                assetId: img.assetId,
                index,
                isNew: true,
                type: "Image" as const,
              })),
            ].map((item) => {
              // Tạo key duy nhất
              const key = item.isNew
                ? `new-img-${item.isNew ? (item as NewMedia).assetId || (item as NewMedia).index : ''}`
                : `existing-img-${item.isNew ? '' : (item as ExistingMedia).id}`;
              const imageUri = item.isNew ? (item as NewMedia).uri : (item as ExistingMedia).url;

              return (
                <View key={key} style={styles.mediaItem}>
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                  />
                  {/* Chỉ hiển thị badge "Mới" cho item mới */}
                  {item.isNew && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>Mới</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    // Gọi hàm xóa tương ứng dựa trên isNew
                    onPress={() =>
                      item.isNew
                        ? removeNewMedia((item as NewMedia).index, "Image")
                        : removeExistingMedia((item as ExistingMedia).id, "Image")
                    }
                    style={styles.removeButton}>
                    <Text style={styles.removeButtonText}>X</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          }
          {/* Hiển thị nếu không có ảnh nào cả */}
          {koiData.existingImages.length === 0 &&
            koiData.koiImages.length === 0 && (
              <Text style={styles.noMediaText}>Chưa có hình ảnh nào.</Text>
            )}
        </View>

        {/* ----- PHẦN HIỂN THỊ TẤT CẢ VIDEO ----- */}
        <Text style={styles.label}>Video</Text>
        <TouchableOpacity
          onPress={() => handleImageSelect("Video")}
          style={[styles.button, styles.selectMediaButton]} 
        >
          <Ionicons name="film-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Chọn/Thêm video</Text>
        </TouchableOpacity>
        <View style={styles.mediaContainer}>
          {
            // Kết hợp video cũ và mới để render
            [
              // Map qua video cũ
              ...koiData.existingVideos.map((vid) => ({
                ...vid,
                isNew: false,
                type: "Video" as const,
              })),
              // Map qua video mới
              ...koiData.koiVideos.map((vid, index) => ({
                uri: vid.uri,
                assetId: vid.assetId,
                index,
                isNew: true,
                type: "Video" as const,
              })),
            ].map((item) => {
              const key = item.isNew
                ? `new-vid-${item.isNew ? (item as NewMedia).assetId || (item as NewMedia).index : ''}`
                : `existing-vid-${item.isNew ? '' : (item as ExistingMedia).id}`;

              return (
                <View key={key} style={styles.mediaItem}>
                  {/* Render video thumbnail (placeholder với icon) */}
                  <View
                    style={[styles.thumbnail, styles.videoThumbnailOverlay]}>
                    {/* Có thể thử hiển thị ảnh nền mờ từ uri nếu muốn */}
                    {/* <Image source={{ uri: item.uri }} style={styles.videoBackgroundThumb} resizeMode="cover" /> */}
                    <View style={styles.playIconOverlay}>
                      <Ionicons
                        name={
                          item.isNew ? "play-circle" : "play-circle-outline"
                        } // Icon khác biệt một chút nếu muốn
                        size={30}
                        color="rgba(255, 255, 255, 0.8)"
                      />
                    </View>
                    {/* Badge "Mới" cho video mới */}
                    {item.isNew && (
                      <View style={styles.newBadge}>
                        <Text style={styles.newBadgeText}>Mới</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    // Gọi hàm xóa tương ứng
                    onPress={() =>
                      item.isNew
                        ? removeNewMedia((item as NewMedia).index, "Video")
                        : removeExistingMedia((item as ExistingMedia).id, "Video")
                    }
                    style={styles.removeButton}>
                    <Text style={styles.removeButtonText}>X</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          }
          {/* Hiển thị nếu không có video nào cả */}
          {koiData.existingVideos.length === 0 &&
            koiData.koiVideos.length === 0 && (
              <Text style={styles.noMediaText}>Chưa có video nào.</Text>
            )}
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            styles.saveButton,
            isSaving && styles.disabledButton,
          ]}
          onPress={handleSubmit}
          disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <View style={styles.saveButtonContent}>
              <Ionicons name="save-outline" size={20} color="#fff" />
              <Text style={styles.buttonText}>Lưu thay đổi</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default KoiProfileEdit;

// Add styles similar to KoiRegister or KoiInformation, adjusted for the edit screen
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8", // Light background
  },
  contentContainer: {
    paddingBottom: 100, // Thêm padding bottom để tránh bị footer đè
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    fontSize: 16,
    color: "#007AFF", // Blue color for back link
    marginLeft: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 15,
    color: "#333",
  },
  form: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingBottom: 8,
  },
  readOnlySection: {
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  readOnlyField: {
    marginBottom: 12,
  },
  readOnlyContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EBEBEB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD",
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  lockIconContainer: {
    marginLeft: "auto",
    backgroundColor: "#E0E0E0",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  lockIcon: {
    fontSize: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 10,
    color: "#333",
  },
  pickerContainer: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    marginBottom: 10,
    overflow: "hidden",
  },
  picker: {
    backgroundColor: "#FFF",
    height: Platform.OS === "ios" ? 150 : 50,
    width: "100%",
  },
  readOnlyText: {
    fontSize: 16,
    color: "#777", // Gray color for read-only
    flex: 1,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: "#34C759", // Green for save
    marginTop: 30,
    marginBottom: 20,
  },
  saveButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: "#BDBDBD", // Gray when disabled
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  processingText: {
    marginTop: 20,
    fontSize: 16,
    color: "#333",
    textAlign: "center",
  },
  progressContainer: {
    width: "80%",
    height: 20,
    backgroundColor: "#E0E0E0",
    borderRadius: 10,
    marginTop: 15,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#007AFF",
  },
  progressText: {
    position: "absolute",
    width: "100%",
    textAlign: "center",
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 12,
    lineHeight: 20,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginBottom: 10,
  },
  mediaContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 15,
  },
  mediaItem: {
    position: "relative",
    marginRight: 10,
    marginBottom: 10,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#E0E0E0",
  },
  videoThumbnailOverlay: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#333",
  },
  playIconOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -15 }, { translateY: -15 }],
  },
  newBadge: {
    position: "absolute",
    top: 5,
    left: 5,
    backgroundColor: "rgba(0, 122, 255, 0.8)",
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  newBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  removeButton: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "rgba(255, 0, 0, 0.7)",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 12,
  },
  noMediaText: {
    fontSize: 14,
    color: "#888",
    fontStyle: "italic",
  },
  selectMediaButton: {
    marginTop: 5,
    marginBottom: 15,
    backgroundColor: "#4A90E2",
  },
});
