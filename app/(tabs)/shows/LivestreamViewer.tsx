// app/(tabs)/shows/LivestreamViewer.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  StreamVideo,
  StreamVideoClient,
  User,
  StreamCall,
  CallContent,
  Call,
  useStreamVideoClient,
  useCallStateHooks,  // Import the main state hook
  CallingState,       // Import enum for call states
  useCall,
} from '@stream-io/video-react-native-sdk';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getLivestreamViewerToken, getLivestreamDetails, LivestreamInfo } from '../../../services/livestreamService'; // Import status check function and type
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

// --- Constants ---
const STATUS_CHECK_INTERVAL = 15000; // Check API status every 15 seconds

// --- Helper Function for Leaving ---
async function handleLeaveCall(call: Call | null) {
  console.log('Attempting to leave call...');
  if (call) {
    try {
      await call.leave();
      console.log('Successfully left the call.');
    } catch (error) {
      console.error('Error leaving call:', error);
      // Optionally show an alert to the user
      // Alert.alert('Lỗi', 'Không thể rời khỏi livestream.');
    }
  }
  // Navigate back regardless of leave success/failure
  if (router.canGoBack()) {
    router.back();
  } else {
    console.log("Cannot go back from livestream.");
    // Potentially navigate to a default screen like home
    // router.replace('/(tabs)/home');
  }
}


// --- Inner Component to handle Call logic ---
interface LivestreamContentProps {
  callId: string;
  callType: string;
  livestreamId: string; // Pass livestreamId for status checks
}

// Component con để xử lý trạng thái call (Phải nằm trong ngữ cảnh <StreamCall>)
const CallStateHandler: React.FC<{ onLeave: (call: Call) => void }> = ({ onLeave }) => {
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
          <Text style={[styles.infoText, { color: '#FFF' }]}>
            {callingState === CallingState.JOINING ? 'Đang tham gia...' : 'Đang kết nối lại...'}
          </Text>
        </View>
      );
    case CallingState.LEFT:
      return (
        <View style={styles.centeredContent}>
          <Ionicons name="stop-circle-outline" size={48} color="#ccc" />
          <Text style={[styles.infoText, { color: '#FFF' }]}>Bạn đã rời khỏi livestream.</Text>
          <TouchableOpacity style={styles.actionButton} onPress={() => call && onLeave(call)}>
            <Text style={styles.actionButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      );
    case CallingState.JOINED:
      if (!isLive) {
        return (
          <View style={styles.centeredContent}>
            <Ionicons name="hourglass-outline" size={48} color="#ccc" />
            <Text style={[styles.infoText, { color: '#FFF' }]}>Đang chờ người phát...</Text>
            <TouchableOpacity style={styles.actionButton} onPress={() => call && onLeave(call)}>
              <Text style={styles.actionButtonText}>Rời khỏi</Text>
            </TouchableOpacity>
          </View>
        );
      }
      
      // Render actual livestream content
      return (
        <CallContent
          onHangupCallHandler={() => {
            console.log('Hangup button pressed or call ended.');
            call && onLeave(call);
          }}
        />
      );
    default:
      return (
        <View style={styles.centeredContent}>
          <Ionicons name="help-circle-outline" size={48} color="#ccc" />
          <Text style={[styles.infoText, { color: '#FFF' }]}>Trạng thái: {callingState || 'không xác định'}</Text>
          <TouchableOpacity style={styles.actionButton} onPress={() => call && onLeave(call)}>
            <Text style={styles.actionButtonText}>Rời khỏi</Text>
          </TouchableOpacity>
        </View>
      );
  }
};

