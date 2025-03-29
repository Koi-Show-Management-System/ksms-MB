import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View, Platform, StatusBar, Dimensions } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { router } from "expo-router";

// Lấy kích thước màn hình
const { width, height } = Dimensions.get('window');

interface FooterProps {
  activeTab?: 'home' | 'notifications' | 'camera' | 'profile' | 'shows';
  onHomePress?: () => void;
  onNotificationPress?: () => void;
  onCameraPress?: () => void;
  onProfilePress?: () => void;
  onShowsPress?: () => void;
}

const Footer: React.FC<FooterProps> = ({
  activeTab = 'home',
  onHomePress,
  onNotificationPress,
  onCameraPress,
  onProfilePress,
  onShowsPress,
}) => {
  // Xử lý các sự kiện nếu không được truyền vào
  const handleHomePress = () => {
    if (onHomePress) {
      onHomePress();
    } else {
      router.push("/");
    }
  };

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      router.push("/Notification");
    }
  };

  const handleCameraPress = () => {
    if (onCameraPress) {
      onCameraPress();
    } else {
      // Mặc định hiển thị thông báo đang phát triển
      alert("Đang phát triển tính năng camera");
    }
  };

  const handleProfilePress = () => {
    if (onProfilePress) {
      onProfilePress();
    } else {
      router.push("/UserProfile");
    }
  };

  const handleShowsPress = () => {
    if (onShowsPress) {
      onShowsPress();
    } else {
      router.push("/shows/KoiShowsPage");
    }
  };

  return (
    <LinearGradient
      colors={['rgba(255,255,255,0.8)', '#FFFFFF']}
      style={styles.footerContainer}
    >
      <BlurView intensity={80} style={styles.footerBlur}>
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.footerItem, activeTab === 'home' && styles.activeFooterItem]} 
            onPress={handleHomePress}
          >
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z79CVK7obB3a4bxY/frame-5.png",
              }}
              style={[styles.footerIcon, activeTab === 'home' && styles.activeFooterIcon]}
            />
            <Text style={[styles.footerText, activeTab === 'home' && styles.activeFooterText]}>Trang chủ</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.footerItem, activeTab === 'shows' && styles.activeFooterItem]}
            onPress={handleShowsPress}
          >
            <Image
              source={{
                uri: "https://img.icons8.com/material-rounded/24/000000/calendar.png",
              }}
              style={[styles.footerIcon, activeTab === 'shows' && styles.activeFooterIcon]}
            />
            <Text style={[styles.footerText, activeTab === 'shows' && styles.activeFooterText]}>Sự kiện</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.footerCameraButton]}
            onPress={handleCameraPress}
          >
            <View style={styles.footerCameraCircle}>
              <Image
                source={{
                  uri: "https://dashboard.codeparrot.ai/api/image/Z79CVK7obB3a4bxY/frame-6.png",
                }}
                style={styles.footerCameraIcon}
              />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.footerItem, activeTab === 'notifications' && styles.activeFooterItem]}
            onPress={handleNotificationPress}
          >
            <Image
              source={{
                uri: "https://dashboard.codeparrot.ai/api/image/Z79CVK7obB3a4bxY/frame-7.png",
              }}
              style={[styles.footerIcon, activeTab === 'notifications' && styles.activeFooterIcon]}
            />
            <Text style={[styles.footerText, activeTab === 'notifications' && styles.activeFooterText]}>Thông báo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.footerItem, activeTab === 'profile' && styles.activeFooterItem]}
            onPress={handleProfilePress}
          >
            <Image
              source={{
                uri: "https://img.icons8.com/material-rounded/24/000000/user.png",
              }}
              style={[styles.footerIcon, activeTab === 'profile' && styles.activeFooterIcon]}
            />
            <Text style={[styles.footerText, activeTab === 'profile' && styles.activeFooterText]}>Tài khoản</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
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
  activeFooterItem: {
    // Có thể thêm style khi tab được chọn nếu cần
  },
  footerIcon: {
    width: 24,
    height: 24,
    tintColor: '#64748b',
  },
  activeFooterIcon: {
    tintColor: '#5664F5',
  },
  footerText: {
    fontFamily: "Lexend Deca",
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  activeFooterText: {
    color: '#5664F5',
    fontWeight: '500',
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
});

export default Footer;
