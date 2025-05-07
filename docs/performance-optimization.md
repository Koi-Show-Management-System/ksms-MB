# Tối Ưu Hiệu Suất Ứng Dụng

## Vô hiệu hóa console.log trong Production

Một lỗi phổ biến ảnh hưởng đến hiệu suất là sử dụng quá nhiều `console.log()`. Các lệnh log trong môi trường production có thể gây ra hiệu suất kém, đặc biệt là trên thiết bị Android.

### Giải pháp đã triển khai

Chúng ta đã triển khai 2 giải pháp:

1. **Vô hiệu hóa tất cả console.log trong môi trường production**
   - Tự động tắt tất cả lệnh `console.log()` khi ứng dụng chạy trong môi trường production 
   - Đặt trong file `app/_layout.tsx`

2. **Logger utility mới**
   - Cung cấp API thay thế cho `console.log()`
   - Tự động bỏ qua log trong môi trường production
   - Thêm thông tin hữu ích như timestamp và tag

### Cách sử dụng Logger mới

Thay vì sử dụng `console.log()` trực tiếp, hãy sử dụng logger mới:

```typescript
import { logger } from '../utils/logger';

// Thay vì console.log()
logger.info('Thông tin bình thường');

// Thay vì console.error()
logger.error('Có lỗi xảy ra', errorObject);

// Loại log khác
logger.debug('Thông tin debug chi tiết');
logger.warn('Cảnh báo');
```

### Tạo Logger tùy chỉnh cho từng module

Bạn có thể tạo logger riêng cho từng module với tag tùy chỉnh:

```typescript
import { createLogger } from '../utils/logger';

// Tạo logger riêng cho module Authentication
const authLogger = createLogger({ tag: 'Auth' });

// Sử dụng
authLogger.info('Đăng nhập thành công');
// Output: [2023-06-15T10:30:45.123Z][Auth][INFO] Đăng nhập thành công
```

### Lợi ích của việc sử dụng Logger mới

1. **Hiệu suất tốt hơn trong production**: Không có log nào được thực thi trong môi trường production
2. **Dễ quản lý**: Có thể bật/tắt log cho từng module cụ thể
3. **Thông tin phong phú hơn**: Thêm timestamp và context
4. **Dễ dàng mở rộng**: Có thể thêm tính năng gửi lỗi đến dịch vụ theo dõi lỗi

## Các ưu điểm về hiệu suất khác

Ngoài việc tắt console.log, chúng ta có thể cải thiện hiệu suất bằng cách:

1. **Sử dụng router.replace() thay vì router.push()** khi không cần lịch sử navigation
2. **Thêm detachPreviousScreen: true và freezeOnBlur: true** trong screenOptions của Stack
3. **Tối ưu hóa các component với memo và useCallback** để tránh re-render không cần thiết
4. **Sử dụng FlatList thay vì ScrollView với map** cho danh sách dài

## Kiểm soát lịch sử navigation

Để giảm tình trạng lag khi điều hướng nhiều màn hình, hãy sử dụng các phương pháp sau:

```typescript
// Thay thế màn hình hiện tại thay vì thêm vào stack
router.replace('/(user)/profile');

// Reset toàn bộ stack khi cần
router.dispatch(
  CommonActions.reset({
    index: 0,
    routes: [{ name: '/(tabs)/home/homepage' }],
  })
);
``` 