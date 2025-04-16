import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { usePathname } from 'expo-router';
import Footer from './Footer';
// useSafeAreaInsets không còn cần thiết ở đây nếu Footer tự xử lý

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
  // Không cần theo dõi keyboardVisible ở đây nữa nếu Footer tự ẩn khi bàn phím mở

  return (
    <View style={styles.container}>
      {/* Content sẽ tự động chiếm không gian còn lại */}
      <View style={styles.content}>
        {children}
      </View>
      {/* Footer được hiển thị độc lập */}
      {showFooter && <Footer activeTab={activeTab} />}
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
    // Không cần paddingBottom ở đây nữa
  },
});

export default LayoutWithFooter;
