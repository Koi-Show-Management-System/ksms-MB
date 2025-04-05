import React from 'react';
import { View, StyleSheet, Text, SafeAreaView } from 'react-native';
import Carousel3D from '../components/Carousel3D';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Danh sách ảnh tùy chỉnh (tùy chọn)
const customImages = [
  'https://picsum.photos/400/600?city',
  'https://picsum.photos/400/600?night',
  'https://picsum.photos/400/600?nature',
  'https://picsum.photos/400/600?beach',
  'https://picsum.photos/400/600?mountain',
  'https://picsum.photos/400/600?forest',
  'https://picsum.photos/400/600?ocean',
  'https://picsum.photos/400/600?sunset',
  'https://picsum.photos/400/600?architecture',
  'https://picsum.photos/400/600?travel',
];

const CarouselDemo = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <Text style={styles.title}>Carousel 3D</Text>
          <Text style={styles.subtitle}>Vuốt để xoay, chạm để phóng to</Text>
        </View>
        <View style={styles.carouselContainer}>
          <Carousel3D images={customImages} />
        </View>
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
  carouselContainer: {
    flex: 1,
    marginBottom: 40,
  },
});

export default CarouselDemo; 