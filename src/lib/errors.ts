/**
 * 统一错误处理机制
 * 
 * 提供一致的错误处理、错误日志记录和用户友好的错误提示。
 * 
 * 错误级别：
 * - ERROR: 严重错误，需要立即关注
 * - WARNING: 警告，可能影响功能
 * - INFO: 信息提示
 * - SUCCESS: 成功提示
 */

/**
 * 错误级别枚举
 */
export enum ErrorLevel {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  SUCCESS = 'success',
}

/**
 * 应用错误类型
 */
export enum ErrorType {
  /** 网络错误 */
  NETWORK_ERROR = 'NETWORK_ERROR',
  /** 认证错误 */
  AUTH_ERROR = 'AUTH_ERROR',
  /** 权限错误 */
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  /** 数据验证错误 */
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  /** 数据库错误 */
  DATABASE_ERROR = 'DATABASE_ERROR',
  /** 未找到资源 */
  NOT_FOUND = 'NOT_FOUND',
  /** 业务逻辑错误 */
  BUSINESS_ERROR = 'BUSINESS_ERROR',
  /** 未知错误 */
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * 应用错误类
 */
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly level: ErrorLevel;
  public readonly code: string;
  public readonly details?: Record<string, any>;
  public readonly timestamp: string;
  public readonly userMessage: string;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN_ERROR,
    level: ErrorLevel = ErrorLevel.ERROR,
    code?: string,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.level = level;
    this.code = code || type;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.userMessage = this.getUserFriendlyMessage();

    // 维护原型链
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * 获取用户友好的错误提示
   */
  private getUserFriendlyMessage(): string {
    const messages: Record<ErrorType, string> = {
      [ErrorType.NETWORK_ERROR]: '网络连接失败，请检查您的网络设置后重试。',
      [ErrorType.AUTH_ERROR]: '您的登录已过期，请重新登录。',
      [ErrorType.PERMISSION_ERROR]: '您没有权限执行此操作。',
      [ErrorType.VALIDATION_ERROR]: '输入的数据格式不正确，请检查后重新提交。',
      [ErrorType.DATABASE_ERROR]: '数据保存失败，请稍后重试。',
      [ErrorType.NOT_FOUND]: '请求的资源不存在。',
      [ErrorType.BUSINESS_ERROR]: this.message,
      [ErrorType.UNKNOWN_ERROR]: '操作失败，请稍后重试。如果问题持续，请联系管理员。',
    };

    return messages[this.type] || messages[ErrorType.UNKNOWN_ERROR];
  }

  /**
   * 转换为JSON对象
   */
  toJSON() {
    return {
      name: this.name,
      type: this.type,
      level: this.level,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

/**
 * 错误处理器配置
 */
interface ErrorHandlerConfig {
  /** 是否记录到控制台 */
  logToConsole?: boolean;
  /** 是否发送到监控系统（如Sentry） */
  sendToMonitoring?: boolean;
  /** 是否显示Toast通知 */
  showToast?: boolean;
  /** 自定义错误处理回调 */
  onError?: (error: AppError) => void;
}

/**
 * 全局错误处理器
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private config: ErrorHandlerConfig;

  private constructor(config: ErrorHandlerConfig = {}) {
    this.config = {
      logToConsole: true,
      sendToMonitoring: false,
      showToast: true,
      ...config,
    };
  }

  /**
   * 获取单例实例
   */
  static getInstance(config?: ErrorHandlerConfig): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler(config);
    }
    return ErrorHandler.instance;
  }

  /**
   * 处理错误
   */
  handle(error: Error | AppError, context?: string): void {
    const appError = error instanceof AppError
      ? error
      : new AppError(error.message, ErrorType.UNKNOWN_ERROR);

    // 记录到控制台
    if (this.config.logToConsole) {
      this.logToConsole(appError, context);
    }

    // 发送到监控系统
    if (this.config.sendToMonitoring) {
      this.sendToMonitoring(appError, context);
    }

    // 显示Toast通知
    if (this.config.showToast) {
      this.showToast(appError);
    }

    // 执行自定义回调
    if (this.config.onError) {
      this.config.onError(appError);
    }
  }

