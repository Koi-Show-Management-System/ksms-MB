/**
 * Utility logger để sử dụng thay cho console.log trực tiếp
 * Logger này sẽ tự động bỏ qua các log trong môi trường production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  tag?: string;
  showTimestamp?: boolean;
}

class Logger {
  private defaultOptions: Required<LoggerOptions> = {
    tag: 'App',
    showTimestamp: true,
  };

  constructor(private options?: LoggerOptions) {
    this.options = { ...this.defaultOptions, ...options };
  }

  /**
   * Log thông tin debug - chỉ hiển thị trong môi trường development
   */
  debug(message: any, ...optionalParams: any[]): void {
    this.logWithLevel('debug', message, ...optionalParams);
  }

  /**
   * Log thông tin thông thường - chỉ hiển thị trong môi trường development
   */
  info(message: any, ...optionalParams: any[]): void {
    this.logWithLevel('info', message, ...optionalParams);
  }

  /**
   * Log cảnh báo - chỉ hiển thị trong môi trường development
   */
  warn(message: any, ...optionalParams: any[]): void {
    this.logWithLevel('warn', message, ...optionalParams);
  }

  /**
   * Log lỗi - chỉ hiển thị trong môi trường development
   * Trong production có thể được gửi đến dịch vụ theo dõi lỗi
   */
  error(message: any, ...optionalParams: any[]): void {
    this.logWithLevel('error', message, ...optionalParams);
  }

  private logWithLevel(level: LogLevel, message: any, ...optionalParams: any[]): void {
    // Bỏ qua tất cả log trong môi trường production
    if (!__DEV__) {
      // Đối với lỗi nghiêm trọng, có thể gửi đến dịch vụ theo dõi lỗi
      // if (level === 'error') {
      //   // Gửi đến dịch vụ theo dõi lỗi
      // }
      return;
    }

    const { tag, showTimestamp } = { ...this.defaultOptions, ...this.options };
    const timestamp = showTimestamp ? `[${new Date().toISOString()}]` : '';
    const prefix = `${timestamp}[${tag}][${level.toUpperCase()}]`;

    switch (level) {
      case 'debug':
        console.log(prefix, message, ...optionalParams);
        break;
      case 'info':
        console.info(prefix, message, ...optionalParams);
        break;
      case 'warn':
        console.warn(prefix, message, ...optionalParams);
        break;
      case 'error':
        console.error(prefix, message, ...optionalParams);
        break;
    }
  }
}

// Tạo logger mặc định
export const logger = new Logger();

// Export constructor để tạo logger tùy chỉnh
export const createLogger = (options: LoggerOptions): Logger => {
  return new Logger(options);
}; 