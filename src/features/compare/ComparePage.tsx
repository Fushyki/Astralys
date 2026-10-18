/**
 * Comparar projetos (`/comparar?a=ID&b=ID`): dois projetos lado a lado, com a variação de DPS e DPR e,
 * personagem a personagem, de dano e de build. Serve para decidir entre duas equipes ou duas builds.
 */
import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import '../../ui/ast.css';
import { analyzeProject, resolveProject } from '../../engine';
import { formatDecimal, formatInt, formatPercent } from '../../ui/format';
import { buildCardModel, hitTypeLookup, type CardModel } from '../card/cardModel';
import { compact } from '../card/RotationCard';
import { useGameData, type LoadedData } from '../rotation/data';
import { listProjects, loadProject } from '../rotation/persistence';
import { compareModels } from './compareModel';

function modelOf(id: string | null, data: LoadedData): CardModel | { error: string } | null {
  if (!id) return null;
  const p = loadProject(id);
  if (!p) return { error: 'Projeto não encontrado neste navegador.' };
  try {
    const r = resolveProject(p, data.game, data.effects);
    const b = analyzeProject({ team: r.team, actions: r.actions, flatEffects: r.flatEffects, ampCoefficient: r.ampCoefficient });
    return buildCardModel(p, b, data.game.characters, hitTypeLookup(r));
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

const isModel = (m: CardModel | { error: string } | null): m is CardModel => !!m && !('error' in m);

const signed = (f: number | null, digits = 1) => (f === null ? '—' : `${f > 0 ? '+' : ''}${formatDecimal(f * 100, digits)}%`);
const tone = (f: number | null) => (f === null || Math.abs(f) < 1e-4 ? '' : f > 0 ? 'up' : 'down');

export default function ComparePage() {
  const [params, setParams] = useSearchParams();
  const { data } = useGameData();
  const projects = useMemo(() => listProjects(), []);
  const aId = params.get('a');
  const bId = params.get('b');
  const a = useMemo(() => (data ? modelOf(aId, data) : null), [data, aId]);
  const b = useMemo(() => (data ? modelOf(bId, data) : null), [data, bId]);
  const cmp = isModel(a) && isModel(b) ? compareModels(a, b) : null;

  const set = (key: 'a' | 'b', value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };
  const swap = () => setParams(new URLSearchParams({ ...(bId ? { a: bId } : {}), ...(aId ? { b: aId } : {}) }), { replace: true });

  const picker = (key: 'a' | 'b', value: string | null, label: string) => (
    <label className="ast-field">
      <span>{label}</span>
      <select value={value ?? ''} onChange={(e) => set(key, e.target.value)} aria-label={`Projeto ${label}`}>
        <option value="">Escolha um projeto</option>
        {projects.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
      </select>
    </label>
  );

  return (
    <div className="ast-app">
      <div className="ast-shell">
        <header className="ast-title">
          <h1 className="ast-caps">Comparar projetos</h1>
          <Link className="ast-btn" to="/rotacao">Meus projetos</Link>
        </header>

        <div className="ast-scenario">
          {picker('a', aId, 'A')}
          <button type="button" className="ast-btn sm" onClick={swap} disabled={!aId && !bId} title="Troca A e B de lugar">Trocar</button>
          {picker('b', bId, 'B')}
        </div>

        {[a, b].map((m, i) => (m && !isModel(m) ? <p key={i} className="ast-error" role="alert" style={{ margin: 18 }}>{i === 0 ? 'A' : 'B'}: {m.error}</p> : null))}
        {!cmp && <p className="ast-hint" style={{ padding: 18 }}>Escolha dois projetos para comparar. Cada um é calculado com a própria equipe, build e rotação.</p>}

        {cmp && isModel(a) && isModel(b) && (
          <div className="ast-compare">
            <p className="verdict" role="status">
              {cmp.winner === 'tie'
                ? 'Os dois rendem o mesmo dano por rotação.'
                : `${cmp.winner === 'b' ? 'B' : 'A'} rende ${signed(Math.abs(cmp.dprChange ?? 0), 1).replace('+', '')} a mais de dano por rotação que ${cmp.winner === 'b' ? 'A' : 'B'}.`}
            </p>

            <table className="ast-table ast-cmp">
              <thead>
                <tr><th scope="col">Indicador</th><th scope="col">A · {a.title}</th><th scope="col">B · {b.title}</th><th scope="col">B contra A</th></tr>
              </thead>
              <tbody>
                <tr style={{ cursor: 'default' }}><td>DPS</td><td>{compact(a.dps)}</td><td>{compact(b.dps)}</td><td className={tone(cmp.dpsChange)}>{signed(cmp.dpsChange, 2)}</td></tr>
                <tr style={{ cursor: 'default' }}><td>DPR (dano por rotação)</td><td>{compact(a.dpr)}</td><td>{compact(b.dpr)}</td><td className={tone(cmp.dprChange)}>{signed(cmp.dprChange, 2)}</td></tr>
                <tr style={{ cursor: 'default' }}>
                  <td>Duração</td><td>{formatDecimal(a.duration, 1)} s</td><td>{formatDecimal(b.duration, 1)} s</td>
                  <td>{cmp.durationChange === 0 ? 'igual' : `${cmp.durationChange > 0 ? '+' : ''}${formatDecimal(cmp.durationChange, 1)} s`}</td>
                </tr>
              </tbody>
            </table>

            <h2 className="ast-caps ast-subtitle">Personagem por personagem</h2>
            <div className="ast-scroll">
              <table className="ast-table ast-cmp">
                <thead>
                  <tr><th scope="col">Personagem</th><th scope="col">Dano em A</th><th scope="col">Dano em B</th><th scope="col">B contra A</th><th scope="col">Build em A</th><th scope="col">Build em B</th></tr>
                </thead>
                <tbody>
                  {cmp.members.map((m) => (
                    <tr key={m.name} style={{ cursor: 'default' }}>
                      <td>{m.name}</td>
                      <td>{m.a ? `${formatInt(m.a.avg)} (${formatPercent(m.a.share, 0)})` : 'fora da equipe'}</td>
                      <td>{m.b ? `${formatInt(m.b.avg)} (${formatPercent(m.b.share, 0)})` : 'fora da equipe'}</td>
                      <td className={tone(m.avgChange)}>{signed(m.avgChange)}</td>
                      <td className="build">{m.a ? `${m.a.weapon} · ${m.a.mains} · ${formatDecimal(m.a.er * 100, 0)}% ER` : '—'}</td>
                      <td className="build">{m.b ? `${m.b.weapon} · ${m.b.mains} · ${formatDecimal(m.b.er * 100, 0)}% ER` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
