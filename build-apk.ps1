# Script để build APK Android sử dụng Docker trên Windows

# Kiểm tra Docker đã được cài đặt chưa
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Docker chưa được cài đặt. Vui lòng cài đặt Docker trước." -ForegroundColor Red
    exit 1
}

# Kiểm tra Docker Compose đã được cài đặt chưa
if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "Docker Compose chưa được cài đặt. Vui lòng cài đặt Docker Compose trước." -ForegroundColor Red
    exit 1
}

# Tạo thư mục build-output nếu chưa tồn tại
if (-not (Test-Path -Path "build-output")) {
    New-Item -ItemType Directory -Path "build-output" | Out-Null
    Write-Host "Đã tạo thư mục build-output" -ForegroundColor Green
}

# Hàm hiển thị menu
function Show-Menu {
    Clear-Host
    Write-Host "=== Build APK Android với Docker ===" -ForegroundColor Cyan
    Write-Host "1. Build với profile development" -ForegroundColor Yellow
    Write-Host "2. Build với profile preview" -ForegroundColor Yellow
    Write-Host "3. Build với profile production" -ForegroundColor Yellow
    Write-Host "4. Mở shell trong container" -ForegroundColor Yellow
    Write-Host "5. Thoát" -ForegroundColor Yellow
    Write-Host "==================================" -ForegroundColor Cyan
    $choice = Read-Host -Prompt "Lựa chọn của bạn"
    return $choice
}

# Build Docker image nếu chưa tồn tại
Write-Host "Đang kiểm tra và build Docker image..." -ForegroundColor Cyan
docker-compose build

# Hiển thị menu và xử lý lựa chọn
while ($true) {
    $choice = Show-Menu
    
    switch ($choice) {
        "1" {
            Write-Host "Đang build APK với profile development..." -ForegroundColor Green
            $env:BUILD_PROFILE = "development"
            docker-compose run android-builder
        }
        "2" {
            Write-Host "Đang build APK với profile preview..." -ForegroundColor Green
            $env:BUILD_PROFILE = "preview"
            docker-compose run android-builder
        }
        "3" {
            Write-Host "Đang build APK với profile production..." -ForegroundColor Green
            $env:BUILD_PROFILE = "production"
            docker-compose run android-builder
        }
        "4" {
            Write-Host "Mở shell trong container..." -ForegroundColor Green
            docker-compose run --entrypoint bash android-builder
        }
        "5" {
            Write-Host "Thoát khỏi chương trình." -ForegroundColor Green
            exit 0
        }
        default {
            Write-Host "Lựa chọn không hợp lệ. Vui lòng chọn từ 1-5." -ForegroundColor Red
        }
    }

    # Kiểm tra xem đã có file APK được tạo ra chưa
    $apkFiles = Get-ChildItem -Path "build-output" -Filter "*.apk" -File -Recurse
    
    if ($apkFiles.Count -gt 0) {
        Write-Host "`nCác file APK đã được tạo ra:" -ForegroundColor Green
        foreach ($file in $apkFiles) {
            Write-Host "- $($file.Name)" -ForegroundColor White
        }
    }

    Write-Host "`nNhấn Enter để tiếp tục..." -ForegroundColor Cyan
    Read-Host
} 