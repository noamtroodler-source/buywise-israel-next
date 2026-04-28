import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

// Generate or retrieve a session ID for error tracking
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('error_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('error_session_id', sessionId);
  }
  return sessionId;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({ errorInfo });
    
    // Report error to Supabase client_errors table
    this.reportError(error, errorInfo);
  }

  private async reportError(error: Error, errorInfo: React.ErrorInfo): Promise<void> {
    try {
      const sessionId = getSessionId();
      const pagePath = window.location.pathname;
      
      // Get current user if authenticated
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      
      // Build metadata object
      const metadata = {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        componentStack: errorInfo.componentStack?.substring(0, 2000), // Limit size
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        referrer: document.referrer || null,
      };

      // Insert into client_errors table
      // Note: error_type must be one of: js_error, map_failure, search_failure, api_error
      const { error: insertError } = await supabase
        .from('client_errors')
        .insert({
          error_type: 'js_error', // Use valid constraint value (actual error name is in metadata)
          error_message: error.message?.substring(0, 1000) || 'Unknown error',
          stack_trace: error.stack?.substring(0, 5000) || null,
          page_path: pagePath,
          session_id: sessionId,
          user_id: user?.id || null,
          metadata: {
            ...metadata,
            error_name: error.name, // Store the actual error type (TypeError, etc.) here
          },
        });

      if (insertError) {
        console.error('Failed to report error to database:', insertError);
      }
    } catch (reportingError) {
      // Silently fail - don't cause additional errors
      console.error('Error reporting failed:', reportingError);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-lg border border-border bg-card p-6 text-center shadow-sm space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl" aria-hidden="true">!</span>
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Something went wrong</h2>
                <p className="text-sm text-muted-foreground">
                  We encountered an unexpected error. Please try again or return to the homepage.
                </p>
                {import.meta.env.DEV && this.state.error && (
                  <details className="mt-4 text-left">
                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                      Technical details
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                      {this.state.error.message}
                      {this.state.error.stack && (
                        <>
                          {'\n\n'}
                          {this.state.error.stack.substring(0, 500)}
                        </>
                      )}
                    </pre>
                  </details>
                )}
              </div>
              <div className="flex gap-3 justify-center">
                <button className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground" onClick={this.handleReset}>
                  Try Again
                </button>
                <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90" onClick={() => window.location.href = '/'}>
                  Go Home
                </button>
              </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
