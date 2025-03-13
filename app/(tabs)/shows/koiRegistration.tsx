import { Video, ResizeMode } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  KoiProfile,
  getKoiProfileById,
  getKoiProfiles,
} from "../../../services/koiProfileService";
import { findSuitableCategory, createRegistration } from "../../../services/registrationService";

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

const KoiRegistrationScreen: React.FC = () => {
  // Get showId from route params
  const params = useLocalSearchParams();
  const showId = params.showId as string;

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

  // Form validation states
  const [formErrors, setFormErrors] = useState({
    size: '',
    category: ''
  });

  // Fetch koi profiles when component mounts
  useEffect(() => {
    loadKoiProfiles();
  }, []);

  const loadKoiProfiles = async () => {
    try {
      setLoading(true);
      const response = await getKoiProfiles();
      setKoiProfiles(response.data.items);
    } catch (error) {
      console.error("Failed to fetch koi profiles:", error);
      Alert.alert(
        "Error",
        "Failed to load your koi profiles. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch koi profile details when a profile is selected
  const handleKoiSelection = async (id: string) => {
    try {
      setLoading(true);
      const response = await getKoiProfileById(id);
      const profile = response.data;
      setSelectedKoiProfile(profile);

      // Populate form fields with profile data
      setKoiName(profile.name);
      setKoiSize(profile.size.toString());
      setKoiVariety(profile.variety.name);
      setKoiDescription(profile.bloodline || "");

      // Initialize media items from profile
      setMediaItems(
        profile.koiMedia.map((media) => ({
          id: media.id,
          mediaUrl: media.mediaUrl,
          mediaType: media.mediaType,
        }))
      );

      setIsDropdownOpen(false);
    } catch (error) {
      console.error("Failed to fetch koi profile details:", error);
      Alert.alert("Error", "Failed to load koi details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSizeChange = async (size: string) => {
    setKoiSize(size);
    setFormErrors(prev => ({ ...prev, size: '' }));
    
    if (!selectedKoiProfile || !showId) {
      console.log('Missing required data:', { selectedKoiProfile, showId });
      return;
    }

    // Validate size
    const sizeNumber = parseFloat(size);
    if (isNaN(sizeNumber) || sizeNumber <= 0) {
      console.log('Invalid size:', size);
      setFormErrors(prev => ({ ...prev, size: 'Please enter a valid size' }));
      return;
    }

    // Validate size range (15-75)
    if (sizeNumber < 15 || sizeNumber > 75) {
      console.log('Size out of range:', sizeNumber);
      setFormErrors(prev => ({ 
        ...prev, 
        size: 'Size must be between 15 and 75 cm' 
      }));
      return;
    }
    
    try {
      setLoading(true);
      setProcessingStep("Finding suitable category...");
      
      console.log('Finding suitable category with params:', {
        showId,
        varietyId: selectedKoiProfile.variety.id,
        size: sizeNumber
      });
      
      const response = await findSuitableCategory(
        showId,
        selectedKoiProfile.variety.id,
        sizeNumber.toString()
      );
      
      console.log('API Response:', response);
      
      // Kiểm tra response có đúng format không
      if (!response) {
        console.log('No response from API');
        setFormErrors(prev => ({ 
          ...prev, 
          category: 'No response from server' 
        }));
        return;
      }

      // Kiểm tra response.data có tồn tại không
      if (!response.data) {
        console.log('No data in response:', response);
        setFormErrors(prev => ({ 
          ...prev, 
          category: 'No category data received' 
        }));
        return;
      }

      // Kiểm tra các trường bắt buộc của category
      const category = response.data;
      if (!category.id || !category.name || !category.sizeMin || !category.sizeMax) {
        console.log('Invalid category data:', category);
        setFormErrors(prev => ({ 
          ...prev, 
          category: 'Invalid category data received' 
        }));
        return;
      }

      // Kiểm tra size có nằm trong khoảng của category không
      if (sizeNumber < category.sizeMin || sizeNumber > category.sizeMax) {
        console.log('Size not in category range:', {
          size: sizeNumber,
          min: category.sizeMin,
          max: category.sizeMax
        });
        setFormErrors(prev => ({ 
          ...prev, 
          category: `Size must be between ${category.sizeMin} and ${category.sizeMax} cm` 
        }));
        return;
      }

      // Nếu tất cả đều hợp lệ, set category
      console.log('Setting selected category:', category);
      setSelectedCategory(category);
      setFormErrors(prev => ({ ...prev, category: '' }));

    } catch (error: any) {
      console.error("Failed to find suitable category:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setFormErrors(prev => ({ 
        ...prev, 
        category: error.response?.data?.message || 'No suitable category found for this size' 
      }));
    } finally {
      setLoading(false);
      setProcessingStep("");
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
      Alert.alert("Required", "Please accept the rules to continue");
      return;
    }

    if (!selectedKoiProfile) {
      Alert.alert("Required", "Please select a koi profile");
      return;
    }

    if (!showId) {
      Alert.alert("Error", "Show ID is missing. Please go back and try again.");
      return;
    }

    if (!koiSize) {
      Alert.alert("Required", "Please enter koi size");
      return;
    }

    if (!selectedCategory) {
      console.log('Missing category:', { selectedCategory, koiSize });
      Alert.alert("Error", "Could not find suitable category for your koi");
      return;
    }

    if (mediaItems.length === 0) {
      Alert.alert(
        "Required",
        "At least one image or video is required for registration"
      );
      return;
    }

    try {
      setLoading(true);
      setUploadProgress(0);
      setProcessingStep("Preparing registration...");

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

      // Add media files
      mediaItems.forEach((item, index) => {
        if (item.isNew && item.fileUri) {
          if (item.mediaType === 'Image') {
            formData.append('RegistrationImages', {
              uri: item.fileUri,
              type: 'image/jpeg',
              name: `image_${index}.jpg`
            } as any);
          } else {
            formData.append('RegistrationVideos', {
              uri: item.fileUri,
              type: 'video/mp4',
              name: `video_${index}.mp4`
            } as any);
          }
        }
      });

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
      setProcessingStep("Creating registration...");
      const response = await createRegistration(formData);
      console.log('Registration response:', response);

      // Success alert and navigation
      Alert.alert(
        "Registration Successful",
        "Your koi has been registered for the competition.",
        [
          {
            text: "OK",
            onPress: () => router.push("/(tabs)/shows/ConfirmRegister"),
          },
        ]
      );
    } catch (error) {
      console.error("Registration error:", error);
      Alert.alert(
        "Registration Failed",
        "Could not complete registration. Please try again."
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
      return <Text style={styles.dropdownText}>No koi profiles available</Text>;
    }

    return koiProfiles.map((profile) => (
      <TouchableOpacity
        key={profile.id}
        style={styles.dropdownItem}
        onPress={() => handleKoiSelection(profile.id)}>
        <Text style={styles.dropdownItemText}>{profile.name}</Text>
      </TouchableOpacity>
    ));
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
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render media list manually to avoid nesting FlatList in ScrollView
  const renderMediaList = () => {
    if (mediaItems.length === 0) {
      return (
        <Text style={styles.noMediaText}>
          No media items. Please add images or videos.
        </Text>
      );
    }

    return (
      <View style={styles.mediaList}>
        {mediaItems.map(item => (
          <View key={item.id}>
            {renderMediaItem({ item })}
          </View>
        ))}
      </View>
    );
  };

  // Render category info
  const renderCategoryInfo = () => {
    if (!selectedCategory) return null;
    
    return (
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryTitle}>Selected Category</Text>
        <Text>Name: {selectedCategory.name}</Text>
        <Text>Size Range: {selectedCategory.sizeMin} - {selectedCategory.sizeMax} cm</Text>
        <Text>Registration Fee: ${selectedCategory.registrationFee}</Text>
      </View>
    );
  };

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

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Register for Koi Competition</Text>
        </View>

        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#5664F5" />
              <Text style={styles.loadingText}>
                {processingStep || "Loading..."}
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
            </View>
          </View>
        )}

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Koi Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select your Koi</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setIsDropdownOpen(!isDropdownOpen)}>
              <Text style={styles.dropdownText}>
                {selectedKoiProfile ? selectedKoiProfile.name : "Select a Koi"}
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

            <Text style={styles.addNewText}>Or add new Koi</Text>
          </View>

          {/* Koi Details */}
          <View style={styles.section}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Koi Entry Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Your Koi Name"
                placeholderTextColor="#94a3b8"
                value={koiName}
                onChangeText={setKoiName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Koi Size</Text>
              <TextInput
                style={styles.input}
                placeholder="Size in cm"
                placeholderTextColor="#94a3b8"
                value={koiSize}
                onChangeText={setKoiSize}
                onBlur={() => handleSizeChange(koiSize)}
                keyboardType="numeric"
              />
              {formErrors.size ? (
                <Text style={styles.errorText}>{formErrors.size}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Koi Variety</Text>
              <TextInput
                style={styles.input}
                placeholder="Variety"
                placeholderTextColor="#94a3b8"
                value={koiVariety}
                onChangeText={setKoiVariety}
                editable={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Koi Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                multiline={true}
                numberOfLines={4}
                placeholder="Enter description"
                placeholderTextColor="#94a3b8"
                value={koiDescription}
                onChangeText={setKoiDescription}
              />
            </View>
          </View>

          {/* Media Management Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Media Gallery</Text>

            {renderMediaList()}

            <View style={styles.mediaButtonsContainer}>
              <TouchableOpacity
                style={styles.mediaButton}
                onPress={handleAddImage}>
                <Text style={styles.mediaButtonText}>Add Image</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mediaButton}
                onPress={handleAddVideo}>
                <Text style={styles.mediaButtonText}>Add Video</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Category Info */}
          {renderCategoryInfo()}

          {/* Agreement Section */}
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

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.iconContainer}>
            <TouchableOpacity style={styles.iconWrapper}>
              <Image
                source={{
                  uri: "https://dashboard.codeparrot.ai/api/image/Z6I0Rqvsm-LWpeaP/frame-4.png",
                }}
                style={styles.footerIcon}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconWrapper}>
              <Image
                source={{
                  uri: "https://dashboard.codeparrot.ai/api/image/Z6I0Rqvsm-LWpeaP/frame-6.png",
                }}
                style={styles.footerIcon}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconWrapper}>
              <Image
                source={{
                  uri: "https://dashboard.codeparrot.ai/api/image/Z6I0Rqvsm-LWpeaP/frame-5.png",
                }}
                style={styles.footerIcon}
              />
            </TouchableOpacity>
          </View>
        </View>
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
    backgroundColor: "#F8F9FA",
    height: 60,
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
    padding: 16,
    alignItems: "center",
  },
  title: {
    fontFamily: "Lexend Deca",
    fontSize: 24,
    fontWeight: "700",
    color: "#030303",
  },
  mainContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: "Lexend Deca",
    fontSize: 18,
    fontWeight: "600",
    color: "#030303",
    marginBottom: 12,
  },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 50,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#D0D3F5",
    borderRadius: 8,
    backgroundColor: "#F8F9FA",
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
    overflow: "scroll",
    zIndex: 1000,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  dropdownItemText: {
    fontFamily: "Roboto",
    fontSize: 14,
    color: "#030303",
  },
  addNewText: {
    fontFamily: "Roboto",
    fontSize: 12,
    color: "#5664F5",
    marginTop: 8,
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontFamily: "Roboto",
    fontSize: 14,
    fontWeight: "500",
    color: "#030303",
    marginBottom: 8,
  },
  input: {
    height: 50,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#D0D3F5",
    borderRadius: 8,
    backgroundColor: "#F8F9FA",
    fontFamily: "Roboto",
    fontSize: 14,
    color: "#030303",
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
    color: "#64748B",
    textAlign: "center",
    marginVertical: 20,
  },
  mediaItemContainer: {
    flexDirection: "row",
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#F8FAFC",
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
    marginTop: 8,
  },
  mediaButton: {
    flex: 1,
    height: 44,
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
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#D0D3F5",
    borderRadius: 4,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
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
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#5664F5",
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
    borderRadius: 10,
    backgroundColor: "white",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
  // Category info styles
  categoryInfo: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#D0D3F5",
    borderRadius: 8,
    backgroundColor: "#F8F9FA",
    marginBottom: 16,
  },
  categoryTitle: {
    fontFamily: "Lexend Deca",
    fontSize: 18,
    fontWeight: "600",
    color: "#030303",
    marginBottom: 12,
  },
  errorText: {
    color: "#EF4444",
    fontFamily: "Roboto",
    fontSize: 12,
    marginTop: 4,
  },
});

export default KoiRegistrationScreen;
