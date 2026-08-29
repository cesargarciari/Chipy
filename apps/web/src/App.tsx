import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell.js';
import { CreatePlayer } from './features/create-player/CreatePlayer.js';
import { PlayScreen } from './features/play/PlayScreen.js';
import { Home } from './pages/Home.js';
import { LeaderboardPage } from './pages/LeaderboardPage.js';
import { LegacyPage } from './pages/LegacyPage.js';
import { SharePage } from './pages/SharePage.js';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000 } },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreatePlayer />} />
            <Route path="/play" element={<PlayScreen />} />
            <Route path="/legacy" element={<LegacyPage />} />
            <Route path="/c/:id" element={<SharePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
