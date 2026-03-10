import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

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
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-primary" />
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
                <Button variant="outline" onClick={this.handleReset}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={() => window.location.href = '/'}>
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
