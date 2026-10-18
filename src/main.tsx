import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import App from './App';
import './index.css';

// O editor (e os ~1 MB de dados do jogo) só é baixado quando a rota é aberta.
const RotationPage = lazy(() => import('./features/rotation/RotationPage'));

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
          <Route path="/rotacao" element={<Navigate to="/rotacao/exemplo" replace />} />
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
