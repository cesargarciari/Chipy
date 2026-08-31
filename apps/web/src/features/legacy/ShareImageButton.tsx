import { toBlob } from 'html-to-image';
import { Check, Copy, LoaderCircle } from 'lucide-react';
import { type RefObject, useState } from 'react';
import { Button } from '../../components/ui/button.js';

/**
 * Renders the referenced node to a PNG and writes it to the clipboard, so the
 * career card can be pasted straight into a chat or a post (the way Copero /
 * El Idolo do it). Captured at 2x on the app's near-black background.
 */
export function ShareImageButton({ targetRef }: { targetRef: RefObject<HTMLElement | null> }) {
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');

  const copy = async () => {
    const node = targetRef.current;
    if (!node) return;
    setState('busy');
    try {
      const blob = await toBlob(node, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#0a0a0b',
      });
      if (!blob) throw new Error('no image produced');
      if (!('clipboard' in navigator) || typeof ClipboardItem === 'undefined') {
        throw new Error('clipboard images not supported here');
      }
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setState('done');
      setTimeout(() => setState('idle'), 1800);
    } catch (err) {
      console.error('career image copy failed', err);
      setState('error');
      setTimeout(() => setState('idle'), 2500);
    }
  };

  const label =
    state === 'busy'
      ? 'Rendering…'
      : state === 'done'
        ? 'Copied to clipboard'
        : state === 'error'
          ? "Couldn't copy - try again"
          : 'Copy as image';

  return (
    <Button variant="outline" disabled={state === 'busy'} onClick={copy}>
      {state === 'busy' ? (
        <LoaderCircle size={16} className="animate-spin" />
      ) : state === 'done' ? (
        <Check size={16} />
      ) : (
        <Copy size={16} />
      )}
      {label}
    </Button>
  );
}
