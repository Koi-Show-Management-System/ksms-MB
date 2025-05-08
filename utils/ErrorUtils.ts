import { logger } from './logger';

interface ErrorUtilsType {
  getGlobalHandler: () => (error: Error, isFatal?: boolean) => void;
  setGlobalHandler: (callback: (error: Error, isFatal?: boolean) => void) => void;
}

declare global {
  interface GlobalThis {
    ErrorUtils?: ErrorUtilsType;
  }
}

/**
 * Thiết lập xử lý lỗi toàn cục cho ứng dụng
 * Bao gồm bắt các unhandled promise rejection và các lỗi JS
 */
export function setupGlobalErrorHandlers() {
  if (__DEV__) {
    console.log('Configuring global error handlers');
  }

  // Bắt các unhandled Promise rejection
  const handlePromiseRejection = (event: any) => {
    const error = event?.reason || 'Unknown Promise Rejection';
    logger.error('Unhandled Promise Rejection:', error);

    // Log additional details if available
    if (error && typeof error === 'object') {
      if (error.stack) logger.error('Error Stack:', error.stack);
      if (error.message) logger.error('Error Message:', error.message);
      if (error.name) logger.error('Error Name:', error.name);
    }
  };

  // Đăng ký global error handler cho React Native
  // Use type assertion to handle React Native's global ErrorUtils
  const globalWithErrorUtils = global as unknown as { ErrorUtils?: ErrorUtilsType };

  if (typeof globalWithErrorUtils.ErrorUtils !== 'undefined') {
    try {
      const originalGlobalHandler = globalWithErrorUtils.ErrorUtils.getGlobalHandler();

      globalWithErrorUtils.ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
        logger.error(`Global JavaScript Error ${isFatal ? '(FATAL)' : ''}:`, error);

        // Log detailed error information in both DEV and PROD
        const errorDetails = {
          message: error.message || 'No message',
          stack: error.stack || 'No stack trace',
          name: error.name || 'Unknown Error',
          isFatal: !!isFatal
        };

        // In development, show in console
        if (__DEV__) {
          console.error('Error details:', errorDetails);
        } else {
          // In production, log through logger
          logger.error('Error details:', JSON.stringify(errorDetails));
        }

        // For fatal errors, we might want to show a user-friendly message
        // or navigate to an error screen, but for now we'll just log it
        if (isFatal) {
          logger.error('FATAL ERROR: App may be in an unstable state');

          // You could add code here to navigate to an error screen
          // or show a user-friendly message
        }

        // Call the original handler
        originalGlobalHandler(error, isFatal);
      });
    } catch (handlerError) {
      logger.error('Failed to set global error handler:', handlerError);
    }
  }

  // Đặt event listeners cho unhandledrejection nếu có hỗ trợ
  if (typeof global.addEventListener === 'function') {
    try {
      // Loại bỏ handlers cũ nếu có
      if (typeof global.removeEventListener === 'function') {
        global.removeEventListener('unhandledrejection', handlePromiseRejection);
      }

      // Thêm handler mới
      global.addEventListener('unhandledrejection', handlePromiseRejection);
    } catch (listenerError) {
      logger.error('Failed to set unhandledrejection listener:', listenerError);
    }
  }

  // Ghi đè console.error để log các lỗi nghiêm trọng trong production
  if (!__DEV__) {
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      // Log lỗi bằng logger để có thể gửi lên hệ thống theo dõi lỗi trong tương lai
      logger.error('Console Error:', ...args);

      // Vẫn giữ hành vi gốc
      originalConsoleError(...args);
    };
  }

  logger.info('Global error handlers configured');
}

/**
 * Hàm tiện ích để bắt và xử lý các lỗi Promise
 * @param promise Promise cần xử lý
 * @returns Tuple [error, result]
 */
export async function safeAwait<T>(promise: Promise<T>): Promise<[Error | null, T | null]> {
  try {
    const result = await promise;
    return [null, result];
  } catch (error) {
    return [error instanceof Error ? error : new Error(String(error)), null];
  }
}

/**
 * Wrap một hàm async trong một try-catch để tránh unhandled promise rejection
 * @param fn Hàm async cần wrap
 * @returns Hàm đã được wrap
 */
export function safeFunctionWrapper<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  errorHandler?: (error: Error, ...args: T) => void
): (...args: T) => Promise<R | undefined> {
  return async (...args: T) => {
    try {
      return await fn(...args);
    } catch (error) {
      const typedError = error instanceof Error ? error : new Error(String(error));
      logger.error(`Error in wrapped function (${fn.name || 'anonymous'}):`, typedError);

      if (errorHandler) {
        errorHandler(typedError, ...args);
      }

      return undefined;
    }
  };
}