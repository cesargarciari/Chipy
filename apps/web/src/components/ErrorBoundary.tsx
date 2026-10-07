import { Component, type ErrorInfo, type ReactNode } from 'react';
import { getT } from '../lib/i18n.js';
import { Button } from './ui/button.js';
import { Card, CardBody } from './ui/card.js';

interface State {
  error: Error | null;
}

/** Shows a recovery card if anything below crashes. "Start over" clears the saved career and reloads. */
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
      // Storage not available, ignore.
    }
    window.location.assign('/');
  };

  override render(): ReactNode {
    if (!this.state.error) return this.props.children;
    const t = getT().errorBoundary;

    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <Card>
          <CardBody className="space-y-4 text-center">
            <h1 className="text-2xl">{t.title}</h1>
            <p className="text-sm text-ink-dim">{t.body}</p>
            <Button className="w-full" onClick={this.reset}>
              {t.button}
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }
}
