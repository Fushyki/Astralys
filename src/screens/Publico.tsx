/** Time compartilhado por link (/p/:id): leitura sem login, com os números do motor e "Abrir nos meus Times". */
import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AppHeader } from '../app/AppHeader';
import '../design/design.css';
import { elementColor } from '../design/elements';
import { CharacterAvatar, Chip, StackedBar } from '../design/primitives';
import { analyzeProject, parseProject, resolveProject, type RotationProject } from '../engine';
import { useGameData } from '../features/rotation/data';
import { cloneProject, saveProject } from '../features/rotation/persistence';
import { getPublic, type PublicProject } from '../online/api';
import { ONLINE_ENABLED } from '../online/config';
import { compact, formatDecimal, formatInt, formatPercent } from '../ui/format';
import './publico.css';

interface Numbers {
  dps: number;
  dpr: number;
  shares: number[];
}

type Loaded =
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'ok'; meta: PublicProject; project: RotationProject };

export default function Publico() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data } = useGameData();
  const [loaded, setLoaded] = useState<Loaded>({ state: 'loading' });
  const [numbers, setNumbers] = useState<Numbers | 'error' | null>(null);

  useEffect(() => {
    if (!ONLINE_ENABLED) return;
    let cancelled = false;
    getPublic(id)
      .then((meta) => {
        if (cancelled) return;
        try {
          setLoaded({ state: 'ok', meta, project: parseProject(meta.dados) });
        } catch {
          setLoaded({ state: 'error', message: 'Este time foi salvo num formato que esta versão do Astralys não abre.' });
        }
      })
      .catch((e: Error) => !cancelled && setLoaded({ state: 'error', message: e.message || 'Não foi possível abrir este link.' }));
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (loaded.state !== 'ok' || !data) return;
    const t = setTimeout(() => {
      try {
        const r = resolveProject(loaded.project, data.game, data.effects);
        const res = analyzeProject({ team: r.team, actions: r.actions, flatEffects: r.flatEffects, ampCoefficient: r.ampCoefficient }).optimization.result;
        setNumbers({ dps: res.totals.dps, dpr: res.totals.avg, shares: res.members.map((m) => m.share) });
      } catch {
        setNumbers('error');
      }
    }, 0);
    return () => clearTimeout(t);
  }, [loaded, data]);

  if (!ONLINE_ENABLED) return <Navigate to="/" replace />;

  const characters = data?.game.characters ?? [];
  const characterOf = (name: string) => characters.find((c) => c.name === name);

  const openCopy = () => {
    if (loaded.state !== 'ok') return;
    const copy = cloneProject(loaded.project, loaded.project.name);
    saveProject({ ...copy, meta: { ...copy.meta, shared: false, favorite: false } });
    navigate(`/projeto/${copy.id}`);
  };

  return (
    <div className="dz">
      <AppHeader />
      <main className="dz-page">
        {loaded.state === 'loading' && <p className="muted" role="status">Abrindo o time…</p>}

        {loaded.state === 'error' && (
          <section className="dz-panel pb-empty" role="alert">
            <h1 className="h2">Time não encontrado</h1>
            <p className="muted">{loaded.message}</p>
            <p className="muted">O link pode ter sido desligado por quem o criou.</p>
            <Link className="dz-btn" to="/">Ir para o início</Link>
          </section>
        )}

        {loaded.state === 'ok' && (
          <>
            <section className="dz-pagehead">
              <div className="titles">
                <h1 className="h1">{loaded.project.name}</h1>
                <span className="muted">Compartilhado por {loaded.meta.author}. Somente leitura: abra uma cópia para editar.</span>
              </div>
              <div className="actions">
                <button type="button" className="dz-btn gold" onClick={openCopy}>Abrir nos meus Times</button>
              </div>
            </section>

            <section className="dz-panel pb-team" aria-label="Time">
              <div className="pb-faces">
                {loaded.project.members.map((m) => (
                  <div key={m.character} className="pb-member">
                    <CharacterAvatar name={m.character} icon={characterOf(m.character)?.icon} color={elementColor(characterOf(m.character)?.element)} size={64} />
                    <b>{m.character}</b>
                    <span className="muted small">{m.weapon}</span>
                    <span className="muted small">C{m.constellation ?? 0}{m.primarySet ? ` · ${m.primarySet}` : ''}</span>
                  </div>
                ))}
              </div>

              {numbers === null && <p className="muted small">Calculando…</p>}
              {numbers === 'error' && <p className="muted small">Não foi possível calcular este time.</p>}
              {numbers && numbers !== 'error' && (
                <>
                  <StackedBar
                    legend={false}
                    format={(f) => formatPercent(f, 1)}
                    parts={loaded.project.members.map((m, i) => ({ key: m.character, label: m.character, fraction: numbers.shares[i] ?? 0, color: elementColor(characterOf(m.character)?.element) }))}
                  />
                  <div className="pb-kp">
                    <span><b className="num" data-testid="pub-dps">{compact(numbers.dps)}</b> DPS</span>
                    <span><b className="num" data-testid="pub-dpr">{compact(numbers.dpr)}</b> DPR</span>
                    <span className="num">{formatDecimal(loaded.project.config.rotationDuration, 1)} s</span>
                  </div>
                </>
              )}

              <div className="pb-meta">
                <Chip>{formatInt(loaded.project.actions.length)} golpes</Chip>
                {loaded.project.gameVersion && <Chip>patch {loaded.project.gameVersion}</Chip>}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
