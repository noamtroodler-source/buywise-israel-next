type ErrorSeverity = 'warning' | 'error' | 'critical';

interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  extra?: Record<string, unknown>;
}

/**
 * Centralized error logging utility.
 * Currently logs to console, but can be extended to integrate with
 * Sentry, Bugsnag, or other error tracking services.
 */
export function logError(
  error: unknown,
  context?: ErrorContext,
  severity: ErrorSeverity = 'error'
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  const componentLabel = context?.component || 'Unknown';

  if (severity === 'critical') {
    console.error(`[CRITICAL] ${componentLabel}:`, errorMessage, context);
  } else if (severity === 'error') {
    console.error(`[ERROR] ${componentLabel}:`, errorMessage);
  } else {
    console.warn(`[WARNING] ${componentLabel}:`, errorMessage);
  }

  // Log stack trace in development only
  if (import.meta.env.DEV && errorStack) {
    console.debug('Stack trace:', errorStack);
  }
}

/**
 * Convenience wrapper for async operations with automatic error logging.
 */
export async function withErrorLogging<T>(
  operation: () => Promise<T>,
  context: ErrorContext
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    logError(error, context);
    return null;
  }
}
