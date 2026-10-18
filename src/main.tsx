import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import App from './App';
import './index.css';

// O editor (e os ~1 MB de dados do jogo) só é baixado quando a rota é aberta.
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
          {/* Interface antiga: continua funcionando até ser substituída, rota por rota. */}
          <Route path="*" element={<App />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
