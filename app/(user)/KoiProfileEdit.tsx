// app/(user)/KoiProfileEdit.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getKoiProfileById, updateKoiProfile, KoiProfile, Variety, getVarieties } from '@/services/koiProfileService';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios'; // Import axios for error checking
// Import Picker if needed for Variety and Status
// import { Picker } from '@react-native-picker/picker';

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

export default function KoiProfileEdit() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const koiId = params.id as string;

  const [koiData, setKoiData] = useState<KoiEditData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [varieties, setVarieties] = useState<Variety[]>([]); // State for varieties

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
        setError('Không tìm thấy ID cá Koi.');
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const response = await getKoiProfileById(koiId);
        if (response.statusCode === 200) {
          const fetchedData = response.data;
          setKoiData({
            varietyId: fetchedData.variety?.id || '',
            size: fetchedData.size?.toString() || '',
            age: fetchedData.age?.toString() || '',
            status: fetchedData.status || '',
            name: fetchedData.name || 'N/A',
            gender: fetchedData.gender || 'N/A',
            bloodline: fetchedData.bloodline || 'N/A',
            koiImages: [], // Start with empty new images
            koiVideos: [], // Start with empty new videos
            existingImages: fetchedData.koiMedia?.filter(m => m.mediaType === 'Image').map(m => ({ id: m.id, url: m.mediaUrl })) || [],
            existingVideos: fetchedData.koiMedia?.filter(m => m.mediaType === 'Video').map(m => ({ id: m.id, url: m.mediaUrl })) || [],
          });
        } else {
          setError(`Lỗi tải dữ liệu: ${response.message}`);
        }
      } catch (err) {
        setError('Đã xảy ra lỗi khi tải thông tin cá Koi.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchKoiData();
  }, [koiId]);

  const handleInputChange = (field: keyof KoiEditData, value: string | number | ImagePicker.ImagePickerAsset[]) => {
    if (koiData) {
      setKoiData({ ...koiData, [field]: value });
    }
  };

  const handleImageSelect = async (type: 'Image' | 'Video') => {
      if (!koiData) return;

      // Request permissions first
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert("Quyền truy cập", "Bạn cần cấp quyền truy cập thư viện ảnh/video để chọn.");
        return;
      }


      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: type === 'Image' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
        allowsMultipleSelection: true, // Allow multiple selections
        quality: 0.8, // Adjust quality as needed
      });

      if (!result.canceled) {
        if (type === 'Image') {
          setKoiData({ ...koiData, koiImages: [...koiData.koiImages, ...result.assets] });
        } else {
          setKoiData({ ...koiData, koiVideos: [...koiData.koiVideos, ...result.assets] });
        }
      }
    };

    // Function to remove a newly selected image/video
    const removeNewMedia = (index: number, type: 'Image' | 'Video') => {
      if (!koiData) return;
      if (type === 'Image') {
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
    const removeExistingMedia = (id: string, type: 'Image' | 'Video') => {
       if (!koiData) return;
       // Mark for removal or handle differently? API might need specific handling.
       // For now, let's just remove from the display list. The submit logic needs refinement.
       if (type === 'Image') {
         setKoiData({ ...koiData, existingImages: koiData.existingImages.filter(img => img.id !== id) });
       } else {
         setKoiData({ ...koiData, existingVideos: koiData.existingVideos.filter(vid => vid.id !== id) });
       }
       Alert.alert("Lưu ý", "Hình ảnh/Video hiện có sẽ bị xóa khi bạn lưu thay đổi.");
    };


  const handleSubmit = async () => {
    if (!koiData || !koiId) {
      Alert.alert('Lỗi', 'Dữ liệu Koi không hợp lệ.');
      return;
    }

    // Basic Validation
    if (!koiData.varietyId || !koiData.size || !koiData.age || !koiData.status) {
       Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ các trường Variety, Size, Age, Status.');
       return;
    }

    setIsSaving(true);
    setError(null);

    const formData = new FormData();

    // Append allowed fields
    formData.append('VarietyId', koiData.varietyId);
    formData.append('Size', koiData.size);
    formData.append('Age', koiData.age);
    formData.append('Status', koiData.status);

    // Append NEW images
    koiData.koiImages.forEach((image, index) => {
      const uriParts = image.uri.split('.');
      const fileType = image.uri.split('.').pop(); // More robust way to get extension
      const mimeType = image.mimeType ?? `image/${fileType}`; // Use mimeType if available
      formData.append('KoiImages', {
        uri: image.uri,
        name: `photo_${Date.now()}_${index}.${fileType}`, // Add timestamp for uniqueness
        type: mimeType,
      } as any); // Cast to 'any' to bypass FormData type checking if needed
    });

    // Append NEW videos
    koiData.koiVideos.forEach((video, index) => {
       const uriParts = video.uri.split('.');
       const fileType = video.uri.split('.').pop();
       const mimeType = video.mimeType ?? `video/${fileType}`; // Use mimeType if available
       formData.append('KoiVideos', {
         uri: video.uri,
         name: `video_${Date.now()}_${index}.${fileType}`, // Add timestamp for uniqueness
         type: mimeType, // Adjust mime type if necessary
       } as any);
    });

    // **Important:** Handling existing media removal needs API clarification.
    // Does the API automatically remove media not included? Or do we need to send IDs to remove?
    // Assuming for now the API replaces all media if new ones are sent.
    // If specific removal is needed, adjust FormData accordingly.

    try {
      console.log('Submitting update data for Koi ID:', koiId);
      // Log FormData entries for debugging
      // formData.forEach((value, key) => {
      //   console.log(`${key}: ${value}`);
      // });
      const response = await updateKoiProfile(koiId, formData);
      if (response.statusCode === 200) {
        Alert.alert('Thành công', 'Thông tin cá Koi đã được cập nhật.', [
          { text: 'OK', onPress: () => router.replace(`/(user)/KoiInformation?id=${koiId}`) }, // Use replace to avoid back button going to edit screen
        ]);
      } else {
        setError(`Cập nhật thất bại: ${response.message}`);
        Alert.alert('Lỗi', `Cập nhật thất bại: ${response.message}`);
      }
    } catch (err: unknown) { // Type error as unknown
      setError('Đã xảy ra lỗi khi cập nhật.');
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi cập nhật. Vui lòng thử lại.');
      console.error("Update error:", err);
       if (axios.isAxiosError(err)) { // Check if it's an AxiosError
           console.error("Server Response:", err.response?.data); // Safe access to response.data
           console.error("Server Status:", err.response?.status);
       } else if (err instanceof Error) { // Check if it's a generic Error
           console.error("Error message:", err.message);
       }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <ActivityIndicator size="large" style={styles.centered} />;
  }

  if (error && !koiData) { // Show error only if data couldn't be loaded initially
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
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
         <TouchableOpacity onPress={() => router.back()}>
             {/* Add a back icon here */}
             <Text style={styles.headerText}>Quay lại</Text>
         </TouchableOpacity>
         <Text style={styles.headerTitle}>Chỉnh sửa thông tin Koi</Text>
      </View>

      {error && <Text style={[styles.errorText, { margin: 15 }]}>{error}</Text>}

      <View style={styles.form}>
        {/* Read-only fields */}
        <Text style={styles.label}>Tên (Không thể sửa)</Text>
        <Text style={styles.readOnlyText}>{koiData.name}</Text>

        <Text style={styles.label}>Giới tính (Không thể sửa)</Text>
        <Text style={styles.readOnlyText}>{koiData.gender}</Text>

        <Text style={styles.label}>Dòng máu (Không thể sửa)</Text>
        <Text style={styles.readOnlyText}>{koiData.bloodline}</Text>

        {/* Editable fields */}
        <Text style={styles.label}>Giống (Variety)</Text>
        {/* Replace with Picker */}
         <TextInput
           style={styles.input}
           value={koiData.varietyId}
           placeholder="Nhập ID giống" // Temporary
           onChangeText={(text) => handleInputChange('varietyId', text)}
         />
         {/* <Picker
           selectedValue={koiData.varietyId}
           style={styles.picker}
           onValueChange={(itemValue) => handleInputChange('varietyId', itemValue)}
         >
           <Picker.Item label="-- Chọn giống --" value="" />
           {varieties.map((variety) => (
             <Picker.Item key={variety.id} label={variety.name} value={variety.id} />
           ))}
         </Picker> */}


        <Text style={styles.label}>Kích thước (cm)</Text>
        <TextInput
          style={styles.input}
          value={koiData.size}
          placeholder="Nhập kích thước"
          keyboardType="numeric"
          onChangeText={(text) => handleInputChange('size', text)}
        />

        <Text style={styles.label}>Tuổi</Text>
        <TextInput
          style={styles.input}
          value={koiData.age}
          placeholder="Nhập tuổi"
          keyboardType="numeric"
          onChangeText={(text) => handleInputChange('age', text)}
        />

        <Text style={styles.label}>Trạng thái</Text>
         {/* Replace with Picker */}
        <TextInput
          style={styles.input}
          value={koiData.status}
          placeholder="Nhập trạng thái (vd: active)" // Temporary
          onChangeText={(text) => handleInputChange('status', text)}
        />
         {/* <Picker
            selectedValue={koiData.status}
            style={styles.picker}
            onValueChange={(itemValue) => handleInputChange('status', itemValue)}
          >
            <Picker.Item label="-- Chọn trạng thái --" value="" />
            <Picker.Item label="Hoạt động (Active)" value="active" />
            <Picker.Item label="Không hoạt động (Inactive)" value="inactive" />
            {/* Add other statuses if needed */}
          {/* </Picker> */}


        {/* Existing Images */}
        <Text style={styles.label}>Hình ảnh hiện có</Text>
        <View style={styles.mediaContainer}>
          {koiData.existingImages.map((image) => (
            <View key={image.id} style={styles.mediaItem}>
              <Image source={{ uri: image.url }} style={styles.thumbnail} />
              <TouchableOpacity onPress={() => removeExistingMedia(image.id, 'Image')} style={styles.removeButton}>
                 <Text style={styles.removeButtonText}>X</Text>
              </TouchableOpacity>
            </View>
          ))}
          {koiData.existingImages.length === 0 && <Text style={styles.noMediaText}>Không có</Text>}
        </View>

        {/* New Images */}
        <Text style={styles.label}>Thêm hình ảnh mới</Text>
         <TouchableOpacity onPress={() => handleImageSelect('Image')} style={styles.button}>
           <Text style={styles.buttonText}>Chọn ảnh</Text>
         </TouchableOpacity>
        <View style={styles.mediaContainer}>
          {koiData.koiImages.map((image, index) => (
            <View key={index} style={styles.mediaItem}>
              <Image source={{ uri: image.uri }} style={styles.thumbnail} />
              <TouchableOpacity onPress={() => removeNewMedia(index, 'Image')} style={styles.removeButton}>
                 <Text style={styles.removeButtonText}>X</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

         {/* Existing Videos */}
         <Text style={styles.label}>Video hiện có</Text>
         <View style={styles.mediaContainer}>
           {koiData.existingVideos.map((video) => (
             <View key={video.id} style={[styles.mediaItem, styles.videoThumbnail]}>
               <Text style={styles.videoText}>Video</Text>
               {/* Add a play icon maybe */}
               <TouchableOpacity onPress={() => removeExistingMedia(video.id, 'Video')} style={styles.removeButton}>
                  <Text style={styles.removeButtonText}>X</Text>
               </TouchableOpacity>
             </View>
           ))}
           {koiData.existingVideos.length === 0 && <Text style={styles.noMediaText}>Không có</Text>}
         </View>

         {/* New Videos */}
         <Text style={styles.label}>Thêm video mới</Text>
          <TouchableOpacity onPress={() => handleImageSelect('Video')} style={styles.button}>
            <Text style={styles.buttonText}>Chọn video</Text>
          </TouchableOpacity>
         <View style={styles.mediaContainer}>
           {koiData.koiVideos.map((video, index) => (
             <View key={index} style={[styles.mediaItem, styles.videoThumbnail]}>
                <Text style={styles.videoText}>Video mới</Text>
               <TouchableOpacity onPress={() => removeNewMedia(index, 'Video')} style={styles.removeButton}>
                  <Text style={styles.removeButtonText}>X</Text>
               </TouchableOpacity>
             </View>
           ))}
         </View>


        <TouchableOpacity
          style={[styles.button, styles.saveButton, isSaving && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Lưu thay đổi</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Add styles similar to KoiRegister or KoiInformation, adjusted for the edit screen
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8', // Light background
  },
   header: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingVertical: 15,
     paddingHorizontal: 15,
     backgroundColor: '#FFF',
     borderBottomWidth: 1,
     borderBottomColor: '#E0E0E0',
   },
   headerText: {
     fontSize: 16,
     color: '#007AFF', // Blue color for back link
   },
   headerTitle: {
     fontSize: 18,
     fontWeight: 'bold',
     marginLeft: 15,
     color: '#333',
   },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
   picker: {
      backgroundColor: '#FFF',
      borderWidth: 1,
      borderColor: '#DDD',
      borderRadius: 8,
      marginBottom: 10,
      // Height might need adjustment depending on platform
   },
  readOnlyText: {
    fontSize: 16,
    color: '#777', // Gray color for read-only
    marginBottom: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#EEE', // Different background
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  saveButton: {
     backgroundColor: '#34C759', // Green for save
     marginTop: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#BDBDBD', // Gray when disabled
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
   mediaContainer: {
     flexDirection: 'row',
     flexWrap: 'wrap',
     marginBottom: 15,
   },
   mediaItem: {
     position: 'relative',
     marginRight: 10,
     marginBottom: 10,
   },
   thumbnail: {
     width: 80,
     height: 80,
     borderRadius: 8,
     backgroundColor: '#E0E0E0',
   },
   videoThumbnail: {
      width: 80,
      height: 80,
      borderRadius: 8,
      backgroundColor: '#333',
      justifyContent: 'center',
      alignItems: 'center',
   },
   videoText: {
      color: '#FFF',
      fontSize: 12,
   },
   removeButton: {
     position: 'absolute',
     top: -5,
     right: -5,
     backgroundColor: 'rgba(255, 0, 0, 0.7)',
     borderRadius: 10,
     width: 20,
     height: 20,
     justifyContent: 'center',
     alignItems: 'center',
   },
   removeButtonText: {
     color: '#FFF',
     fontWeight: 'bold',
     fontSize: 12,
   },
   noMediaText: {
      fontSize: 14,
      color: '#888',
      fontStyle: 'italic',
   }
});