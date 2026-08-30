import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './ui/button.js';
import { Card, CardBody } from './ui/card.js';

interface State {
  error: Error | null;
}

/**
 * Last line of defence: a render throw anywhere below here shows a recovery
 * card instead of a blank page. "Start over" clears the saved career (the
 * usual culprit is a persisted run that no longer replays) and reloads.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Chipy crashed:', error, info.componentStack);
  }

  private reset = () => {
    try {
      for (let i = localStorage.length - 1; i >= 0; i -= 1) {
        const key = localStorage.key(i);
        if (key?.startsWith('chipy.run')) localStorage.removeItem(key);
      }
    } catch {
      // ignore — private mode / storage disabled
    }
    window.location.assign('/');
  };

  override render(): ReactNode {
    if (!this.state.error) return this.props.children;

    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <Card>
          <CardBody className="space-y-4 text-center">
            <h1 className="text-2xl">Something broke</h1>
            <p className="text-sm text-ink-dim">
              The app hit an error it couldn&apos;t recover from — most likely a saved career from
              an older version. Starting over will clear it.
            </p>
            <Button className="w-full" onClick={this.reset}>
              Start over
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }
}
