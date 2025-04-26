// app/(tabs)/shows/LivestreamViewer.tsx
import { Ionicons } from "@expo/vector-icons";
import {
  Call,
  CallingState,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  useCall,
  useCallStateHooks,
  User,
  useStreamVideoClient,
  ViewerLivestream,
} from "@stream-io/video-react-native-sdk";
import { router, useLocalSearchParams } from "expo-router";
import { jwtDecode } from "jwt-decode";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TikTokStyleLivestreamUI from "../../../components/TikTokStyleLivestreamUI";
import api from "../../../services/api";
import {
  getLivestreamDetails,
  getLivestreamViewerToken,
} from "../../../services/livestreamService";

// Lấy kích thước màn hình
const { width } = Dimensions.get("window");

// --- Constants ---
const STATUS_CHECK_INTERVAL = 15000; // Check API status every 15 seconds

// --- Helper Function for Leaving ---
async function handleLeaveCall(call: Call | null) {
  console.log("Attempting to leave call...");
  if (call) {
    try {
      await call.leave();
      console.log("Successfully left the call.");
    } catch (error) {
      console.error("Error leaving call:", error);
    }
  }
  // Navigate back regardless of leave success/failure
  if (router.canGoBack()) {
    router.back();
  } else {
    console.log("Cannot go back from livestream.");
  }
}

// --- Inner Component to handle Call logic ---
interface LivestreamContentProps {
  callId: string;
  callType: string;
  livestreamId: string; // Pass livestreamId for status checks
}

// Interface for livestream comments
interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  userImage?: string;
}

// Import EnhancedLivestreamUI component instead of defining it inline

// Component con để xử lý trạng thái call (Phải nằm trong ngữ cảnh <StreamCall>)
const CallStateHandler: React.FC<{
  onLeave: (call: Call) => void;
  showName: string;
  livestreamId: string;
  userId: string;
  userName: string;
  userProfileImage?: string;
}> = ({
  onLeave,
  showName,
  livestreamId,
  userId,
  userName,
  userProfileImage,
}) => {
  // Các hook này bây giờ an toàn vì chúng nằm trong ngữ cảnh StreamCall
  const { useCallCallingState, useIsCallLive } = useCallStateHooks();
  const callingState = useCallCallingState();
  const isLive = useIsCallLive();
  const call = useCall(); // Lấy call từ ngữ cảnh

  console.log("CallStateHandler: Current calling state:", callingState);
  console.log("CallStateHandler: Is call live:", isLive);

  // --- Render dựa vào trạng thái ---
  switch (callingState) {
    case CallingState.JOINING:
    case CallingState.RECONNECTING:
      return (
        <View style={styles.centeredContent}>
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={[styles.infoText, { color: "#FFF" }]}>
            {callingState === CallingState.JOINING
              ? "Đang tham gia..."
              : "Đang kết nối lại..."}
          </Text>
        </View>
      );
    case CallingState.LEFT:
      return (
        <View style={styles.centeredContent}>
          <Ionicons name="stop-circle-outline" size={48} color="#ccc" />
          <Text style={[styles.infoText, { color: "#FFF" }]}>
            Bạn đã rời khỏi livestream.
          </Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => call && onLeave(call)}>
            <Text style={styles.actionButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      );
    case CallingState.JOINED:
      if (!isLive) {
        return (
          <View style={styles.centeredContent}>
            <Ionicons name="hourglass-outline" size={48} color="#ccc" />
            <Text style={[styles.infoText, { color: "#FFF" }]}>
              Đang chờ người phát...
            </Text>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => call && onLeave(call)}>
              <Text style={styles.actionButtonText}>Rời khỏi</Text>
            </TouchableOpacity>
          </View>
        );
      }

      // Use TikTokStyleLivestreamUI for a TikTok-like chat experience
      return (
        <TikTokStyleLivestreamUI
          showName={showName}
          onLeave={() => call && onLeave(call)}
          livestreamId={livestreamId}
          userId={userId}
          userName={userName}
          userProfileImage={userProfileImage}>
          <View style={{ height: "100%" }}>
            <ViewerLivestream />
          </View>
        </TikTokStyleLivestreamUI>
      );
    default:
      return (
        <View style={styles.centeredContent}>
          <Ionicons name="help-circle-outline" size={48} color="#ccc" />
          <Text style={[styles.infoText, { color: "#FFF" }]}>
            Trạng thái: {callingState || "không xác định"}
          </Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => call && onLeave(call)}>
            <Text style={styles.actionButtonText}>Rời khỏi</Text>
          </TouchableOpacity>
        </View>
      );
  }
};

