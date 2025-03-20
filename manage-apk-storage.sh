#!/bin/bash

# Script quản lý lưu trữ APK trên server

# Thư mục lưu trữ APK
APK_DIR="/var/www/html/apk-downloads"

# Hàm hiển thị menu
show_menu() {
    echo "=== Quản lý lưu trữ APK trên Server ==="
    echo "1. Liệt kê tất cả APK hiện có"
    echo "2. Xem dung lượng ổ đĩa hiện tại"
    echo "3. Làm sạch các APK cũ (giữ lại 5 phiên bản gần nhất)"
    echo "4. Làm sạch tất cả APK cũ hơn X ngày"
    echo "5. Cập nhật trang download"
    echo "6. Kiểm tra tình trạng web server"
    echo "7. Thoát"
    echo "=================================="
    echo -n "Lựa chọn của bạn: "
}

# Kiểm tra thư mục lưu trữ APK
check_apk_dir() {
    if [ ! -d "$APK_DIR" ]; then
        echo "Thư mục $APK_DIR không tồn tại. Tạo thư mục..."
        sudo mkdir -p "$APK_DIR"
        sudo chmod 755 "$APK_DIR"
        
        # Tạo index.html
        update_download_page
    fi
}

# Liệt kê APK
list_apks() {
    echo "Danh sách các APK theo profile:"
    
    for profile in "production" "preview" "development"; do
        echo -e "\n=== Profile: $profile ==="
        echo "Latest version:"
        if [ -L "$APK_DIR/latest_$profile" ]; then
            ls -la "$APK_DIR/latest_$profile"/*.apk 2>/dev/null
            
            # Hiển thị thông tin build
            if [ -f "$APK_DIR/latest_$profile/build_info.txt" ]; then
                echo "Build info:"
                cat "$APK_DIR/latest_$profile/build_info.txt"
            fi
        else
            echo "Không có build nào cho profile $profile"
        fi
        
        echo -e "\nTất cả phiên bản:"
        find "$APK_DIR" -maxdepth 1 -type d -name "${profile}_*" | sort -r | while read dir; do
            count=$(find "$dir" -name "*.apk" | wc -l)
            if [ "$count" -gt 0 ]; then
                echo "$dir ($(ls -la "$dir"/*.apk | awk '{print $5, $9}'))"
            fi
        done
    done
}

# Xem dung lượng ổ đĩa
check_disk_usage() {
    echo "Dung lượng thư mục APK:"
    du -sh "$APK_DIR"
    
    echo -e "\nDung lượng ổ đĩa hiện tại:"
    df -h /var/www/html/
    
    echo -e "\nChi tiết các profile:"
    for profile in "production" "preview" "development"; do
        echo "- $profile: $(du -sh "$APK_DIR"/latest_$profile 2>/dev/null || echo "N/A")"
    done
}

# Xóa các APK cũ (giữ lại 5 phiên bản gần nhất)
clean_old_apks() {
    for profile in "production" "preview" "development"; do
        echo "Làm sạch profile $profile..."
        
        # Tìm tất cả thư mục của profile và sắp xếp từ cũ đến mới
        dirs=$(find "$APK_DIR" -maxdepth 1 -type d -name "${profile}_*" | sort)
        
        # Đếm số thư mục
        count=$(echo "$dirs" | wc -l)
        
        # Nếu có hơn 5 thư mục, xóa các thư mục cũ nhất
        if [ "$count" -gt 5 ]; then
            keep=$((count - 5))
            echo "Tìm thấy $count phiên bản, xóa $keep phiên bản cũ nhất..."
            
            echo "$dirs" | head -n $keep | while read dir; do
                echo "Xóa $dir..."
                sudo rm -rf "$dir"
            done
        else
            echo "Chỉ có $count phiên bản, giữ lại tất cả."
        fi
    done
}

# Xóa các APK cũ hơn X ngày
clean_by_date() {
    echo -n "Nhập số ngày (APK cũ hơn số ngày này sẽ bị xóa): "
    read days
    
    if [[ "$days" =~ ^[0-9]+$ ]]; then
        echo "Xóa các APK cũ hơn $days ngày..."
        find "$APK_DIR" -maxdepth 1 -type d -name "*_20*" -mtime +"$days" | while read dir; do
            if [ -d "$dir" ]; then
                echo "Xóa $dir..."
                sudo rm -rf "$dir"
            fi
        done
        echo "Hoàn tất."
    else
        echo "Lỗi: Vui lòng nhập một số hợp lệ."
    fi
}

# Cập nhật trang download
update_download_page() {
    cat << EOF | sudo tee "$APK_DIR/index.html"
<!DOCTYPE html>
<html>
<head>
    <title>APK Downloads</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1 { color: #333; }
        .profile { margin-bottom: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
        .profile h2 { margin-top: 0; color: #0066cc; }
        .download-btn { display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; 
                        text-decoration: none; border-radius: 4px; margin-top: 10px; }
        .timestamp { color: #666; font-size: 0.8em; margin-top: 10px; }
    </style>
</head>
<body>
    <h1>APK Downloads</h1>
    
    <div class="profile">
        <h2>Production Build</h2>
        <p>Latest stable version of the application.</p>
        <a href="latest_production/" class="download-btn">Download Production APK</a>
        <p class="timestamp">Last updated: $(stat -c %y "$APK_DIR/latest_production" 2>/dev/null || echo "Not available")</p>
    </div>
    
    <div class="profile">
        <h2>Preview Build</h2>
        <p>Preview version with upcoming features.</p>
        <a href="latest_preview/" class="download-btn">Download Preview APK</a>
        <p class="timestamp">Last updated: $(stat -c %y "$APK_DIR/latest_preview" 2>/dev/null || echo "Not available")</p>
    </div>
    
    <div class="profile">
        <h2>Development Build</h2>
        <p>Latest development build with newest features.</p>
        <a href="latest_development/" class="download-btn">Download Development APK</a>
        <p class="timestamp">Last updated: $(stat -c %y "$APK_DIR/latest_development" 2>/dev/null || echo "Not available")</p>
    </div>
</body>
</html>
EOF
    echo "Trang download đã được cập nhật tại $APK_DIR/index.html"
}

# Kiểm tra tình trạng web server
check_web_server() {
    if command -v nginx >/dev/null 2>&1; then
        echo "Nginx được cài đặt."
        echo "Trạng thái Nginx:"
        sudo systemctl status nginx | grep Active
        
        echo -e "\nCấu hình server blocks:"
        ls -la /etc/nginx/sites-enabled/
        
        echo -e "\nKiểm tra port 80:"
        sudo lsof -i:80
    elif command -v apache2 >/dev/null 2>&1; then
        echo "Apache được cài đặt."
        echo "Trạng thái Apache:"
        sudo systemctl status apache2 | grep Active
        
        echo -e "\nCấu hình Virtual Hosts:"
        ls -la /etc/apache2/sites-enabled/
        
        echo -e "\nKiểm tra port 80:"
        sudo lsof -i:80
    else
        echo "Không tìm thấy Nginx hoặc Apache. Vui lòng cài đặt web server."
    fi
}

# Kiểm tra thư mục APK
check_apk_dir

# Hiển thị menu và xử lý lựa chọn
while true; do
    show_menu
    read choice

    case $choice in
        1)
            list_apks
            ;;
        2)
            check_disk_usage
            ;;
        3)
            clean_old_apks
            ;;
        4)
            clean_by_date
            ;;
        5)
            update_download_page
            ;;
        6)
            check_web_server
            ;;
        7)
            echo "Thoát khỏi chương trình."
            exit 0
            ;;
        *)
            echo "Lựa chọn không hợp lệ. Vui lòng chọn từ 1-7."
            ;;
    esac

    echo ""
    echo "Nhấn Enter để tiếp tục..."
    read
    clear
done 