import * as FileSystem from "expo-file-system";
import api from "./api";
import { Platform } from "react-native";

// Interface cho media item
interface MediaItem {
  mediaUrl: string;
  mediaType: string;
  isLocalFile?: boolean;
}

// Interface cho dữ liệu đăng ký
interface RegistrationData {
  KoiShowId: string;
  KoiProfileId: string;
  RegisterName: string;
  Notes?: string;
}

/**
 * Tải file từ URL và trả về base64 string
 */
const getBase64FromUrl = async (url: string): Promise<string> => {
  try {
    if (Platform.OS === 'web') {
      // Xử lý cho web
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Loại bỏ phần "data:image/jpeg;base64," hoặc "data:video/mp4;base64,"
          const base64 = base64String.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } else {
      // Xử lý cho mobile
      if (url.startsWith('http')) {
        const filename = url.split('/').pop() || `file-${Date.now()}`;
        const cacheDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
        
        if (!cacheDir) {
          throw new Error('Không thể xác định thư mục cache');
        }
        
        const downloadResult = await FileSystem.downloadAsync(
          url,
          cacheDir + filename
        );
        
        if (downloadResult.status !== 200) {
          throw new Error(`Không thể tải file từ ${url}`);
        }
        
        url = downloadResult.uri;
      }
      
      const base64 = await FileSystem.readAsStringAsync(url, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      return base64;
    }
  } catch (error) {
    console.error('Lỗi khi chuyển đổi file sang base64:', error);
    throw error;
  }
};

/**
 * Đăng ký Koi tham gia cuộc thi
 */
export const submitRegistration = async (
  mediaItems: MediaItem[],
  registrationData: RegistrationData
) => {
  try {
    // Chuẩn bị dữ liệu media
    const mediaData = await Promise.all(
      mediaItems.map(async (item) => {
        // Nếu là file local, chuyển đổi sang base64
        if (item.isLocalFile) {
          const base64 = await getBase64FromUrl(item.mediaUrl);
          return {
            mediaType: item.mediaType,
            base64Data: base64,
            isNewMedia: true
          };
        } else {
          // Nếu là URL từ Firebase, chỉ cần gửi URL
          return {
            mediaType: item.mediaType,
            mediaUrl: item.mediaUrl,
            isNewMedia: false
          };
        }
      })
    );

    // Chuẩn bị dữ liệu đăng ký
    const requestData = {
      ...registrationData,
      mediaItems: mediaData
    };

    // Gửi request đăng ký
    const response = await api.post('/api/v1/koi-registration', requestData);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi đăng ký Koi:', error);
    throw error;
  }
};

/**
 * Tải lên hình ảnh hoặc video mới cho hồ sơ Koi
 */
export const uploadKoiMedia = async (
  koiProfileId: string,
  fileUri: string,
  mediaType: 'Image' | 'Video'
): Promise<string> => {
  try {
    // Chuyển đổi file sang base64
    const base64 = await getBase64FromUrl(fileUri);
    
    // Chuẩn bị dữ liệu
    const requestData = {
      koiProfileId,
      mediaType,
      base64Data: base64
    };
    
    // Gửi request tải lên
    const response = await api.post('/api/v1/koi-profile/upload-media', requestData);
    
    // Trả về URL của file đã tải lên
    return response.data.data.mediaUrl;
  } catch (error) {
    console.error('Lỗi khi tải lên media cho Koi:', error);
    throw error;
  }
};
