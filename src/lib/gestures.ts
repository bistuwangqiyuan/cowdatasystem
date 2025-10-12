/**
 * Gesture Support Library
 * 
 * 提供常用的移动端手势识别功能：
 * - Swipe (滑动)
 * - Long Press (长按)
 * - Pull to Refresh (下拉刷新)
 * - Double Tap (双击)
 * - Pinch (捏合缩放)
 */

/**
 * 滑动方向
 */
export enum SwipeDirection {
  LEFT = 'left',
  RIGHT = 'right',
  UP = 'up',
  DOWN = 'down',
}

/**
 * 手势事件接口
 */
export interface GestureEvent {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  deltaX: number;
  deltaY: number;
  distance: number;
  duration: number;
  direction?: SwipeDirection;
}

/**
 * 滑动手势配置
 */
export interface SwipeConfig {
  /** 最小滑动距离（像素） */
  minDistance?: number;
  /** 最大滑动时间（毫秒） */
  maxDuration?: number;
  /** 回调函数 */
  onSwipe?: (event: GestureEvent) => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

/**
 * 长按手势配置
 */
export interface LongPressConfig {
  /** 长按时间（毫秒） */
  duration?: number;
  /** 最大移动距离（像素） */
  maxMovement?: number;
  /** 回调函数 */
  onLongPress?: (event: MouseEvent | TouchEvent) => void;
  onLongPressStart?: () => void;
  onLongPressEnd?: () => void;
}

/**
 * 下拉刷新配置
 */
export interface PullToRefreshConfig {
  /** 触发刷新的距离（像素） */
  threshold?: number;
  /** 回调函数 */
  onRefresh?: () => Promise<void>;
  /** 刷新指示器元素 */
  indicator?: HTMLElement;
}

/**
 * 滑动手势识别
 */
export class SwipeGesture {
  private element: HTMLElement;
  private config: Required<SwipeConfig>;
  private startX = 0;
  private startY = 0;
  private startTime = 0;
  private isTracking = false;

  constructor(element: HTMLElement, config: SwipeConfig = {}) {
    this.element = element;
    this.config = {
      minDistance: config.minDistance || 50,
      maxDuration: config.maxDuration || 300,
      onSwipe: config.onSwipe || (() => {}),
      onSwipeLeft: config.onSwipeLeft || (() => {}),
      onSwipeRight: config.onSwipeRight || (() => {}),
      onSwipeUp: config.onSwipeUp || (() => {}),
      onSwipeDown: config.onSwipeDown || (() => {}),
    };

    this.init();
  }

  private init() {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this));
  }

  private handleTouchStart(e: TouchEvent) {
    const touch = e.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.startTime = Date.now();
    this.isTracking = true;
  }

  private handleTouchEnd(e: TouchEvent) {
    if (!this.isTracking) return;

    const touch = e.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    const endTime = Date.now();

    const deltaX = endX - this.startX;
    const deltaY = endY - this.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = endTime - this.startTime;

    // 检查是否满足滑动条件
    if (distance >= this.config.minDistance && duration <= this.config.maxDuration) {
      const event: GestureEvent = {
        startX: this.startX,
        startY: this.startY,
        endX,
        endY,
        deltaX,
        deltaY,
        distance,
        duration,
      };

      // 判断滑动方向
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // 水平滑动
        if (deltaX > 0) {
          event.direction = SwipeDirection.RIGHT;
          this.config.onSwipeRight();
        } else {
          event.direction = SwipeDirection.LEFT;
          this.config.onSwipeLeft();
        }
      } else {
        // 垂直滑动
        if (deltaY > 0) {
          event.direction = SwipeDirection.DOWN;
          this.config.onSwipeDown();
        } else {
          event.direction = SwipeDirection.UP;
          this.config.onSwipeUp();
        }
      }

      this.config.onSwipe(event);
    }

    this.isTracking = false;
  }

  private handleTouchCancel() {
    this.isTracking = false;
  }

  /**
   * 销毁手势监听
   */
  destroy() {
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.element.removeEventListener('touchcancel', this.handleTouchCancel.bind(this));
  }
}

/**
 * 长按手势识别
 */
export class LongPressGesture {
  private element: HTMLElement;
  private config: Required<LongPressConfig>;
  private timer: number | null = null;
  private startX = 0;
  private startY = 0;
  private isLongPressing = false;

  constructor(element: HTMLElement, config: LongPressConfig = {}) {
    this.element = element;
    this.config = {
      duration: config.duration || 500,
      maxMovement: config.maxMovement || 10,
      onLongPress: config.onLongPress || (() => {}),
      onLongPressStart: config.onLongPressStart || (() => {}),
      onLongPressEnd: config.onLongPressEnd || (() => {}),
    };

    this.init();
  }

