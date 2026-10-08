import { toBlob } from 'html-to-image';
import { Check, Copy, LoaderCircle } from 'lucide-react';
import { type RefObject, useState } from 'react';
import { Button } from '../../components/ui/button.js';
import { PALETTE } from '../../lib/palette.js';
import { useResolvedTheme } from '../../store/theme.js';

/** Copies the career card to the clipboard as an image, in whichever theme is on screen. */
export function ShareImageButton({ targetRef }: { targetRef: RefObject<HTMLElement | null> }) {
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const theme = useResolvedTheme();

  const copy = async () => {
    const node = targetRef.current;
    if (!node) return;
    setState('busy');
    try {
      const opts = { pixelRatio: 2, cacheBust: true, backgroundColor: PALETTE[theme].ground };
      // The first pass warms html-to-image's font and image cache; the second is the keeper.
      await toBlob(node, opts);
      const blob = await toBlob(node, opts);
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
          ? "Couldn't copy. Try again."
          : 'Copy as image';

  return (
    <Button variant="secondary" disabled={state === 'busy'} onClick={copy}>
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
