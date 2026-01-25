/**
 * Safely get and parse JSON from sessionStorage with validation.
 * Returns defaultValue if key doesn't exist, parsing fails, or validation fails.
 * Session data persists across page refreshes but is cleared when browser closes.
 */
export function safeSessionGet<T>(
  key: string,
  defaultValue: T,
  validator?: (data: unknown) => data is T
): T {
  try {
    const stored = sessionStorage.getItem(key);
    if (!stored) return defaultValue;
    
    const parsed = JSON.parse(stored);
    
    if (validator && !validator(parsed)) {
      console.warn(`Invalid data in sessionStorage key "${key}", using default`);
      return defaultValue;
    }
    
    return parsed as T;
  } catch (error) {
    console.warn(`Failed to parse sessionStorage key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Safely stringify and store JSON in sessionStorage.
 * Returns true on success, false on failure.
 */
export function safeSessionSet(key: string, value: unknown): boolean {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Failed to save to sessionStorage key "${key}":`, error);
    return false;
  }
}

/**
 * Safely remove an item from sessionStorage.
 */
export function safeSessionRemove(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    console.warn(`Failed to remove sessionStorage key "${key}":`, error);
  }
}
