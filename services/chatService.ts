import Constants from "expo-constants";
import { StreamChat } from "stream-chat";
import api from "./api";

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

// Interface for chat messages
export interface ChatMessage {
  id: string;
  author: string;
  authorId: string;
  content: string;
  timestamp: Date;
  profileImage?: string;
}

// Interface for sending a message
export interface MessageToSend {
  authorId: string;
  author: string;
  content: string;
  profileImage?: string;
}

// Interface for chat message response
export interface ChatMessagesResponse {
  success: boolean;
  data: ChatMessage[];
  message: string;
}

// Interface for send message response
export interface SendMessageResponse {
  success: boolean;
  data: ChatMessage;
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
    throw new Error("Stream Chat API key không được cấu hình");
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
export async function getChatToken(
  userId: string
): Promise<GetChatTokenResponse> {
  try {
    const response = await api.get<GetChatTokenResponse>(
      `/api/v1/chat/token/${userId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error getting chat token:", error);
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
export async function connectUser(
  userId: string,
  username: string,
  token: string,
  profileImage?: string
) {
  const client = initChatClient();
  try {
    await client.connectUser(
      {
        id: userId,
        name: username,
        image:
          profileImage ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}`,
      },
      token
    );
    return client;
  } catch (error) {
    console.error("Error connecting user to chat:", error);
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
    const channel = client.channel("livestream", `livestream-${livestreamId}`, {
      name: `${showName || "Koi Show"} Chat`,
      image:
        "https://getstream.io/random_svg/?name=" +
        encodeURIComponent(showName || "Koi Show"),
    });

    // Kết nối với kênh và lấy trạng thái ban đầu
    await channel.watch();

    return channel;
  } catch (error) {
    console.error("Error creating livestream channel:", error);
    throw error;
  }
}

/**
 * Gửi tin nhắn đến kênh
 * @param client Stream Chat client
 * @param channelId ID của kênh
 * @param message Nội dung tin nhắn
 */
export async function sendMessage(
  client: StreamChat,
  channelId: string,
  message: string
) {
  try {
    const channel = client.channel("livestream", channelId);
    await channel.sendMessage({
      text: message,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}

/**
 * Get chat messages from livestream
 * @param livestreamId ID of the livestream
 * @returns A promise that resolves with the chat messages
 */
export async function getChatMessages(
  livestreamId: string
): Promise<ChatMessagesResponse> {
  try {
    // Try to use Stream's client first
    if (chatClientInstance) {
      try {
        const channelId = `livestream-${livestreamId}`;
        const channel = chatClientInstance.channel("livestream", channelId);
        const response = await channel.watch();

        // Convert Stream's message format to your app's format
        const messages: ChatMessage[] = response.messages.map((msg) => ({
          id: msg.id,
          author: msg.user?.name || "Unknown",
          authorId: msg.user?.id || "unknown",
          content: msg.text || "",
          timestamp: new Date(msg.created_at || Date.now()),
          profileImage: msg.user?.image,
        }));

        return {
          success: true,
          data: messages,
          message: "Messages fetched successfully",
        };
      } catch (streamError) {
        console.error("Error fetching messages from Stream:", streamError);
        // Fall back to API
      }
    }

    // Fallback to your backend API
    const response = await api.get<ChatMessagesResponse>(
      `/api/v1/chat/messages/${livestreamId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error getting chat messages:", error);
    return {
      success: false,
      data: [],
      message: "Failed to load messages",
    };
  }
}

/**
 * Send a chat message to a livestream
 * @param livestreamId ID of the livestream
 * @param message Message to send
 * @returns A promise that resolves with the sent message
 */
export async function sendChatMessage(
  livestreamId: string,
  message: MessageToSend
): Promise<SendMessageResponse> {
  try {
    // Try to use Stream's client first if connected
    if (chatClientInstance && chatClientInstance.userID) {
      try {
        const channelId = `livestream-${livestreamId}`;
        const channel = chatClientInstance.channel("livestream", channelId);

        // Send message via Stream
        const response = await channel.sendMessage({
          text: message.content,
          // You can add custom data if needed
          custom_data: {
            authorDisplay: message.author,
          },
        });

        // Convert the response to your app's format
        return {
          success: true,
          data: {
            id: response.message.id,
            author: message.author,
            authorId: message.authorId,
            content: message.content,
            timestamp: new Date(response.message.created_at),
            profileImage: message.profileImage,
          },
          message: "Message sent successfully",
        };
      } catch (streamError) {
        console.error("Error sending message via Stream:", streamError);
        // Fall back to API
      }
    }

    // Fallback to your backend API
    const response = await api.post<SendMessageResponse>(
      `/api/v1/chat/messages/${livestreamId}`,
      message
    );
    return response.data;
  } catch (error) {
    console.error("Error sending chat message:", error);
    return {
      success: false,
      data: {
        id: "error",
        author: message.author,
        authorId: message.authorId,
        content: message.content,
        timestamp: new Date(),
        profileImage: message.profileImage,
      },
      message: "Failed to send message",
    };
  }
}
