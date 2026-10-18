import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './index.css';

// O editor (e os ~1 MB de dados do jogo) só é baixado quando a rota é aberta.
const HomePage = lazy(() => import('./features/home/HomePage'));
const RotationPage = lazy(() => import('./features/rotation/RotationPage'));
const CardPage = lazy(() => import('./features/card/CardPage'));
const EnergyPage = lazy(() => import('./features/energy/EnergyPage'));
const ProjectsPage = lazy(() => import('./features/rotation/ProjectsPage'));

const queryClient = new QueryClient();
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find root DOM element with id "root". Verify index.html contains <div id="root"></div>.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route
            path="/rotacao"
            element={
              <Suspense fallback={null}>
                <ProjectsPage />
              </Suspense>
            }
          />
          <Route
            path="/rotacao/:id/card"
            element={
              <Suspense fallback={null}>
                <CardPage />
              </Suspense>
            }
          />
          <Route
            path="/rotacao/:id/recarga"
            element={
              <Suspense fallback={null}>
                <EnergyPage />
              </Suspense>
            }
          />
          <Route
            path="/rotacao/:id"
            element={
              <Suspense fallback={null}>
                <RotationPage />
              </Suspense>
            }
          />
          <Route
            path="/"
            element={
              <Suspense fallback={null}>
                <HomePage />
              </Suspense>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