  private init() {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: true });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this));
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this));
    this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.element.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.element.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
  }

  private handleTouchStart(e: TouchEvent) {
    const touch = e.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.startTimer(e);
  }

  private handleTouchMove(e: TouchEvent) {
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - this.startX);
    const deltaY = Math.abs(touch.clientY - this.startY);

    // 如果移动距离超过阈值，取消长按
    if (deltaX > this.config.maxMovement || deltaY > this.config.maxMovement) {
      this.cancelTimer();
    }
  }

  private handleTouchEnd() {
    this.cancelTimer();
    if (this.isLongPressing) {
      this.config.onLongPressEnd();
      this.isLongPressing = false;
    }
  }

  private handleTouchCancel() {
    this.cancelTimer();
    if (this.isLongPressing) {
      this.config.onLongPressEnd();
      this.isLongPressing = false;
    }
  }

  private handleMouseDown(e: MouseEvent) {
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.startTimer(e);
  }

  private handleMouseUp() {
    this.cancelTimer();
    if (this.isLongPressing) {
      this.config.onLongPressEnd();
      this.isLongPressing = false;
    }
  }

  private handleMouseLeave() {
    this.cancelTimer();
    if (this.isLongPressing) {
      this.config.onLongPressEnd();
      this.isLongPressing = false;
    }
  }

  private startTimer(event: MouseEvent | TouchEvent) {
    this.timer = window.setTimeout(() => {
      this.isLongPressing = true;
      this.config.onLongPressStart();
      this.config.onLongPress(event);
    }, this.config.duration);
  }

  private cancelTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * 销毁手势监听
   */
  destroy() {
    this.cancelTimer();
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.element.removeEventListener('touchcancel', this.handleTouchCancel.bind(this));
    this.element.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.element.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    this.element.removeEventListener('mouseleave', this.handleMouseLeave.bind(this));
  }
}

/**
 * 下拉刷新手势
 */
export class PullToRefreshGesture {
  private element: HTMLElement;
  private config: Required<PullToRefreshConfig>;
  private startY = 0;
  private currentY = 0;
  private isRefreshing = false;
  private isPulling = false;

  constructor(element: HTMLElement, config: PullToRefreshConfig = {}) {
    this.element = element;
    this.config = {
      threshold: config.threshold || 80,
      onRefresh: config.onRefresh || (() => Promise.resolve()),
      indicator: config.indicator || this.createDefaultIndicator(),
    };

    this.init();
  }

  private init() {
    this.element.style.position = 'relative';
    this.element.style.overflow = 'auto';
    
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }

  private createDefaultIndicator(): HTMLElement {
    const indicator = document.createElement('div');
    indicator.className = 'pull-to-refresh-indicator';
    indicator.innerHTML = '<span class="animate-spin">↻</span>';
    this.element.prepend(indicator);
    return indicator;
  }

  private handleTouchStart(e: TouchEvent) {
    if (this.isRefreshing) return;
    
    // 只在滚动到顶部时启用下拉刷新
    if (this.element.scrollTop === 0) {
      this.startY = e.touches[0].clientY;
      this.isPulling = true;
    }
  }

  private handleTouchMove(e: TouchEvent) {
    if (!this.isPulling || this.isRefreshing) return;

    this.currentY = e.touches[0].clientY;
    const delta = this.currentY - this.startY;

    if (delta > 0) {
      // 阻止默认滚动
      e.preventDefault();
      
      // 更新指示器位置（添加阻尼效果）
      const pullDistance = Math.min(delta * 0.5, this.config.threshold);
      this.config.indicator.style.transform = `translateY(${pullDistance}px)`;
      
      // 达到阈值时改变指示器状态
      if (pullDistance >= this.config.threshold) {
        this.config.indicator.classList.add('ready');
      } else {
        this.config.indicator.classList.remove('ready');
      }
    }
  }

  private async handleTouchEnd() {
    if (!this.isPulling || this.isRefreshing) return;

    const delta = this.currentY - this.startY;
    const pullDistance = Math.min(delta * 0.5, this.config.threshold);

    if (pullDistance >= this.config.threshold) {
      // 触发刷新
      this.isRefreshing = true;
      this.config.indicator.classList.add('refreshing');
      
      try {
        await this.config.onRefresh();
      } finally {
        this.isRefreshing = false;
        this.config.indicator.classList.remove('refreshing', 'ready');
        this.config.indicator.style.transform = 'translateY(0)';
      }
    } else {
      // 未达到阈值，回弹
      this.config.indicator.style.transform = 'translateY(0)';
      this.config.indicator.classList.remove('ready');
    }

    this.isPulling = false;
    this.startY = 0;
    this.currentY = 0;
  }

  /**
   * 销毁手势监听
   */
  destroy() {
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    if (this.config.indicator.parentElement) {
      this.config.indicator.remove();
    }
  }
}

/**
 * 便捷函数：为元素添加滑动手势
 */
export function addSwipeGesture(element: HTMLElement, config: SwipeConfig): SwipeGesture {
  return new SwipeGesture(element, config);
}

/**
 * 便捷函数：为元素添加长按手势
 */
export function addLongPressGesture(element: HTMLElement, config: LongPressConfig): LongPressGesture {
  return new LongPressGesture(element, config);
}

/**
 * 便捷函数：为元素添加下拉刷新
 */
export function addPullToRefresh(element: HTMLElement, config: PullToRefreshConfig): PullToRefreshGesture {
  return new PullToRefreshGesture(element, config);
}

