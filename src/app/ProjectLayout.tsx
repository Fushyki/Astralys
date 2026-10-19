/**
 * Layout de todas as telas de um projeto (/projeto/:id/...): abre o projeto, salva sozinho, calcula o motor UMA vez
 * no worker e entrega o resultado às telas pelo contexto. Editar numa tela atualiza as outras sem recarregar.
 */
import { useEffect, useMemo } from 'react';
import { Link, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import '../design/design.css';
import { memberColors } from '../design/elements';
import { StateCard } from '../design/primitives';
import { useGameData } from '../features/rotation/data';
import { SAMPLE_ID, loadProject, saveProject } from '../features/rotation/persistence';
import { useRotationStore } from '../features/rotation/store';
import { summarize } from '../features/rotation/summary';
import { useAnalysis } from '../features/rotation/useAnalysis';
import { AppHeader } from './AppHeader';
import { ProjectSteps } from './ProjectSteps';
import { ProjectProvider } from './ProjectContext';

const SAVE_DELAY_MS = 400;

export default function ProjectLayout() {
  const { id = SAMPLE_ID } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { data, error: dataError } = useGameData();
  const project = useRotationStore((s) => s.project);
  const dirty = useRotationStore((s) => s.dirty);
  const selectedMember = useRotationStore((s) => s.selectedMember);
  const open = useRotationStore((s) => s.open);
  const markSaved = useRotationStore((s) => s.markSaved);
  const setFavorite = useRotationStore((s) => s.setFavorite);

  // Abre o projeto da rota (só quando o id muda; trocar de aba não reabre).
  useEffect(() => {
    if (useRotationStore.getState().project?.id === id) return;
    const p = loadProject(id);
    if (p) open(p);
  }, [id, open]);

  // Salva sozinho, pouco depois da última alteração.
  useEffect(() => {
    if (!project || !dirty) return;
    const t = setTimeout(() => {
      saveProject(project);
      markSaved();
    }, SAVE_DELAY_MS);
    return () => clearTimeout(t);
  }, [project, dirty, markSaved]);

  const exists = useMemo(() => loadProject(id) !== null, [id]);
  const current = project && project.id === id ? project : null;

  // Ctrl+Z desfaz, Ctrl+Y (ou Ctrl+Shift+Z) refaz; ignorado enquanto se digita num campo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = el && (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || (el.tagName === 'INPUT' && !/^(checkbox|radio|range|button)$/.test((el as HTMLInputElement).type)));
      if (typing) return;
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) {
        e.preventDefault();
        useRotationStore.getState().undo();
      } else if (k === 'y' || (k === 'z' && e.shiftKey)) {
        e.preventDefault();
        useRotationStore.getState().redo();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const analysis = useAnalysis(current, data);

  useEffect(() => {
    if (current) document.title = `${current.name} · Astralys`;
  }, [current]);

  const ready = analysis.status === 'ready' ? analysis : null;
  const resolvedMembers = ready?.resolved.team.members ?? [];
  const inSync = !!current && resolvedMembers.length === current.members.length && resolvedMembers.every((m, i) => m.character.name === current.members[i].character);
  const summary = useMemo(() => (ready ? summarize(ready.bundle, ready.resolved) : null), [ready]);
  const colors = useMemo(
    () => memberColors((current?.members ?? []).map((m) => data?.game.characters.find((c) => c.name === m.character)?.element)),
    [current, data],
  );

  const routeMember = /personagem\/([^/]+)/.exec(pathname);
  const headerMember = (routeMember ? decodeURIComponent(routeMember[1]) : undefined) ?? current?.members[selectedMember]?.character ?? current?.members[0]?.character;

  // Salvar no Vault: marca como favorito, grava na hora (a navegação cancelaria o salvamento atrasado) e leva ao Vault.
  const toggleFavorite = (p: NonNullable<typeof current>) => {
    const favorite = !p.meta.favorite;
    setFavorite(favorite);
    saveProject({ ...p, meta: { ...p.meta, favorite, updatedAt: new Date().toISOString() } });
    if (favorite) navigate('/vault');
  };

  if (!exists && !current) {
    return (
      <StateCard title="Projeto não encontrado">
        <p>Não existe um projeto salvo com o id “{id}” neste navegador.</p>
        <Link className="dz-btn" to={`/projeto/${SAMPLE_ID}`}>Abrir o exemplo</Link>
        <Link className="dz-btn" to="/vault">Ir ao Vault</Link>
      </StateCard>
    );
  }
  if (dataError) {
    return (
      <StateCard title="Não foi possível carregar os dados do jogo">
        <p>Recarregue a página. Se o problema continuar, o arquivo de dados pode estar indisponível.</p>
      </StateCard>
    );
  }
  if (analysis.status === 'error') {
    return (
      <StateCard title="Não foi possível calcular o projeto">
        <p>{analysis.message}</p>
        <Link className="dz-btn" to={`/projeto/${SAMPLE_ID}`}>Abrir o exemplo</Link>
      </StateCard>
    );
  }
  if (!current || !data || !ready || !summary) {
    return (
      <div className="dz">
        <AppHeader projectId={id} memberName={headerMember} />
        <div className="dz-state" role="status">
          <h1 className="h2">Calculando</h1>
          <p>Carregando os dados do jogo e otimizando os substats da equipe.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dz">
      <AppHeader projectId={id} memberName={headerMember} favorite={!!current.meta.favorite} onToggleFavorite={() => toggleFavorite(current)} />
      <ProjectProvider value={{ id, project: current, data, bundle: ready.bundle, resolved: ready.resolved, stale: ready.stale, inSync, summary, colors }}>
        <div className={ready.stale ? 'dz-busy' : undefined}>
          <Outlet />
        </div>
        <ProjectSteps id={id} firstMember={current.members[0].character} />
      </ProjectProvider>
    </div>
  );
}
