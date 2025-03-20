# Hướng dẫn Build APK bằng Docker trên VPS

Tài liệu này hướng dẫn cách sử dụng Docker để build ứng dụng Android APK từ dự án React Native/Expo này, tối ưu hóa cho môi trường VPS đã cài đặt sẵn Docker.

## Cấu trúc dự án

- `Dockerfile`: Chứa cấu hình để tạo môi trường build Android
- `docker-compose.yml`: Cấu hình Docker Compose để dễ dàng chạy container
- `.github/workflows/docker-android-build.yml`: Workflow để tự động build APK trên GitHub Actions
- `build-apk.sh`: Script Bash để tự động hóa quy trình build trên Linux

## Các bước thực hiện

### 1. Chuẩn bị

Trước tiên, clone repository và tạo thư mục build-output:

```bash
# Clone repository
git clone https://github.com/your-username/your-repo.git
cd your-repo

# Tạo thư mục output cho APK
mkdir -p build-output
```

### 2. Build bằng script trợ giúp

```bash
# Thêm quyền thực thi cho script
chmod +x build-apk.sh

# Chạy script
./build-apk.sh
```

### 3. Hoặc build thủ công với Docker Compose

#### Build Docker image

```bash
docker-compose build
```

#### Build APK với profile cụ thể

```bash
# Thiết lập build profile (development, preview, production)
export BUILD_PROFILE=development
docker-compose run android-builder
```

### 4. Lệnh build tùy chỉnh

Nếu bạn muốn chạy các lệnh tùy chỉnh trong container:

```bash
docker-compose run --entrypoint bash android-builder
```

Sau đó, bạn có thể chạy các lệnh bên trong container, ví dụ:

```bash
# Trong container
yarn run build --profile preview
```

## Sử dụng GitHub Actions CI/CD với Phân phối APK trên Server

Dự án này bao gồm workflow GitHub Actions để tự động hóa việc build APK. Workflow này được cấu hình để:

1. Chạy khi có push vào các nhánh `main` hoặc `development`
2. Có thể chạy thủ công thông qua GitHub interface với lựa chọn build profile
3. Lưu trữ APK trực tiếp trên server để phân phối

### Thiết lập Android SDK

Workflow GitHub Actions sẽ tự động thiết lập Android SDK trên VPS:

1. SDK được cài đặt vào thư mục `/opt/android-sdk`
2. Workflow tự động tải Command Line Tools và cài đặt các thành phần cần thiết
3. Biến môi trường `ANDROID_HOME` và `ANDROID_SDK_ROOT` được thiết lập đúng đường dẫn
4. Docker container sẽ sử dụng Android SDK từ host thông qua volume mount

Nếu bạn muốn thiết lập Android SDK thủ công:

```bash
# Tạo thư mục Android SDK
sudo mkdir -p /opt/android-sdk
sudo chown $USER:$USER /opt/android-sdk

# Tải Command Line Tools
cd /opt/android-sdk
wget -q https://dl.google.com/android/repository/commandlinetools-linux-8512546_latest.zip
unzip -q commandlinetools-linux-8512546_latest.zip
mkdir -p cmdline-tools/latest
mv cmdline-tools/* cmdline-tools/latest/ 2>/dev/null
rm commandlinetools-linux-8512546_latest.zip

# Thiết lập biến môi trường
echo 'export ANDROID_HOME=/opt/android-sdk' >> ~/.bashrc
echo 'export ANDROID_SDK_ROOT=/opt/android-sdk' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools' >> ~/.bashrc
source ~/.bashrc

# Chấp nhận licenses và cài đặt các thành phần
yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses
$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager "platform-tools" "platforms;android-31" "build-tools;31.0.0"
```

### Thiết lập Web Server cho phân phối APK

Workflow này được thiết kế để lưu trữ và phân phối APK thông qua web server trên VPS:

1. Đảm bảo đã cài đặt web server (Nginx hoặc Apache):
   ```bash
   # Cài đặt Nginx
   sudo apt update
   sudo apt install nginx
   ```

