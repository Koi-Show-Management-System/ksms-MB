// app/(user)/UserProfile.tsx
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// --- User Data Interface ---
interface UserData {
  username: string;
  email: string;
  location: string;
  koiCount: number;
  phoneNumber: string;
  profileImage: string;
  coverImage: string;
  joinDate: string;
  bio: string;
  fullName: string;
}

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

// --- Main UserProfile Component ---
const UserProfile: React.FC = () => {
  const [userData] = useState<UserData>({
    username: "John Doe",
    email: "john.doe@example.com",
    location: "San Francisco, CA",
    koiCount: 15,
    phoneNumber: "+1 234 567 8901",
    profileImage:
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=2080&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    coverImage:
      "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    joinDate: "January 15, 2021",
    bio: "Passionate koi collector and enthusiast for over 10 years.",
    fullName: "John Doe",
  });
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleChangePassword = (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => {
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setPasswordModalVisible(false);

      // Show success message
      Alert.alert("Success", "Your password has been changed successfully.", [
        { text: "OK" },
      ]);
    }, 1500);
  };

  const handleUpdateInformation = () => {
    // Navigate to edit profile screen
    router.push("/(user)/EditProfile");
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          // Handle logout logic
          router.replace("/(auth)/signIn");
        },
      },
    ]);
  };

  const handleImageUpload = () => {
    // Implement image upload logic
    console.log("Image upload logic not implemented");
  };

  const renderEditFields = () => {
    // Implement renderEditFields logic
    console.log("Edit fields rendering logic not implemented");
    return null;
  };

  const renderUserInfo = () => {
    // Implement renderUserInfo logic
    console.log("User info rendering logic not implemented");
    return null;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}>
      {/* Profile Information Section */}
      <View style={styles.profileInfoSection}>
        <View style={styles.profileImageContainer}>
          {userData.profileImage ? (
            <Image source={{ uri: userData.profileImage }} style={styles.profileImage} />
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
            onPress={handleImageUpload}>
            <Text style={styles.uploadButtonText}>Upload Photo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.profileDetailsContainer}>
          <View style={styles.profileNameContainer}>
            <Text style={styles.profileName}>
              {userData.fullName || "Loading..."}
            </Text>
            <TouchableOpacity
              onPress={() => setIsEditing(!isEditing)}
              style={styles.editButton}>
              <Text style={styles.editButtonText}>
                {isEditing ? "Cancel" : "Edit"}
              </Text>
            </TouchableOpacity>
          </View>
          {isEditing ? renderEditFields() : renderUserInfo()}
        </View>
      </View>

      {/* Settings Section */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingIconContainer}>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z7yU5-OoSyo-4k6R/bell.png",
              }}
              style={styles.settingIcon}
            />
          </View>
          <Text style={styles.settingText}>Notification</Text>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z7yU5-OoSyo-4k6R/arrow.png",
            }}
            style={styles.arrowIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingIconContainer}>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z7yU5-OoSyo-4k6R/lock.png",
              }}
              style={styles.settingIcon}
            />
          </View>
          <Text style={styles.settingText}>Privacy & Security</Text>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z7yU5-OoSyo-4k6R/arrow.png",
            }}
            style={styles.arrowIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleChangePassword}>
          <View style={styles.settingIconContainer}>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z7yU5-OoSyo-4k6R/key.png",
              }}
              style={styles.settingIcon}
            />
          </View>
          <Text style={styles.settingText}>Change Password</Text>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z7yU5-OoSyo-4k6R/arrow.png",
            }}
            style={styles.arrowIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingIconContainer}>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z7yU5-OoSyo-4k6R/help.png",
              }}
              style={styles.settingIcon}
            />
          </View>
          <Text style={styles.settingText}>Help & Support</Text>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z7yU5-OoSyo-4k6R/arrow.png",
            }}
            style={styles.arrowIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
          <View style={styles.settingIconContainer}>
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z7yU5-OoSyo-4k6R/logout.png",
              }}
              style={styles.settingIcon}
            />
          </View>
          <Text style={[styles.settingText, styles.logoutText]}>Log Out</Text>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z7yU5-OoSyo-4k6R/arrow.png",
            }}
            style={styles.arrowIcon}
          />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  contentContainer: {
    paddingBottom: 40,
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
  },
  uploadButtonText: {
    fontFamily: "Poppins",
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  profileDetailsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  profileNameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileName: {
    fontFamily: "Poppins",
    fontSize: 24,
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
  sectionTitle: {
    fontFamily: "Poppins",
    fontSize: 20,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 16,
    marginLeft: 16,
  },
  profileContainer: {
    width: "100%",
    marginTop: 60,
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
  actionsContainer: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
    tintColor: "#FFFFFF",
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
  cancelButton: {
    backgroundColor: "#F5F5F5",
    marginRight: 8,
  },
  submitButton: {
    backgroundColor: "#4A90E2",
    marginLeft: 8,
  },
  modalButtonText: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  settingsSection: {
    padding: 16,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  settingIconContainer: {
    width: 24,
    height: 24,
    marginRight: 16,
  },
  settingIcon: {
    width: "100%",
    height: "100%",
  },
  settingText: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  arrowIcon: {
    width: 16,
    height: 16,
    tintColor: "#666666",
  },
  logoutText: {
    color: "#E74C3C",
  },
});

export default UserProfile;
