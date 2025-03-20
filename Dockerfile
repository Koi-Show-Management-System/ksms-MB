# Sử dụng Node.js trên Debian slim base image (tương thích với Debian 11)
FROM node:20-bullseye-slim AS base

# Cài đặt các dependencies cần thiết
RUN apt-get update && apt-get install -y \
    git \
    curl \
    sudo \
    unzip \
    openjdk-17-jdk \
    gnupg \
    procps \
    sed \
    && rm -rf /var/lib/apt/lists/*

# Cài đặt Android SDK và các tools cần thiết
ENV ANDROID_HOME=/opt/android-sdk
ENV PATH=${PATH}:${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/platform-tools

RUN mkdir -p ${ANDROID_HOME} && \
    cd ${ANDROID_HOME} && \
    curl -o cmdline-tools.zip https://dl.google.com/android/repository/commandlinetools-linux-10406996_latest.zip && \
    unzip cmdline-tools.zip && \
    rm cmdline-tools.zip && \
    mkdir -p cmdline-tools/latest && \
    mv cmdline-tools/* cmdline-tools/latest/ || true && \
    cd cmdline-tools/latest/bin && \
    yes | ./sdkmanager --licenses && \
    ./sdkmanager "platform-tools" \
                 "build-tools;35.0.0" \
                 "platforms;android-35" \
                 "platforms;android-34" \
                 "ndk;26.1.10909125"

# Cài đặt Expo CLI và các công cụ cần thiết
RUN npm install -g expo-cli eas-cli yarn

# Giai đoạn phụ thuộc - Cài đặt node_modules
FROM base AS dependencies
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Giai đoạn build - Xây dựng ứng dụng
FROM dependencies AS builder
WORKDIR /app
COPY . .

# Đặt biến môi trường để build
ENV NODE_ENV=production
ENV EAS_NO_VCS=1 
ENV EAS_BUILD_AUTOCOMMIT=false

# Tạo thư mục build-output cho APK
RUN mkdir -p /app/build-output

# Script chuẩn bị cho build
COPY <<EOF /app/build-script.sh
#!/bin/bash
set -e

# Thiết lập profile
PROFILE=\${1:-production}

# Xử lý keystore nếu đang chạy trong CI và có cung cấp keystore
if [ "\${KEYSTORE_READY}" == "true" ] && [ -n "\${ANDROID_KEYSTORE_PATH}" ]; then
  echo "Setting up keystore for production signing..."
  
  # Tạo hoặc cập nhật tệp gradle.properties
  GRADLE_PROPS=/app/android/gradle.properties
  
  # Backup gradle.properties
  cp \$GRADLE_PROPS \$GRADLE_PROPS.bak
  
  # Thêm cấu hình signing vào gradle.properties
  echo "" >> \$GRADLE_PROPS
  echo "# Signing config từ CI/CD" >> \$GRADLE_PROPS
  echo "KSMS_RELEASE_STORE_FILE=\${ANDROID_KEYSTORE_PATH}" >> \$GRADLE_PROPS
  echo "KSMS_RELEASE_KEY_ALIAS=\${ANDROID_KEY_ALIAS}" >> \$GRADLE_PROPS
  echo "KSMS_RELEASE_STORE_PASSWORD=\${ANDROID_KEYSTORE_PASSWORD}" >> \$GRADLE_PROPS
  echo "KSMS_RELEASE_KEY_PASSWORD=\${ANDROID_KEY_PASSWORD}" >> \$GRADLE_PROPS
  
  # Cập nhật cấu hình signing trong build.gradle
  BUILDGRADLE=/app/android/app/build.gradle
  
  # Kiểm tra nếu chưa có signingConfigs.release
  if ! grep -q "signingConfigs.release" \$BUILDGRADLE; then
    # Tìm vị trí signingConfigs block
    LINE=\$(grep -n "signingConfigs {" \$BUILDGRADLE | cut -d: -f1)
    if [ -n "\$LINE" ]; then
      # Thêm cấu hình release signing
      sed -i "\$LINE a\\        release {\\n            storeFile file(KSMS_RELEASE_STORE_FILE)\\n            storePassword KSMS_RELEASE_STORE_PASSWORD\\n            keyAlias KSMS_RELEASE_KEY_ALIAS\\n            keyPassword KSMS_RELEASE_KEY_PASSWORD\\n        }" \$BUILDGRADLE
      
      # Cập nhật buildTypes để sử dụng signing config
      sed -i "s/signingConfig signingConfigs.debug/signingConfig signingConfigs.release/g" \$BUILDGRADLE
    fi
  fi
  
  echo "Keystore setup completed"
fi

# Running the build
echo "Building APK with profile: \$PROFILE"
yarn run build --profile \$PROFILE --non-interactive

# Chuyển APK đến thư mục output
mkdir -p /app/build-output
find /app -name "*.apk" -type f -exec cp {} /app/build-output/ \;

echo "Build completed. APK files saved to /app/build-output/"
EOF

RUN chmod +x /app/build-script.sh

# Entry point để dễ dàng chỉ định profile
ENTRYPOINT ["/app/build-script.sh"]
# Sử dụng build profile mặc định là production nếu không được chỉ định
CMD ["production"] 