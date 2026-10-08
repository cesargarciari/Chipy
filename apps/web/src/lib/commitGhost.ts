import { prefersReducedMotion } from '../store/theme.js';

/**
 * The "lock it in" beat. When a choice is committed the engine advances at once and the next
 * call starts arriving, so the chosen card can't stay on screen. Instead a non-interactive copy of
 * its face is pinned where it was, rings in the accent, lifts, and dissolves over the incoming
 * scene. It never blocks input, so the next decision is clickable immediately.
 */
export function releaseCommitGhost(face: HTMLElement): void {
  if (typeof face.animate !== 'function') return;
  if (prefersReducedMotion()) return;

  const rect = face.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;

  const ghost = face.cloneNode(true) as HTMLElement;
  ghost.setAttribute('aria-hidden', 'true');
  ghost.inert = true;
  ghost.classList.add('commit-ghost');
  Object.assign(ghost.style, {
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  });
  document.body.appendChild(ghost);
  // The clone inherits the face's entrance animation; it should start fully formed.
  for (const a of ghost.getAnimations({ subtree: true })) a.cancel();

  const anim = ghost.animate(
    [
      { transform: 'none', opacity: 1, filter: 'blur(0px)' },
      {
        transform: 'translate3d(0, -6px, 0) scale(1.012)',
        opacity: 1,
        filter: 'blur(0px)',
        offset: 0.3,
      },
      { transform: 'translate3d(0, -40px, 0) scale(0.97)', opacity: 0, filter: 'blur(10px)' },
    ],
    { duration: 620, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' },
  );
  const remove = () => ghost.remove();
  anim.finished.then(remove, remove);
}
