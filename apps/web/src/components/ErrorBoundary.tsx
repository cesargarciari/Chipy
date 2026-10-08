import { Component, type ErrorInfo, type ReactNode } from 'react';
import { getT } from '../lib/i18n.js';
import { Button } from './ui/button.js';

interface State {
  error: Error | null;
}

/** Shows a recovery screen if anything below crashes. "Start over" clears the saved career and reloads. */
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
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
        <h1 className="t-title">{t.title}</h1>
        <p className="t-lead mt-4 text-ink/65">{t.body}</p>
        <Button size="lg" className="mt-10" onClick={this.reset}>
          {t.button}
        </Button>
      </div>
    );
  }
}
