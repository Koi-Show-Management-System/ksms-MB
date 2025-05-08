import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { signalRService } from '../services/signalRService';
import { Ionicons } from '@expo/vector-icons';
import { QueryClient } from '@tanstack/react-query';

// Add type declaration for React Query global cache
declare global {
  interface Window {
    __REACT_QUERY_GLOBAL_CACHE__?: QueryClient;
  }
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Cập nhật state để hiển thị UI thay thế
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log detailed error information
    console.error('ErrorBoundary caught an error:', error);
    console.error('Component stack:', errorInfo.componentStack);

    // Log additional details if available
    if (error.stack) console.error('Error stack:', error.stack);
    if (error.message) console.error('Error message:', error.message);
    if (error.name) console.error('Error name:', error.name);

    // Update state with error info
    this.setState({ errorInfo });

    // Ensure SignalR connection is stopped to prevent background errors
    try {
      signalRService.stopConnection().catch(e =>
        console.error('Failed to stop SignalR connection in error boundary:', e)
      );
    } catch (e) {
      console.error('Error stopping SignalR in error boundary:', e);
    }
  }

  resetApp = async (): Promise<void> => {
    try {
      // Show loading indicator or message to user
      Alert.alert(
        'Đang khôi phục ứng dụng',
        'Vui lòng đợi trong giây lát...'
      );

      // Ensure SignalR is disconnected
      try {
        await signalRService.stopConnection();
      } catch (signalRError) {
        console.error('Error stopping SignalR during reset:', signalRError);
        // Continue with reset even if SignalR disconnect fails
      }

      // Clear any cached data that might be causing issues
      try {
        // Clear React Query cache if available
        if (typeof window !== 'undefined' && window.__REACT_QUERY_GLOBAL_CACHE__) {
          window.__REACT_QUERY_GLOBAL_CACHE__.clear();
        }
      } catch (cacheError) {
        console.error('Error clearing cache during reset:', cacheError);
      }

      // Reset state first to unmount components that might be causing issues
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null
      });

      // Short delay to allow state update to process
      await new Promise(resolve => setTimeout(resolve, 100));

      // Navigate to home screen
      router.replace('/');
    } catch (resetError) {
      console.error('Error resetting app:', resetError);
      Alert.alert(
        'Lỗi Nghiêm Trọng',
        'Không thể khôi phục ứng dụng. Vui lòng đóng và mở lại ứng dụng.'
      );
    }
  };

  logOut = async (): Promise<void> => {
    try {
      // Đảm bảo SignalR ngắt kết nối
      await signalRService.stopConnection();

      // Xóa các thông tin đăng nhập
      await AsyncStorage.multiRemove([
        'userToken',
        'userId',
        'userEmail',
        'userRole',
        'userFullName',
      ]);

      // Chuyển đến màn hình đăng nhập
      router.replace('/(auth)/signIn');

      // Reset state
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null
      });
    } catch (logoutError) {
      console.error('Error logging out:', logoutError);
      Alert.alert(
        'Lỗi Đăng Xuất',
        'Không thể đăng xuất. Vui lòng đóng và mở lại ứng dụng.'
      );
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Extract a user-friendly error message
      let errorMessage = 'Đã xảy ra lỗi không xác định';
      if (this.state.error) {
        // Try to get a more specific error message
        if (this.state.error.message) {
          errorMessage = this.state.error.message;
        } else {
          errorMessage = this.state.error.toString();
        }

        // Limit error message length for display
        if (errorMessage.length > 150) {
          errorMessage = errorMessage.substring(0, 150) + '...';
        }
      }

      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Ionicons name="alert-circle-outline" size={80} color="#E74C3C" />
            <Text style={styles.title}>Đã xảy ra lỗi!</Text>
            <Text style={styles.message}>
              Rất tiếc, ứng dụng đã gặp lỗi không mong muốn. Vui lòng thử lại.
            </Text>

            <View style={styles.errorBox}>
              <Text style={styles.errorMessage}>{errorMessage}</Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.button}
                onPress={this.resetApp}
                activeOpacity={0.7}>
                <Ionicons name="refresh-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Tải lại ứng dụng</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={this.logOut}
                activeOpacity={0.7}>
                <Ionicons name="log-out-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Đăng xuất</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#E74C3C',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  errorBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 15,
    width: '100%',
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  errorMessage: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    paddingHorizontal: 5,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 10,
    gap: 10,
  },
  button: {
    backgroundColor: '#3498DB',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: '#95A5A6',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
});

export default ErrorBoundary;