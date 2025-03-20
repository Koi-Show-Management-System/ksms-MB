#!/bin/bash

# Script để build APK Android sử dụng Docker trên VPS

# Tạo thư mục build-output nếu chưa tồn tại
mkdir -p build-output

# Hàm hiển thị menu
show_menu() {
    echo "=== Build APK Android với Docker trên VPS ==="
    echo "1. Build với profile development"
    echo "2. Build với profile preview"
    echo "3. Build với profile production"
    echo "4. Mở shell trong container"
    echo "5. Thoát"
    echo "=================================="
    echo -n "Lựa chọn của bạn: "
}

# Build Docker image nếu chưa tồn tại
echo "Đang kiểm tra và build Docker image..."
docker-compose build

# Hiển thị menu và xử lý lựa chọn
while true; do
    show_menu
    read choice

    case $choice in
        1)
            echo "Đang build APK với profile development..."
            export BUILD_PROFILE=development
            docker-compose run android-builder
            ;;
        2)
            echo "Đang build APK với profile preview..."
            export BUILD_PROFILE=preview
            docker-compose run android-builder
            ;;
        3)
            echo "Đang build APK với profile production..."
            export BUILD_PROFILE=production
            docker-compose run android-builder
            ;;
        4)
            echo "Mở shell trong container..."
            docker-compose run --entrypoint bash android-builder
            ;;
        5)
            echo "Thoát khỏi chương trình."
            exit 0
            ;;
        *)
            echo "Lựa chọn không hợp lệ. Vui lòng chọn từ 1-5."
            ;;
    esac

    # Kiểm tra xem đã có file APK được tạo ra chưa
    if [ -n "$(find build-output -name "*.apk" -type f 2>/dev/null)" ]; then
        echo ""
        echo "Các file APK đã được tạo ra:"
        find build-output -name "*.apk" -type f | while read file; do
            echo "- $(basename "$file")"
        done
    fi

    echo ""
    echo "Nhấn Enter để tiếp tục..."
    read
    clear
done 