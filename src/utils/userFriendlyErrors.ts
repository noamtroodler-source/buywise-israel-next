/**
 * Maps technical error messages to user-friendly versions.
 * Strips Supabase/PostgreSQL error codes and provides clear guidance.
 */
const ERROR_MAP: Record<string, string> = {
  'duplicate key': 'This item already exists',
  'violates foreign key': 'This item is linked to other data',
  'violates check constraint': 'The provided value is not valid',
  'invalid input syntax': 'Please check your input format',
  'permission denied': "You don't have permission for this action",
  'JWT expired': 'Your session has expired. Please sign in again.',
  'Failed to fetch': 'Unable to connect. Please check your internet.',
  'network': 'Unable to connect. Please check your internet.',
  'row-level security': "You don't have permission for this action",
  'not found': 'The requested item was not found',
};

/**
 * Converts technical error messages to user-friendly versions.
 * @param error - The error object or message
 * @param fallback - Default message if no match found
 * @returns A user-friendly error message
 */
export function getUserFriendlyError(
  error: unknown,
  fallback = 'Something went wrong. Please try again.'
): string {
  const message = error instanceof Error ? error.message : String(error);
  const lowerMessage = message.toLowerCase();
  
  for (const [key, friendly] of Object.entries(ERROR_MAP)) {
    if (lowerMessage.includes(key.toLowerCase())) {
      return friendly;
    }
  }
  
  // If message is too technical (contains codes/brackets), use fallback
  if (message.includes('PGRST') || message.includes('[') || message.length > 100) {
    return fallback;
  }
  
  return fallback;
}
