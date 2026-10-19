/** Otimizador de artefatos (/projeto/:id/otimizador/:nome?): os melhores conjuntos do inventário GOOD para um personagem do time. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useProjectView } from '../app/ProjectContext';
import { CharacterAvatar, Chip, Panel, Segmented } from '../design/primitives';
import { pieceIconUrl } from '../design/images';
import { norm, type Good, type GoodArtifact } from '../features/good/goodImport';
import { loadGood } from '../features/good/goodStore';
import { startOptimizerJob, type OptimizerJob, type OptimizerProgress } from '../features/optimizer/client';
import type { Constraints, Objective } from '../features/optimizer/evaluator';
import { DEFAULT_CONFIG, countCandidates, type OptimizedBuild, type OptimizerConfig, type OptimizerResult } from '../features/optimizer/run';
import { useRotationStore } from '../features/rotation/store';
import { formatDecimal, formatInt } from '../ui/format';
import './otimizador.css';

const SLOTS = [
  { key: 'flower', label: 'Flor' },
  { key: 'plume', label: 'Pluma' },
  { key: 'sands', label: 'Areia' },
  { key: 'goblet', label: 'Cálice' },
  { key: 'circlet', label: 'Tiara' },
] as const;

const MAIN_LABEL: Record<string, string> = {
  hp: 'HP', atk: 'ATK', hp_: 'HP%', atk_: 'ATK%', def_: 'DEF%', eleMas: 'Maestria', enerRech_: 'Recarga', critRate_: 'Taxa Crítica',
  critDMG_: 'Dano Crítico', heal_: 'Cura', pyro_dmg_: 'DMG Pyro', hydro_dmg_: 'DMG Hydro', cryo_dmg_: 'DMG Cryo', electro_dmg_: 'DMG Electro',
  anemo_dmg_: 'DMG Anemo', geo_dmg_: 'DMG Geo', dendro_dmg_: 'DMG Dendro', physical_dmg_: 'DMG Físico',
};
const SUB_LABEL: Record<string, string> = { hp: 'HP', hp_: 'HP%', atk: 'ATK', atk_: 'ATK%', def: 'DEF', def_: 'DEF%', eleMas: 'EM', enerRech_: 'ER', critRate_: 'CR', critDMG_: 'CD' };
const PERCENT = new Set(['hp_', 'atk_', 'def_', 'enerRech_', 'critRate_', 'critDMG_', 'heal_', 'pyro_dmg_', 'hydro_dmg_', 'cryo_dmg_', 'electro_dmg_', 'anemo_dmg_', 'geo_dmg_', 'dendro_dmg_', 'physical_dmg_']);
const fmtStat = (key: string, value: number) => (PERCENT.has(key) ? `${formatDecimal(value, 1)}%` : formatInt(value));

type Focus = 'team' | 'member' | 'action' | 'stat';
type StatKey = 'hp' | 'atk' | 'def' | 'em' | 'er';
const STAT_LABEL: Record<StatKey, string> = { hp: 'HP máximo', atk: 'ATK', def: 'DEF', em: 'Maestria', er: 'Recarga' };

interface UiState {
  focus: Focus;
  action: number;
  stat: StatKey;
  mins: Record<'er' | 'cr' | 'cd' | 'em' | 'hp' | 'atk' | 'def', string>;
  levelMin: number;
  levelMax: number;
  topN: number;
  borrow: boolean;
  /** Main stats desmarcados por posição (guarda o que sai, para novos main stats do inventário entrarem sozinhos). */
  offMains: Record<'sands' | 'goblet' | 'circlet', string[]>;
  offSets: string[];
}

const initial: UiState = {
  focus: 'team', action: 0, stat: 'hp', mins: { er: '', cr: '', cd: '', em: '', hp: '', atk: '', def: '' },
  levelMin: 0, levelMax: 20, topN: 5, borrow: false, offMains: { sands: [], goblet: [], circlet: [] }, offSets: [],
};

const STORAGE = 'astralys.otimizador';
const readUi = (): UiState => {
  try {
    const raw = localStorage.getItem(STORAGE);
    return raw ? { ...initial, ...(JSON.parse(raw) as Partial<UiState>) } : initial;
  } catch {
    return initial;
  }
};

function Img({ src, fallback }: { src?: string; fallback: string }) {
  const [failed, setFailed] = useState(false);
  return src && !failed ? <img src={src} alt="" loading="lazy" crossOrigin="anonymous" onError={() => setFailed(true)} /> : <b className="ph" aria-hidden="true">{fallback}</b>;
}

