/**
 * Safely get and parse JSON from localStorage with validation.
 * Returns defaultValue if key doesn't exist, parsing fails, or validation fails.
 */
export function safeGetJSON<T>(
  key: string,
  defaultValue: T,
  validator?: (data: unknown) => data is T
): T {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;
    
    const parsed = JSON.parse(stored);
    
    if (validator && !validator(parsed)) {
      console.warn(`Invalid data in localStorage key "${key}", using default`);
      return defaultValue;
    }
    
    return parsed as T;
  } catch (error) {
    console.warn(`Failed to parse localStorage key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Safely stringify and store JSON in localStorage.
 * Returns true on success, false on failure.
 */
export function safeSetJSON(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Failed to save to localStorage key "${key}":`, error);
    return false;
  }
}

/**
 * Safely remove an item from localStorage.
 */
export function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Failed to remove localStorage key "${key}":`, error);
  }
}
