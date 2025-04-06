import React, { ReactNode, useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Dimensions, Keyboard } from 'react-native';
import { usePathname } from 'expo-router';
import Footer from './Footer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface LayoutWithFooterProps {
  children: ReactNode;
  showFooter?: boolean;
}

// Hàm helper để xác định activeTab dựa vào đường dẫn hiện tại
const getActiveTabFromPath = (path: string): 'home' | 'notifications' | 'camera' | 'profile' | 'shows' => {
  if (path.includes('/home')) return 'home';
  if (path.includes('/Notification')) return 'notifications'; 
  if (path.includes('/shows')) return 'shows';
  if (path.includes('/UserProfile') || 
      path.includes('/Transactions') || 
      path.includes('/TicketDetail') || 
      path.includes('/TicketCheckin') || 
      path.includes('/OrderDetail') || 
      path.includes('/KoiList') || 
      path.includes('/CompetitionTicket') || 
      path.includes('/CompetitionJoined')) return 'profile';
  
  // Mặc định trả về home
  return 'home';
};

const LayoutWithFooter: React.FC<LayoutWithFooterProps> = ({ children, showFooter = true }) => {
  const pathname = usePathname();
  const activeTab = getActiveTabFromPath(pathname);
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  
  // Lắng nghe sự thay đổi kích thước màn hình
  useEffect(() => {
    const dimensionsHandler = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });
    
    // Lắng nghe sự kiện bàn phím hiển thị/ẩn
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });
    
    return () => {
      dimensionsHandler.remove();
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  
  // Tính toán bottomPadding dựa trên nhiều yếu tố
  // - Kích thước footer (mặc định 70)
  // - Insets.bottom (cho notch hoặc thanh home trên iOS)
  // - Trạng thái thanh điều hướng (thông qua screenDimensions)
  // - Trạng thái bàn phím
  
  const footerHeight = 70;
  const navBarHeight = Platform.OS === 'android' ? 15 : 0; // Ước tính chiều cao thanh điều hướng trên Android
  const safeAreaBottom = Math.max(insets.bottom, 0);
  
  // Chỉ áp dụng padding khi footer hiển thị và bàn phím không hiển thị
  const bottomPadding = showFooter && !keyboardVisible 
    ? footerHeight + safeAreaBottom + navBarHeight
    : 0;
  
  return (
    <View style={styles.container}>
      <View style={[styles.content, { paddingBottom: bottomPadding }]}>
        {children}
      </View>
      {showFooter && !keyboardVisible && <Footer activeTab={activeTab} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
    // paddingBottom được tính toán động và truyền vào style
  },
});

export default LayoutWithFooter; 