const LivestreamContent: React.FC<
  LivestreamContentProps & {
    showName?: string;
    userId: string;
    userName: string;
    userProfileImage?: string;
  }
> = ({
  callId,
  callType,
  livestreamId,
  showName,
  userId,
  userName,
  userProfileImage,
}) => {
  const client = useStreamVideoClient();
  const [call, setCall] = useState<Call | null>(null);
  const [isLoadingCall, setIsLoadingCall] = useState(true);
  const [callError, setCallError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<string | null>(null); // Store status from API
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null); // Sửa kiểu cho setInterval
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // Sửa kiểu cho setTimeout
  const joinAttemptsRef = useRef<number>(0);
  const MAX_JOIN_ATTEMPTS = 3;

  // --- Status Check Effect ---
  useEffect(() => {
    let isMounted = true;

    async function checkStatus() {
      if (!livestreamId) return;
      console.log(`Checking API status for livestream: ${livestreamId}`);
      try {
        const response = await getLivestreamDetails(livestreamId);
        if (isMounted && response.data?.status) {
          console.log("API Status:", response.data.status);
          setApiStatus(response.data.status.toLowerCase()); // Normalize status
        }
      } catch (error) {
        console.error("Error checking livestream status via API:", error);
        // Don't set error state here, just log it
      }
    }

    // Initial check
    checkStatus();

    // Set up interval
    intervalRef.current = setInterval(checkStatus, STATUS_CHECK_INTERVAL);

    // Cleanup interval on unmount
    return () => {
      isMounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        console.log("Cleared status check interval.");
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [livestreamId]); // Depend only on livestreamId

  // --- Call Setup Effect ---
  useEffect(() => {
    if (!client || !callId || !callType) {
      console.warn(
        "LivestreamContent: Client, callId, or callType not available yet."
      );
      return;
    }

    let isMounted = true;
    let currentCall: Call | null = null; // Local variable to manage the call instance
    joinAttemptsRef.current = 0;

    const setupCall = async () => {
      setIsLoadingCall(true);
      setCallError(null);
      setCall(null);
      console.log(
        `LivestreamContent: Attempting to get or create call: ${callType}/${callId}`
      );

      try {
        try {
          console.log(
            `LivestreamContent: Attempting to get call instance: ${callType}/${callId}`
          );

          // Make sure we're properly handling this call reference
          currentCall = client.call(callType, callId);

          if (!currentCall) {
            throw new Error("Không thể tạo đối tượng call.");
          }

          console.log("LivestreamContent: Call instance obtained");

          // Join call with retries
          const attemptJoin = async () => {
            joinAttemptsRef.current++;
            console.log(
              `LivestreamContent: Attempting to join call (attempt ${joinAttemptsRef.current})...`
            );

            // Check connection info
            console.log(`[LivestreamContent] Current connection info:`, {
              callId: currentCall?.id,
              callType: currentCall?.type,
            });

            try {
              // Kiểm tra null trước khi gọi join
              if (!currentCall) {
                throw new Error("Call instance is null");
              }

              // Use valid options for join call
              const joinResult = await currentCall.join({
                create: false,
                ring: false,
                notify: false,
              });

              // Disable camera and mic when joining
              if (currentCall) {
                try {
                  await currentCall.camera.disable();
                  await currentCall.microphone.disable();
                } catch (mediaError) {
                  console.error("Error disabling media:", mediaError);
                  // Continue even if we can't disable media - better to show livestream
                }
              }

              console.log(
                "LivestreamContent: Successfully joined call",
                joinResult
              );

              if (isMounted) {
                setCall(currentCall);
                setIsLoadingCall(false);
              }
            } catch (joinError: any) {
              console.error(
                `Join attempt ${joinAttemptsRef.current} failed:`,
                joinError
              );

              // Log detailed error information
              if (joinError.response) {
                console.error("Error response data:", joinError.response.data);
                console.error(
                  "Error response status:",
                  joinError.response.status
                );
              }

              // Handle specific error types
              const errorMessage = joinError.message || "Unknown error";

              if (
                errorMessage.includes("permission denied") ||
                errorMessage.includes("not allowed to perform action")
              ) {
                throw new Error("Bạn không có quyền tham gia livestream này");
              }

              // If we haven't exceeded max retries, try again
              if (joinAttemptsRef.current < MAX_JOIN_ATTEMPTS) {
                console.warn(
                  `Retrying connection (${joinAttemptsRef.current}/${MAX_JOIN_ATTEMPTS})...`
                );

                // Exponential backoff for retries
                const delayMs = 1000 * Math.pow(2, joinAttemptsRef.current - 1);

                if (isMounted) {
                  retryTimeoutRef.current = setTimeout(
                    attemptJoin,
                    delayMs
                  ) as ReturnType<typeof setTimeout>;
                }
              } else {
                throw new Error(
                  `Không thể kết nối sau ${MAX_JOIN_ATTEMPTS} lần thử. Vui lòng thử lại sau.`
                );
              }
            }
          };

          // Start join attempts
          await attemptJoin();
        } catch (err: any) {
          console.error("LivestreamContent: Error in call setup:", err);
          if (isMounted) {
            // Process common error types
            const errorMsg = err.message || "Không xác định";

            switch (true) {
              case errorMsg.includes("permission denied"):
              case errorMsg.includes("not allowed to perform action"):
                setCallError("Bạn không có quyền truy cập vào livestream này.");
                break;
              case errorMsg.includes("network"):
              case errorMsg.includes("timeout"):
                setCallError(
                  "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối và thử lại."
                );
                break;
              case errorMsg.includes("call not found"):
                setCallError("Livestream này không tồn tại hoặc đã kết thúc.");
                break;
              case errorMsg.includes("maximum retries"):
              case errorMsg.includes("lần thử"):
                setCallError(
                  "Không thể kết nối sau nhiều lần thử. Vui lòng thử lại sau."
                );
                break;
              default:
                setCallError(`Không thể tham gia livestream: ${errorMsg}`);
                break;
            }

            setIsLoadingCall(false);
          }

          // Clean up call if there was an error
          if (currentCall) {
            try {
              await currentCall.leave();
            } catch (e) {
              console.error("Error leaving call after failure:", e);
            }
            currentCall = null;
          }
        }
      } catch (finalError) {
        console.error("Unhandled error in setupCall:", finalError);
        if (isMounted) {
          setCallError("Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.");
          setIsLoadingCall(false);
        }
      }
    };

    setupCall();

    return () => {
      isMounted = false;

      // Clear any pending timers
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      // Leave the call when component unmounts
      if (call) {
        console.log(
          "LivestreamContent unmounting or deps changed, leaving call..."
        );
        call
          .leave()
          .catch((e) => console.error("Error leaving call on unmount:", e));
      } else {
        console.log(
          "LivestreamContent unmounting or deps changed, no call object to leave."
        );
      }

      setCall(null); // Clear call state on unmount
      console.log("LivestreamContent unmounted/deps changed.");
    };
  }, [client, callId, callType]); // Re-run if client, callId, or callType changes

  // --- Render Logic ---

  // 1. Initial Loading or Call Setup Error
  if (isLoadingCall) {
    return (
      <View style={styles.centeredContent}>
        <ActivityIndicator size="large" color="#FFF" />
        <Text style={[styles.infoText, { color: "#FFF" }]}>
          Đang tải cuộc gọi...
        </Text>
      </View>
    );
  }

  if (callError) {
    return (
      <View style={styles.centeredContent}>
        <Ionicons name="alert-circle-outline" size={48} color="red" />
        <Text style={[styles.errorText, { color: "#FFF" }]}>{callError}</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLeaveCall(null)}>
          <Text style={styles.actionButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 2. Check API Status (Highest Priority After Setup)
  if (apiStatus === "ended") {
    return (
      <View style={styles.centeredContent}>
        <Ionicons name="stop-circle-outline" size={48} color="#ccc" />
        <Text style={[styles.infoText, { color: "#FFF" }]}>
          Livestream đã kết thúc.
        </Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLeaveCall(call)}>
          <Text style={styles.actionButtonText}>Rời khỏi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (apiStatus === "paused") {
    return (
      <View style={styles.centeredContent}>
        <Ionicons name="pause-circle-outline" size={48} color="#ccc" />
        <Text style={[styles.infoText, { color: "#FFF" }]}>
          Livestream đang tạm dừng.
        </Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLeaveCall(call)}>
          <Text style={styles.actionButtonText}>Rời khỏi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 3. Check Call Object
  if (!call) {
    return (
      <View style={styles.centeredContent}>
        <Ionicons name="videocam-off-outline" size={48} color="#ccc" />
        <Text style={[styles.errorText, { color: "#FFF" }]}>
          Không thể tải cuộc gọi.
        </Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLeaveCall(null)}>
          <Text style={styles.actionButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render StreamCall with call object
  console.log("LivestreamContent: Rendering StreamCall with CallContent.");
  return (
    <StreamCall call={call}>
      <CallStateHandler
        onLeave={handleLeaveCall}
        showName={showName || "Koi Show Livestream"}
        livestreamId={livestreamId}
        userId={userId}
        userName={userName}
        userProfileImage={userProfileImage}
      />
    </StreamCall>
  );
};

// --- Main Screen Component ---
const LivestreamViewerScreen: React.FC = () => {
  const { livestreamId, callId, apiKey, showName } = useLocalSearchParams<{
    livestreamId: string;
    callId: string;
    apiKey: string;
    showName?: string;
  }>();

  const [token, setToken] = useState<string | null>(null);
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [isLoadingToken, setIsLoadingToken] = useState<boolean>(true);
  const [isLoadingClient, setIsLoadingClient] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const callRef = useRef<Call | null>(null); // Ref to hold the call object for the leave button
  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [userProfileImage, setUserProfileImage] = useState<string | undefined>(
    undefined
  );

  // Function để lấy thông tin user profile từ API
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log(`[LivestreamViewer] Fetching user profile for ID: ${userId}`);
      const response = await api.get(`/api/v1/account/${userId}`);

      if (response.data.statusCode === 200) {
        const userInfo = response.data.data;

        // Cập nhật thông tin người dùng với dữ liệu thật từ API
        const username =
          userInfo.username ||
          userInfo.fullName ||
          `User-${userId.slice(0, 8)}`;
        const profileImage =
          userInfo.avatar || userInfo.profileImage || undefined;

        console.log(
          `[LivestreamViewer] User profile fetched successfully: ${username}`
        );
        return { username, profileImage };
      } else {
        console.warn(
          `[LivestreamViewer] Failed to fetch user profile: ${response.data.message}`
        );
        return null;
      }
    } catch (error) {
      console.error("[LivestreamViewer] Error fetching user profile:", error);
      return null;
    }
  };

  // --- Effect for Client Setup and Token Fetching ---
  useEffect(() => {
    let isMounted = true;
    let videoClient: StreamVideoClient | null = null;

    // Định nghĩa interface cho payload của JWT token ở đây để có thể truy cập trong toàn bộ hàm
    interface LivestreamTokenPayload {
      user_id: string; // ID của người dùng
      role: string; // Vai trò của người dùng
      call_cids: string[]; // Danh sách các call ID được phép truy cập
      nbf: number; // Not before timestamp
      exp: number; // Expiration timestamp
      iat: number; // Issued at timestamp
    }

    async function setupClientAndToken() {
      if (!livestreamId || !callId || !apiKey) {
        if (isMounted) {
          setError(
            "Thiếu thông tin cần thiết để xem livestream (ID, CallID, hoặc API Key)."
          );
          setIsLoadingToken(false);
        }
        return;
      }

      // --- 1. Fetch Viewer Token ---
      setIsLoadingToken(true);
      setError(null);
      let fetchedToken: string | null = null;
      try {
        console.log(`Fetching token for livestream: ${livestreamId}`);
        const response = await getLivestreamViewerToken(livestreamId);
        if (response.data?.token) {
          fetchedToken = response.data.token;
          if (isMounted) setToken(fetchedToken);
          console.log(
            "[LivestreamViewer] Raw viewer token received:",
            fetchedToken
          );
          console.log("Token fetched successfully.");
        } else {
          throw new Error("Không nhận được token từ API.");
        }
      } catch (err: any) {
        console.error("Error fetching viewer token:", err);
        if (isMounted)
          setError(`Lỗi lấy token: ${err.message || "Unknown error"}`);
        setIsLoadingToken(false);
        return;
      } finally {
        if (isMounted) setIsLoadingToken(false);
      }

      if (!fetchedToken || !isMounted) return;

      // --- 2. Initialize and Connect Stream Client ---
      setIsLoadingClient(true);
      try {
        // Giải mã token livestream một lần duy nhất
        const tokenPayload = jwtDecode<LivestreamTokenPayload>(fetchedToken);
        console.log(
          "[LivestreamViewer] Decoded viewer token payload:",
          tokenPayload
        );

        // Xác thực token
        if (
          !tokenPayload.user_id ||
          !tokenPayload.call_cids ||
          tokenPayload.call_cids.length === 0
        ) {
          throw new Error("Token không hợp lệ: Thiếu user_id hoặc call_cids");
        }

        // Kiểm tra xem callId có nằm trong danh sách call_cids được cấp phép không
        const expectedCallId = `livestream:${callId}`;
        if (!tokenPayload.call_cids.includes(expectedCallId)) {
          console.error("Call CIDs in token:", tokenPayload.call_cids);
          console.error("Expected Call ID:", expectedCallId);
          throw new Error("Token không có quyền truy cập vào livestream này");
        }

        // Lưu ID người dùng
        const userId = tokenPayload.user_id;
        if (isMounted) setUserId(userId);

        // Tạo đối tượng user tạm thời
        let userToConnect: User = {
          id: userId,
          name: `Viewer-${userId.slice(0, 8)}`,
          type: "authenticated",
        };

        // Lấy thông tin chi tiết người dùng từ API
        try {
          const userInfo = await fetchUserProfile(userId);

          // Nếu lấy được thông tin từ API, cập nhật tên và avatar
          if (userInfo) {
            userToConnect.name = userInfo.username;
            userToConnect.image = userInfo.profileImage;

            if (isMounted) {
              setUserName(userInfo.username || "");
              setUserProfileImage(userInfo.profileImage);
            }
          } else {
            // Nếu không lấy được từ API, dùng thông tin từ token
            if (isMounted) {
              setUserName(userToConnect.name || "");
            }
          }
        } catch (profileError) {
          console.error(
            "[LivestreamViewer] Error fetching user profile:",
            profileError
          );
          // Vẫn dùng thông tin từ token nếu có lỗi
          if (isMounted) {
            setUserName(userToConnect.name || "");
          }
        }

        // --- TRỰC TIẾP TRUYỀN TOKEN ---
        console.log(
          `[LivestreamViewer] Initializing client with direct token approach`
        );

        // Khởi tạo client với token trực tiếp
        videoClient = new StreamVideoClient({
          apiKey,
          token: fetchedToken, // Sử dụng token trực tiếp, không qua tokenProvider
          user: userToConnect, // Sử dụng user object đã cập nhật từ API
          options: {
            timeout: 15000, // Tăng timeout lên để tránh issues với mạng chậm
          },
        });

        // Khi khởi tạo client với cả user và token, connectUser() sẽ được gọi tự động
        console.log(
          `[LivestreamViewer] Client initialized with direct token authentication`
        );

        if (isMounted) setClient(videoClient);
      } catch (err: any) {
        console.error("Error connecting Stream client:", err);
        if (isMounted)
          setError(`Lỗi kết nối Stream: ${err.message || "Unknown error"}`);
      } finally {
        if (isMounted) setIsLoadingClient(false);
      }
    }

    setupClientAndToken();

    // --- Cleanup Function ---
    return () => {
      isMounted = false;
      console.log(
        "Livestream viewer screen unmounting. Disconnecting client..."
      );

      // Đảm bảo ngắt kết nối client khi unmount
      if (videoClient) {
        videoClient
          .disconnectUser()
          .then(() =>
            console.log("Stream client disconnected successfully on unmount.")
          )
          .catch((e) =>
            console.error("Error disconnecting Stream client on unmount:", e)
          );
      }

      // Đặt giá trị null cho state để tránh memory leak
      setClient(null);
      setToken(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livestreamId, apiKey, callId]);

  // --- Render Logic ---
  if (isLoadingToken || isLoadingClient) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>
          {isLoadingToken
            ? "Đang lấy quyền truy cập..."
            : "Đang kết nối tới livestream..."}
        </Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={64} color="red" />
        <Text style={styles.errorText}>Lỗi: {error}</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLeaveCall(null)}>
          <Text style={styles.actionButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!client || !callId || !livestreamId) {
    // Also check for livestreamId
    console.warn(
      "Rendering null state. Client Ready:",
      !!client,
      "CallID Present:",
      !!callId,
      "LivestreamID Present:",
      !!livestreamId
    );
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
        <Text style={styles.errorText}>
          Không thể chuẩn bị xem livestream. Thiếu thông tin cần thiết.
        </Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLeaveCall(null)}>
          <Text style={styles.actionButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // --- Render Livestream via Wrapper ---
  console.log("Rendering StreamVideo provider and LivestreamContent");
  return (
    <View style={styles.fullScreenContainer}>
      <StreamVideo client={client}>
        {/* Pass livestreamId down */}
        <LivestreamContent
          callId={callId}
          callType="livestream"
          livestreamId={livestreamId}
          showName={showName}
          userId={userId}
          userName={userName}
          userProfileImage={userProfileImage}
        />
      </StreamVideo>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  streamChatContainer: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: "#000",
  },
  streamWrapper: {
    // Sử dụng tỷ lệ cố định thay vì flex
    height: (width * 9) / 24, // Giảm tỷ lệ xuống thấp hơn để chat có nhiều không gian hơn
    backgroundColor: "#000",
    borderBottomWidth: 0, // Đảm bảo không có đường viền
  },
  chatWrapper: {
    flex: 1, // Chat chiếm phần còn lại
    marginTop: 0, // Không có margin
    paddingTop: 0, // Không có padding
    paddingBottom: 80, // Tăng padding bottom lên 80
    backgroundColor: "#FFF",
  },
  centered: {
    // For initial loading/error covering the whole screen
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f6fa",
  },
  centeredContent: {
    // For status messages within the black container
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "transparent", // Keep it transparent
  },
  loadingText: {
    // For initial loading
    marginTop: 10,
    fontSize: 16,
    color: "#555",
  },
  infoText: {
    // For status messages inside the stream view
    marginTop: 10,
    fontSize: 16,
    color: "#FFF", // White text on black background
    textAlign: "center",
  },
  errorText: {
    // For both initial error and status error
    marginTop: 10,
    fontSize: 16,
    color: "red",
    textAlign: "center",
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 5,
  },
  actionButton: {
    // General purpose button for errors/ended states
    marginTop: 20,
    backgroundColor: "#555", // Darker button
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
    flex: 1,
    marginHorizontal: 10,
  },

  // Styles mới cho giao diện livestream nâng cao
  livestreamContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  videoWrapper: {
    width: "100%",
    height: (width * 9) / 16, // Tỷ lệ 16:9 cho video
    backgroundColor: "#000",
    position: "relative",
  },
  liveIndicator: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 10,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#f00",
    marginRight: 4,
  },
  liveText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  viewCountContainer: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 10,
  },
  viewCountText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 4,
  },
  backButtonOverlay: {
    position: "absolute",
    top: 50,
    left: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  infoSection: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  streamTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  streamStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  statButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  statText: {
    fontSize: 14,
    marginLeft: 4,
    color: "#666",
  },
  commentsContainer: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  commentsSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  commentsScrollView: {
    flex: 1,
  },
  commentItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginRight: 8,
  },
  commentTime: {
    fontSize: 12,
    color: "#999",
  },
  commentText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 12,
    paddingBottom: 8,
  },
  commentInput: {
    flex: 1,
    height: 40,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#333",
  },
  sendButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
});

// Đảm bảo export mặc định đúng cách
const LivestreamViewer = LivestreamViewerScreen;
export default LivestreamViewer;
