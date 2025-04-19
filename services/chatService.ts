import { StreamChat, TokenOrProvider, Channel } from 'stream-chat';
import api from './api';
import Constants from 'expo-constants';

// Interface cho phản hồi token chat
export interface ChatTokenResponse {
  token: string;
}

// Stream chat instance
let chatClientInstance: StreamChat | null = null;

// Interface cho response lấy token chat
export interface GetChatTokenResponse {
  data: {
    token: string;
    // Thêm các trường khác nếu API trả về nhiều hơn
  };
  statusCode: number;
  message: string;
}

/**
 * Khởi tạo Stream Chat client
 * @returns Instance của Stream Chat client
 */
export function initChatClient(): StreamChat {
  // Nếu đã có instance, trả về instance đó
  if (chatClientInstance) {
    return chatClientInstance;
  }
  
  // Lấy API key từ biến môi trường hoặc constants
  const apiKey = Constants.expoConfig?.extra?.streamChatApiKey;
  
  if (!apiKey) {
    throw new Error('Stream Chat API key không được cấu hình');
  }
  
  chatClientInstance = new StreamChat(apiKey);
  return chatClientInstance;
}

/**
 * Ngắt kết nối user khỏi chat client
 */
export async function disconnectUser() {
  if (chatClientInstance) {
    await chatClientInstance.disconnectUser();
    chatClientInstance = null;
  }
}

/**
 * Lấy token chat từ API
 * @param userId ID của người dùng
 */
export async function getChatToken(userId: string): Promise<GetChatTokenResponse> {
  try {
    const response = await api.get<GetChatTokenResponse>(`/api/v1/chat/token/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting chat token:', error);
    throw error;
  }
}

/**
 * Kết nối user với Stream Chat
 * @param userId ID của người dùng
 * @param username Tên hiển thị của người dùng
 * @param token Token xác thực
 * @param profileImage URL hình ảnh đại diện (tùy chọn)
 */
export async function connectUser(userId: string, username: string, token: string, profileImage?: string) {
  const client = initChatClient();
  try {
    await client.connectUser(
      {
        id: userId,
        name: username,
        image: profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}`,
      },
      token
    );
    return client;
  } catch (error) {
    console.error('Error connecting user to chat:', error);
    throw error;
  }
}

/**
 * Tạo hoặc lấy kênh chat cho livestream
 * @param client Stream Chat client
 * @param livestreamId ID của livestream
 * @param showName Tên của show
 */
export async function getOrCreateLivestreamChannel(
  client: StreamChat,
  livestreamId: string,
  showName: string
) {
  try {
    // Sử dụng loại kênh "livestream" với ID livestream
    const channel = client.channel('livestream', `livestream-${livestreamId}`, {
      name: `${showName || 'Koi Show'} Chat`,
      image: 'https://getstream.io/random_svg/?name=' + encodeURIComponent(showName || 'Koi Show'),
    });

    // Kết nối với kênh và lấy trạng thái ban đầu
    await channel.watch();
    
    return channel;
  } catch (error) {
    console.error('Error creating livestream channel:', error);
    throw error;
  }
}

/**
 * Gửi tin nhắn đến kênh
 * @param client Stream Chat client
 * @param channelId ID của kênh
 * @param message Nội dung tin nhắn
 */
export async function sendMessage(client: StreamChat, channelId: string, message: string) {
  try {
    const channel = client.channel('livestream', channelId);
    await channel.sendMessage({
      text: message,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
} 