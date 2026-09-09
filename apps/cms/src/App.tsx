import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout.js';
import { AuthProvider } from './features/auth/AuthProvider.js';
import { RequireAuth } from './features/auth/RequireAuth.js';
import { ThemeProvider } from './features/theme/ThemeProvider.js';
import { ThemedToaster } from './features/theme/ThemedToaster.js';
import { LoginPage } from './routes/LoginPage.js';

// Split per route so the first load carries only the shell and login. Heavy
// dependencies — drag-and-drop, and the rich text editor later — then ship with
// the screen that needs them instead of on first paint.
const DashboardPage = lazy(() =>
  import('./routes/DashboardPage.js').then((m) => ({
    default: m.DashboardPage,
  })),
);
const CategoriesPage = lazy(() =>
  import('./routes/CategoriesPage.js').then((m) => ({
    default: m.CategoriesPage,
  })),
);
const BreakingNewsPage = lazy(() =>
  import('./routes/BreakingNewsPage.js').then((m) => ({
    default: m.BreakingNewsPage,
  })),
);
const SessionsPage = lazy(() =>
  import('./routes/SessionsPage.js').then((m) => ({ default: m.SessionsPage })),
);
const NotFoundPage = lazy(() =>
  import('./routes/NotFoundPage.js').then((m) => ({ default: m.NotFoundPage })),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<RequireAuth />}>
                <Route element={<AppLayout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="categories" element={<CategoriesPage />} />
                  <Route path="breaking-news" element={<BreakingNewsPage />} />
                  <Route path="sessions" element={<SessionsPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
          <ThemedToaster />
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
