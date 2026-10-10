import { ChevronDown, Moon, Sun } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { cn } from '../lib/cn.js';
import { useT } from '../lib/i18n.js';
import { useLanguage, type Lang } from '../store/language.js';
import { useResolvedTheme, useTheme } from '../store/theme.js';

const navItem = ({ isActive }: { isActive: boolean }) =>
  cn(
    'inline-flex h-9 items-center rounded-full px-3 text-sm transition-colors duration-200',
    isActive ? 'bg-ink/7 text-ink' : 'text-ink/60 hover:text-ink',
  );

/** A select, not a button, so the e2e walk (which clicks the first button) never lands on it. */
function LanguageSelect() {
  const lang = useLanguage((s) => s.lang);
  const setLang = useLanguage((s) => s.setLang);
  const t = useT();

  return (
    <div className="relative">
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        aria-label={t.nav.languageLabel}
        className="h-9 cursor-pointer appearance-none rounded-full bg-transparent pl-3 pr-7 text-xs font-medium uppercase tracking-[0.04em] text-ink/70 inset-ring inset-ring-ink/13 transition-colors hover:text-ink"
      >
        <option value="en">EN</option>
        <option value="es">ES</option>
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-ink/60"
      />
    </div>
  );
}

/** A checkbox switch, also not a button, for the same e2e reason. */
function ThemeSwitch() {
  const t = useT();
  const resolved = useResolvedTheme();
  const setTheme = useTheme((s) => s.setTheme);
  const dark = resolved === 'dark';

  return (
    <label className="relative inline-flex cursor-pointer">
      <input
        type="checkbox"
        role="switch"
        checked={dark}
        onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')}
        aria-label={t.nav.themeLabel}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="flex h-9 w-15 items-center rounded-full px-1 inset-ring inset-ring-ink/13 transition-shadow peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
      >
        <span
          className={cn(
            'grid h-7 w-7 place-items-center rounded-full bg-float text-ink shadow-lift transition-[translate] duration-300 ease-out',
            dark ? 'translate-x-6' : 'translate-x-0',
          )}
        >
          {dark ? <Moon size={14} strokeWidth={1.75} /> : <Sun size={14} strokeWidth={1.75} />}
        </span>
      </span>
    </label>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const lang = useLanguage((s) => s.lang);
  const theme = useTheme((s) => s.theme);
  const { pathname } = useLocation();
  const t = useT();

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 bg-ground/80 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            to="/"
            aria-label={t.nav.homeLabel}
            className="-ml-1 flex items-center gap-2.5 rounded-full p-1"
          >
            <img src="/chipy-logo-320.png" alt="" className="h-8 w-8 shrink-0 rounded-[0.55rem]" />
            <span className="hidden text-[1.0625rem] font-medium tracking-[-0.035em] min-[400px]:inline">
              Chipy
            </span>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <nav className="flex items-center gap-0.5">
              <NavLink to="/" className={navItem} end>
                {t.nav.play}
              </NavLink>
              <NavLink to="/leaderboard" className={navItem}>
                {t.nav.leaderboard}
              </NavLink>
            </nav>
            <LanguageSelect />
            <ThemeSwitch />
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mx-auto w-full max-w-6xl px-4 pb-10 pt-16 sm:px-6">
        <div className="flex items-center gap-3 border-t border-ink/8 pt-6 text-sm text-ink/60">
          <img
            src="/chipy-logo-320.png"
            alt=""
            className="h-5 w-5 shrink-0 rounded-[0.3rem] opacity-90"
          />
          <p>{t.nav.footer}</p>
        </div>
      </footer>
    </div>
  );
}