export default function Otimizador() {
  const v = useProjectView();
  const { nome } = useParams();
  const navigate = useNavigate();
  const update = useRotationStore((s) => s.updateMember);
  const { project, data, colors } = v;
  const index = Math.max(0, project.members.findIndex((m) => m.character === nome));
  const ref = project.members[index];
  const character = data.game.characters.find((c) => c.name === ref?.character);

  const [good, setGood] = useState<Good | null>(() => loadGood());
  const [ui, setUi] = useState<UiState>(readUi);
  const [progress, setProgress] = useState<OptimizerProgress | null>(null);
  const [result, setResult] = useState<OptimizerResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [equippedKey, setEquippedKey] = useState<string | null>(null);
  const job = useRef<OptimizerJob | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(ui));
    } catch {
      /* sem armazenamento: a tela continua */
    }
  }, [ui]);
  useEffect(() => () => job.current?.stop(), []);
  useEffect(() => {
    setResult(null);
    setError(null);
  }, [index]);
  useEffect(() => {
    const refresh = () => setGood(loadGood());
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);

  const characterKey = useMemo(() => good?.characters.find((c) => norm(c.key) === norm(ref?.character ?? ''))?.key ?? ref?.character ?? '', [good, ref]);
  const setInfo = useMemo(() => {
    const map = new Map<string, { key: string; name: string; id?: number; count: number }>();
    for (const a of good?.artifacts ?? []) {
      const s = data.game.artifacts.find((x) => norm(x.name) === norm(a.setKey));
      const cur = map.get(a.setKey) ?? { key: a.setKey, name: s?.name ?? a.setKey, id: s?.id, count: 0 };
      cur.count++;
      map.set(a.setKey, cur);
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [good, data.game.artifacts]);
  const mainsOf = (slot: 'sands' | 'goblet' | 'circlet') => {
    const counts = new Map<string, number>();
    for (const a of good?.artifacts ?? []) if (a.slotKey === slot) counts.set(a.mainStatKey, (counts.get(a.mainStatKey) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  };

  if (!ref) return <Navigate to={`/projeto/${v.id}`} replace />;

  const memberActions = v.resolved.actions.map((a, i) => ({ a, i })).filter(({ a }) => a.member === index);
  const buffStats = (v.resolved.team.members[index]?.characterEffect?.buffs ?? []).filter((b) => b.convert && b.convert.from !== 'partyEnergy' && b.convert.from !== 'baseAtk');
  const buffShortcuts = [...new Map(buffStats.map((b) => [b.convert!.from, b])).entries()].filter(([from]) => from in STAT_LABEL) as [StatKey, (typeof buffStats)[number]][];

  const config = (): OptimizerConfig => {
    const num = (s: string, f: number) => (s.trim() === '' || Number.isNaN(Number(s)) ? undefined : Number(s) / f);
    const constraints: Constraints = {
      er: num(ui.mins.er, 100), cr: num(ui.mins.cr, 100), cd: num(ui.mins.cd, 100),
      em: num(ui.mins.em, 1), hp: num(ui.mins.hp, 1), atk: num(ui.mins.atk, 1), def: num(ui.mins.def, 1),
    };
    const objective: Objective = ui.focus === 'team' ? { kind: 'team' } : ui.focus === 'member' ? { kind: 'member' } : ui.focus === 'action' ? { kind: 'action', index: ui.action } : { kind: 'stat', stat: ui.stat };
    const mainStats: OptimizerConfig['mainStats'] = {};
    for (const slot of ['sands', 'goblet', 'circlet'] as const) {
      const on = mainsOf(slot).map(([k]) => k).filter((k) => !ui.offMains[slot].includes(k));
      if (on.length !== mainsOf(slot).length) mainStats[slot] = on;
    }
    return {
      ...DEFAULT_CONFIG, levelMin: ui.levelMin, levelMax: ui.levelMax, topN: ui.topN, objective, mainStats,
      constraints: Object.fromEntries(Object.entries(constraints).filter(([, x]) => x !== undefined)) as Constraints,
      allowedSets: ui.offSets.length ? setInfo.map((s) => s.key).filter((k) => !ui.offSets.includes(k)) : undefined,
      borrowFrom: ui.borrow ? 'all' : 'none',
    };
  };

  const preview = good && character ? countCandidates(good, characterKey, character.element, config(), data.game) : null;

  const run = () => {
    if (!good) return;
    setRunning(true);
    setError(null);
    setResult(null);
    setEquippedKey(null);
    setProgress(null);
    const j = startOptimizerJob(
      {
        good, characterKey, config: config(), member: index, rolls: v.bundle.optimization.rolls, ref,
        resolved: { team: v.resolved.team, actions: v.resolved.actions, flatEffects: v.resolved.flatEffects, ampCoefficient: v.resolved.ampCoefficient },
        planilha: project.compat === 'planilha', game: data.game, effects: data.effects,
      },
      setProgress,
    );
    job.current = j;
    j.promise.then((r) => setResult(r), (e) => setError(e instanceof Error ? e.message : String(e))).finally(() => setRunning(false));
  };
  const stop = () => job.current?.stop();

  const equip = (b: OptimizedBuild) => {
    update(index, { artifacts: b.loadout.artifacts, primarySet: b.loadout.primarySet, secondarySet: b.loadout.secondarySet, fourPiece: b.loadout.fourPiece, manualRolls: b.loadout.manualRolls });
    setEquippedKey(b.key);
  };

  const toggle = (list: string[], key: string) => (list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);
  const focusValue = (r: OptimizedBuild['report']) =>
    ui.focus === 'stat' ? (ui.stat === 'er' ? `${formatDecimal(r.value * 100, 0)}%` : formatInt(r.value)) : formatInt(r.value);
  const base = result?.equipped?.report.value;

  return (
    <main className="dz-page ot">
      <section className="dz-pagehead">
        <div className="titles">
          <span className="lbl">Otimizador de artefatos · {project.name}</span>
          <h1 className="h1">Os melhores artefatos de {ref.character}</h1>
          <span className="muted">Busca exata no seu inventário: testa as combinações que importam e descarta só o que não pode vencer.</span>
        </div>
      </section>

      <div className="ot-team" role="tablist" aria-label="Quem otimizar">
        {project.members.map((m, i) => {
          const c = data.game.characters.find((x) => x.name === m.character);
          return (
            <button key={m.character} type="button" role="tab" aria-selected={i === index} className="ot-member" style={{ ['--c' as string]: colors[i] }} onClick={() => navigate(`/projeto/${v.id}/otimizador/${encodeURIComponent(m.character)}`)}>
              <CharacterAvatar name={m.character} icon={c?.icon} color={colors[i]} size={56} />
              <span className="n">{m.character}</span>
            </button>
          );
        })}
      </div>

      {!good ? (
        <Panel title="Inventário">
          <div className="ot-empty">
            <p>O otimizador usa as peças que você tem. Importe o inventário (arquivo do Genshin Optimizer ou pelo UID) e volte aqui.</p>
            <Link className="dz-btn gold" to="/inventario">Importar o inventário</Link>
          </div>
        </Panel>
      ) : (
        <div className="ot-grid">
          <div className="ot-side">
            <Panel title="Foco da build">
              <div className="ot-focus" role="group" aria-label="Foco da build">
                {([['team', 'Dano do time'], ['member', `Dano de ${ref.character}`], ['action', 'Um golpe'], ['stat', 'Um stat']] as [Focus, string][]).map(([k, label]) => (
                  <button key={k} type="button" aria-pressed={ui.focus === k} onClick={() => setUi({ ...ui, focus: k })}>{label}</button>
                ))}
              </div>
              {ui.focus === 'action' && (
                <select className="dz-input" aria-label="Golpe" value={ui.action} onChange={(e) => setUi({ ...ui, action: Number(e.target.value) })}>
                  {memberActions.length === 0 && <option value={0}>Sem golpes dele na rotação</option>}
                  {memberActions.map(({ a, i }) => <option key={a.id} value={i}>{(a.time ?? 0).toFixed(1)} s · {a.move.label}</option>)}
                </select>
              )}
              {ui.focus === 'stat' && (
                <div className="ot-chips">
                  {(Object.keys(STAT_LABEL) as StatKey[]).map((k) => (
                    <button key={k} type="button" className="ot-chip" aria-pressed={ui.stat === k} onClick={() => setUi({ ...ui, stat: k })}>{STAT_LABEL[k]}</button>
                  ))}
                </div>
              )}
              {buffShortcuts.length > 0 && (
                <div className="ot-buffs">
                  <span className="muted small">Quem dá buff que escala com stat? Maximize a fonte:</span>
                  {buffShortcuts.map(([from, b]) => (
                    <button key={from} type="button" className="ot-chip warm" onClick={() => setUi({ ...ui, focus: 'stat', stat: from })} title={b.note}>
                      {STAT_LABEL[from]} · {b.label}
                    </button>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Mínimos nos stats finais">
              <div className="ot-mins">
                {([['er', 'Recarga', '%'], ['cr', 'Taxa Crítica', '%'], ['cd', 'Dano Crítico', '%'], ['em', 'Maestria', ''], ['hp', 'HP', ''], ['atk', 'ATK', ''], ['def', 'DEF', '']] as const).map(([k, label, suf]) => (
                  <label key={k}>
                    <span>{label}</span>
                    <input className="dz-input" inputMode="decimal" placeholder="—" value={ui.mins[k]} onChange={(e) => setUi({ ...ui, mins: { ...ui.mins, [k]: e.target.value } })} aria-label={`${label} mínima`} />
                    {suf && <i>{suf}</i>}
                  </label>
                ))}
              </div>
            </Panel>

            <Panel title="Peças">
              <div className="ot-row">
                <label>Nível <input className="dz-input sm" type="number" min={0} max={20} value={ui.levelMin} onChange={(e) => setUi({ ...ui, levelMin: Math.min(20, Math.max(0, Number(e.target.value))) })} aria-label="Nível mínimo" /> a <input className="dz-input sm" type="number" min={0} max={20} value={ui.levelMax} onChange={(e) => setUi({ ...ui, levelMax: Math.min(20, Math.max(0, Number(e.target.value))) })} aria-label="Nível máximo" /></label>
                <label className="ot-switch"><input type="checkbox" checked={ui.borrow} onChange={(e) => setUi({ ...ui, borrow: e.target.checked })} /> Usar peças que outros personagens estão usando</label>
              </div>
              {(['sands', 'goblet', 'circlet'] as const).map((slot) => (
                <div className="ot-mains" key={slot}>
                  <span className="lbl">{SLOTS.find((s) => s.key === slot)!.label}</span>
                  <div className="ot-chips">
                    {mainsOf(slot).map(([k, n]) => (
                      <button key={k} type="button" className="ot-chip" aria-pressed={!ui.offMains[slot].includes(k)} onClick={() => setUi({ ...ui, offMains: { ...ui.offMains, [slot]: toggle(ui.offMains[slot], k) } })}>
                        {MAIN_LABEL[k] ?? k} <small>{n}</small>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </Panel>

            <Panel title="Sets" aside={<button type="button" className="dz-link" onClick={() => setUi({ ...ui, offSets: [] })}>Marcar todos</button>}>
              <div className="ot-sets">
                {setInfo.map((s) => (
                  <button key={s.key} type="button" className="ot-set" aria-pressed={!ui.offSets.includes(s.key)} onClick={() => setUi({ ...ui, offSets: toggle(ui.offSets, s.key) })} title={s.name}>
                    <Img src={s.id ? pieceIconUrl(s.id, 'flower') : undefined} fallback="◆" />
                    <small>{s.count}</small>
                  </button>
                ))}
              </div>
            </Panel>

            <div className="ot-go">
              <label>Melhores a mostrar
                <select className="dz-input sm" value={ui.topN} onChange={(e) => setUi({ ...ui, topN: Number(e.target.value) })}>
                  {[1, 2, 3, 4, 5, 8, 10].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              {preview && (
                <span className="muted small">
                  {preview.total} peças entram ({preview.perSlot.join(' / ')} por posição)
                  {preview.removed.equippedByOthers > 0 && !ui.borrow ? ` · ${preview.removed.equippedByOthers} em outros personagens ficam de fora` : ''}
                </span>
              )}
              {running ? (
                <button type="button" className="dz-btn" onClick={stop}>Parar</button>
              ) : (
                <button type="button" className="dz-btn gold big" onClick={run}>Otimizar</button>
              )}
            </div>
          </div>

          <div className="ot-main">
            {running && (
              <div className="ot-progress" role="status" aria-live="polite">
                <div className="bar"><i /></div>
                <span>
                  Buscando… {progress ? `${formatInt(progress.evaluations)} combinações testadas · ${(progress.elapsedMs / 1000).toFixed(0)} s` : 'preparando'}
                  {progress && Number.isFinite(progress.best) ? ` · melhor até agora ${focusValue({ value: progress.best } as OptimizedBuild['report'])}` : ''}
                </span>
              </div>
            )}
            {error && <p className="dz-error" role="alert">{error}</p>}
            {!running && !result && !error && (
              <div className="ot-empty">
                <p>Escolha o foco e os filtros e toque em <b>Otimizar</b>. {ui.focus === 'team' ? 'O dano do time inclui os buffs que este personagem dá aos outros.' : ''}</p>
              </div>
            )}
            {result && (
              <>
                <div className="ot-summary">
                  <span>{result.stopped ? 'Busca parada: estes são os melhores achados até aqui.' : 'Busca completa: nenhum conjunto melhor existe com estes filtros.'}</span>
                  <span className="muted small">{formatInt(result.stats.evaluations)} avaliações de {result.stats.combinations.toExponential(1)} combinações</span>
                </div>
                {result.equipped && (
                  <BuildCard title="Equipado hoje" build={result.equipped} base={undefined} focusValue={focusValue} data={data.game.artifacts} focus={ui.focus} />
                )}
                {result.builds.length === 0 && <p className="note">Nenhum conjunto cumpre os mínimos escolhidos. Afrouxe um deles.</p>}
                {result.builds.map((b, i) => (
                  <BuildCard key={b.key} title={`#${i + 1}`} build={b} base={base} focusValue={focusValue} data={data.game.artifacts} focus={ui.focus} onEquip={() => equip(b)} equipped={equippedKey === b.key} />
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function BuildCard({ title, build, base, focusValue, data, focus, onEquip, equipped }: {
  title: string;
  build: OptimizedBuild;
  base?: number;
  focusValue: (r: OptimizedBuild['report']) => string;
  data: { name: string; id: number }[];
  focus: Focus;
  onEquip?: () => void;
  equipped?: boolean;
}) {
  const r = build.report;
  const delta = base && Number.isFinite(r.value) ? (r.value / base - 1) * 100 : undefined;
  return (
    <article className="ot-build" data-now={!onEquip}>
      <header>
        <span className="rank">{title}</span>
        <div className="val">
          <b className="num">{focusValue(r)}</b>
          <small>{focus === 'team' ? 'dano da rotação' : focus === 'member' ? 'dano dele' : focus === 'action' ? 'dano do golpe' : 'valor do stat'}</small>
        </div>
        {delta !== undefined && <Chip tone={delta >= 0 ? '#7bd88f' : '#e06c75'}>{delta >= 0 ? '+' : ''}{formatDecimal(delta, 2)}% contra o equipado</Chip>}
        <span className="set">{build.setLabel}</span>
        {onEquip && (
          <button type="button" className="dz-btn gold" onClick={onEquip} disabled={equipped}>{equipped ? 'Equipado' : 'Equipar'}</button>
        )}
      </header>
      <div className="pieces">
        {build.pieces.map((a: GoodArtifact) => {
          const set = data.find((x) => norm(x.name) === norm(a.setKey));
          return (
            <div className="piece" key={`${a.slotKey}`} data-rarity={a.rarity}>
              <span className="art"><Img src={set ? pieceIconUrl(set.id, a.slotKey as 'flower') : undefined} fallback="◆" /></span>
              <span className="main">{MAIN_LABEL[a.mainStatKey] ?? a.mainStatKey}</span>
              <ul>
                {a.substats.map((s) => <li key={s.key}><span>{SUB_LABEL[s.key] ?? s.key}</span><b className="num">{fmtStat(s.key, s.value)}</b></li>)}
              </ul>
              {a.location && <span className="loc">de {a.location}</span>}
            </div>
          );
        })}
      </div>
      <footer className="num">
        <span>ATK {formatInt(r.stats.atk)}</span><span>HP {formatInt(r.stats.hp)}</span><span>DEF {formatInt(r.stats.def)}</span>
        <span>Taxa {formatDecimal(r.stats.critRate * 100, 1)}%</span><span>Dano Crít. {formatDecimal(r.stats.critDmg * 100, 1)}%</span>
        <span>EM {formatInt(r.stats.em)}</span><span>ER {formatDecimal(r.stats.er * 100, 0)}%</span>
        <span className="muted">DPR do time {formatInt(r.teamAvg)}</span>
      </footer>
    </article>
  );
}
