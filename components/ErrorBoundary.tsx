import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { signalRService } from '../services/signalRService';
import { Ionicons } from '@expo/vector-icons';

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
    // Bạn cũng có thể ghi log lỗi vào một dịch vụ báo cáo lỗi ở đây
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  resetApp = async (): Promise<void> => {
    try {
      // Đảm bảo SignalR ngắt kết nối
      await signalRService.stopConnection();
      
      // Chuyển đến màn hình chính
      router.replace('/');
      
      // Reset state
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null
      });
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
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Ionicons name="alert-circle-outline" size={80} color="#E74C3C" />
            <Text style={styles.title}>Đã xảy ra lỗi!</Text>
            <Text style={styles.message}>
              Rất tiếc, ứng dụng đã gặp lỗi không mong muốn.
            </Text>
            <Text style={styles.errorMessage}>
              {this.state.error?.toString()}
            </Text>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={this.resetApp}>
                <Text style={styles.buttonText}>Tải lại ứng dụng</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={this.logOut}>
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
  errorMessage: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
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
  },
  secondaryButton: {
    backgroundColor: '#95A5A6',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorBoundary; 