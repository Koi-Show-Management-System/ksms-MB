# Carousel3D Component

Carousel3D là một component hiển thị ảnh dạng 3D với hiệu ứng xoay và phóng to ảnh. Component này sử dụng React Native Reanimated và React Native Gesture Handler để tạo trải nghiệm mượt mà cho người dùng.

## Cài đặt

Component này yêu cầu các thư viện sau:

```bash
yarn add react-native-reanimated react-native-gesture-handler expo-blur
```

Nếu bạn chưa cài đặt các thư viện này, hãy cài đặt chúng trước.

## Sử dụng

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Carousel3D from '../components/Carousel3D';

// Danh sách ảnh tuỳ chỉnh
const myImages = [
  'https://example.com/image1.jpg',
  'https://example.com/image2.jpg',
  'https://example.com/image3.jpg',
  // Thêm nhiều ảnh hơn ở đây...
];

const MyScreen = () => {
  return (
    <View style={styles.container}>
      {/* Sử dụng với ảnh mặc định */}
      <Carousel3D />
      
      {/* Hoặc sử dụng với ảnh tùy chỉnh */}
      {/* <Carousel3D images={myImages} /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default MyScreen;
```

## Props

| Prop | Kiểu dữ liệu | Mô tả | Mặc định |
|------|--------------|-------|----------|
| images | string[] | Danh sách URL ảnh | Ảnh ngẫu nhiên từ picsum.photos |

## Tính năng

1. **Xoay 3D**: Vuốt ngang để xoay carousel theo kiểu 3D cylinder
2. **Phóng to ảnh**: Chạm vào ảnh để xem ở chế độ toàn màn hình
3. **Hiệu ứng mượt mà**: Sử dụng Reanimated 2 để tạo hiệu ứng chuyển động mượt mà
4. **Đáp ứng**: Tự động điều chỉnh kích thước dựa trên kích thước màn hình

## Tùy chỉnh

Bạn có thể tùy chỉnh component bằng cách chỉnh sửa các giá trị trong tệp `Carousel3D.tsx`:

- Thay đổi kích thước và bán kính của carousel
- Điều chỉnh thời gian và loại animation
- Thay đổi giao diện của carousel và ảnh
- Thêm các hiệu ứng khác tùy ý

## Lưu ý

- Component này yêu cầu không gian màn hình đủ cao để hiển thị đẹp mắt
- Hiệu suất tốt nhất trên các thiết bị có cấu hình cao
- Có thể tùy chỉnh thêm để phù hợp với thiết kế ứng dụng của bạn 