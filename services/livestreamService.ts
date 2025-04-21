// services/livestreamService.ts
import api from "./api";

export interface LivestreamInfo {
  id: string;
  callId: string;
  startTime: string;
  endTime: string | null;
  showName: string;
  viewerCount: number;
  status: string;
}

export interface GetAllLivestreamsResponse {
  data: LivestreamInfo[];
  statusCode: number;
  message: string;
}

export interface GetLivestreamDetailsResponse {
  data: LivestreamInfo;
  statusCode: number;
  message: string;
}

export interface GetViewerTokenResponse {
  data: {
    token: string;
  };
  statusCode: number;
  message: string;
}

export interface GetLivestreamChatTokenResponse {
  data: {
    token: string;
  };
  statusCode: number;
  message: string;
}

// --- Livestream API Functions ---

/**
 * Fetches all livestreams associated with a specific Koi Show.
 * @param koiShowId - The ID of the Koi Show.
 * @returns A promise that resolves with the list of livestreams.
 */
export async function getAllLivestreamsForShow(
  koiShowId: string
): Promise<GetAllLivestreamsResponse> {
  try {
    const response = await api.get<GetAllLivestreamsResponse>(
      `/api/v1/livestream/get-all/${koiShowId}`
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching livestreams for show ${koiShowId}:`, error);
    // Re-throw the error so the calling component can handle it (e.g., show specific UI)
    // The interceptor in api.ts already handles generic error toasts.
    throw error;
  }
}

/**
 * Fetches the details of a specific livestream.
 * @param livestreamId - The ID of the livestream.
 * @returns A promise that resolves with the livestream details.
 */
export async function getLivestreamDetails(
  livestreamId: string
): Promise<GetLivestreamDetailsResponse> {
  try {
    const response = await api.get<GetLivestreamDetailsResponse>(
      `/api/v1/livestream/${livestreamId}`
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching livestream details for ${livestreamId}:`,
      error
    );
    throw error;
  }
}

/**
 * Fetches a viewer token for a specific livestream.
 * @param livestreamId - The ID of the livestream.
 * @returns A promise that resolves with the viewer token data.
 */
export async function getLivestreamViewerToken(
  livestreamId: string
): Promise<GetViewerTokenResponse> {
  try {
    // Assuming the token endpoint is GET, adjust if it's POST or other method
    const response = await api.get<GetViewerTokenResponse>(
      `/api/v1/livestream/viewer-token/${livestreamId}`
    );
    return response.data; // Return the whole response data object which includes the token
  } catch (error) {
    console.error(
      `Error fetching viewer token for livestream ${livestreamId}:`,
      error
    );
    throw error;
  }
}

/**
 * Fetches a chat token for a specific livestream.
 * @param livestreamId - The ID of the livestream.
 * @returns A promise that resolves with the chat token data.
 */
export async function getLivestreamChatToken(
  livestreamId: string
): Promise<GetLivestreamChatTokenResponse> {
  try {
    const response = await api.get<GetLivestreamChatTokenResponse>(
      `/api/v1/livestream/chat-token/${livestreamId}`
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching chat token for livestream ${livestreamId}:`,
      error
    );
    throw error;
  }
}
// --- End Livestream API Functions ---
