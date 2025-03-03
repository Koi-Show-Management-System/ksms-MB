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
}

// --- Header Component ---
interface HeaderProps {
  userData: UserData;
  onBackPress: () => void;
  onEditPress: () => void;
}

const Header: React.FC<HeaderProps> = ({
  userData,
  onBackPress,
  onEditPress,
}) => {
  return (
    <View style={styles.headerWrapper}>
      <Image source={{ uri: userData.coverImage }} style={styles.coverImage} />
      <LinearGradient
        colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.7)"]}
        style={styles.coverGradient}
      />
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
          <Image
            source={{
              uri: "https://dashboard.codeparrot.ai/api/image/Z79X-67obB3a4bxu/frame.png",
            }}
            style={styles.backIcon}
          />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onEditPress} style={styles.editButton}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.profileImageContainer}>
        <Image
          source={{ uri: userData.profileImage }}
          style={styles.profileImage}
        />
        <Text style={styles.usernameText}>{userData.username}</Text>
        <Text style={styles.joinDateText}>
          Member since {userData.joinDate}
        </Text>
        <Text style={styles.bioText}>{userData.bio}</Text>
      </View>
    </View>
  );
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

// --- Footer Component ---
const Footer: React.FC = () => {
  return (
    <View style={styles.footerContainer}>
      <TouchableOpacity
        style={styles.footerIconButton}
        onPress={() => router.push("/(tabs)/home/homepage")}>
        <Image
          source={{
            uri: "https://dashboard.codeparrot.ai/api/image/Z79X-67obB3a4bxu/frame-2.png",
          }}
          style={styles.footerIcon}
        />
        <Text style={styles.footerText}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.footerIconButton}
        onPress={() => router.push("/(user)/Notification")}>
        <Image
          source={{
            uri: "https://dashboard.codeparrot.ai/api/image/Z79X-67obB3a4bxu/frame-4.png",
          }}
          style={styles.footerIcon}
        />
        <Text style={styles.footerText}>Notifications</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.footerIconButton, styles.activeFooterButton]}
        onPress={() => {}}>
        <Image
          source={{
            uri: "https://dashboard.codeparrot.ai/api/image/Z79X-67obB3a4bxu/frame-3.png",
          }}
          style={[styles.footerIcon, styles.activeFooterIcon]}
        />
        <Text style={[styles.footerText, styles.activeFooterText]}>
          Profile
        </Text>
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
  // Mock user data - in a real app, this would come from an API or context
  const [userData, setUserData] = useState<UserData>({
    username: "JohnDoe",
    email: "john.doe@example.com",
    location: "New York, USA",
    koiCount: 20,
    phoneNumber: "+1 555 123 4567",
    profileImage:
      "https://dashboard.codeparrot.ai/api/image/Z79X-67obB3a4bxu/group-9.png",
    coverImage:
      "https://dashboard.codeparrot.ai/api/image/Z79X-67obB3a4bxu/koi-cover.jpg",
    joinDate: "January 2022",
    bio: "Passionate koi collector and enthusiast. I love attending koi exhibitions and sharing my knowledge with fellow enthusiasts.",
  });

  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

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

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}>
        <Header
          userData={userData}
          onBackPress={() => router.back()}
          onEditPress={handleUpdateInformation}
        />

        <ProfileSection userData={userData} />

        <ActionButtons
          onChangePassword={() => setPasswordModalVisible(true)}
          onUpdateInformation={handleUpdateInformation}
          onLogout={handleLogout}
        />
      </ScrollView>

      <Footer />

      <PasswordChangeModal
        visible={passwordModalVisible}
        onClose={() => setPasswordModalVisible(false)}
        onSubmit={handleChangePassword}
        loading={loading}
      />
    </View>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },

  // Header Styles
  headerWrapper: {
    width: "100%",
    height: 300,
    position: "relative",
  },
  coverImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  coverGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "100%",
  },
  headerContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    zIndex: 10,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: "#FFFFFF",
  },
  backText: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: "#4A90E2",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    fontFamily: "Poppins",
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  profileImageContainer: {
    alignItems: "center",
    position: "absolute",
    bottom: -50,
    left: 0,
    right: 0,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  usernameText: {
    fontFamily: "Poppins",
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 8,
  },
  joinDateText: {
    fontFamily: "Poppins",
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.8,
  },
  bioText: {
    fontFamily: "Poppins",
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 32,
    opacity: 0.9,
  },

  // Section Title
  sectionTitle: {
    fontFamily: "Poppins",
    fontSize: 20,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 16,
    marginLeft: 16,
  },

  // Profile Section Styles
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

  // Action Buttons Styles
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

  // Footer Styles
  footerContainer: {
    width: "100%",
    height: 70,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    paddingBottom: 10,
  },
  footerIconButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  activeFooterButton: {
    borderTopWidth: 2,
    borderTopColor: "#4A90E2",
    paddingTop: 6,
  },
  footerIcon: {
    width: 24,
    height: 24,
    marginBottom: 4,
  },
  activeFooterIcon: {
    tintColor: "#4A90E2",
  },
  footerText: {
    fontSize: 12,
    color: "#666666",
  },
  activeFooterText: {
    color: "#4A90E2",
    fontWeight: "600",
  },

  // Modal Styles
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
});

export default UserProfile;
