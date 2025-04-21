import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Channel, Event, StreamChat } from "stream-chat";

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

// Single client instance for the entire app
let chatClientInstance: StreamChat | null = null;

// Constants for AsyncStorage
const STREAM_TOKEN_STORAGE_KEY = "@StreamChat:userToken";
const STREAM_USER_STORAGE_KEY = "@StreamChat:userData";

// Track channel subscription
const subscribedChannels: { [channelId: string]: boolean } = {};

// Store channel instances to reuse
const channelInstances: { [channelId: string]: Channel } = {};

/**
 * Initialize the Stream Chat client
 * @returns The StreamChat client instance
 */
export function initChatClient(): StreamChat {
  if (chatClientInstance) {
    console.log("[ChatService] Returning existing Stream Chat client instance");
    return chatClientInstance;
  }

  // Get API key from config or use hardcoded value for backup
  const apiKey =
    Constants.expoConfig?.extra?.streamChatApiKey || "z87auffz2r8y";
  if (!apiKey) {
    throw new Error("Stream Chat API key is not configured");
  }

  console.log(
    "[ChatService] Initializing Stream Chat client with API key:",
    apiKey
  );

  // Create a new client instance with optimizations for React Native
  chatClientInstance = StreamChat.getInstance(apiKey, {
    enableInsights: true, // Enable insights for better performance tracking
    enableWSFallback: true, // Enable WebSocket fallback for better connection reliability
    persistUserOnConnectionFailure: true, // Keep user connected on temporary failures
  });

  console.log("[ChatService] Stream Chat client initialized");

  return chatClientInstance;
}

/**
 * Save user token to AsyncStorage for later use
 */
async function saveUserTokenToStorage(
  userId: string,
  token: string
): Promise<void> {
  try {
    await AsyncStorage.setItem(STREAM_TOKEN_STORAGE_KEY, token);
    console.log(
      `[ChatService] Token saved to AsyncStorage for user: ${userId}`
    );
  } catch (error) {
    console.error("[ChatService] Failed to save token to AsyncStorage:", error);
  }
}

/**
 * Save user data to AsyncStorage
 */
async function saveUserDataToStorage(userData: {
  id: string;
  name: string;
  image?: string;
}): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STREAM_USER_STORAGE_KEY,
      JSON.stringify(userData)
    );
    console.log(
      `[ChatService] User data saved to AsyncStorage for user: ${userData.id}`
    );
  } catch (error) {
    console.error(
      "[ChatService] Failed to save user data to AsyncStorage:",
      error
    );
  }
}

/**
 * Get saved user token from AsyncStorage
 */
export async function getSavedUserToken(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem(STREAM_TOKEN_STORAGE_KEY);
    return token;
  } catch (error) {
    console.error(
      "[ChatService] Failed to get token from AsyncStorage:",
      error
    );
    return null;
  }
}

/**
 * Get saved user data from AsyncStorage
 */
