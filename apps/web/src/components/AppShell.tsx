import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';

const navItem = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-semibold transition-colors ${isActive ? 'text-amber' : 'text-ink-dim hover:text-ink'}`;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4">
      <header className="flex items-center justify-between py-5">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-amber text-court-950">
            <span className="text-lg font-black leading-none">C</span>
          </span>
          <span className="text-xl font-black tracking-tight">Chipy</span>
        </Link>
        <nav className="flex gap-5">
          <NavLink to="/" className={navItem} end>
            Play
          </NavLink>
          <NavLink to="/leaderboard" className={navItem}>
            Leaderboard
          </NavLink>
        </nav>
      </header>

      <main className="flex-1 py-4">{children}</main>

      <footer className="py-6 text-center text-xs text-ink-dim">
        Chipy - a portfolio project. Not affiliated with the NBA.
      </footer>
    </div>
  );
}
