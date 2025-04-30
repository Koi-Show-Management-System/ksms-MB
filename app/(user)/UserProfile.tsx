// app/(user)/UserProfile.tsx
import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// --- User Data Interface ---
interface UserData {
  id?: string;
  username: string;
  email: string;
  location?: string;
  koiCount?: number;
  phoneNumber?: string;
  phone?: string;
  profileImage?: string | null;
  avatar?: string | null;
  coverImage?: string;
  joinDate?: string;
  bio?: string;
  fullName: string;
  role?: string;
  status?: string;
}

// API response interface
interface ApiResponse<T> {
  data: T;
  statusCode: number;
  message: string;
}

// --- Hàm trích xuất chữ cái đầu của họ tên ---
const getUserInitials = (name: string): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

// --- Profile Section Component ---
interface ProfileSectionProps {
  userData: UserData;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ userData }) => {
  const profileItems = [
    {
      icon: "https://dashboard.codeparrot.ai/api/image/Z79X-67obB3a4bxu/email-icon.png",
      label: "Email",
      value: userData.email,
    },
    {
      icon: "https://dashboard.codeparrot.ai/api/image/Z79X-67obB3a4bxu/location-icon.png",
      label: "Location",
      value: userData.location,
    },
    {
      icon: "https://dashboard.codeparrot.ai/api/image/Z79X-67obB3a4bxu/fish-icon.png",
      label: "Koi Fish",
      value: `${userData.koiCount} fish`,
    },
    {
      icon: "https://dashboard.codeparrot.ai/api/image/Z79X-67obB3a4bxu/phone-icon.png",
      label: "Phone",
      value: userData.phoneNumber,
    },
  ];

  return (
    <View style={styles.profileContainer}>
      <Text style={styles.sectionTitle}>Personal Information</Text>

      {profileItems.map((item, index) => (
        <View key={index} style={styles.profileInfoRow}>
          <View style={styles.profileLabelContainer}>
            <Image source={{ uri: item.icon }} style={styles.profileItemIcon} />
            <Text style={styles.profileLabel}>{item.label}</Text>
          </View>
          <Text style={styles.profileValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
};

// --- Action Buttons Component ---
interface ActionButtonsProps {
  onChangePassword: () => void;
  onUpdateInformation: () => void;
  onLogout: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onChangePassword,
  onUpdateInformation,
  onLogout,
}) => {
  return (
    <View style={styles.actionsContainer}>
      <TouchableOpacity
        style={[styles.actionButton, styles.changePasswordButton]}
        onPress={onChangePassword}>
        <Image
          source={{
            uri: "https://dashboard.codeparrot.ai/api/image/Z79X-67obB3a4bxu/password-icon.png",
          }}
          style={styles.actionButtonIcon}
        />
        <Text style={styles.actionButtonText}>Change Password</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.updateInfoButton]}
        onPress={onUpdateInformation}>
        <Image
          source={{
            uri: "https://dashboard.codeparrot.ai/api/image/Z79X-67obB3a4bxu/update-icon.png",
          }}
          style={styles.actionButtonIcon}
        />
        <Text style={styles.actionButtonText}>Update Information</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.logoutButton]}
        onPress={onLogout}>
        <Image
          source={{
            uri: "https://dashboard.codeparrot.ai/api/image/Z79X-67obB3a4bxu/logout-icon.png",
          }}
          style={styles.actionButtonIcon}
        />
        <Text style={styles.actionButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

// --- Password Change Modal ---
interface PasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => void;
  loading: boolean;
}

const PasswordChangeModal: React.FC<PasswordModalProps> = ({
  visible,
  onClose,
  onSubmit,
  loading,
}) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setError("");
    onSubmit(currentPassword, newPassword, confirmPassword);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Change Password</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="Current Password"
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholderTextColor="#999"
          />

          <TextInput
            style={styles.input}
            placeholder="New Password"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            placeholderTextColor="#999"
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm New Password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholderTextColor="#999"
          />

          <View style={styles.modalButtonsContainer}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.submitButton]}
              onPress={handleSubmit}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.modalButtonText}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Thêm hàm helper để chuyển đổi URL ảnh thành File
