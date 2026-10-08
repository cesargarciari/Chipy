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

  if (saving) return <p className="text-center text-sm text-ink/60">Saving your career…</p>;
  if (!shareUrl) {
    return (
      <p className="text-center text-sm text-ink/60">
        {saveError
          ? `Couldn't save online (${saveError}). Your career still stands.`
          : 'Playing offline. This career was not saved.'}
      </p>
    );
  }

  return (
    <div className="flex gap-2 rounded-full bg-raised p-1.5 inset-ring inset-ring-ink/8">
      <input
        readOnly
        value={shareUrl}
        aria-label="Share link"
        onFocusCapture={(e) => e.currentTarget.select()}
        className="t-num min-w-0 flex-1 bg-transparent px-4 text-sm text-ink/70 outline-none"
      />
      <Button
        variant="primary"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            /* Clipboard blocked, the user can still select the text. */
          }
        }}
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
        {copied ? 'Copied' : 'Copy link'}
      </Button>
    </div>
  );
}
