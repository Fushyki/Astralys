import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import './index.css';

// O editor (e os ~1 MB de dados do jogo) só é baixado quando a rota é aberta.
const ProjectLayout = lazy(() => import('./app/ProjectLayout'));
const Equipe = lazy(() => import('./screens/Equipe'));
const Personagem = lazy(() => import('./screens/Personagem'));
const Rotacao = lazy(() => import('./screens/Rotacao'));
const Time = lazy(() => import('./screens/Time'));
const Armas = lazy(() => import('./screens/Armas'));
const Recarga = lazy(() => import('./screens/Recarga'));
const RecargaLivre = lazy(() => import('./screens/RecargaLivre'));
const Vault = lazy(() => import('./screens/Vault'));
const Comparar = lazy(() => import('./screens/Comparar'));
const Inicio = lazy(() => import('./screens/Inicio'));
const Card = lazy(() => import('./screens/Card'));
const Entrar = lazy(() => import('./screens/Entrar'));

/** Rotas da versão anterior: mandam para as telas novas. */
const To = ({ to }: { to: (id: string) => string }) => {
  const { id = 'exemplo' } = useParams();
  return <Navigate to={to(id)} replace />;
};

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
          <Route path="/rotacao" element={<Navigate to="/vault" replace />} />
          <Route path="/rotacao/:id" element={<To to={(id) => `/projeto/${id}/rotacao`} />} />
          <Route path="/rotacao/:id/card" element={<To to={(id) => `/card/${id}`} />} />
          <Route path="/rotacao/:id/recarga" element={<To to={(id) => `/projeto/${id}/recarga`} />} />
          <Route path="/comparar" element={<Suspense fallback={null}><Comparar /></Suspense>} />
          <Route
            path="/projeto/:id"
            element={
              <Suspense fallback={null}>
                <ProjectLayout />
              </Suspense>
            }
          >
            <Route index element={<Suspense fallback={null}><Equipe /></Suspense>} />
            <Route path="personagem/:nome" element={<Suspense fallback={null}><Personagem /></Suspense>} />
            <Route path="rotacao" element={<Suspense fallback={null}><Rotacao /></Suspense>} />
            <Route path="armas/:nome?" element={<Suspense fallback={null}><Armas /></Suspense>} />
            <Route path="recarga" element={<Suspense fallback={null}><Recarga /></Suspense>} />
            <Route path="time" element={<Suspense fallback={null}><Time /></Suspense>} />
          </Route>
          <Route path="/card/:id" element={<Suspense fallback={null}><Card /></Suspense>} />
          <Route path="/entrar" element={<Suspense fallback={null}><Entrar /></Suspense>} />
          <Route path="/vault" element={<Suspense fallback={null}><Vault /></Suspense>} />
          <Route path="/recarga" element={<Suspense fallback={null}><RecargaLivre /></Suspense>} />
          <Route path="/" element={<Suspense fallback={null}><Inicio /></Suspense>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
