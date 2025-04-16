# Hướng dẫn tích hợp và sử dụng Socket.IO Realtime

## Giới thiệu

Tài liệu này hướng dẫn cách tích hợp và sử dụng tính năng realtime với Socket.IO trong ứng dụng KSMS. Tính năng này cho phép cập nhật dữ liệu realtime như thông báo, trạng thái cá Koi, và các sự kiện khác.

## Cài đặt

Để sử dụng tính năng socket realtime, bạn cần cài đặt thư viện socket.io-client:

```bash
yarn add socket.io-client
```

## Cấu trúc tệp

Tính năng socket realtime được tổ chức thành các tệp sau:

1. `services/socketService.ts` - Dịch vụ quản lý kết nối socket
2. `context/SocketContext.tsx` - Context provider để quản lý trạng thái socket
3. `components/NotificationBadge.tsx` - Component hiển thị biểu tượng thông báo với badge

## Cách sử dụng

### 1. Khởi tạo Socket Provider

Socket Provider đã được thêm vào `app/_layout.tsx`. Nó sẽ tự động kết nối và quản lý socket cho toàn bộ ứng dụng.

### 2. Sử dụng Socket Context trong component

Để sử dụng socket trong component, bạn cần import hook `useSocket`:

```typescript
import { useSocket } from '../context/SocketContext';

const MyComponent = () => {
  const { 
    isConnected, 
    notifications, 
    hasNewNotifications,
    koiStatusUpdates,
    showStatusUpdates,
    registrationStatusUpdates,
    livestreamStarted,
    paymentCompleted,
    resultAnnounced
  } = useSocket();
  
  // Sử dụng dữ liệu socket
  
  return (
    // JSX
  );
};
```

### 3. Xử lý thông báo realtime

Khi có thông báo mới, socket sẽ tự động cập nhật state trong context và hiển thị toast. Bạn có thể sử dụng `notifications` từ context để hiển thị danh sách thông báo.

### 4. Xử lý cập nhật trạng thái

Khi có cập nhật trạng thái (cá Koi, cuộc thi, đăng ký), socket sẽ tự động cập nhật state trong context. Bạn có thể sử dụng các state tương ứng để cập nhật UI.

### 5. Sử dụng NotificationBadge

Component `NotificationBadge` đã được thêm vào Header. Nó sẽ hiển thị badge khi có thông báo mới.

## Các sự kiện Socket

Socket service hỗ trợ các sự kiện sau:

- `connect` - Kết nối thành công
- `disconnect` - Ngắt kết nối
- `connect_error` - Lỗi kết nối
- `new_notification` - Thông báo mới
- `koi_status_updated` - Cập nhật trạng thái cá Koi
- `show_status_updated` - Cập nhật trạng thái cuộc thi
- `registration_status_updated` - Cập nhật trạng thái đăng ký
- `livestream_started` - Livestream bắt đầu
- `payment_completed` - Thanh toán hoàn tất
- `result_announced` - Công bố kết quả

## Cấu hình Backend

Để sử dụng tính năng socket realtime, backend cần hỗ trợ Socket.IO và phát các sự kiện tương ứng. Dưới đây là ví dụ về cách phát sự kiện từ backend:

```javascript
// Phát sự kiện thông báo mới
io.to(userId).emit('new_notification', {
  id: 'notification-id',
  title: 'Tiêu đề thông báo',
  content: 'Nội dung thông báo',
  type: 'Registration',
  isRead: false,
  sentDate: new Date().toISOString()
});

// Phát sự kiện cập nhật trạng thái cá Koi
io.to(userId).emit('koi_status_updated', {
  koiId: 'koi-id',
  newStatus: 'Approved',
  updatedAt: new Date().toISOString()
});
```

## Xử lý lỗi và kết nối lại

Socket service tự động xử lý lỗi kết nối và thử kết nối lại khi mất kết nối. Bạn có thể sử dụng state `isConnected` từ context để hiển thị trạng thái kết nối.

## Tùy chỉnh

Bạn có thể tùy chỉnh cách hiển thị thông báo và cập nhật UI bằng cách chỉnh sửa các component tương ứng.

## Lưu ý

- Socket sẽ tự động kết nối khi người dùng đăng nhập và ngắt kết nối khi người dùng đăng xuất.
- Đảm bảo rằng backend phát các sự kiện với định dạng đúng như đã định nghĩa trong interface.
- Sử dụng `__DEV__` để bật/tắt log debug trong môi trường phát triển.