/**
 * Otimizador de artefatos, como aba "Otimizar" da página do personagem (/projeto/:id/personagem/:nome?aba=otimizar):
 * a otimização é individual de cada personagem. A rota antiga /projeto/:id/otimizador/:nome? redireciona para lá.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useProjectView } from '../app/ProjectContext';
import { Chip, Panel } from '../design/primitives';
import { DualRange, SecHead, StatChip, STAT_COLOR, STAT_TAG } from '../design/filtros';
import { pieceIconUrl } from '../design/images';
import { norm, type Good, type GoodArtifact } from '../features/good/goodImport';
import { loadGood } from '../features/good/goodStore';
import { startOptimizerJob, type OptimizerJob, type OptimizerProgress } from '../features/optimizer/client';
import type { Constraints, Objective } from '../features/optimizer/evaluator';
import { DEFAULT_CONFIG, countCandidates, type OptimizedBuild, type OptimizerConfig, type OptimizerResult } from '../features/optimizer/run';
import { REACTION_LABEL, reactionOptions } from '../features/character/characterModel';
import { useRotationStore } from '../features/rotation/store';
import { energyMembers, energyResults } from '../features/energy/energyModel';
import type { ReactionChoice } from '../engine';
import { mainStatValue } from '../engine/pieces';
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

type Goal = 'dano' | 'buff' | 'stat';
type Scope = 'team' | 'member' | 'move';
type Crit = 'avg' | 'crit' | 'noCrit';
type StatKey = 'hp' | 'atk' | 'def' | 'em' | 'er';
const STAT_LABEL: Record<StatKey, string> = { hp: 'HP máximo', atk: 'ATK', def: 'DEF', em: 'Maestria', er: 'Recarga' };
const FROM_LABEL: Record<string, string> = { atk: 'o ATK', baseAtk: 'o ATK base', hp: 'o HP', def: 'a DEF', em: 'a Maestria', er: 'a Recarga' };
const CRIT_LABEL: Record<Crit, string> = { avg: 'Média com crítico', crit: 'Sempre crítico', noCrit: 'Sem crítico' };
const CRIT_SHORT: Record<Crit, string> = { avg: 'Média', crit: 'Sempre', noCrit: 'Nunca' };
const TALENT_LABEL = { normal: 'Ataque normal', skill: 'Habilidade', burst: 'Supremo' } as const;

interface UiState {
  /** O que otimizar: dano, o valor de um buff ou um stat. */
  goal: Goal;
  /** Dano de: toda a rotação do time, só do personagem ou um golpe do kit. */
  scope: Scope;
  moveId: string;
  reaction: string;
  crit: Crit;
  buffId: string;
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
  goal: 'dano', scope: 'team', moveId: '', reaction: 'none', crit: 'avg', buffId: '', stat: 'hp', mins: { er: '', cr: '', cd: '', em: '', hp: '', atk: '', def: '' },
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

/** Rota antiga: manda para a aba Otimizar do personagem. */
export default function Otimizador() {
  const v = useProjectView();
  const { nome } = useParams();
  return <Navigate to={`/projeto/${v.id}/personagem/${encodeURIComponent(nome ?? v.project.members[0].character)}?aba=otimizar`} replace />;
}

