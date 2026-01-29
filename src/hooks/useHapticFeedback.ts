/**
 * Haptic feedback utility for mobile interactions.
 * Uses the Vibration API when available, with graceful fallback.
 */

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning';

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [15, 50, 15],
  error: [50, 100, 50],
  warning: [30, 50, 30],
};

/**
 * Check if the device supports vibration
 */
export function supportsHaptics(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

/**
 * Trigger haptic feedback with a predefined pattern
 */
export function triggerHaptic(pattern: HapticPattern = 'light'): void {
  if (!supportsHaptics()) return;
  
  try {
    navigator.vibrate(PATTERNS[pattern]);
  } catch {
    // Silently fail if vibration not available
  }
}

/**
 * Hook for haptic feedback in React components
 */
export function useHapticFeedback() {
  const isSupported = supportsHaptics();

  const haptic = (pattern: HapticPattern = 'light') => {
    triggerHaptic(pattern);
  };

  // Convenience methods
  const light = () => haptic('light');
  const medium = () => haptic('medium');
  const heavy = () => haptic('heavy');
  const success = () => haptic('success');
  const error = () => haptic('error');
  const warning = () => haptic('warning');

  return {
    isSupported,
    haptic,
    light,
    medium,
    heavy,
    success,
    error,
    warning,
  };
}
