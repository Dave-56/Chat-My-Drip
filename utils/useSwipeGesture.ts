import { useRef, useEffect, useState } from 'react';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Minimum distance in pixels to trigger swipe
  velocityThreshold?: number; // Minimum velocity to trigger swipe
  preventScroll?: boolean; // Prevent default scroll behavior during swipe
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  isSwiping: boolean;
}

export const useSwipeGesture = (options: SwipeGestureOptions = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    velocityThreshold = 0.3,
    preventScroll = false,
  } = options;

  const elementRef = useRef<HTMLElement | null>(null);
  const touchStateRef = useRef<TouchState | null>(null);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStateRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
        isSwiping: false,
      };
      setIsSwiping(false);
      setSwipeProgress(0);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStateRef.current) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStateRef.current.startX;
      const deltaY = touch.clientY - touchStateRef.current.startY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Determine if this is primarily a horizontal or vertical swipe
      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);

      if (distance > 10) {
        touchStateRef.current.isSwiping = true;
        setIsSwiping(true);

        if (preventScroll && isHorizontal) {
          e.preventDefault();
        }

        // Calculate progress for visual feedback (0-1)
        const progress = Math.min(distance / threshold, 1);
        setSwipeProgress(progress);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStateRef.current || !touchStateRef.current.isSwiping) {
        touchStateRef.current = null;
        setIsSwiping(false);
        setSwipeProgress(0);
        return;
      }

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStateRef.current.startX;
      const deltaY = touch.clientY - touchStateRef.current.startY;
      const deltaTime = Date.now() - touchStateRef.current.startTime;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const velocity = distance / deltaTime; // pixels per ms

      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      const isHorizontal = absDeltaX > absDeltaY;

      // Check if swipe meets threshold and velocity requirements
      if (distance >= threshold && velocity >= velocityThreshold) {
        if (isHorizontal) {
          if (deltaX > 0 && onSwipeRight) {
            onSwipeRight();
          } else if (deltaX < 0 && onSwipeLeft) {
            onSwipeLeft();
          }
        } else {
          if (deltaY > 0 && onSwipeDown) {
            onSwipeDown();
          } else if (deltaY < 0 && onSwipeUp) {
            onSwipeUp();
          }
        }
      }

      touchStateRef.current = null;
      setIsSwiping(false);
      setSwipeProgress(0);
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: !preventScroll });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventScroll });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, velocityThreshold, preventScroll]);

  return {
    ref: elementRef,
    swipeProgress,
    isSwiping,
  };
};

