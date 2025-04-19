// Đây chỉ là hướng dẫn tích hợp, không phải file thực tế để chạy
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * HƯỚNG DẪN TÍCH HỢP STREAM CHAT VÀO LIVESTREAMVIEWER
 * 
 * Bởi vì file LivestreamViewer.tsx quá lớn để chỉnh sửa trực tiếp qua API,
 * dưới đây là hướng dẫn các thay đổi cần thiết:
 * 
 * 1. Import EnhancedLivestreamChat từ components
 * 
 * 2. Trong component EnhancedLivestreamUI, thay thế phần "Phần bình luận" với EnhancedLivestreamChat
 *    và truyền các props: userId, userName, livestreamId, và showName
 * 
 * 3. Đảm bảo rằng bạn có có truy cập vào livestreamId và showName trong EnhancedLivestreamUI
 * 
 * 4. Cập nhật styles nếu cần thiết để phù hợp với giao diện của bạn
 * 
 * 5. Trong file app/_layout.tsx, thêm OverlayProvider của Stream Chat từ stream-chat-expo
 * 
 * 6. Cập nhật services/chatService.ts để sử dụng API key thực và token từ backend của bạn
 */

const ChatIntegrationExample = () => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Hướng dẫn tích hợp Stream Chat</Text>
        
        <Text style={styles.sectionTitle}>1. Import Component</Text>
        <Text style={styles.code}>import EnhancedLivestreamChat from '../../../components/EnhancedLivestreamChat';</Text>
        
        <Text style={styles.sectionTitle}>2. Sử dụng trong LivestreamViewer</Text>
        <Text style={styles.paragraph}>
          Thay thế phần "Phần bình luận" trong EnhancedLivestreamUI với component EnhancedLivestreamChat
          và truyền các thông tin cần thiết.
        </Text>
        
        <Text style={styles.sectionTitle}>3. Cấu hình Token</Text>
        <Text style={styles.paragraph}>
          Token chat sẽ được lấy từ API thông qua hàm getLivestreamChatToken(), tương tự như
          cách lấy token cho livestream.
        </Text>
        
        <Text style={styles.paragraph}>
          Xem các file đã được tạo:
        </Text>
        <Text style={styles.code}>components/LivestreamChat.tsx</Text>
        <Text style={styles.code}>components/EnhancedLivestreamChat.tsx</Text>
        <Text style={styles.code}>services/chatService.ts</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#555',
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
    color: '#666',
  },
  code: {
    fontFamily: 'monospace',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
    fontSize: 14,
    marginBottom: 12,
    color: '#0066cc',
  },
});

export default ChatIntegrationExample; 