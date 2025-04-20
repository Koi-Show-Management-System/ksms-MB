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
  const apiKey =
    Constants.expoConfig?.extra?.streamChatApiKey || "z87auffz2r8y";

  if (!apiKey) {
    throw new Error("Stream Chat API key không được cấu hình");
  }

  // Log for debugging
  console.log(
    "[ChatService] Initializing Stream Chat client with API key:",
    apiKey
  );

  chatClientInstance = StreamChat.getInstance(apiKey);
  return chatClientInstance;
}

/**
 * Ngắt kết nối user khỏi chat client
 */
export async function disconnectUser() {
  if (chatClientInstance) {
    try {
      console.log("[ChatService] Disconnecting user from Stream Chat");
      await chatClientInstance.disconnectUser();
      chatClientInstance = null;
    } catch (error) {
      console.error("[ChatService] Error disconnecting user:", error);
    }
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
    console.log("[ChatService] Getting chat token for user:", userId);
    const response = await api.get<GetChatTokenResponse>(
      `/api/v1/chat/token/${userId}`
    );
    console.log("[ChatService] Chat token received successfully");
    return response.data;
  } catch (error) {
    console.error("[ChatService] Error getting chat token:", error);
    // Create a fallback response for development
    return {
      data: {
        token: "",
      },
      statusCode: 500,
      message: "Failed to get chat token",
    };
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
    console.log("[ChatService] Connecting user to Stream Chat:", username);

    // Check if already connected with the same user
    if (client.userID === userId) {
      console.log("[ChatService] User already connected with the same ID");
      return client;
    }

    // Disconnect any existing connection first
    if (client.userID) {
      console.log(
        "[ChatService] Disconnecting existing user before connecting new user"
      );
      await client.disconnectUser();
    }

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
    console.log("[ChatService] User connected successfully:", userId);
    return client;
  } catch (error) {
    console.error("[ChatService] Error connecting user to chat:", error);

    // Try to recover if possible
    if (error.message?.includes("already connected")) {
      console.log("[ChatService] User already connected, returning client");
      return client;
    }

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
    const channelId = `livestream-${livestreamId}`;
    console.log("[ChatService] Creating/getting channel:", channelId);

    // Sử dụng loại kênh "livestream" với ID livestream
    const channel = client.channel("livestream", channelId, {
      name: `${showName || "Koi Show"} Chat`,
      image:
        "https://getstream.io/random_svg/?name=" +
        encodeURIComponent(showName || "Koi Show"),
      members: [client.userID || ""],
    });

    // Kết nối với kênh và lấy trạng thái ban đầu
    console.log("[ChatService] Watching channel:", channelId);
    await channel.watch();
    console.log("[ChatService] Channel ready:", channelId);

    return channel;
  } catch (error) {
    console.error("[ChatService] Error creating livestream channel:", error);

    // More detailed error info for troubleshooting
    if (error.code) {
      console.error(
        `[ChatService] Stream Error Code: ${error.code}, Status: ${error.status}`
      );
    }

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
    console.log("[ChatService] Sending message to channel:", channelId);
    const channel = client.channel("livestream", channelId);
    await channel.sendMessage({
      text: message,
    });
    console.log("[ChatService] Message sent successfully");
  } catch (error) {
    console.error("[ChatService] Error sending message:", error);
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
    const channelId = `livestream-${livestreamId}`;
    console.log(
      `[ChatService] Getting messages for livestream channel: ${channelId}`
    );

    // Try to use Stream's client first
    if (chatClientInstance && chatClientInstance.userID) {
      try {
        const channel = chatClientInstance.channel("livestream", channelId);

        // Make sure we're watching this channel
        await channel.watch();

        const response = await channel.query({
          messages: { limit: 50 },
        });

        // Convert Stream's message format to your app's format
        const messages: ChatMessage[] = (response.messages || []).map(
          (msg) => ({
            id: msg.id,
            author: msg.user?.name || "Unknown",
            authorId: msg.user?.id || "unknown",
            content: msg.text || "",
            timestamp: new Date(msg.created_at || Date.now()),
            profileImage: msg.user?.image,
          })
        );

        console.log(
          `[ChatService] Successfully retrieved ${messages.length} messages from Stream`
        );

        return {
          success: true,
          data: messages,
          message: "Messages fetched successfully",
        };
      } catch (streamError) {
        console.error(
          "[ChatService] Error fetching messages from Stream:",
          streamError
        );
        // Don't fall back to API if it's a Stream-specific error
        if (streamError.code) {
          throw streamError;
        }
        // Otherwise fall back to API
      }
    } else {
      console.log(
        "[ChatService] Stream client not initialized or user not connected, falling back to API"
      );
    }

    // Fallback to your backend API
    console.log(`[ChatService] Falling back to API for channel: ${channelId}`);
    const response = await api.get<ChatMessagesResponse>(
      `/api/v1/chat/messages/${livestreamId}`
    );
    return response.data;
  } catch (error) {
    console.error("[ChatService] Error getting chat messages:", error);

    // Provide more specific error information
    if (error.code && error.status) {
      console.error(
        `[ChatService] Stream Error Code: ${error.code}, Status: ${error.status}`
      );
    }

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
    const channelId = `livestream-${livestreamId}`;
    console.log(`[ChatService] Sending message to channel: ${channelId}`);

    // Try to use Stream's client first if connected
    if (chatClientInstance && chatClientInstance.userID) {
      try {
        const channel = chatClientInstance.channel("livestream", channelId);

        // Ensure we're watching the channel
        await channel.watch();

        // Send message via Stream
        const response = await channel.sendMessage({
          text: message.content,
          // You can add custom data if needed
          custom_data: {
            authorDisplay: message.author,
          },
        });

        console.log("[ChatService] Message successfully sent via Stream");

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
        console.error(
          "[ChatService] Error sending message via Stream:",
          streamError
        );

        if (streamError.code) {
          console.error(
            `[ChatService] Stream Error Code: ${streamError.code}, Status: ${streamError.status}`
          );
          throw streamError;
        }
        // Otherwise fall back to API
      }
    } else {
      console.log(
        "[ChatService] Stream client not initialized or user not connected, falling back to API"
      );
    }

    // Fallback to your backend API
    console.log(
      `[ChatService] Falling back to API for sending message to: ${channelId}`
    );
    const response = await api.post<SendMessageResponse>(
      `/api/v1/chat/messages/${livestreamId}`,
      message
    );
    return response.data;
  } catch (error) {
    console.error("[ChatService] Error sending chat message:", error);

    // Provide more detailed error information
    if (error.code && error.status) {
      console.error(
        `[ChatService] Stream Error Code: ${error.code}, Status: ${error.status}`
      );
    }

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
