# Carousel3DAdvanced Component

Carousel3DAdvanced là một component hiển thị ảnh 3D được nâng cấp với nhiều tính năng cao cấp và hiệu ứng đẹp mắt. Component này được thiết kế dành cho React Native Expo.

## Cài đặt

Component này yêu cầu các thư viện sau:

```bash
yarn add react-native-reanimated react-native-gesture-handler expo-blur expo-linear-gradient @expo/vector-icons
```

Đảm bảo rằng bạn đã cài đặt và cấu hình đúng các thư viện này trong dự án của bạn.

## Tính năng

1. **Hiệu ứng 3D mượt mà**: Hiển thị các ảnh trong dạng hình trụ 3D với hiệu ứng xoay
2. **Tự động chuyển ảnh**: Tự động xoay carousel sau một khoảng thời gian nhất định
3. **Điều khiển**: Các nút điều khiển để di chuyển đến ảnh trước/tiếp theo và bật/tắt tự động chuyển
4. **Hiệu ứng phóng to**: Chạm vào ảnh để xem ở chế độ toàn màn hình với hiệu ứng blur nền
5. **Hiển thị tiêu đề và mô tả**: Hiển thị thông tin chi tiết về từng ảnh
6. **Thích ứng**: Tự động điều chỉnh kích thước dựa trên màn hình thiết bị
7. **Hiệu ứng tải**: Hiển thị loading khi ảnh đang tải
8. **Phản hồi cử chỉ**: Xử lý các cử chỉ của người dùng một cách mượt mà

## Sử dụng cơ bản

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Carousel3DAdvanced from '../components/Carousel3DAdvanced';

const MyScreen = () => {
  return (
    <View style={styles.container}>
      <Carousel3DAdvanced />
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

## Dữ liệu tùy chỉnh

Bạn có thể cung cấp dữ liệu tùy chỉnh cho carousel:

```tsx
const myItems = [
  {
    uri: 'https://example.com/image1.jpg',
    title: 'Tiêu đề 1',
    description: 'Mô tả chi tiết về ảnh 1'
  },
  {
    uri: 'https://example.com/image2.jpg',
    title: 'Tiêu đề 2',
    description: 'Mô tả chi tiết về ảnh 2'
  },
  // Thêm các ảnh khác...
];

<Carousel3DAdvanced items={myItems} />
```

## Props

| Prop | Kiểu dữ liệu | Mô tả | Mặc định |
|------|--------------|-------|----------|
| items | CardItem[] | Danh sách các ảnh với tiêu đề và mô tả | Danh sách mẫu |
| autoPlay | boolean | Bật/tắt chế độ tự động chuyển | true |
| autoPlayInterval | number | Thời gian giữa các lần chuyển (ms) | 3000 |
| showControls | boolean | Hiển thị các nút điều khiển | true |
| onCardPress | (item, index) => void | Hàm xử lý khi nhấn vào ảnh | undefined |
| containerStyle | object | Style tùy chỉnh cho container | undefined |
| backgroundColor | string | Màu nền của carousel | '#121212' |

## Cấu trúc CardItem

```typescript
interface CardItem {
  uri: string;      // URL của ảnh
  title?: string;   // Tiêu đề (tùy chọn)
  description?: string;  // Mô tả (tùy chọn)
}
```

## Ví dụ nâng cao

```tsx
import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import Carousel3DAdvanced from '../components/Carousel3DAdvanced';

const MyAdvancedScreen = () => {
  // Xử lý khi người dùng nhấp vào ảnh
  const handleCardPress = (item, index) => {
    Alert.alert('Đã chọn ảnh', `Bạn đã chọn ${item.title} ở vị trí ${index}`);
    // Thêm xử lý tùy chỉnh khác...
  };

  return (
    <View style={styles.container}>
      <Carousel3DAdvanced 
        autoPlay={true}
        autoPlayInterval={5000}
        showControls={true}
        backgroundColor="#1a1a2e"
        onCardPress={handleCardPress}
        containerStyle={{ borderRadius: 10, overflow: 'hidden' }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
});

export default MyAdvancedScreen;
```

## Hiệu suất

- Component sử dụng React.memo để tránh render lại không cần thiết
- Sử dụng useCallback cho các hàm để tối ưu hiệu suất
- Sử dụng Animated.SharedValue từ React Native Reanimated để đảm bảo animation mượt mà
- Tự động dừng autoplay khi người dùng tương tác để tiết kiệm tài nguyên

## Lưu ý

- Component này tương thích với cả iOS và Android
- Đảm bảo rằng bạn có đủ không gian trên màn hình để hiển thị carousel (khuyến nghị tối thiểu 500px chiều cao)
- Cung cấp ảnh có chất lượng tốt để có trải nghiệm người dùng tốt nhất
- Có thể customization thêm để phù hợp với design của ứng dụng của bạn

## Tùy chỉnh nâng cao

Bạn có thể chỉnh sửa trực tiếp file `Carousel3DAdvanced.tsx` để thêm các tính năng mới hoặc điều chỉnh hiệu ứng hiện có:

- Thay đổi kích thước và bán kính của carousel
- Điều chỉnh các tham số animation
- Thêm các hiệu ứng mới
- Thay đổi giao diện và bố cục 