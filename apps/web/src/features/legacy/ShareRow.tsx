import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../components/ui/button.js';

export function ShareRow({
  shareUrl,
  saving,
  saveError,
}: {
  shareUrl?: string;
  saving?: boolean;
  saveError?: string | null;
}) {
  const [copied, setCopied] = useState(false);

  if (saving) return <p className="text-center text-sm text-ink-dim">Saving your career…</p>;
  if (!shareUrl) {
    return (
      <p className="text-center text-sm text-ink-dim">
        {saveError
          ? `Couldn't save online (${saveError}) - your career still stands.`
          : 'Playing offline - this career was not saved.'}
      </p>
    );
  }

  return (
    <div className="flex gap-2">
      <input
        readOnly
        value={shareUrl}
        aria-label="Share link"
        onFocusCapture={(e) => e.currentTarget.select()}
        className="flex-1 rounded-lg border border-court-600 bg-court-800 px-3 py-2 text-sm text-ink-dim"
      />
      <Button
        variant="outline"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            /* clipboard blocked - the input is selectable as a fallback */
          }
        }}
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
        {copied ? 'Copied' : 'Copy link'}
      </Button>
    </div>
  );
}
