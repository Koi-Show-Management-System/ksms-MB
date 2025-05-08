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
  };

  // Đăng ký global error handler cho React Native
  if (typeof global.ErrorUtils !== 'undefined') {
    try {
      const originalGlobalHandler = global.ErrorUtils.getGlobalHandler();
      
      global.ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
        logger.error(`Global JavaScript Error ${isFatal ? '(FATAL)' : ''}:`, error);

        // Ghi log chi tiết hơn trong chế độ development
        if (__DEV__) {
          console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
          });
        }
        
        // Gọi global handler gốc
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