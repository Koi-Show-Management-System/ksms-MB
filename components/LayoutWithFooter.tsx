import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { usePathname } from 'expo-router';
import Footer from './Footer';

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
  
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {children}
      </View>
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
    paddingBottom: 70, // Để đảm bảo nội dung không bị Footer che khuất
  },
});

export default LayoutWithFooter; 