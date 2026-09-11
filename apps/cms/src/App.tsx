import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout.js';
import { AuthProvider } from './features/auth/AuthProvider.js';
import { RequireAuth } from './features/auth/RequireAuth.js';
import { ThemeProvider } from './features/theme/ThemeProvider.js';
import { ThemedToaster } from './features/theme/ThemedToaster.js';
import { LoginPage } from './routes/LoginPage.js';

const DashboardPage = lazy(() =>
  import('./routes/DashboardPage.js').then((m) => ({
    default: m.DashboardPage,
  })),
);
const ArticlesPage = lazy(() =>
  import('./routes/ArticlesPage.js').then((m) => ({
    default: m.ArticlesPage,
  })),
);
const ArticleFormPage = lazy(() =>
  import('./routes/ArticleFormPage.js').then((m) => ({
    default: m.ArticleFormPage,
  })),
);
const CategoriesPage = lazy(() =>
  import('./routes/CategoriesPage.js').then((m) => ({
    default: m.CategoriesPage,
  })),
);
const MediaLibraryPage = lazy(() =>
  import('./routes/MediaLibraryPage.js').then((m) => ({
    default: m.MediaLibraryPage,
  })),
);
const BreakingNewsPage = lazy(() =>
  import('./routes/BreakingNewsPage.js').then((m) => ({
    default: m.BreakingNewsPage,
  })),
);
const AdvertisementsPage = lazy(() =>
  import('./routes/AdvertisementsPage.js').then((m) => ({
    default: m.AdvertisementsPage,
  })),
);
const SessionsPage = lazy(() =>
  import('./routes/SessionsPage.js').then((m) => ({ default: m.SessionsPage })),
);
const SettingsPage = lazy(() =>
  import('./routes/SettingsPage.js').then((m) => ({ default: m.SettingsPage })),
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
                  <Route path="articles" element={<ArticlesPage />} />
                  <Route path="articles/new" element={<ArticleFormPage />} />
                  <Route
                    path="articles/:id/edit"
                    element={<ArticleFormPage />}
                  />
                  <Route path="categories" element={<CategoriesPage />} />
                  <Route path="media" element={<MediaLibraryPage />} />
                  <Route path="breaking-news" element={<BreakingNewsPage />} />
                  <Route
                    path="advertisements"
                    element={<AdvertisementsPage />}
                  />
                  <Route path="sessions" element={<SessionsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
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