const LivestreamContent: React.FC<LivestreamContentProps> = ({ callId, callType, livestreamId }) => {
  const client = useStreamVideoClient();
  const [call, setCall] = useState<Call | null>(null);
  const [isLoadingCall, setIsLoadingCall] = useState(true);
  const [callError, setCallError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<string | null>(null); // Store status from API
  const intervalRef = useRef<number | null>(null); // Use number for setInterval ID

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
        console.error('Error checking livestream status via API:', error);
        // Don't necessarily set an error state here, maybe just log
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
    };
  }, [livestreamId]); // Depend only on livestreamId

  // --- Call Setup Effect ---
  useEffect(() => {
    if (!client || !callId || !callType) {
      console.warn("LivestreamContent: Client, callId, or callType not available yet.");
      return;
    }

    let isMounted = true;
    let currentCall: Call | null = null; // Local variable to manage the call instance

    const setupCall = async () => {
      setIsLoadingCall(true);
      setCallError(null);
      setCall(null);
      console.log(`LivestreamContent: Attempting to get or create call: ${callType}/${callId}`);

      try {
        try {
          console.log(`LivestreamContent: Attempting to get call instance: ${callType}/${callId}`);
          currentCall = client.call(callType, callId);
          console.log("LivestreamContent: Call instance obtained");

          // Thêm xử lý lỗi kết nối và retry
          let retryCount = 0;
          const maxRetries = 3;

          while (retryCount < maxRetries) {
            try {
              console.log(`LivestreamContent: Attempting to join call (attempt ${retryCount + 1})...`);
              
              // Kiểm tra và ghi log thông tin kết nối hiện tại
              console.log(`[LivestreamContent] Current connection info:`, { 
                callId: currentCall.id,
                callType: currentCall.type
              });
              
              // Sử dụng các tùy chọn hợp lệ cho join call
              const joinResult = await currentCall.join({
                create: false,
                ring: false,
                notify: false
              });
              
              console.log("LivestreamContent: Successfully joined call", joinResult);
              break;
            } catch (joinError: any) {
              retryCount++;
              console.error(`Join attempt ${retryCount} failed:`, joinError);
              
              // Ghi log chi tiết lỗi
              if (joinError.response) {
                console.error('Error response data:', joinError.response.data);
                console.error('Error response status:', joinError.response.status);
              }
              
              // Phân tích chi tiết lỗi
              if (joinError.message.includes('permission denied') || 
                  joinError.message.includes('not allowed to perform action')) {
                throw new Error('Bạn không có quyền tham gia livestream này');
              }
              
              if (retryCount === maxRetries) {
                throw new Error('Không thể kết nối sau nhiều lần thử lại');
              }
              
              console.warn(`Đang thử kết nối lại lần ${retryCount}...`);
              // Tăng thời gian chờ mỗi lần retry
              await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
            }
          }

          if (isMounted) {
            setCall(currentCall);
          }
        } catch (err: any) {
          console.error("LivestreamContent: Error in call setup:", err);
          if (isMounted) {
            // Xử lý các loại lỗi phổ biến
            switch (true) {
              case err.message.includes('permission denied'):
              case err.message.includes('not allowed to perform action'):
                setCallError('Bạn không có quyền truy cập vào livestream này.');
                break;
              case err.message.includes('network'):
              case err.message.includes('timeout'):
                setCallError('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.');
                break;
              case err.message.includes('call not found'):
                setCallError('Livestream này không tồn tại hoặc đã kết thúc.');
                break;
              case err.message.includes('maximum retries'):
                setCallError('Không thể kết nối sau nhiều lần thử. Vui lòng thử lại sau.');
                break;
              default:
                setCallError(`Không thể tham gia livestream: ${err.message}`);
                break;
            }
          }
          // Đảm bảo cleanup
          if (currentCall) {
            currentCall.leave().catch(e =>
              console.error('Error leaving call after failure:', e)
            );
            currentCall = null;
          }
        }
      } finally {
        if (isMounted) {
          setIsLoadingCall(false);
        }
      }
    };

    setupCall();

    return () => {
      isMounted = false;
      // Cleanup: Leave the call when the component unmounts or callId/callType changes
      if (call) { // Use the state variable 'call' for cleanup
        console.log("LivestreamContent unmounting or deps changed, leaving call...");
        call.leave().catch(e => console.error("Error leaving call on unmount:", e));
      } else {
          console.log("LivestreamContent unmounting or deps changed, no call object to leave.");
      }
      setCall(null); // Clear call state on unmount
      console.log("LivestreamContent unmounted/deps changed.");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, callId, callType]); // Re-run if client, callId, or callType changes

  // --- Render Logic ---

  // 1. Initial Loading or Call Setup Error
  if (isLoadingCall) {
    return (
      <View style={styles.centeredContent}>
        <ActivityIndicator size="large" color="#FFF" />
        <Text style={[styles.infoText, { color: '#FFF' }]}>Đang tải cuộc gọi...</Text>
      </View>
    );
  }

  if (callError) {
    return (
      <View style={styles.centeredContent}>
        <Ionicons name="alert-circle-outline" size={48} color="red" />
        <Text style={[styles.errorText, { color: '#FFF' }]}>{callError}</Text>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleLeaveCall(null)}>
           <Text style={styles.actionButtonText}>Quay lại</Text>
         </TouchableOpacity>
      </View>
    );
  }

  // 2. Check API Status (Highest Priority After Setup)
  if (apiStatus === 'ended') {
    return (
      <View style={styles.centeredContent}>
        <Ionicons name="stop-circle-outline" size={48} color="#ccc" />
        <Text style={[styles.infoText, { color: '#FFF' }]}>Livestream đã kết thúc.</Text>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleLeaveCall(call)}>
          <Text style={styles.actionButtonText}>Rời khỏi</Text>
        </TouchableOpacity>
      </View>
    );
  }

   if (apiStatus === 'paused') { // Assuming 'paused' is a possible status
     return (
       <View style={styles.centeredContent}>
         <Ionicons name="pause-circle-outline" size={48} color="#ccc" />
         <Text style={[styles.infoText, { color: '#FFF' }]}>Livestream đang tạm dừng.</Text>
         {/* Maybe add a refresh button or rely on interval */}
       </View>
     );
   }

  // 3. Check Call Object and SDK States (Only if API status is likely 'active' or unknown)
  if (!call) {
    // Should not happen often if isLoadingCall and callError are handled, but good failsafe
    return (
      <View style={styles.centeredContent}>
        <Ionicons name="videocam-off-outline" size={48} color="#ccc" />
        <Text style={[styles.errorText, { color: '#FFF' }]}>Không thể tải cuộc gọi.</Text>
         <TouchableOpacity style={styles.actionButton} onPress={() => handleLeaveCall(null)}>
           <Text style={styles.actionButtonText}>Quay lại</Text>
         </TouchableOpacity>
      </View>
    );
  }

  // QUAN TRỌNG: Các hooks để lấy trạng thái đã được chuyển vào CallStateHandler
  // và chỉ sử dụng trong ngữ cảnh <StreamCall>

  // Render StreamCall với call object đã được join thành công
  console.log("LivestreamContent: Rendering StreamCall with CallContent.");
  return (
    <StreamCall call={call}>
      <CallStateHandler onLeave={handleLeaveCall} />
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

  // --- Effect for Client Setup and Token Fetching ---
  // Ref để lưu trữ client, tránh tạo lại không cần thiết
  // const clientRef = useRef<StreamVideoClient | null>(null); // Tạm thời loại bỏ ref không sử dụng

  useEffect(() => {
    let isMounted = true;
    let videoClient: StreamVideoClient | null = null;

    // Định nghĩa interface cho payload của JWT token ở đây để có thể truy cập trong toàn bộ hàm
    interface LivestreamTokenPayload {
      user_id: string;       // ID của người dùng
      role: string;         // Vai trò của người dùng
      call_cids: string[]; // Danh sách các call ID được phép truy cập
      nbf: number;        // Not before timestamp
      exp: number;       // Expiration timestamp
      iat: number;      // Issued at timestamp
    }

    async function setupClientAndToken() {
      if (!livestreamId || !callId || !apiKey) {
        if (isMounted) {
          setError('Thiếu thông tin cần thiết để xem livestream (ID, CallID, hoặc API Key).');
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
          console.log("[LivestreamViewer] Raw viewer token received:", fetchedToken);
          console.log("Token fetched successfully.");
        } else {
          throw new Error('Không nhận được token từ API.');
        }
      } catch (err: any) {
        console.error('Error fetching viewer token:', err);
        if (isMounted) setError(`Lỗi lấy token: ${err.message || 'Unknown error'}`);
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
        console.log("[LivestreamViewer] Decoded viewer token payload:", tokenPayload);

        // Xác thực token
        if (!tokenPayload.user_id || !tokenPayload.call_cids || tokenPayload.call_cids.length === 0) {
          throw new Error('Token không hợp lệ: Thiếu user_id hoặc call_cids');
        }

        // Kiểm tra xem callId có nằm trong danh sách call_cids được cấp phép không
        const expectedCallId = `livestream:${callId}`;
        if (!tokenPayload.call_cids.includes(expectedCallId)) {
          console.error('Call CIDs in token:', tokenPayload.call_cids);
          console.error('Expected Call ID:', expectedCallId);
          throw new Error('Token không có quyền truy cập vào livestream này');
        }

        // Chuẩn bị đối tượng người dùng để kết nối
        const userToConnect: User = {
          id: tokenPayload.user_id,
          name: `Viewer-${tokenPayload.user_id.slice(0, 8)}`,
          type: 'authenticated'
        };

        // --- TRỰC TIẾP TRUYỀN TOKEN ---
        console.log(`[LivestreamViewer] Initializing client with direct token approach`);
        
        // Khởi tạo client với token trực tiếp
        videoClient = new StreamVideoClient({
          apiKey,
          token: fetchedToken, // Sử dụng token trực tiếp, không qua tokenProvider
          user: userToConnect, // Truyền user object cùng lúc
          options: {
            timeout: 15000 // Tăng timeout lên để tránh issues với mạng chậm
          }
        });

        // Khi khởi tạo client với cả user và token, connectUser() sẽ được gọi tự động
        console.log(`[LivestreamViewer] Client initialized with direct token authentication`);

        if (isMounted) setClient(videoClient);
      } catch (err: any) {
        console.error('Error connecting Stream client:', err);
        if (isMounted) setError(`Lỗi kết nối Stream: ${err.message || 'Unknown error'}`);
      } finally {
        if (isMounted) setIsLoadingClient(false);
      }
    }

    setupClientAndToken();

    // --- Cleanup Function ---
    return () => {
      isMounted = false;
      console.log('Livestream viewer screen unmounting. Disconnecting client...');
      
      // Đảm bảo ngắt kết nối client khi unmount
      if (videoClient) {
        videoClient.disconnectUser()
          .then(() => console.log('Stream client disconnected successfully on unmount.'))
          .catch(e => console.error('Error disconnecting Stream client on unmount:', e));
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
          {isLoadingToken ? 'Đang lấy quyền truy cập...' : 'Đang kết nối tới livestream...'}
        </Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={64} color="red" />
        <Text style={styles.errorText}>Lỗi: {error}</Text>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleLeaveCall(null)}>
          <Text style={styles.actionButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!client || !callId || !livestreamId) { // Also check for livestreamId
     console.warn("Rendering null state. Client Ready:", !!client, "CallID Present:", !!callId, "LivestreamID Present:", !!livestreamId);
    return (
      <SafeAreaView style={styles.centered}>
         <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
        <Text style={styles.errorText}>Không thể chuẩn bị xem livestream. Thiếu thông tin cần thiết.</Text>
         <TouchableOpacity style={styles.actionButton} onPress={() => handleLeaveCall(null)}>
           <Text style={styles.actionButtonText}>Quay lại</Text>
         </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // --- Render Livestream via Wrapper ---
  console.log("Rendering StreamVideo provider and LivestreamContent");
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => handleLeaveCall(callRef.current)} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{showName || 'Livestream'}</Text>
        <View style={{ width: 24 }} /> {/* Spacer */}
      </View>
      <StreamVideo client={client}>
         {/* Pass livestreamId down */}
         <LivestreamContent
            callId={callId}
            callType="livestream"
            livestreamId={livestreamId}
            // Pass the call object up via ref if needed by parent, though maybe not necessary now
            // ref={(c) => callRef.current = c} // This won't work directly on functional components
         />
      </StreamVideo>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: { // For initial loading/error covering the whole screen
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f6fa',
  },
   centeredContent: { // For status messages within the black container
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: 'transparent', // Keep it transparent
  },
  loadingText: { // For initial loading
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  infoText: { // For status messages inside the stream view
      marginTop: 10,
      fontSize: 16,
      color: '#FFF', // White text on black background
      textAlign: 'center',
  },
  errorText: { // For both initial error and status error
    marginTop: 10,
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
  },
   actionButton: { // General purpose button for errors/ended states
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
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 10,
  },
});

export default LivestreamViewerScreen;