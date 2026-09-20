import { ChevronDown } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useT } from '../lib/i18n.js';
import { useLanguage, type Lang } from '../store/language.js';

const navItem = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-semibold transition-colors ${isActive ? 'text-amber' : 'text-ink-dim hover:text-ink'}`;

/** A native `<select>`, not a `<button>` - the e2e career-loop walk clicks the
 * first non-perks-shop button on every screen, and this control is always
 * mounted in the header, so it must never be a button candidate for that. */
function LanguageToggle() {
  const lang = useLanguage((s) => s.lang);
  const setLang = useLanguage((s) => s.setLang);
  const t = useT();

  return (
    <div className="relative">
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        aria-label={t.nav.languageLabel}
        className="cursor-pointer appearance-none rounded-full border border-court-700 bg-transparent py-1 pl-3 pr-6 text-xs font-bold uppercase tracking-wide text-ink-dim outline-none transition-colors hover:border-amber hover:text-ink focus-visible:border-amber"
      >
        <option value="en">EN</option>
        <option value="es">ES</option>
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-ink-dim"
      />
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const lang = useLanguage((s) => s.lang);
  const t = useT();

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4">
      <header className="flex items-center justify-between gap-4 py-5">
        <Link to="/" className="text-xl font-black tracking-tight">
          Chipy
        </Link>
        <div className="flex items-center gap-5">
          <nav className="flex gap-5">
            <NavLink to="/" className={navItem} end>
              {t.nav.play}
            </NavLink>
            <NavLink to="/leaderboard" className={navItem}>
              {t.nav.leaderboard}
            </NavLink>
          </nav>
          <LanguageToggle />
        </div>
      </header>

      <main className="flex-1 py-4">{children}</main>

      <footer className="py-6 text-center text-xs text-ink-dim">{t.nav.footer}</footer>
    </div>
  );
}