2. Workflow sẽ lưu trữ APK tại thư mục `/var/www/html/apk-downloads/`
3. Mỗi build sẽ được lưu vào thư mục riêng với format `[profile]_[timestamp]`
4. Các symlink sẽ được tạo cho build mới nhất của mỗi profile:
   - `/var/www/html/apk-downloads/latest_production/`
   - `/var/www/html/apk-downloads/latest_preview/`
   - `/var/www/html/apk-downloads/latest_development/`

5. Một trang web đơn giản sẽ được tạo tại `/var/www/html/apk-downloads/index.html` để dễ dàng download

### Truy cập APK

Sau khi build thành công, APK có thể được truy cập qua:

- **Trang danh sách chung**: `http://your-server-address/apk-downloads/`
- **Download trực tiếp**:
  - Production: `http://your-server-address/apk-downloads/latest_production/`
  - Preview: `http://your-server-address/apk-downloads/latest_preview/`
  - Development: `http://your-server-address/apk-downloads/latest_development/`

Bạn cần thay `your-server-address` bằng địa chỉ IP hoặc tên miền của VPS.

### Thiết lập Self-hosted Runner

Để sử dụng GitHub Actions với VPS của bạn:

1. Trên GitHub, truy cập repository > Settings > Actions > Runners
2. Nhấp vào "New self-hosted runner"
3. Chọn "Linux" và làm theo hướng dẫn để cài đặt runner trên VPS
4. Runner cần được thiết lập với nhãn `self-hosted` để workflow hoạt động

### Thiết lập Secrets cho GitHub Actions

Để sử dụng đầy đủ tính năng signing và phân phối, bạn cần thiết lập các secrets sau trong repository GitHub:

1. Mở repository GitHub > Settings > Secrets and variables > Actions
2. Thêm các secrets sau:

#### Secrets bắt buộc cho ký APK production:

- **ANDROID_KEYSTORE_BASE64**: Keystore đã được mã hóa base64
- **ANDROID_KEYSTORE_PASSWORD**: Mật khẩu của keystore
- **ANDROID_KEY_ALIAS**: Alias của key
- **ANDROID_KEY_PASSWORD**: Mật khẩu của key

#### Secrets tùy chọn cho phân phối:

- **GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64**: Service account JSON mã hóa base64 để phân phối lên Google Play

### Tạo Keystore và mã hóa Base64

```bash
# 1. Tạo keystore
keytool -genkeypair -v -storetype PKCS12 -keystore ksms_key.keystore -alias ksms_key -keyalg RSA -keysize 2048 -validity 10000

# 2. Mã hóa keystore thành Base64
base64 -i ksms_key.keystore | tr -d '\n' > keystore_base64.txt
```

### Để chạy workflow thủ công:

1. Truy cập vào tab Actions trong GitHub repository
2. Chọn workflow "Docker Android Build"
3. Nhấp vào "Run workflow"
4. Chọn profile build (development, preview, production)
5. Nhấp vào "Run workflow"

## Tùy chỉnh

### Quản lý dung lượng lưu trữ APK

Để tránh tốn quá nhiều dung lượng disk, bạn có thể thêm một cron job để xóa các build cũ:

```bash
# Thêm vào crontab
sudo crontab -e

# Thêm dòng sau để giữ lại các build trong 30 ngày
0 0 * * * find /var/www/html/apk-downloads/ -type d -name "*_20*" -mtime +30 -exec rm -rf {} \; 2>/dev/null
```

### Sử dụng EAS build local

Nếu bạn muốn sử dụng EAS build local, bạn có thể cấu hình trong `eas.json`:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleDebug",
        "credentialsSource": "local"
      }
    }
  }
}
```

Sau đó chạy:

```bash
docker-compose run android-builder eas build --platform android --profile development --local
```

## Xử lý sự cố

### Vấn đề về quyền (Permission)

Nếu bạn gặp vấn đề về quyền khi chạy Docker hoặc khi lưu trữ APK, hãy thử:

```bash
# Quyền cho build-output
sudo chown -R $(whoami) build-output/

# Quyền cho thư mục phân phối APK
sudo chown -R www-data:www-data /var/www/html/apk-downloads/
sudo chmod -R 755 /var/www/html/apk-downloads/
```

### Xóa image và container

Nếu bạn muốn xóa và bắt đầu lại:

```bash
docker-compose down
docker system prune -a
```