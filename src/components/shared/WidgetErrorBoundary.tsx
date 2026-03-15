import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  className?: string;
}

interface State {
  hasError: boolean;
}

export class WidgetErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[WidgetErrorBoundary]', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className={`rounded-2xl border-destructive/20 bg-destructive/5 ${this.props.className ?? ''}`}>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-8 px-4 text-center">
            <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {this.props.fallbackTitle || 'Failed to load'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Something went wrong loading this section.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleRetry}
              className="rounded-xl border-destructive/20 text-destructive hover:bg-destructive/10 gap-2"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