export async function getSavedUserData(): Promise<{
  id: string;
  name: string;
  image?: string;
} | null> {
  try {
    const userData = await AsyncStorage.getItem(STREAM_USER_STORAGE_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error(
      "[ChatService] Failed to get user data from AsyncStorage:",
      error
    );
    return null;
  }
}

/**
 * Check if token is valid and not expired
 */
export function isTokenValid(token: string): boolean {
  try {
    // Simple check if token is JWT-formatted
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    // Check expiration
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;

    // Check if token is expired (exp is in seconds)
    return payload.exp * 1000 > Date.now();
  } catch (error) {
    console.error("[ChatService] Error checking token validity:", error);
    return false;
  }
}

/**
 * Get a chat token for the client
 * @param userId ID of the user
 * @param livestreamId Optional livestream ID to fetch token from the livestream viewer token API
 * @returns Token for Stream Chat
 */
export async function getChatToken(
  userId: string,
  livestreamId?: string
): Promise<string> {
  try {
    // First check if we have a valid token in storage
    const storedToken = await getSavedUserToken();
    if (storedToken && isTokenValid(storedToken)) {
      console.log("[ChatService] Using valid token from storage");
      return storedToken;
    }

    console.log("[ChatService] Getting new chat token for user:", userId);

    // === TEMPORARY SOLUTION: Using viewer token instead of chat token ===
    // If livestreamId is provided, try to get token from the livestream VIEWER token API
    if (livestreamId) {
      try {
        console.log(
          `[ChatService] Attempting to use livestream viewer token for livestream: ${livestreamId}`
        );

        // Import the function to get livestream VIEWER token
        const { getLivestreamViewerToken } = await import(
          "./livestreamService"
        );

        // Fetch the token from the API
        const response = await getLivestreamViewerToken(livestreamId);

        if (response.data?.token) {
          const token = response.data.token;
          console.log(
            "[ChatService] Successfully got token from livestream viewer API"
          );
          console.log("[ChatService] Token:", token);

          // Save the token for future use
          await saveUserTokenToStorage(userId, token);
          return token;
        } else {
          console.warn(
            "[ChatService] Livestream viewer token API response missing token data"
          );
        }
      } catch (tokenError) {
        console.error(
          "[ChatService] Error getting token from livestream viewer API:",
          tokenError
        );
        // Continue to fallback methods
      }
    }

    /* === ORIGINAL CODE: Using chat token API ===
    // If livestreamId is provided, try to get token from the livestream CHAT token API
    if (livestreamId) {
      try {
        console.log(
          `[ChatService] Attempting to use livestream chat token for livestream: ${livestreamId}`
        );

        // Import the function to get livestream CHAT token
        const { getLivestreamChatToken } = await import("./livestreamService");

        // Fetch the token from the API
        const response = await getLivestreamChatToken(livestreamId);

        if (response.data?.token) {
          const token = response.data.token;
          console.log(
            "[ChatService] Successfully got token from livestream chat API"
          );

          // Save the token for future use
          await saveUserTokenToStorage(userId, token);
          return token;
        } else {
          console.warn(
            "[ChatService] Livestream chat token API response missing token data"
          );
        }
      } catch (tokenError) {
        console.error(
          "[ChatService] Error getting token from livestream chat API:",
          tokenError
        );
        // Continue to fallback methods
      }
    }
    */

    // === TEMPORARY SOLUTION: Using dev token in production ===
    // Tạm thời sử dụng dev token cho cả môi trường production để test
    const client = initChatClient();
    const devToken = client.devToken(userId);
    console.log("[ChatService] Using dev token for testing");
    await saveUserTokenToStorage(userId, devToken);
    return devToken;

    /* === ORIGINAL CODE: Only use dev token in development ===
    // Only use dev token in development environment
    if (__DEV__) {
      const client = initChatClient();
      const devToken = client.devToken(userId);
      console.log("[ChatService] In development mode - using dev token");
      await saveUserTokenToStorage(userId, devToken);
      return devToken;
    }

    // For production: Don't use dev token, throw an error instead
    throw new Error("Không thể lấy token chat hợp lệ. Vui lòng thử lại sau.");
    */
  } catch (error) {
    console.error("[ChatService] Error getting chat token:", error);
    throw error;
  }
}

/**
 * Disconnect user from Stream Chat
 */
export async function disconnectUser(): Promise<void> {
  if (!chatClientInstance) return;

  try {
    console.log("[ChatService] Disconnecting user from Stream Chat");
    await chatClientInstance.disconnectUser();
    chatClientInstance = null;

    // Clear all channel instances
    Object.keys(channelInstances).forEach((key) => {
      delete channelInstances[key];
    });

    // Clear subscribed channels
    Object.keys(subscribedChannels).forEach((key) => {
      delete subscribedChannels[key];
    });

    console.log("[ChatService] User disconnected successfully");
  } catch (error) {
    console.error("[ChatService] Error disconnecting user:", error);
  }
}

/**
 * Connect user to Stream Chat
 * @param userId User ID
 * @param username Display name
 * @param token Stream Chat token
 * @param profileImage Optional profile image URL
 * @returns Stream Chat client
 */
export async function connectUser(
  userId: string,
  username: string,
  token: string,
  profileImage?: string
): Promise<StreamChat> {
  const client = initChatClient();

  try {
    console.log("[ChatService] Connecting user to Stream Chat:", username);

    // If already connected with the same user, just return the client
    if (client.userID === userId) {
      console.log("[ChatService] User already connected with the same ID");
      return client;
    }

    // If connected with a different user, disconnect first
    if (client.userID && client.userID !== userId) {
      console.log(
        "[ChatService] Disconnecting existing user before connecting new user"
      );
      await client.disconnectUser();
    }

    // Create user data object
    const userData = {
      id: userId,
      name: username,
      image:
        profileImage ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}`,
    };

    // Save user data for potential reconnection
    await saveUserDataToStorage(userData);

    // Connect user to Stream Chat
    await client.connectUser(userData, token);

    console.log("[ChatService] User connected successfully:", userId);

    // Set up event handlers
    setupConnectionEventHandlers(client);

    return client;
  } catch (error) {
    console.error("[ChatService] Error connecting user to chat:", error);

    // Handle "already connected" error gracefully
    if (error.message?.includes("already connected")) {
      console.log("[ChatService] User already connected, returning client");
      return client;
    }

    throw error;
  }
}

/**
 * Set up event handlers for connection events
 */
function setupConnectionEventHandlers(client: StreamChat): void {
  // Health check handler
  client.on("connection.changed", (event: Event) => {
    console.log(
      `[ChatService] Connection status changed: ${
        event.online ? "online" : "offline"
      }`
    );

    if (event.online) {
      // Reconnect to all previously watched channels
      Object.keys(subscribedChannels).forEach((channelId) => {
        if (subscribedChannels[channelId] && channelInstances[channelId]) {
          console.log(
            `[ChatService] Rewatching channel after reconnection: ${channelId}`
          );
          channelInstances[channelId].watch().catch((error) => {
            console.error(
              `[ChatService] Error rewatching channel ${channelId}:`,
              error
            );
          });
        }
      });
    }
  });

  // Connection error handler
  client.on("connection.error", (event: Event) => {
    console.error("[ChatService] Connection error:", event);
  });
}

/**
 * Create or get a livestream chat channel
 * @param client Stream Chat client
 * @param livestreamId Livestream ID
 * @param showName Show name
 * @returns Channel instance
 */
export async function getOrCreateLivestreamChannel(
  client: StreamChat,
  livestreamId: string,
  showName: string
): Promise<Channel> {
  try {
    const channelId = `livestream-${livestreamId}`;
    console.log("[ChatService] Creating/getting channel:", channelId);

    // Check if we already have this channel instance
    if (channelInstances[channelId]) {
      console.log(
        `[ChatService] Returning existing channel instance: ${channelId}`
      );
      const existingChannel = channelInstances[channelId];

      // Make sure it's being watched
      if (!subscribedChannels[channelId]) {
        console.log(`[ChatService] Rewatching existing channel: ${channelId}`);
        await existingChannel.watch();
        subscribedChannels[channelId] = true;
      }

      return existingChannel;
    }

    // Create channel data
    const channelData = {
      name: `${showName || "Koi Show"} Chat`,
      image:
        "https://getstream.io/random_svg/?name=" +
        encodeURIComponent(showName || "Koi Show"),
      members: [client.userID || ""],
      created_by_id: client.userID || "",
    };

    // Create a new channel instance
    const channel = client.channel("livestream", channelId, channelData);

    // Store the channel instance for reuse
    channelInstances[channelId] = channel;

    // Watch the channel to connect to it
    console.log("[ChatService] Watching channel:", channelId);
    await channel.watch();
    subscribedChannels[channelId] = true;

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

    // Try to recover from common errors
    if (error.code === 4) {
      // Missing required field
      console.log(
        "[ChatService] Attempting channel creation with minimal data"
      );
      const channelId = `livestream-${livestreamId}`;
      const minimalChannel = client.channel("livestream", channelId);
      await minimalChannel.create();
      channelInstances[channelId] = minimalChannel;
      subscribedChannels[channelId] = true;
      return minimalChannel;
    }

    throw error;
  }
}

/**
 * Get chat messages from a livestream channel
 * @param livestreamId Livestream ID
 * @returns Chat messages
 */
export async function getChatMessages(
  livestreamId: string
): Promise<ChatMessagesResponse> {
  try {
    const channelId = `livestream-${livestreamId}`;
    console.log(
      `[ChatService] Getting messages for livestream channel: ${channelId}`
    );

    // Make sure we have a client and it's connected
    if (!chatClientInstance || !chatClientInstance.userID) {
      console.error(
        "[ChatService] Cannot get messages: Client not initialized or user not connected"
      );
      return {
        success: false,
        data: [],
        message: "Chat service not initialized",
      };
    }

    // Get or create the channel
    const channel = chatClientInstance.channel("livestream", channelId);

    // Make sure we're watching this channel
    if (!subscribedChannels[channelId]) {
      console.log(
        `[ChatService] Watching channel before getting messages: ${channelId}`
      );
      await channel.watch();
      subscribedChannels[channelId] = true;
      channelInstances[channelId] = channel;
    }

    // Query the channel for messages
    const response = await channel.query({
      messages: { limit: 50 },
      watch: true, // Make sure we receive real-time updates
    });

    // Convert Stream's message format to your app's format
    const messages: ChatMessage[] = (response.messages || []).map((msg) => ({
      id: msg.id,
      author: msg.user?.name || "Unknown",
      authorId: msg.user?.id || "unknown",
      content: msg.text || "",
      timestamp: new Date(msg.created_at || Date.now()),
      profileImage: msg.user?.image,
    }));

    console.log(
      `[ChatService] Successfully retrieved ${messages.length} messages from Stream`
    );

    return {
      success: true,
      data: messages,
      message: "Messages fetched successfully",
    };
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
 * Send a chat message to a livestream channel
 * @param livestreamId Livestream ID
 * @param message Message to send
 * @returns Response with sent message
 */
export async function sendChatMessage(
  livestreamId: string,
  message: MessageToSend
): Promise<SendMessageResponse> {
  try {
    const channelId = `livestream-${livestreamId}`;
    console.log(`[ChatService] Sending message to channel: ${channelId}`);

    // Make sure we have a client and it's connected
    if (!chatClientInstance || !chatClientInstance.userID) {
      throw new Error("Chat service not initialized or user not connected");
    }

    // Get the channel
    let channel = channelInstances[channelId];

    if (!channel) {
      // Create the channel if it doesn't exist
      channel = chatClientInstance.channel("livestream", channelId);
      channelInstances[channelId] = channel;

      // Watch the channel to connect to it
      console.log(
        `[ChatService] Watching channel before sending message: ${channelId}`
      );
      await channel.watch();
      subscribedChannels[channelId] = true;
    }

    // Send message via Stream
    const response = await channel.sendMessage({
      text: message.content,
      // Add custom data if needed
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

/**
 * Setup automatic reconnection of chat
 * This should be called in your app's main component
 */
export async function setupAutomaticChatReconnection(): Promise<void> {
  try {
    const userData = await getSavedUserData();
    const token = await getSavedUserToken();

    if (userData && token && isTokenValid(token)) {
      console.log(
        "[ChatService] Attempting automatic reconnection for user:",
        userData.id
      );
      await connectUser(userData.id, userData.name, token, userData.image);
    }
  } catch (error) {
    console.error("[ChatService] Error in automatic reconnection:", error);
  }
}
