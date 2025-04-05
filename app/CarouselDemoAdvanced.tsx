import React from 'react';
import { View, StyleSheet, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import Carousel3DAdvanced from '../components/Carousel3DAdvanced';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Các mẫu dữ liệu tùy chỉnh
const customItems = [
  {
    uri: 'https://picsum.photos/400/600?mountain',
    title: 'Núi Tuyết',
    description: 'Những dãy núi hùng vĩ với tuyết phủ quanh năm'
  },
  {
    uri: 'https://picsum.photos/400/600?beach',
    title: 'Bãi Biển',
    description: 'Bãi biển cát trắng với làn nước trong xanh'
  },
  {
    uri: 'https://picsum.photos/400/600?forest',
    title: 'Rừng Già',
    description: 'Khu rừng nguyên sinh với hệ sinh thái đa dạng'
  },
  {
    uri: 'https://picsum.photos/400/600?city',
    title: 'Thành Phố',
    description: 'Thành phố nhộn nhịp với ánh đèn rực rỡ'
  },
  {
    uri: 'https://picsum.photos/400/600?architecture',
    title: 'Kiến Trúc',
    description: 'Công trình kiến trúc đặc sắc với thiết kế ấn tượng'
  },
  {
    uri: 'https://picsum.photos/400/600?sunset',
    title: 'Hoàng Hôn',
    description: 'Cảnh hoàng hôn đẹp mê hồn trên biển'
  }
];

const CarouselDemoAdvanced = () => {
  const router = useRouter();

  // Xử lý khi nhấn vào card
  const handleCardPress = (item: any, index: number) => {
    console.log(`Card pressed: ${item.title} at index ${index}`);
    // Bạn có thể thêm xử lý tùy chỉnh khác ở đây
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Quay lại</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Carousel 3D Nâng Cao</Text>
          <Text style={styles.subtitle}>
            Với tính năng tự động chuyển, điều khiển, và hiệu ứng
          </Text>
        </View>
        
        <ScrollView style={styles.scrollView}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Carousel Mặc Định</Text>
            <Text style={styles.sectionDescription}>
              Với tự động chuyển và điều khiển
            </Text>
            <View style={styles.carouselContainer}>
              <Carousel3DAdvanced />
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Carousel Tùy Chỉnh</Text>
            <Text style={styles.sectionDescription}>
              Với dữ liệu và hình ảnh tùy chỉnh
            </Text>
            <View style={styles.carouselContainer}>
              <Carousel3DAdvanced 
                items={customItems} 
                autoPlay={true}
                autoPlayInterval={5000}
                backgroundColor="#1a1a2e"
                onCardPress={handleCardPress}
              />
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Carousel Không Tự Động</Text>
            <Text style={styles.sectionDescription}>
              Chỉ điều khiển thủ công bằng nút hoặc vuốt
            </Text>
            <View style={styles.carouselContainer}>
              <Carousel3DAdvanced 
                autoPlay={false}
                backgroundColor="#2d3436"
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 20,
    zIndex: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginHorizontal: 20,
    marginBottom: 6,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#aaa',
    marginHorizontal: 20,
    marginBottom: 15,
  },
  carouselContainer: {
    height: 500,
  },
});

export default CarouselDemoAdvanced; 