  /**
   * 记录到控制台
   */
  private logToConsole(error: AppError, context?: string): void {
    const logMethod = error.level === ErrorLevel.ERROR ? console.error : console.warn;
    
    logMethod(
      `[${error.level.toUpperCase()}] ${context ? `[${context}]` : ''} ${error.type}:`,
      {
        message: error.message,
        userMessage: error.userMessage,
        code: error.code,
        details: error.details,
        timestamp: error.timestamp,
        stack: error.stack,
      }
    );
  }

  /**
   * 发送到监控系统（Sentry等）
   */
  private sendToMonitoring(error: AppError, context?: string): void {
    // TODO: 集成 Sentry 或其他监控系统
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, {
    //     contexts: {
    //       app: { context },
    //     },
    //     tags: {
    //       errorType: error.type,
    //       errorLevel: error.level,
    //     },
    //   });
    // }
  }

  /**
   * 显示Toast通知
   */
  private showToast(error: AppError): void {
    // 发送自定义事件，由Toast组件监听
    window.dispatchEvent(
      new CustomEvent('app:error', {
        detail: {
          message: error.userMessage,
          level: error.level,
          code: error.code,
        },
      })
    );
  }
}

/**
 * 便捷的错误处理函数
 */
export function handleError(error: Error | AppError, context?: string): void {
  ErrorHandler.getInstance().handle(error, context);
}

/**
 * Supabase 错误转换
 */
export function handleSupabaseError(error: any): AppError {
  // Supabase 错误码映射
  const errorCodeMap: Record<string, ErrorType> = {
    '23505': ErrorType.VALIDATION_ERROR, // Unique violation
    '23503': ErrorType.VALIDATION_ERROR, // Foreign key violation
    '42501': ErrorType.PERMISSION_ERROR, // Insufficient privilege
    'PGRST116': ErrorType.NOT_FOUND, // Row not found
    'PGRST301': ErrorType.AUTH_ERROR, // JWT expired
  };

  const errorCode = error.code || error.message;
  const errorType = errorCodeMap[errorCode] || ErrorType.DATABASE_ERROR;

  return new AppError(
    error.message || '数据库操作失败',
    errorType,
    ErrorLevel.ERROR,
    errorCode,
    { originalError: error }
  );
}

/**
 * Fetch 错误转换
 */
export function handleFetchError(error: any, url: string): AppError {
  if (error.name === 'AbortError') {
    return new AppError(
      '请求已取消',
      ErrorType.NETWORK_ERROR,
      ErrorLevel.WARNING,
      'FETCH_ABORTED',
      { url }
    );
  }

  if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
    return new AppError(
      '网络请求失败',
      ErrorType.NETWORK_ERROR,
      ErrorLevel.ERROR,
      'FETCH_FAILED',
      { url }
    );
  }

  return new AppError(
    error.message || '请求失败',
    ErrorType.NETWORK_ERROR,
    ErrorLevel.ERROR,
    'UNKNOWN_FETCH_ERROR',
    { url, originalError: error }
  );
}

/**
 * 验证错误创建
 */
export function createValidationError(
  field: string,
  message: string,
  details?: Record<string, any>
): AppError {
  return new AppError(
    `字段 "${field}" 验证失败: ${message}`,
    ErrorType.VALIDATION_ERROR,
    ErrorLevel.WARNING,
    'VALIDATION_FAILED',
    { field, ...details }
  );
}

/**
 * 成功提示创建
 */
export function showSuccess(message: string): void {
  window.dispatchEvent(
    new CustomEvent('app:error', {
      detail: {
        message,
        level: ErrorLevel.SUCCESS,
        code: 'SUCCESS',
      },
    })
  );
}

/**
 * 信息提示创建
 */
export function showInfo(message: string): void {
  window.dispatchEvent(
    new CustomEvent('app:error', {
      detail: {
        message,
        level: ErrorLevel.INFO,
        code: 'INFO',
      },
    })
  );
}

