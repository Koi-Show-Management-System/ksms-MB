// app/(tabs)/shows/LivestreamViewer.tsx // Path updated
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  StreamVideo,
  StreamVideoClient,
  User,
  StreamCall,
  CallContent,
  Call, // Import Call type
  useStreamVideoClient, // Import the hook to get client from context
} from '@stream-io/video-react-native-sdk';
import { SafeAreaView } from 'react-native-safe-area-context';
// Adjust import path for the new location
import { getLivestreamViewerToken } from '../../../services/livestreamService'; // Path updated
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; // To potentially get user ID
import { jwtDecode } from 'jwt-decode'; // Import jwt-decode

// --- Inner Component to handle Call logic ---
interface LivestreamContentProps {
  callId: string;
  callType: string;
}

const LivestreamContent: React.FC<LivestreamContentProps> = ({ callId, callType }) => {
  const client = useStreamVideoClient(); // Get client from StreamVideo context
  const [call, setCall] = useState<Call | null>(null);
  const [isLoadingCall, setIsLoadingCall] = useState(true);
  const [callError, setCallError] = useState<string | null>(null);

  useEffect(() => {
    if (!client || !callId || !callType) {
        console.warn("LivestreamContent: Client, callId, or callType not available yet.");
        // Don't set loading to false here, wait for client/props
        return;
    };

    let isMounted = true;

    const setupCall = async () => {
      if (!client) return; // Guard against client being null

      setIsLoadingCall(true);
      setCallError(null);
      setCall(null); // Reset call state
      console.log(`LivestreamContent: Attempting to get call: ${callType}/${callId}`);

      try {
        // Use client.call() to get the call object instance
        const callInstance = client.call(callType, callId);
        console.log("LivestreamContent: Call instance obtained via client.call()");

        // Attempt to join the call explicitly
        console.log("LivestreamContent: Attempting to join call...");
        await callInstance.join({ create: false });
        console.log("LivestreamContent: Successfully joined call.");

         if (isMounted) {
             setCall(callInstance);
         }
      } catch (err: any) {
        console.error("LivestreamContent: Error getting or joining call instance:", err);
        if (isMounted) setCallError(`Lỗi lấy hoặc tham gia cuộc gọi: ${err.message || 'Unknown error'}`);
      } finally {
         if (isMounted) setIsLoadingCall(false);
      }
    };

    setupCall(); // Call the async function

    return () => {
        isMounted = false;
        // Cleanup related to the call instance if needed, e.g., call?.off(...)
        console.log("LivestreamContent unmounting");
    }

  }, [client, callId, callType]); // Depend on client and props

  if (isLoadingCall) {
    return (
      <View style={styles.centeredContent}>
        <ActivityIndicator size="large" color="#FFF" />
        <Text style={[styles.loadingText, { color: '#FFF' }]}>Đang tải cuộc gọi...</Text>
      </View>
    );
  }

  if (callError) {
    return (
      <View style={styles.centeredContent}>
        <Ionicons name="alert-circle-outline" size={48} color="red" />
        <Text style={[styles.errorText, { color: '#FFF' }]}>Lỗi: {callError}</Text>
        {/* Maybe add a retry button? */}
      </View>
    );
  }

  if (!call) {
    // This might happen briefly or if client.call fails silently
    return (
       <View style={styles.centeredContent}>
         <Ionicons name="videocam-off-outline" size={48} color="#ccc" />
         <Text style={[styles.errorText, { color: '#FFF' }]}>Không thể tải cuộc gọi.</Text>
       </View>
    );
  }

  // Now we have the call object, render StreamCall
  console.log("LivestreamContent: Rendering StreamCall with call object.");
  return (
    <StreamCall call={call}>
      <CallContent
        onHangupCallHandler={() => {
          console.log('Livestream ended or left by user.');
          if (router.canGoBack()) {
              router.back();
          } else {
              // Handle case where there's no screen to go back to
              console.log("Cannot go back from livestream.");
          }
        }}
        // Consider adding error handling specific to CallContent if available
        // onError={(error) => { console.error("CallContent Error:", error); setError("Lỗi trong quá trình xem stream."); }}
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
  const [isLoadingClient, setIsLoadingClient] = useState<boolean>(false); // Only for client connection phase
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let videoClient: StreamVideoClient | null = null;
    let isMounted = true;

    async function setupClientAndToken() {
      // Validate essential parameters first
      if (!livestreamId || !callId || !apiKey) {
        if (isMounted) {
            setError('Thiếu thông tin cần thiết để xem livestream (ID, CallID, hoặc API Key).');
            setIsLoadingToken(false); // Ensure loading stops
        }
        return;
      }

      // --- 1. Fetch Viewer Token ---
      setIsLoadingToken(true);
      setError(null); // Reset error
      let fetchedToken: string | null = null;
      try {
        console.log(`Fetching token for livestream: ${livestreamId}`);
        const response = await getLivestreamViewerToken(livestreamId);
        if (response.data?.token) {
          fetchedToken = response.data.token;
          if (isMounted) setToken(fetchedToken);
          console.log("Token fetched successfully.");
        } else {
          throw new Error('Không nhận được token từ API.');
        }
      } catch (err: any) {
        console.error('Error fetching viewer token:', err);
        if (isMounted) setError(`Lỗi lấy token: ${err.message || 'Unknown error'}`);
        setIsLoadingToken(false);
        return; // Stop if token fetching fails
      } finally {
         // Only set loading false if token fetch succeeded or failed definitively
         if (isMounted) setIsLoadingToken(false);
      }

      if (!fetchedToken || !isMounted) return; // Exit if no token or unmounted

      // --- 2. Initialize and Connect Stream Client ---
      setIsLoadingClient(true);
      try {
        // Decode token to get user ID
        let userId = `viewer-${Date.now()}-${Math.random().toString(16).substring(2, 8)}`; // Default guest ID
        try {
          // Define expected payload structure (adjust based on your actual token)
          interface JwtPayload {
            user_id?: string;
            sub?: string;
            // Add other fields if necessary
            [key: string]: any; // Allow other properties
          }
          const decoded = jwtDecode<JwtPayload>(fetchedToken);
          console.log("Decoded Token Payload:", decoded);
          if (decoded.user_id) {
            userId = decoded.user_id;
          } else if (decoded.sub) {
            userId = decoded.sub; // Fallback to 'sub' if user_id is not present
          }
          console.log("Extracted User ID from token:", userId);
        } catch (decodeError) {
          console.error("Failed to decode token or extract user ID, using guest ID:", decodeError);
          // Use the default guest ID if decoding fails
        }

        const user: User = { id: userId, name: 'Viewer', type: 'guest' }; // Use extracted or guest ID
        console.log(`Initializing Stream client for user: ${userId} with key: ${apiKey}`);
        videoClient = new StreamVideoClient({ apiKey, user, token: fetchedToken });
        // Don't set client state here yet, wait for connection

        console.log(`Connecting Stream client for user: ${userId}...`);
        await videoClient.connectUser(user, fetchedToken);
        console.log('Stream client connected successfully.');
        if (isMounted) setClient(videoClient); // Set client state *after* successful connection

      } catch (err: any) {
        console.error('Error connecting Stream client:', err);
        if (isMounted) setError(`Lỗi kết nối Stream: ${err.message || 'Unknown error'}`);
        // No need to disconnect videoClient here as it wasn't set to state
      } finally {
        if (isMounted) setIsLoadingClient(false);
      }
    }

    setupClientAndToken();

    // --- Cleanup Function ---
    return () => {
      isMounted = false;
      console.log('Livestream viewer screen unmounting. Disconnecting client...');
      // Use the client state variable for cleanup
      client?.disconnectUser() // Use optional chaining as client might be null
        .then(() => console.log('Stream client disconnected successfully on unmount.'))
        .catch(e => console.error('Error disconnecting Stream client on unmount:', e));
      setClient(null); // Clear client state
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livestreamId, apiKey]); // Rerun only if these change, callId is passed down

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
        <TouchableOpacity style={styles.backButtonError} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Ensure client is connected and required IDs are present before rendering StreamVideo
  if (!client || !callId) {
     console.warn("Rendering null state. Client Ready:", !!client, "CallID Present:", !!callId);
    return (
      <SafeAreaView style={styles.centered}>
         <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
        <Text style={styles.errorText}>Không thể chuẩn bị xem livestream. Thiếu client hoặc Call ID.</Text>
         <TouchableOpacity style={styles.backButtonError} onPress={() => router.back()}>
           <Text style={styles.backButtonText}>Quay lại</Text>
         </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // --- Render Livestream via Wrapper ---
  console.log("Rendering StreamVideo provider and LivestreamContent");
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{showName || 'Livestream'}</Text>
        <View style={{ width: 24 }} /> {/* Spacer */}
      </View>
      <StreamVideo client={client}>
         {/* Pass callId and callType to the inner component */}
         <LivestreamContent callId={callId} callType="livestream" />
      </StreamVideo>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Black background for video focus
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f6fa',
  },
   centeredContent: { // Style for loading/error within the main container
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: 'transparent', // Make background transparent
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555', // Keep dark color for light background loading
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: 'red', // Keep red for light background error
    textAlign: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#FFF', // White header background
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5, // Add padding for easier touch
  },
   backButtonError: {
     backgroundColor: "#000000",
     paddingVertical: 12,
     paddingHorizontal: 24,
     borderRadius: 8,
   },
   backButtonText: {
     color: "#ffffff",
     fontSize: 16,
     fontWeight: "600",
   },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    flex: 1, // Allow title to take available space
    marginHorizontal: 10, // Add horizontal margin
  },
});

export default LivestreamViewerScreen;

// Force refresh