#!/bin/bash
set -e

# Thiết lập profile
PROFILE=${1:-production}

# Xử lý keystore nếu đang chạy trong CI và có cung cấp keystore
if [ "${KEYSTORE_READY}" == "true" ] && [ -n "${ANDROID_KEYSTORE_PATH}" ]; then
  echo "Setting up keystore for production signing..."
  
  # Tạo hoặc cập nhật tệp gradle.properties
  GRADLE_PROPS=/app/android/gradle.properties
  
  # Backup gradle.properties
  cp $GRADLE_PROPS $GRADLE_PROPS.bak
  
  # Thêm cấu hình signing vào gradle.properties
  echo "" >> $GRADLE_PROPS
  echo "# Signing config từ CI/CD" >> $GRADLE_PROPS
  echo "KSMS_RELEASE_STORE_FILE=${ANDROID_KEYSTORE_PATH}" >> $GRADLE_PROPS
  echo "KSMS_RELEASE_KEY_ALIAS=${ANDROID_KEY_ALIAS}" >> $GRADLE_PROPS
  echo "KSMS_RELEASE_STORE_PASSWORD=${ANDROID_KEYSTORE_PASSWORD}" >> $GRADLE_PROPS
  echo "KSMS_RELEASE_KEY_PASSWORD=${ANDROID_KEY_PASSWORD}" >> $GRADLE_PROPS
  
  # Cập nhật cấu hình signing trong build.gradle
  BUILDGRADLE=/app/android/app/build.gradle
  
  # Kiểm tra nếu chưa có signingConfigs.release
  if ! grep -q "signingConfigs.release" $BUILDGRADLE; then
    # Tìm vị trí signingConfigs block
    LINE=$(grep -n "signingConfigs {" $BUILDGRADLE | cut -d: -f1)
    if [ -n "$LINE" ]; then
      # Thêm cấu hình release signing
      sed -i "$LINE a\\        release {\\n            storeFile file(KSMS_RELEASE_STORE_FILE)\\n            storePassword KSMS_RELEASE_STORE_PASSWORD\\n            keyAlias KSMS_RELEASE_KEY_ALIAS\\n            keyPassword KSMS_RELEASE_KEY_PASSWORD\\n        }" $BUILDGRADLE
      
      # Cập nhật buildTypes để sử dụng signing config
      sed -i "s/signingConfig signingConfigs.debug/signingConfig signingConfigs.release/g" $BUILDGRADLE
    fi
  fi
  
  echo "Keystore setup completed"
fi

# Running the build
echo "Building APK with profile: $PROFILE"

# Đăng nhập vào Expo nếu có token
if [ -n "$EXPO_TOKEN" ]; then
  echo "Đang sử dụng EXPO_TOKEN để xác thực..."
  # Sử dụng token thay vì đăng nhập tương tác
  # Biến EXPO_TOKEN được tự động sử dụng bởi eas-cli
else
  echo "EXPO_TOKEN không được thiết lập, có thể gặp lỗi xác thực"
fi

# Hàm thực hiện build với số lần thử lại
build_with_retry() {
  local max_attempts=3
  local attempt=1
  local wait_time=5

  while [ $attempt -le $max_attempts ]; do
    echo "Lần thử build thứ $attempt/$max_attempts..."
    
    if npx eas-cli@latest build -p android --profile $PROFILE --non-interactive --local; then
      echo "Build thành công!"
      return 0
    else
      echo "Build thất bại. Đợi $wait_time giây trước khi thử lại..."
      sleep $wait_time
      attempt=$((attempt + 1))
      wait_time=$((wait_time * 2))  # Tăng thời gian chờ sau mỗi lần thử
    fi
  done

  echo "Đã thử build $max_attempts lần nhưng vẫn thất bại."
  return 1
}

# Thực hiện build với cơ chế retry
if ! build_with_retry; then
  echo "Build thất bại sau nhiều lần thử."
  exit 1
fi

# Chuyển APK đến thư mục output
mkdir -p /app/build-output
find /app -name "*.apk" -type f -exec cp {} /app/build-output/ \;

echo "Build completed. APK files saved to /app/build-output/" 