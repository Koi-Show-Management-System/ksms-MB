// services/streamChatService.ts
import { StreamChat } from "stream-chat";
import { chatApiKey } from "../constants/ApiKeys";

// Singleton instance của Stream Chat client
let chatClientInstance: StreamChat | null = null;

/**
 * Khởi tạo và trả về instance của Stream Chat client
 * @returns Stream Chat client instance
 */
export const getChatClient = () => {
  if (!chatClientInstance) {
    // Thay thế bằng API key thực tế của bạn từ GetStream.io
    chatClientInstance = StreamChat.getInstance(chatApiKey);
  }
  return chatClientInstance;
};

/**
 * Kết nối user với Stream Chat API
 * @param userId ID của user
 * @param username Tên hiển thị của user
 * @param userToken Token xác thực từ backend
 * @param userImage URL của ảnh đại diện user
 */
export const connectUser = async (
  userId: string,
  username: string,
  userToken: string,
  userImage?: string
) => {
  const chatClient = getChatClient();

  try {
    await chatClient.connectUser(
      {
        id: userId,
        name: username,
        image: userImage,
      },
      userToken
    );
    console.log("Connected to Stream Chat API");
    return chatClient;
  } catch (error) {
    console.error("Error connecting to Stream Chat:", error);
    throw error;
  }
};

/**
 * Ngắt kết nối user từ Stream Chat API
 */
export const disconnectUser = async () => {
  const chatClient = getChatClient();

  try {
    if (chatClient) {
      await chatClient.disconnectUser();
      console.log("Disconnected from Stream Chat API");
    }
  } catch (error) {
    console.error("Error disconnecting from Stream Chat:", error);
    throw error;
  }
};

/**
 * Tham gia vào kênh chat của một livestream
 * @param livestreamId ID của buổi livestream
 * @returns Channel object
 */
export const joinLivestreamChat = async (livestreamId: string) => {
  const chatClient = getChatClient();

  if (!chatClient?.userID) {
    throw new Error("User not connected to Stream Chat API");
  }

  try {
    // Sử dụng kiểu kênh 'livestream' mặc định của Stream
    const channel = chatClient.channel("livestream", livestreamId, {
      name: `Livestream Chat ${livestreamId}`,
    });

    // Theo dõi kênh để nhận tin nhắn và cập nhật
    await channel.watch();
    console.log("Joined livestream chat channel:", livestreamId);
    return channel;
  } catch (error) {
    console.error("Error joining livestream chat:", error);
    throw error;
  }
};

/**
 * Rời khỏi kênh chat của một livestream
 * @param livestreamId ID của buổi livestream
 */
export const leaveLivestreamChat = async (livestreamId: string) => {
  const chatClient = getChatClient();

  if (!chatClient?.userID) {
    return;
  }

  try {
    const channel = chatClient.channel("livestream", livestreamId);
    await channel.stopWatching();
    console.log("Left livestream chat channel:", livestreamId);
  } catch (error) {
    console.error("Error leaving livestream chat:", error);
    throw error;
  }
};

/**
 * Gửi tin nhắn trong kênh chat
 * @param channel Channel object
 * @param message Nội dung tin nhắn
 */
export const sendChatMessage = async (channel: any, message: string) => {
  try {
    const response = await channel.sendMessage({
      text: message,
    });
    return response;
  } catch (error) {
    console.error("Error sending chat message:", error);
    throw error;
  }
};
