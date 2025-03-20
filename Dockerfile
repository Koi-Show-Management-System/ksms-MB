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

# Kiểm tra và cài đặt Android SDK nếu chưa có
RUN if [ ! -d "${ANDROID_HOME}/cmdline-tools/latest" ]; then \
    mkdir -p ${ANDROID_HOME} && \
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
                 "ndk;26.1.10909125"; \
    fi

# Kiểm tra và cài đặt Expo CLI và EAS CLI nếu chưa có
RUN if ! command -v expo &> /dev/null || ! command -v eas &> /dev/null; then \
    npm install -g --force expo-cli eas-cli; \
    fi

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

# Tạo file build script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Thiết lập profile\n\
PROFILE=${1:-production}\n\
\n\
# Xử lý keystore nếu đang chạy trong CI và có cung cấp keystore\n\
if [ "${KEYSTORE_READY}" == "true" ] && [ -n "${ANDROID_KEYSTORE_PATH}" ]; then\n\
  echo "Setting up keystore for production signing..."\n\
  \n\
  # Tạo hoặc cập nhật tệp gradle.properties\n\
  GRADLE_PROPS=/app/android/gradle.properties\n\
  \n\
  # Backup gradle.properties\n\
  cp $GRADLE_PROPS $GRADLE_PROPS.bak\n\
  \n\
  # Thêm cấu hình signing vào gradle.properties\n\
  echo "" >> $GRADLE_PROPS\n\
  echo "# Signing config từ CI/CD" >> $GRADLE_PROPS\n\
  echo "KSMS_RELEASE_STORE_FILE=${ANDROID_KEYSTORE_PATH}" >> $GRADLE_PROPS\n\
  echo "KSMS_RELEASE_KEY_ALIAS=${ANDROID_KEY_ALIAS}" >> $GRADLE_PROPS\n\
  echo "KSMS_RELEASE_STORE_PASSWORD=${ANDROID_KEYSTORE_PASSWORD}" >> $GRADLE_PROPS\n\
  echo "KSMS_RELEASE_KEY_PASSWORD=${ANDROID_KEY_PASSWORD}" >> $GRADLE_PROPS\n\
  \n\
  # Cập nhật cấu hình signing trong build.gradle\n\
  BUILDGRADLE=/app/android/app/build.gradle\n\
  \n\
  # Kiểm tra nếu chưa có signingConfigs.release\n\
  if ! grep -q "signingConfigs.release" $BUILDGRADLE; then\n\
    # Tìm vị trí signingConfigs block\n\
    LINE=$(grep -n "signingConfigs {" $BUILDGRADLE | cut -d: -f1)\n\
    if [ -n "$LINE" ]; then\n\
      # Thêm cấu hình release signing\n\
      sed -i "$LINE a\\        release {\\n            storeFile file(KSMS_RELEASE_STORE_FILE)\\n            storePassword KSMS_RELEASE_STORE_PASSWORD\\n            keyAlias KSMS_RELEASE_KEY_ALIAS\\n            keyPassword KSMS_RELEASE_KEY_PASSWORD\\n        }" $BUILDGRADLE\n\
      \n\
      # Cập nhật buildTypes để sử dụng signing config\n\
      sed -i "s/signingConfig signingConfigs.debug/signingConfig signingConfigs.release/g" $BUILDGRADLE\n\
    fi\n\
  fi\n\
  \n\
  echo "Keystore setup completed"\n\
fi\n\
\n\
# Running the build\n\
echo "Building APK with profile: $PROFILE"\n\
eas build --profile $PROFILE --non-interactive\n\
\n\
# Chuyển APK đến thư mục output\n\
mkdir -p /app/build-output\n\
find /app -name "*.apk" -type f -exec cp {} /app/build-output/ \;\n\
\n\
echo "Build completed. APK files saved to /app/build-output/"' > /app/build-script.sh

RUN chmod +x /app/build-script.sh

# Entry point để dễ dàng chỉ định profile
ENTRYPOINT ["/app/build-script.sh"]
# Sử dụng build profile mặc định là production nếu không được chỉ định
CMD ["production"] 