# Tối ưu hóa hiệu năng cho ứng dụng Koi Show

Tài liệu này mô tả các tối ưu hóa đã thực hiện để cải thiện hiệu năng của màn hình KoiShowInformation trong ứng dụng Koi Show.

## Vấn đề
- Màn hình KoiShowInformation gọi nhiều API đồng thời (không song song)
- Thời gian tải màn hình > 3 giây
- Không có caching dữ liệu
- Không có tái sử dụng dữ liệu giữa các lần render

## Giải pháp

### 1. Áp dụng React Query
Cài đặt React Query để cải thiện việc quản lý dữ liệu và caching:
```bash
yarn add @tanstack/react-query
```

### 2. Tạo QueryProvider
Tạo một QueryProvider để cấu hình React Query tối ưu cho môi trường mobile:
- Đặt cấu hình `staleTime` và `gcTime` hợp lý
- Cấu hình số lần retry và thời gian giữa các lần retry
- Tắt `refetchOnWindowFocus` không phù hợp với mobile

### 3. Tối ưu hóa API Calls
- Tạo `koiShowService.ts` để tách các hàm gọi API
- Sử dụng `Promise.all` để gọi nhiều API song song
- Thực hiện gọi API một lần và chia sẻ kết quả qua Context

### 4. Áp dụng Memorization và Component Optimization
- Sử dụng `memo` để tránh re-render các component con
- Áp dụng `useCallback` cho các hàm được sử dụng trong component
- Tách các component lớn thành các component nhỏ hơn

### 5. Tối ưu FlatList
- Thiết lập `initialNumToRender`, `maxToRenderPerBatch`, và `windowSize`
- Bật `removeClippedSubviews` để giải phóng bộ nhớ
- Sử dụng `keyExtractor` và `ItemSeparatorComponent` đã được memoized

### 6. Cấu trúc lại component
- Tách thành 3 component: Wrapper, Content và Item
- Sử dụng Provider-Consumer pattern để tối ưu hóa data flow

## Kết quả
- Giảm thời gian tải màn hình xuống dưới 1 giây
- Dữ liệu được cache và tái sử dụng giữa các lần render
- Giảm số lượng API calls không cần thiết
- Tăng trải nghiệm người dùng thông qua UI mượt mà hơn

## Các file đã sửa đổi
1. `context/QueryProvider.tsx` - Tạo mới
2. `context/KoiShowContext.tsx` - Tạo mới
3. `services/koiShowService.ts` - Tạo mới
4. `app/_layout.tsx` - Thêm QueryProvider
5. `app/(tabs)/shows/KoiShowInformation.tsx` - Cấu trúc lại và tối ưu hóa

## Hướng phát triển tiếp theo
1. Áp dụng tương tự cho các màn hình khác trong ứng dụng
2. Thêm prefetching dữ liệu ở màn hình danh sách
3. Triển khai Suspense để tăng trải nghiệm người dùng
4. Thêm tính năng offline support với React Query 