export function OtimizadorPanel({ index }: { index: number }) {
  const v = useProjectView();
  const update = useRotationStore((s) => s.updateMember);
  const { project, data } = v;
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

  if (!ref) return null;

  const inLevel = (a: GoodArtifact) => (a.level ?? 0) >= ui.levelMin && (a.level ?? 0) <= ui.levelMax;
  const allArt = good?.artifacts ?? [];
  const levelCount = allArt.filter(inLevel).length;
  const slotCount = (slot: string) => allArt.filter((a) => a.slotKey === slot && inLevel(a)).length;
  const slotTotal = (slot: string) => allArt.filter((a) => a.slotKey === slot).length;
  const mineKey = norm(characterKey);
  const othersCount = allArt.filter((a) => a.location && norm(a.location) !== mineKey).length;
  const setsOn = setInfo.filter((s) => !ui.offSets.includes(s.key)).length;

  const moves = data.game.moves.filter((m) => m.character === ref.character);
  const moveChosen = moves.find((m) => m.id === ui.moveId) ?? moves.find((m) => m.talent === 'burst') ?? moves[0];
  const teamElements = v.resolved.team.members.map((m) => m.character.element);
  const reactions = character ? reactionOptions(character.element, teamElements) : (['none'] as ReactionChoice[]);
  const reaction = (reactions.includes(ui.reaction as ReactionChoice) ? ui.reaction : 'none') as ReactionChoice;
  /** Buffs que este personagem dá e que crescem com os stats dele (o valor muda com o build). */
  const effect = v.resolved.team.members[index]?.characterEffect;
  const buffOptions = [
    ...(effect?.teamFlatAtk ? [{ id: `flat-atk-${index}`, label: 'ATK fixo que ele dá ao time', hint: 'cresce com o ATK dele' }] : []),
    ...(effect?.buffs ?? [])
      .filter((b) => b.convert && b.convert.from !== 'partyEnergy' && (b.minConstellation ?? 0) <= (ref.constellation ?? 0))
      .map((b) => ({ id: `cbuff-${index}-${b.id}`, label: b.label, hint: `cresce com ${FROM_LABEL[b.convert!.from] ?? b.convert!.from}` })),
  ];
  const buffChosen = buffOptions.find((b) => b.id === ui.buffId) ?? buffOptions[0];

  const config = (): OptimizerConfig => {
    const num = (s: string, f: number) => (s.trim() === '' || Number.isNaN(Number(s)) ? undefined : Number(s) / f);
    const constraints: Constraints = {
      er: num(ui.mins.er, 100), cr: num(ui.mins.cr, 100), cd: num(ui.mins.cd, 100),
      em: num(ui.mins.em, 1), hp: num(ui.mins.hp, 1), atk: num(ui.mins.atk, 1), def: num(ui.mins.def, 1),
    };
    const objective: Objective =
      ui.goal === 'stat' ? { kind: 'stat', stat: ui.stat }
      : ui.goal === 'buff' ? { kind: 'buff', buffId: buffChosen?.id ?? '' }
      : ui.scope === 'move' && moveChosen ? { kind: 'move', moveId: moveChosen.id, reaction, crit: ui.crit }
      : ui.scope === 'member' ? { kind: 'member' }
      : { kind: 'team' };
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
    // Equipar põe as 5 peças reais no personagem: o dano calculado é exatamente o mostrado aqui.
    update(index, { pieces: b.pieces.map((p) => ({ ...p })) });
    setEquippedKey(b.key);
  };

  const toggle = (list: string[], key: string) => (list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);
  const focusValue = (r: OptimizedBuild['report']) =>
    ui.goal === 'stat' ? (ui.stat === 'er' ? `${formatDecimal(r.value * 100, 0)}%` : formatInt(r.value))
    : ui.goal === 'buff' ? (Math.abs(r.value) < 10 ? `${formatDecimal(r.value * 100, 1)}%` : formatInt(r.value))
    : formatInt(r.value);
  const goalCaption = ui.goal === 'stat' ? STAT_LABEL[ui.stat] : ui.goal === 'buff' ? (buffChosen?.label ?? 'buff') : ui.scope === 'move' ? `${moveChosen?.labelPt ?? moveChosen?.label ?? 'golpe'} · ${REACTION_LABEL[reaction] ?? reaction}` : ui.scope === 'member' ? `dano de ${ref.character}` : 'dano da rotação do time';
  const base = result?.equipped?.report.value;
  /** Recarga que a calculadora de recarga do projeto pede para este personagem (null se ele não usa o Supremo). */
  const erNeeded = (() => {
    const r = energyResults(project, energyMembers(project, data.game.characters, data.particles))[index];
    return r && r.status !== 'ignored' ? Math.ceil(r.neededER * 1000) / 10 : null;
  })();
  const minsOn = Object.values(ui.mins).filter((x) => x.trim() !== '').length;

  const equippedSig = new Set((result?.equipped?.pieces ?? []).map(pieceSig));

  return (
    <div className="ot">
      {!good ? (
        <Panel title="Inventário">
          <div className="ot-empty">
            <p>Importe o inventário (arquivo do Genshin Optimizer ou UID) para otimizar.</p>
            <Link className="dz-btn gold" to="/inventario">Importar o inventário</Link>
          </div>
        </Panel>
      ) : (
        <>
          <div className="ot-top">
            <Panel title="Mínimos nos stats" aside={<span className="fx-badge num">{minsOn} ativos</span>} className="fx-panel">
              <div className="ot-mins">
                {([['er', 'Recarga', '%'], ['cr', 'Taxa crítica', '%'], ['cd', 'Dano crítico', '%'], ['em', 'Maestria', ''], ['hp', 'HP', ''], ['atk', 'ATK', ''], ['def', 'DEF', '']] as const).map(([k, label, suf]) => (
                  <label key={k}>
                    <span>{label}</span>
                    <input className="dz-input" inputMode="decimal" placeholder="—" value={ui.mins[k]} onChange={(e) => setUi({ ...ui, mins: { ...ui.mins, [k]: e.target.value } })} aria-label={`${label} mínima`} />
                    {suf && <i>{suf}</i>}
                  </label>
                ))}
              </div>
              {erNeeded !== null ? (
                <p className="ot-tip">
                  A calculadora de recarga pede <b className="num">{formatDecimal(erNeeded, 1)}%</b> para {ref.character}.{' '}
                  <button type="button" className="dz-link" onClick={() => setUi({ ...ui, mins: { ...ui.mins, er: String(erNeeded) } })}>Usar como mínimo</button>
                  {' · '}<Link className="dz-link" to={`/projeto/${v.id}/recarga`}>Abrir a calculadora</Link>
                </p>
              ) : (
                <p className="ot-tip">Ex.: Recarga ≥ 120% para não faltar energia na rotação.</p>
              )}
            </Panel>

            <Panel title="Filtro de artefatos" aside={<span className="fx-badge num">{levelCount}/{allArt.length}</span>} className="fx-panel">
              <div className="fx-box">
                <SecHead title="Nível" />
                <DualRange min={0} max={20} low={ui.levelMin} high={ui.levelMax} label="Nível" onChange={(lo, hi) => setUi({ ...ui, levelMin: lo, levelMax: hi })} />
              </div>
              <div className="fx-box">
                <SecHead title="Peças disponíveis" />
                <div className="fx-grid">
                  {SLOTS.map((sl) => <StatChip key={sl.key} tag={sl.label} n={slotCount(sl.key)} on={slotCount(sl.key) > 0} label={`${sl.label}: ${slotCount(sl.key)} de ${slotTotal(sl.key)} no filtro de nível`} />)}
                </div>
              </div>
              {(['sands', 'goblet', 'circlet'] as const).map((slot) => {
                const mains = mainsOf(slot);
                const on = mains.filter(([k]) => !ui.offMains[slot].includes(k)).length;
                return (
                  <div className="fx-box" key={slot} data-slot={slot}>
                    <SecHead
                      title={SLOTS.find((x) => x.key === slot)!.label}
                      count={on}
                      total={mains.length}
                      aside={<button type="button" className="dz-link" onClick={() => setUi({ ...ui, offMains: { ...ui.offMains, [slot]: on === mains.length ? mains.map(([k]) => k) : [] } })}>{on === mains.length ? 'Nenhum' : 'Todos'}</button>}
                    />
                    <div className="fx-grid">
                      {mains.map(([k, n]) => (
                        <StatChip key={k} tag={STAT_TAG[k] ?? k} n={n} on={!ui.offMains[slot].includes(k)} color={STAT_COLOR[k]} label={`${MAIN_LABEL[k] ?? k}: ${n} peças`} className="ot-chip-main"
                          onClick={() => setUi({ ...ui, offMains: { ...ui.offMains, [slot]: toggle(ui.offMains[slot], k) } })} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </Panel>

            <Panel
              title="Sets"
              aside={
                <span className="ot-aside">
                  <span className="fx-badge num">{setsOn}/{setInfo.length}</span>
                  <button type="button" className="dz-link" onClick={() => setUi({ ...ui, offSets: ui.offSets.length ? [] : setInfo.map((x) => x.key) })}>{ui.offSets.length ? 'Marcar todos' : 'Nenhum'}</button>
                </span>
              }
              className="fx-panel ot-sets-panel"
            >
              <div className="ot-sets">
                {setInfo.map((x) => (
                  <button key={x.key} type="button" className="ot-set" aria-pressed={!ui.offSets.includes(x.key)} onClick={() => setUi({ ...ui, offSets: toggle(ui.offSets, x.key) })} title={x.name}>
                    <Img src={x.id ? pieceIconUrl(x.id, 'flower') : undefined} fallback="◆" />
                    <small>{x.count}</small>
                  </button>
                ))}
              </div>
              <button type="button" className="fx-wide" aria-pressed={ui.borrow} onClick={() => setUi({ ...ui, borrow: !ui.borrow })}>
                <span className="box" aria-hidden="true">✓</span>Usar artefatos de outros personagens
                <span className="fx-badge num">{ui.borrow ? othersCount : 0}/{othersCount}</span>
              </button>
            </Panel>
          </div>

          <section className="ot-bar" aria-label="Foco da otimização">
            <div className="ot-bar-row">
              <div className="ot-field">
                <span className="lbl">Otimizar</span>
                <div className="ot-seg" role="group" aria-label="O que otimizar">
                  {([['dano', 'Dano', 'Dano do time, dele ou de um golpe'], ['buff', 'Buff', 'O maior valor de um buff que ele dá ao time (foco de suportes)'], ['stat', 'Stat', 'O maior valor final de HP, ATK, Maestria… (use os mínimos para não perder o resto)']] as [Goal, string, string][]).map(([k, label, tip]) => (
                    <button key={k} type="button" aria-pressed={ui.goal === k} title={tip} onClick={() => setUi({ ...ui, goal: k })}>{label}</button>
                  ))}
                </div>
              </div>

              {ui.goal === 'dano' && (
                <>
                  <div className="ot-field">
                    <span className="lbl">Alvo</span>
                    <div className="ot-seg" role="group" aria-label="Dano de" title="Rotação do time: soma o dano de todos, com os buffs que ele dá nas janelas. Um golpe: avaliado sozinho com todos os buffs ligados.">
                      {([['team', 'Rotação do time'], ['member', `Só ${ref.character}`], ['move', 'Um golpe']] as [Scope, string][]).map(([k, label]) => (
                        <button key={k} type="button" aria-pressed={ui.scope === k} onClick={() => setUi({ ...ui, scope: k })}>{label}</button>
                      ))}
                    </div>
                  </div>
                  {ui.scope === 'move' && (
                    <>
                      <div className="ot-field grow">
                        <span className="lbl">Golpe</span>
                        <select className="dz-input" aria-label="Golpe do kit" value={moveChosen?.id ?? ''} onChange={(e) => setUi({ ...ui, moveId: e.target.value })}>
                          {(['normal', 'skill', 'burst'] as const).map((t) => (
                            <optgroup key={t} label={TALENT_LABEL[t]}>
                              {moves.filter((m) => m.talent === t).map((m) => <option key={m.id} value={m.id}>{m.labelPt ?? m.label}</option>)}
                            </optgroup>
                          ))}
                        </select>
                      </div>
                      <div className="ot-field">
                        <span className="lbl">Reação</span>
                        <div className="ot-seg" role="group" aria-label="Reação">
                          {reactions.map((r) => (
                            <button key={r} type="button" aria-pressed={reaction === r} onClick={() => setUi({ ...ui, reaction: r })}>{REACTION_LABEL[r] ?? r}</button>
                          ))}
                        </div>
                      </div>
                      <div className="ot-field">
                        <span className="lbl">Crítico</span>
                        <div className="ot-seg" role="group" aria-label="Crítico">
                          {(Object.keys(CRIT_LABEL) as Crit[]).map((c) => (
                            <button key={c} type="button" title={CRIT_LABEL[c]} aria-pressed={ui.crit === c} onClick={() => setUi({ ...ui, crit: c })}>{CRIT_SHORT[c]}</button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {ui.goal === 'buff' && (
                <div className="ot-field grow">
                  <span className="lbl">Buff</span>
                  {buffOptions.length === 0 ? (
                    <p className="note">{ref.character} não tem buff que cresça com os stats dele (nesta constelação). Escolha Dano ou Stat.</p>
                  ) : (
                    <div className="ot-seg" role="group" aria-label="Buff">
                      {buffOptions.map((b) => (
                        <button key={b.id} type="button" title={b.hint} aria-pressed={buffChosen?.id === b.id} onClick={() => setUi({ ...ui, buffId: b.id })}>{b.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {ui.goal === 'stat' && (
                <div className="ot-field grow">
                  <span className="lbl">Stat</span>
                  <div className="ot-seg" role="group" aria-label="Stat">
                    {(Object.keys(STAT_LABEL) as StatKey[]).map((k) => (
                      <button key={k} type="button" aria-pressed={ui.stat === k} onClick={() => setUi({ ...ui, stat: k })}>{STAT_LABEL[k]}</button>
                    ))}
                  </div>
                </div>
              )}

              <div className="ot-field">
                <span className="lbl">Mostrar</span>
                <select className="dz-input sm" aria-label="Melhores a mostrar" value={ui.topN} onChange={(e) => setUi({ ...ui, topN: Number(e.target.value) })}>
                  {[1, 2, 3, 4, 5, 8, 10].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            <div className="ot-go">
              {running ? (
                <button type="button" className="dz-btn" onClick={stop}>Parar</button>
              ) : (
                <button type="button" className="dz-btn gold big" onClick={run}>Otimizar</button>
              )}
              {preview && (
                <span className="muted small">
                  {preview.total} peças entram ({preview.perSlot.join(' / ')} por posição)
                  {preview.removed.equippedByOthers > 0 && !ui.borrow ? ` · ${preview.removed.equippedByOthers} em outros personagens ficam de fora` : ''}
                </span>
              )}
            </div>

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
            {result && (
              <div className="ot-summary">
                <b>{result.builds.length > 0 && result.equipped && result.builds[0].key === result.equipped.key ? 'Seu build equipado já é o melhor com estes filtros.' : result.stopped ? 'Busca parada: estes são os melhores achados até aqui.' : 'Busca completa: nenhum conjunto melhor existe com estes filtros.'}</b>
                <span className="muted small">{formatInt(result.stats.evaluations)} avaliações de {result.stats.combinations.toExponential(1)} combinações</span>
                {result.equipped && <span className="ot-now">Equipado hoje <b className="num">{focusValue(result.equipped.report)}</b></span>}
              </div>
            )}
            {!running && !result && !error && <p className="ot-tip">Escolha o foco e os filtros e toque em <b>Otimizar</b>.</p>}
          </section>

          {result && (
            <div className="ot-results">
              {result.builds.length === 0 && <p className="note">Nenhum conjunto cumpre os mínimos escolhidos. Afrouxe um deles.</p>}
              {result.builds.map((b, i) => (
                <BuildCard key={b.key} title={`#${i + 1}`} build={b} base={base} now={result.equipped?.report} equippedSig={equippedSig} focusValue={focusValue} data={data.game.artifacts} caption={goalCaption} onEquip={() => equip(b)} equipped={equippedKey === b.key} />
              ))}
              {result.equipped && (
                <BuildCard title="Hoje" build={result.equipped} equippedSig={equippedSig} focusValue={focusValue} data={data.game.artifacts} caption={goalCaption} />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function pieceSig(a: GoodArtifact) {
  return `${a.slotKey}|${a.setKey}|${a.mainStatKey}|${a.level ?? 0}|${a.substats.map((s) => `${s.key}:${s.value}`).join(',')}`;
}

function Delta({ now, prev, fmt, pct }: { now: number; prev?: number; fmt: (d: number) => string; pct?: boolean }) {
  if (prev === undefined || !Number.isFinite(now) || Math.abs(now - prev) < 1e-9) return null;
  const d = pct ? (now / prev - 1) * 100 : now - prev;
  return <small className={d >= 0 ? 'up' : 'down'}>{d >= 0 ? '+' : '−'}{fmt(Math.abs(d))}</small>;
}

function BuildCard({ title, build, base, now, equippedSig, focusValue, data, caption, onEquip, equipped }: {
  title: string;
  build: OptimizedBuild;
  base?: number;
  /** Relatório do build equipado hoje: base dos sinais de diferença nos stats. */
  now?: OptimizedBuild['report'];
  equippedSig: Set<string>;
  focusValue: (r: OptimizedBuild['report']) => string;
  data: { name: string; id: number }[];
  caption: string;
  onEquip?: () => void;
  equipped?: boolean;
}) {
  const r = build.report;
  const delta = base && Number.isFinite(r.value) ? (r.value / base - 1) * 100 : undefined;
  const isNow = !onEquip;
  const dec = (n: number) => formatDecimal(n, 1);
  const stats: { label: string; value: string; d: React.ReactNode }[] = [
    { label: 'ATK', value: formatInt(r.stats.atk), d: <Delta now={r.stats.atk} prev={now?.stats.atk} fmt={formatInt} /> },
    { label: 'HP', value: formatInt(r.stats.hp), d: <Delta now={r.stats.hp} prev={now?.stats.hp} fmt={formatInt} /> },
    { label: 'DEF', value: formatInt(r.stats.def), d: <Delta now={r.stats.def} prev={now?.stats.def} fmt={formatInt} /> },
    { label: 'Maestria', value: formatInt(r.stats.em), d: <Delta now={r.stats.em} prev={now?.stats.em} fmt={formatInt} /> },
    { label: 'Taxa crít.', value: `${dec(r.stats.critRate * 100)}%`, d: <Delta now={r.stats.critRate * 100} prev={now ? now.stats.critRate * 100 : undefined} fmt={dec} /> },
    { label: 'Dano crít.', value: `${dec(r.stats.critDmg * 100)}%`, d: <Delta now={r.stats.critDmg * 100} prev={now ? now.stats.critDmg * 100 : undefined} fmt={dec} /> },
    { label: 'Recarga', value: `${formatDecimal(r.stats.er * 100, 1)}%`, d: <Delta now={r.stats.er * 100} prev={now ? now.stats.er * 100 : undefined} fmt={dec} /> },
    { label: 'DPR do time', value: formatInt(r.teamAvg), d: <Delta now={r.teamAvg} prev={now?.teamAvg} fmt={(d) => `${formatDecimal(d, 2)}%`} pct /> },
  ];
  return (
    <article className="ot-build" data-now={isNow}>
      <header>
        <span className="rank">{title}</span>
        <div className="val">
          <b className="num">{focusValue(r)}</b>
          <small>{caption} · {build.setLabel}</small>
        </div>
        {delta !== undefined && <Chip tone={delta >= 0 ? '#7bd88f' : '#e06c75'}>{delta >= 0 ? '+' : '−'}{formatDecimal(Math.abs(delta), 2)}% contra o equipado</Chip>}
        {isNow && <Chip tone="#8a93b8">referência · em uso</Chip>}
        {onEquip && (
          <button type="button" className="dz-btn gold" onClick={onEquip} disabled={equipped}>{equipped ? 'Equipado' : 'Equipar'}</button>
        )}
      </header>
      <div className="pieces">
        {build.pieces.map((a: GoodArtifact) => {
          const set = data.find((x) => norm(x.name) === norm(a.setKey));
          const kept = equippedSig.has(pieceSig(a));
          return (
            <div className="piece" key={`${a.slotKey}`} data-rarity={a.rarity} data-change={!isNow && !kept}>
              <span className="top">
                <span>{SLOTS.find((x) => x.key === a.slotKey)?.label ?? a.slotKey}</span>
                {!isNow && <em>{kept ? 'equipada' : 'troca'}</em>}
              </span>
              <span className="art"><Img src={set ? pieceIconUrl(set.id, a.slotKey as 'flower') : undefined} fallback="◆" /></span>
              <span className="main">{MAIN_LABEL[a.mainStatKey] ?? a.mainStatKey} <b className="num">{fmtStat(a.mainStatKey, mainStatValue(a.mainStatKey, a.rarity, a.level))}</b></span>
              <ul>
                {a.substats.map((s) => <li key={s.key}><span>{SUB_LABEL[s.key] ?? s.key}</span><b className="num">{fmtStat(s.key, s.value)}</b></li>)}
              </ul>
              {a.location && <span className="loc">de {a.location}</span>}
            </div>
          );
        })}
      </div>
      <dl className="stats num">
        {stats.map((s) => (
          <div key={s.label}>
            <dt>{s.label}</dt>
            <dd>{s.value}{!isNow && s.d}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