const urlToFile = async (
  url: string | null | undefined,
  fileName: string
): Promise<File | null> => {
  if (!url) return null;

  try {
    // Tránh xử lý URL nếu là đường dẫn tương đối
    if (!url.startsWith("http") && !url.startsWith("blob:")) {
      return null;
    }

    const response = await fetch(url);
    const blob = await response.blob();
    // Tạo File object từ Blob
    return new File([blob], fileName, { type: blob.type });
  } catch (error) {
    console.error("Lỗi khi chuyển đổi URL thành File:", error);
    return null;
  }
};

// --- Main UserProfile Component ---
const UserProfile: React.FC = () => {
  const [userData, setUserData] = useState<UserData>({
    username: "",
    email: "",
    location: "",
    koiCount: 0,
    phoneNumber: "",
    profileImage: null,
    coverImage: "",
    joinDate: "",
    bio: "",
    fullName: "",
  });
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [updateData, setUpdateData] = useState({
    fullName: "",
    username: "",
    phone: "",
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem("userId");

      if (!userId) {
        throw new Error("Không tìm thấy ID người dùng");
      }

      const response = await api.get<ApiResponse<UserData>>(
        `/api/v1/account/${userId}`
      );

      if (response.data.statusCode === 200) {
        const userInfo = response.data.data;
        setUserData({
          ...userInfo,
          phoneNumber: userInfo.phone, // Ánh xạ phone sang phoneNumber để tương thích với giao diện cũ
          profileImage: userInfo.avatar, // Ánh xạ avatar sang profileImage để tương thích với giao diện cũ
        });
        setUpdateData({
          fullName: userInfo.fullName || "",
          username: userInfo.username || "",
          phone: userInfo.phone || "",
        });
      } else {
        throw new Error(
          response.data.message || "Không thể tải dữ liệu người dùng"
        );
      }
    } catch (error: any) {
      console.error("Lỗi khi tải dữ liệu người dùng:", error);
      setError(error.message || "Có lỗi xảy ra khi tải dữ liệu người dùng");
      Alert.alert("Lỗi", "Không thể tải thông tin người dùng");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem("userId");

      if (!userId) {
        throw new Error("Không tìm thấy ID người dùng");
      }

      // Tạo FormData object để gửi cả dữ liệu văn bản và tệp
      const formData = new FormData();

      // Thêm tất cả thông tin hiện tại vào FormData
      formData.append("FullName", updateData.fullName);
      formData.append("Username", updateData.username);
      formData.append("Phone", updateData.phone);

      // Thêm các trường khác từ userData để đảm bảo không mất dữ liệu
      if (userData.email) formData.append("Email", userData.email);
      if (userData.location) formData.append("Location", userData.location);
      if (userData.role) formData.append("Role", userData.role);
      if (userData.status) formData.append("Status", userData.status);

      // Nếu đã có ảnh đại diện, chuyển đổi URL thành file và thêm vào FormData
      if (userData.profileImage || userData.avatar) {
        const avatarUrl = userData.profileImage || userData.avatar;
        try {
          // Chỉ tạo file khi ảnh là URL tuyệt đối (không phải đường dẫn tương đối)
          if (
            avatarUrl &&
            (avatarUrl.startsWith("http") || avatarUrl.startsWith("blob:"))
          ) {
            const response = await fetch(avatarUrl);
            const blob = await response.blob();
            const filename = avatarUrl.split("/").pop() || "avatar.jpg";

            // @ts-ignore - React Native's FormData is not fully compatible with TypeScript definitions
            formData.append("AvatarUrl", {
              uri: avatarUrl,
              name: filename,
              type: blob.type || "image/jpeg",
            });
          }
        } catch (error) {
          console.error("Lỗi khi chuyển đổi ảnh đại diện:", error);
          // Tiếp tục mà không thêm ảnh nếu xảy ra lỗi
        }
      }

      const response = await api.put(`/api/v1/account/${userId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.statusCode === 200) {
        Alert.alert("Thành công", "Cập nhật thông tin thành công");
        setIsEditing(false);
        fetchUserData(); // Tải lại dữ liệu sau khi cập nhật
      } else {
        throw new Error(
          response.data.message || "Không thể cập nhật thông tin"
        );
      }
    } catch (error: any) {
      console.error("Lỗi khi cập nhật thông tin:", error);
      Alert.alert(
        "Lỗi",
        error.message || "Có lỗi xảy ra khi cập nhật thông tin"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUploadAvatar = async () => {
    try {
      // Yêu cầu quyền truy cập thư viện ảnh
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Lỗi",
          "Cần cấp quyền truy cập thư viện ảnh để tải lên ảnh đại diện"
        );
        return;
      }

      // Mở thư viện ảnh để chọn
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploadingImage(true);

        try {
          const userId = await AsyncStorage.getItem("userId");

          if (!userId) {
            throw new Error("Không tìm thấy ID người dùng");
          }

          // Tạo form data để upload ảnh
          const formData = new FormData();
          const localUri = result.assets[0].uri;
          const filename = localUri.split("/").pop() || "avatar.jpg";

          // Xác định kiểu MIME
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : "image/jpeg";

          // @ts-ignore - React Native's FormData is not fully compatible with TypeScript definitions
          formData.append("AvatarUrl", {
            uri: localUri,
            name: filename,
            type,
          });

          // Thêm tất cả thông tin hiện tại vào FormData
          formData.append("FullName", userData.fullName || "");
          formData.append("Username", userData.username || "");
          formData.append(
            "Phone",
            userData.phone || userData.phoneNumber || ""
          );

          // Thêm các trường khác từ userData để đảm bảo không mất dữ liệu
          if (userData.email) formData.append("Email", userData.email);
          if (userData.location) formData.append("Location", userData.location);
          if (userData.role) formData.append("Role", userData.role);
          if (userData.status) formData.append("Status", userData.status);

          const response = await api.put(
            `/api/v1/account/${userId}`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );

          if (response.data.statusCode === 200) {
            Alert.alert("Thành công", "Cập nhật ảnh đại diện thành công");
            fetchUserData(); // Tải lại dữ liệu sau khi cập nhật
          } else {
            throw new Error(
              response.data.message || "Không thể cập nhật ảnh đại diện"
            );
          }
        } catch (error: any) {
          console.error("Lỗi khi tải lên ảnh đại diện:", error);
          Alert.alert(
            "Lỗi",
            error.message || "Có lỗi xảy ra khi tải lên ảnh đại diện"
          );
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (error: any) {
      console.error("Lỗi khi chọn ảnh:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh. Vui lòng thử lại.");
      setUploadingImage(false);
    }
  };

  const handleChangePassword = (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => {
    setLoading(true);

    // Tạo payload cho API
    const payload = {
      oldPassword: currentPassword,
      newPassword: newPassword,
      confirmNewPassword: confirmPassword,
    };

    // Gọi API để đổi mật khẩu
    api
      .post("/api/v1/auth/change-password", payload)
      .then((response) => {
        if (response.data.statusCode === 200) {
          // Hiển thị thông báo thành công
          Alert.alert(
            "Thành công",
            "Mật khẩu của bạn đã được thay đổi thành công.",
            [{ text: "OK" }]
          );
          setPasswordModalVisible(false);
        } else {
          // Xử lý trường hợp API trả về lỗi
          throw new Error(response.data.message || "Không thể đổi mật khẩu");
        }
      })
      .catch((error) => {
        console.error("Lỗi khi đổi mật khẩu:", error);
        Alert.alert(
          "Lỗi",
          error.response?.data?.message ||
            error.message ||
            "Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleUpdateInformation = () => {
    setIsEditing(true);
  };

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất không?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          try {
            // Xóa tất cả dữ liệu người dùng khỏi AsyncStorage
            await AsyncStorage.multiRemove([
              "userToken",
              "userId",
              "userEmail",
              "userRole",
              "userFullName",
            ]);
            // Chuyển hướng đến màn hình đăng nhập
            router.replace("/(auth)/signIn");
          } catch (error) {
            console.error("Lỗi khi đăng xuất:", error);
            Alert.alert("Lỗi", "Không thể đăng xuất. Vui lòng thử lại.");
          }
        },
      },
    ]);
  };

  const renderEditFields = () => {
    return (
      <View style={styles.editFieldsContainer}>
        <View style={styles.editField}>
          <Text style={styles.editLabel}>Họ tên</Text>
          <TextInput
            style={styles.editInput}
            value={updateData.fullName}
            onChangeText={(text) =>
              setUpdateData({ ...updateData, fullName: text })
            }
            placeholder="Nhập họ tên"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.editField}>
          <Text style={styles.editLabel}>Username</Text>
          <TextInput
            style={styles.editInput}
            value={updateData.username}
            onChangeText={(text) =>
              setUpdateData({ ...updateData, username: text })
            }
            placeholder="Nhập username"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.editField}>
          <Text style={styles.editLabel}>Số điện thoại</Text>
          <TextInput
            style={styles.editInput}
            value={updateData.phone}
            onChangeText={(text) =>
              setUpdateData({ ...updateData, phone: text })
            }
            placeholder="Nhập số điện thoại"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.editButtonsContainer}>
          <TouchableOpacity
            style={[styles.editActionButton, styles.cancelButton]}
            onPress={() => setIsEditing(false)}
            disabled={loading}>
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.editActionButton, styles.saveButton]}
            onPress={handleUpdateProfile}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Lưu</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderUserInfo = () => {
    return (
      <View style={styles.userInfoContainer}>
        <Text style={styles.userEmail}>{userData.email}</Text>
        <Text style={styles.userStatus}>
          {userData.status || "Đang hoạt động"}
        </Text>
      </View>
    );
  };

  if (loading && !userData.email) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin cá nhân</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Profile Information Section */}
        <View style={styles.profileInfoSection}>
          <View style={styles.profileImageContainer}>
            {userData.profileImage ? (
              <Image
                source={{ uri: userData.profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderText}>
                  {getUserInitials(userData.fullName || "User Profile")}
                </Text>
              </View>
            )}

            {/* Image Upload Button */}
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleUploadAvatar}
              disabled={uploadingImage}>
              {uploadingImage ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.uploadButtonText}>Tải ảnh</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.profileDetailsContainer}>
            <View style={styles.profileNameContainer}>
              <Text style={styles.profileName}>
                {userData.fullName || "Đang tải..."}
              </Text>
              <TouchableOpacity
                onPress={() => setIsEditing(!isEditing)}
                style={styles.editButton}>
                <Text style={styles.editButtonText}>
                  {isEditing ? "Hủy" : "Chỉnh sửa"}
                </Text>
              </TouchableOpacity>
            </View>
            {isEditing ? renderEditFields() : renderUserInfo()}
          </View>
        </View>

        {/* Profile Fields Section */}
        <View style={styles.profileContainer}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>

          <View style={styles.profileInfoRow}>
            <View style={styles.profileLabelContainer}>
              <Image
                source={{
                  uri: "https://dashboard.codeparrot.ai/api/image/Z79X-67obB3a4bxu/user-icon.png",
                }}
                style={styles.profileItemIcon}
              />
              <Text style={styles.profileLabel}>Họ tên</Text>
            </View>
            <Text style={styles.profileValue}>
              {userData.fullName || "Chưa cập nhật"}
            </Text>
          </View>

          <View style={styles.profileInfoRow}>
            <View style={styles.profileLabelContainer}>
              <Image
                source={{
                  uri: "https://dashboard.codeparrot.ai/api/image/Z79X-67obB3a4bxu/user-icon.png",
                }}
                style={styles.profileItemIcon}
              />
              <Text style={styles.profileLabel}>Username</Text>
            </View>
            <Text style={styles.profileValue}>
              {userData.username || "Chưa cập nhật"}
            </Text>
          </View>

          <View style={styles.profileInfoRow}>
            <View style={styles.profileLabelContainer}>
              <Image
                source={{
                  uri: "https://dashboard.codeparrot.ai/api/image/Z79X-67obB3a4bxu/email-icon.png",
                }}
                style={styles.profileItemIcon}
              />
              <Text style={styles.profileLabel}>Email</Text>
            </View>
            <Text style={styles.profileValue}>{userData.email}</Text>
          </View>

          <View style={styles.profileInfoRow}>
            <View style={styles.profileLabelContainer}>
              <Image
                source={{
                  uri: "https://dashboard.codeparrot.ai/api/image/Z79X-67obB3a4bxu/phone-icon.png",
                }}
                style={styles.profileItemIcon}
              />
              <Text style={styles.profileLabel}>Điện thoại</Text>
            </View>
            <Text style={styles.profileValue}>
              {userData.phone || "Chưa cập nhật"}
            </Text>
          </View>
        </View>

        {/* Nút đổi mật khẩu và đăng xuất */}
        <View style={styles.actionsContainer}>
          <Text style={[styles.sectionTitle, styles.centeredSectionTitle]}>
            Quản lý tài khoản
          </Text>
          <TouchableOpacity
            style={[styles.actionButton, styles.changePasswordButton]}
            onPress={() => setPasswordModalVisible(true)}>
            <Text style={styles.actionButtonText}>Đổi Mật Khẩu</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}>
            <Text style={styles.actionButtonText}>Đăng Xuất</Text>
          </TouchableOpacity>
        </View>

        {/* Password Change Modal */}
        <PasswordChangeModal
          visible={passwordModalVisible}
          onClose={() => setPasswordModalVisible(false)}
          onSubmit={handleChangePassword}
          loading={loading}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
  contentContainer: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666666",
    fontFamily: "Poppins",
  },
  profileInfoSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  profileImageContainer: {
    position: "relative",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#4A90E2",
  },
  placeholderText: {
    fontFamily: "Poppins",
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  uploadButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#4A90E2",
    padding: 8,
    borderRadius: 20,
    minWidth: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadButtonText: {
    fontFamily: "Poppins",
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  profileDetailsContainer: {
    flex: 1,
    marginLeft: 16,
  },
  profileNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  profileName: {
    fontFamily: "Poppins",
    fontSize: 20,
    fontWeight: "700",
    color: "#333333",
  },
  editButton: {
    backgroundColor: "#4A90E2",
    padding: 8,
    borderRadius: 20,
  },
  editButtonText: {
    fontFamily: "Poppins",
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  userInfoContainer: {
    marginTop: 8,
  },
  userEmail: {
    fontFamily: "Poppins",
    fontSize: 14,
    color: "#666666",
  },
  userStatus: {
    fontFamily: "Poppins",
    fontSize: 14,
    color: "#4A90E2",
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: "Poppins",
    fontSize: 20,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 16,
    marginLeft: 16,
  },
  centeredSectionTitle: {
    textAlign: "center",
    marginLeft: 0,
    width: "100%",
  },
  profileContainer: {
    width: "100%",
    marginTop: 20,
    paddingVertical: 16,
  },
  profileInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  profileLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileItemIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  profileLabel: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  profileValue: {
    fontFamily: "Poppins",
    fontSize: 14,
    color: "#666666",
    maxWidth: "60%",
    textAlign: "right",
  },
  editFieldsContainer: {
    marginTop: 16,
  },
  editField: {
    marginBottom: 12,
  },
  editLabel: {
    fontFamily: "Poppins",
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 4,
  },
  editInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 10,
    fontFamily: "Poppins",
    fontSize: 14,
    color: "#333333",
  },
  editButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  editActionButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: "#4A90E2",
    marginLeft: 8,
  },
  cancelButtonText: {
    fontFamily: "Poppins",
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
  },
  saveButtonText: {
    fontFamily: "Poppins",
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  modalTitle: {
    fontFamily: "Poppins",
    fontSize: 20,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 24,
  },
  errorText: {
    color: "#E74C3C",
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    color: "#333333",
  },
  modalButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  actionsContainer: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 24,
    marginTop: 16,
    alignItems: "center", // Center the buttons horizontally
  },
  actionButton: {
    justifyContent: "center",
    alignItems: "center",
    height: 56,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: "80%", // Set a fixed width for the buttons
  },
  actionButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  actionButtonIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
    tintColor: "#FFFFFF",
    display: "none", // Hide the icon to center the text perfectly
  },
  changePasswordButton: {
    backgroundColor: "#4A90E2",
  },
  updateInfoButton: {
    backgroundColor: "#50C878",
  },
  logoutButton: {
    backgroundColor: "#E74C3C",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Poppins",
    textAlign: "center", // Center the text within the button
    width: "100%", // Ensure the text takes up the full width
    textAlignVertical: "center", // Center vertically (Android)
  },
  modalButtonText: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  submitButton: {
    backgroundColor: "#4A90E2",
    marginLeft: 8,
  },
});

export default UserProfile;
