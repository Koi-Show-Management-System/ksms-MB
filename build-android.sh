#!/bin/bash
# Script CI/CD để build ứng dụng Android trên Linux/Mac
# Tác giả: sang
# Ngày tạo: 20/03/2025

# Màu sắc cho output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Bước 1: Cập nhật dependencies
echo -e "${GREEN}===== Cập nhật dependencies =====${NC}"
yarn install

# Bước 2: Chạy tests (nếu có)
echo -e "${GREEN}===== Chạy tests =====${NC}"
# yarn test

# Bước 3: Prebuild project
echo -e "${GREEN}===== Prebuild project =====${NC}"
npx expo prebuild -p android --clean

# Bước 4: Build APK
echo -e "${GREEN}===== Build APK =====${NC}"
cd android
./gradlew clean
./gradlew assembleRelease
cd ..

# Bước 5: Di chuyển APK đã build vào thư mục release
echo -e "${GREEN}===== Di chuyển APK đã build =====${NC}"
RELEASE_DIR="./release"
if [ ! -d "$RELEASE_DIR" ]; then
    mkdir -p "$RELEASE_DIR"
fi

APK_PATH="./android/app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK_PATH" ]; then
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    NEW_APK_NAME="KSMS_${TIMESTAMP}.apk"
    cp "$APK_PATH" "$RELEASE_DIR/$NEW_APK_NAME"
    echo -e "${GREEN}===== Build thành công! =====${NC}"
    echo -e "${YELLOW}APK được lưu tại: $RELEASE_DIR/$NEW_APK_NAME${NC}"
else
    echo -e "${RED}===== Build thất bại! =====${NC}"
    echo -e "${RED}Không tìm thấy APK tại: $APK_PATH${NC}"
fi 