/**
 * Otimizador de artefatos, como aba "Otimizar" da página do personagem (/projeto/:id/personagem/:nome?aba=otimizar):
 * a otimização é individual de cada personagem. A rota antiga /projeto/:id/otimizador/:nome? redireciona para lá.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useProjectView, type ProjectView } from '../app/ProjectContext';
import { Panel, StarIcon } from '../design/primitives';
import { DualRange, STAT_TAG } from '../design/filtros';
import { pieceIconUrl } from '../design/images';
import { norm, type Good, type GoodArtifact } from '../features/good/goodImport';
import { loadGood } from '../features/good/goodStore';
import { startOptimizerJob, type OptimizerJob, type OptimizerProgress } from '../features/optimizer/client';
import type { Constraints, Objective } from '../features/optimizer/evaluator';
import { DEFAULT_CONFIG, countCandidates, evaluateEquipped, type OptimizedBuild, type OptimizerConfig, type OptimizerResult } from '../features/optimizer/run';
import { REACTION_LABEL, displayName, reactionOptions } from '../features/character/characterModel';
import { useRotationStore } from '../features/rotation/store';
import { energyMembers, energyResults } from '../features/energy/energyModel';
import { kitElement, type ElementOrPhysical, type ReactionChoice } from '../engine';
import { mainStatValue } from '../engine/pieces';
import { MAIN_LABEL, SUB_LABEL, formatMain, formatSub } from '../features/good/labels';
import { formatDecimal, formatInt } from '../ui/format';
import './otimizador.css';
import { Button, ButtonLink } from '../design/Button';
import { CurrentBuild } from './otimizar/CurrentBuild';
import { ResultCard, pieceSig, type CardCompare, type Owner } from './otimizar/ResultCard';
import { MIN_DEFS, activeMins, firstUnmet, formatMin, type MinKey } from './otimizar/minimos';
import { FamilyBadge, damageColor } from '../design/damageFamily';
import { specialOfMove } from '../engine/project';
import { MovePickerDialog, KindBadge, kindOf } from './otimizador/MovePicker';
import { elementColor } from '../design/elements';

/** Número grande em português: 4,3 mil, 3,3 bi. */
function bigNumber(n: number): string {
  if (n < 1e3) return formatInt(n);
  const units: [number, string][] = [[1e12, 'tri'], [1e9, 'bi'], [1e6, 'mi'], [1e3, 'mil']];
  const [d, name] = units.find(([d]) => n >= d)!;
  return `${formatDecimal(n / d, 1)} ${name}`;
}

const SLOTS = [
  { key: 'flower', label: 'Flor' },
  { key: 'plume', label: 'Pluma' },
  { key: 'sands', label: 'Areia' },
  { key: 'goblet', label: 'Cálice' },
  { key: 'circlet', label: 'Tiara' },
] as const;

type Goal = 'dano' | 'buff' | 'stat';
type Scope = 'team' | 'member' | 'move';
type Crit = 'avg' | 'crit' | 'noCrit';
type StatKey = 'hp' | 'atk' | 'def' | 'em' | 'er';
const STAT_LABEL: Record<StatKey, string> = { hp: 'HP máximo', atk: 'ATK', def: 'DEF', em: 'Maestria', er: 'Recarga' };
const FROM_LABEL: Record<string, string> = { atk: 'o ATK', baseAtk: 'o ATK base', hp: 'o HP', def: 'a DEF', em: 'a Maestria', er: 'a Recarga' };
const CRIT_LABEL: Record<Crit, string> = { avg: 'Média com crítico', crit: 'Sempre crítico', noCrit: 'Sem crítico' };
const CRIT_SHORT: Record<Crit, string> = { avg: 'Média', crit: 'Sempre', noCrit: 'Nunca' };
/** Glifo da posição quando falta a imagem da peça. */
const SLOT_GLYPH: Record<string, string> = { flower: '✿', plume: '✒', sands: '⌛', goblet: '♕', circlet: '♛' };
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
  /** Peças de sets desmarcados continuam entrando como peça extra, sem bônus. */
  fillerSets: boolean;
}

const initial: UiState = {
  goal: 'dano', scope: 'team', moveId: '', reaction: 'none', crit: 'avg', buffId: '', stat: 'hp', mins: { er: '', cr: '', cd: '', em: '', hp: '', atk: '', def: '' },
  levelMin: 0, levelMax: 20, topN: 5, borrow: false, offMains: { sands: [], goblet: [], circlet: [] }, offSets: [], fillerSets: true,
};

/** Cada personagem de cada projeto guarda a própria configuração do otimizador (alvo, mínimos, filtros e sets). */
const STORAGE = 'astralys.otimizador';
const storageKey = (projectId: string, character: string) => `${STORAGE}:${projectId}:${character}`;

/**
 * Padrão de um personagem que ainda não tem configuração salva: suporte com buff que cresce com os stats dele
 * (ex.: ATK fixo do Bennett) começa em "Buff"; os demais, em "Dano". A Recarga mínima vem da calculadora de recarga quando ele usa o Supremo.
 */
function roleDefaults(v: ProjectView, index: number, erNeeded: number | null): UiState {
  const ref = v.project.members[index];
  const share = v.summary.members[index]?.fraction ?? 0;
  const effect = v.resolved.team.members[index]?.characterEffect;
  const hasBuff = !!effect?.teamFlatAtk || (effect?.buffs ?? []).some((b) => b.convert && b.convert.from !== 'partyEnergy' && (b.minConstellation ?? 0) <= (ref?.constellation ?? 0));
  return { ...initial, goal: share < 0.1 && hasBuff ? 'buff' : 'dano', mins: { ...initial.mins, er: erNeeded !== null && share < 0.5 ? String(erNeeded) : '' } };
}

const readUi = (key: string, fallback: () => UiState): UiState => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...initial, ...(JSON.parse(raw) as Partial<UiState>) } : fallback();
  } catch {
    return fallback();
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
  const key = storageKey(v.id, ref?.character ?? '');
  const erDefault = (() => {
    if (!ref) return null;
    const r = energyResults(project, energyMembers(project, data.game.characters, data.particles))[index];
    return r && r.status !== 'ignored' ? Math.ceil(r.neededER * 1000) / 10 : null;
  })();
  const [store, setStore] = useState<{ key: string; ui: UiState }>(() => ({ key, ui: readUi(key, () => roleDefaults(v, index, erDefault)) }));
  // Ao trocar de personagem lê a configuração dele; enquanto o usuário não mexe, nada é gravado na chave nova.
  const ui = store.key === key ? store.ui : readUi(key, () => roleDefaults(v, index, erDefault));
  const setUi = (next: UiState) => setStore({ key, ui: next });
  const [progress, setProgress] = useState<OptimizerProgress | null>(null);
  const [result, setResult] = useState<OptimizerResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [equippedKey, setEquippedKey] = useState<string | null>(null);
  const [fieldMode, setFieldMode] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [minKey, setMinKey] = useState<MinKey>('er');
  const [minVal, setMinVal] = useState('');
  const [showAllSets, setShowAllSets] = useState(false);
  const [pickingMove, setPickingMove] = useState(false);
  const setsWrap = useRef<HTMLDivElement>(null);
  /** Quantos sets cabem em linhas inteiras na altura que sobra no painel (medido). */
  const [setLimit, setSetLimit] = useState(6);
  const job = useRef<OptimizerJob | null>(null);

  useEffect(() => {
    if (store.key !== key) return;
    try {
      localStorage.setItem(key, JSON.stringify(store.ui));
    } catch {
      /* sem armazenamento: a tela continua */
    }
  }, [store, key]);
  useEffect(() => () => job.current?.stop(), []);
  useEffect(() => {
    setResult(null);
    setError(null);
    setEquippedKey(null);
    setShowAllSets(false);
  }, [key]);
  useEffect(() => {
    const refresh = () => setGood(loadGood());
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);

  useEffect(() => {
    const el = setsWrap.current;
    if (!el) return;
    const gap = 8;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const cols = Math.max(1, Math.floor((w + gap) / (56 + gap)));
      const cell = (w - (cols - 1) * gap) / cols;
      const rows = Math.max(1, Math.floor((h + gap) / (cell + gap)));
      setSetLimit(cols * rows);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [good, showAllSets]);

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
  const pickedSets = ui.offSets.length ? setInfo.filter((s) => !ui.offSets.includes(s.key)) : [];
  const overflow = setInfo.length > setLimit;
  const visibleSets = showAllSets || !overflow ? setInfo : setInfo.slice(0, setLimit);

  const moves = data.game.moves.filter((m) => m.character === ref.character);
  const moveChosen = moves.find((m) => m.id === ui.moveId) ?? moves.find((m) => m.talent === 'burst') ?? moves[0];
  const kitMode = v.resolved.team.config.elementMode === 'kit';
  const infusion = v.resolved.team.members[index]?.normalInfusion;
  const moveElement: ElementOrPhysical | undefined = moveChosen && character ? (kitMode ? kitElement(character, moveChosen, infusion) : (character.element as ElementOrPhysical)) : undefined;
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
      fillerSets: ui.fillerSets,
      borrowFrom: ui.borrow ? 'all' : 'none',
    };
  };

  const preview = good && character ? countCandidates(good, characterKey, character.element, config(), data.game) : null;

  /** Para escolher artefatos o motor avalia os efeitos de arma e set (que começam desligados) como ligados; o que o usuário desligou de propósito continua desligado. */
  const optimizerTeam = {
    ...v.resolved.team,
    disabled: (v.resolved.team.disabled ?? []).filter((id) => !v.resolved.gearIds.includes(id) || project.disabled.includes(id)),
  };

  /** Build atual: as peças do projeto ou as do inventário com o nome dele, avaliadas como os resultados (mesma fonte dos stats e das diferenças). */
  const current = (() => {
    if (!good) return null;
    try {
      return evaluateEquipped({
        good, characterKey, config: { ...config(), constraints: {} }, member: index, rolls: v.bundle.optimization.rolls, ref,
        resolved: { team: optimizerTeam, actions: v.resolved.actions, flatEffects: v.resolved.flatEffects, ampCoefficient: v.resolved.ampCoefficient },
        planilha: project.compat === 'planilha', game: data.game, effects: data.effects,
      }, ref.pieces?.length ? (ref.pieces as GoodArtifact[]) : undefined);
    } catch {
      return null;
    }
  })();

  const run = () => {
    if (!good) return;
    setRunning(true);
    setError(null);
    setResult(null);
    setEquippedKey(null);
    setShowMore(false);
    setProgress(null);
    const j = startOptimizerJob(
      {
        good, characterKey, config: config(), member: index, rolls: v.bundle.optimization.rolls, ref,
        resolved: { team: optimizerTeam, actions: v.resolved.actions, flatEffects: v.resolved.flatEffects, ampCoefficient: v.resolved.ampCoefficient },
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
  /** Recarga que a calculadora de recarga do projeto pede para este personagem (null se ele não usa o Supremo). */
  const erNeeded = (() => {
    const r = energyResults(project, energyMembers(project, data.game.characters, data.particles))[index];
    return r && r.status !== 'ignored' ? Math.ceil(r.neededER * 1000) / 10 : null;
  })();
  const minsOn = Object.values(ui.mins).filter((x) => x.trim() !== '').length;

  const addMin = () => {
    const n = Number(minVal.replace(',', '.'));
    if (minVal.trim() === '' || !Number.isFinite(n)) return;
    setUi({ ...ui, mins: { ...ui.mins, [minKey]: String(n) } });
    setMinVal('');
  };
  /** O Golpe, a Reação e o Crítico só valem com Alvo = "Um golpe" (os outros ficam desativados, sem sumir). */
  const moveOn = ui.goal === 'dano' && ui.scope === 'move';
  /** O mínimo de Recarga é o que a calculadora de recarga pede. */
  const erInUse = erNeeded !== null && ui.mins.er.trim() !== '' && Math.abs(Number(ui.mins.er.replace(',', '.')) - erNeeded) < 1e-6;
  /** O mínimo que o build equipado não atinge (null se atinge todos, ou se não há equipado). */
  const unmet = current ? firstUnmet(ui.mins, current.report.stats) : null;

  /** Dono de uma peça equipada em outro personagem: o nome e a cor dele (a do time, se ele for do time). */
  const ownerOf = (location: string): Owner => {
    const i = project.members.findIndex((m) => norm(m.character) === norm(location));
    return i >= 0 ? { name: project.members[i].character, color: v.colors[i] } : { name: location, color: 'var(--faint)' };
  };
  const currentSig = new Set((current?.pieces ?? []).map(pieceSig));
  /** Builds da lista: o equipado entra na posição dele (selo "equipado hoje") ou, se ficou fora do top, no fim. */
  const cards = (() => {
    if (!result) return [];
    const list = result.builds.map((b) => ({ build: b, isCurrent: !!current && b.pieces.length === current.pieces.length && b.pieces.every((p) => currentSig.has(pieceSig(p))), outside: false }));
    if (current && !list.some((c) => c.isCurrent)) list.push({ build: current, isCurrent: true, outside: true });
    return list;
  })();
  /** Chip de comparação: contra o equipado quando ele cumpre os mínimos; senão o #1 é o "melhor resultado" e os outros comparam com ele. */
  const compareOf = (c: (typeof cards)[number], i: number): CardCompare | undefined => {
    const v0 = c.build.report.value;
    if (c.outside) return undefined;
    if (current && !unmet) {
      if (c.isCurrent) return undefined;
      const d = (v0 / current.report.value - 1) * 100;
      return Number.isFinite(d) ? { text: `${d >= 0 ? '+' : '−'}${formatDecimal(Math.abs(d), 2)}% contra o equipado`, tone: d >= 0 ? 'good' : 'bad' } : undefined;
    }
    const best = cards[0]?.build.report.value;
    if (i === 0) return { text: 'melhor resultado', tone: 'good' };
    const d = best ? (v0 / best - 1) * 100 : NaN;
    return Number.isFinite(d) ? { text: `${d >= 0 ? '+' : '−'}${formatDecimal(Math.abs(d), 2)}% contra o #1`, tone: d >= 0 ? 'good' : 'bad' } : undefined;
  };

  return (
    <div className="ot">
      {!good ? (
        <Panel title="Inventário">
          <div className="ot-empty">
            <p>Importe o inventário (arquivo do Genshin Optimizer ou UID) para otimizar.</p>
            <ButtonLink variant="primary" to="/inventario">Importar o inventário</ButtonLink>
          </div>
        </Panel>
      ) : (
        <>
          <div className="ot-top">
            <CurrentBuild build={current} field={fieldMode} onField={() => setFieldMode(!fieldMode)} sets={data.game.artifacts} />

            <Panel bar title="Filtro de artefatos" badge={<span className="dz-badge num">{levelCount}/{allArt.length}</span>}>
              <div className="ot-level">
                <span className="lb">Nível</span>
                <DualRange min={0} max={20} low={ui.levelMin} high={ui.levelMax} prefix="+" label="Nível" onChange={(lo, hi) => setUi({ ...ui, levelMin: lo, levelMax: hi })} />
              </div>
              <div className="ot-pieces">
                <span className="lb">Peças</span>
                {SLOTS.map((sl) => <span key={sl.key} className="ot-ch" title={`${sl.label}: ${slotCount(sl.key)} de ${slotTotal(sl.key)} no filtro de nível`}>{sl.label} <b className="num">{slotCount(sl.key)}</b></span>)}
              </div>
              {(['sands', 'goblet', 'circlet'] as const).map((slot) => {
                const mains = mainsOf(slot);
                const on = mains.filter(([k]) => !ui.offMains[slot].includes(k)).length;
                return (
                  <div className="ot-grp" key={slot} data-slot={slot}>
                    <div className="ot-grp-head">
                      <span className="lb">{SLOTS.find((x) => x.key === slot)!.label} · <span className="num">{on}/{mains.length}</span></span>
                      <button type="button" className="ot-ghost" onClick={() => setUi({ ...ui, offMains: { ...ui.offMains, [slot]: [] } })}>Todos</button>
                      <button type="button" className="ot-ghost" onClick={() => setUi({ ...ui, offMains: { ...ui.offMains, [slot]: mains.map(([k]) => k) } })}>Nenhum</button>
                    </div>
                    <div className="ot-chips">
                      {mains.map(([k, n]) => (
                        <button key={k} type="button" className="ot-ch" aria-pressed={!ui.offMains[slot].includes(k)} title={`${MAIN_LABEL[k] ?? k}: ${n} peças`} onClick={() => setUi({ ...ui, offMains: { ...ui.offMains, [slot]: toggle(ui.offMains[slot], k) } })}>
                          {STAT_TAG[k] ?? k} <b className="num">{n}</b>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </Panel>

            <Panel
              bar
              title="Sets"
              badge={<span className={`dz-badge num${ui.offSets.length ? ' gold' : ''}`}>{setsOn}/{setInfo.length}</span>}
              aside={<button type="button" className="ot-ghost" onClick={() => setUi({ ...ui, offSets: ui.offSets.length ? [] : setInfo.map((x) => x.key) })}>Nenhum</button>}
            >
              <div className="ot-switches">
                <button type="button" className="ot-switch" aria-pressed={ui.fillerSets} onClick={() => setUi({ ...ui, fillerSets: !ui.fillerSets })}>
                  <span className="box" aria-hidden="true">✓</span><span className="t">Aceitar peças de outros sets, sem bônus</span>
                </button>
                <button type="button" className="ot-switch" aria-pressed={ui.borrow} onClick={() => setUi({ ...ui, borrow: !ui.borrow })}>
                  <span className="box" aria-hidden="true">✓</span><span className="t">Usar artefatos de outros personagens</span>
                  <span className="dz-badge num">{ui.borrow ? othersCount : 0}/{othersCount}</span>
                </button>
              </div>
              <span className="ot-hint">Marque só os sets que podem dar bônus de 2 ou 4 peças.</span>
              <div className="ot-sets-wrap" data-all={showAllSets} ref={setsWrap}>
                <div className="ot-sets">
                  {visibleSets.map((x) => (
                    <button key={x.key} type="button" className="ot-set" aria-pressed={!ui.offSets.includes(x.key)} onClick={() => setUi({ ...ui, offSets: toggle(ui.offSets, x.key) })} title={`${x.name}: ${x.count} peças`} aria-label={`${x.name}: ${x.count} peças`}>
                      <Img src={x.id ? pieceIconUrl(x.id, 'flower') : undefined} fallback="◆" />
                      <small className="num">{x.count}</small>
                    </button>
                  ))}
                </div>
              </div>
              {overflow && (
                <button type="button" className="ot-more-sets" onClick={() => setShowAllSets(!showAllSets)}>{showAllSets ? 'Mostrar menos' : `Mostrar todos · mais ${setInfo.length - visibleSets.length} sets`}</button>
              )}
            </Panel>
          </div>

          <section className="ot-bar" aria-label="Foco da otimização">
            <div className="ot-bar-grid">
              <div className="ot-bar-cfg">
                <div className="ot-bar-line">
                  <div className="ot-field">
                    <span className="lbl">Otimizar</span>
                    <div className="ot-seg" role="group" aria-label="O que otimizar">
                      {([['dano', 'Dano', 'Dano do time, dele ou de um golpe'], ['buff', 'Buff', 'O maior valor de um buff que ele dá ao time (foco de suportes)'], ['stat', 'Stat', 'O maior valor final de HP, ATK, Maestria… (use os mínimos para não perder o resto)']] as [Goal, string, string][]).map(([k, label, tip]) => (
                        <button key={k} type="button" aria-pressed={ui.goal === k} title={tip} onClick={() => setUi({ ...ui, goal: k })}>{label}</button>
                      ))}
                    </div>
                  </div>
                  {ui.goal === 'dano' && (
                    <div className="ot-field">
                      <span className="lbl">Alvo</span>
                      <div className="ot-seg" role="group" aria-label="Dano de" title="Rotação do time: soma o dano de todos, com os buffs que ele dá nas janelas. Um golpe: avaliado sozinho com todos os buffs ligados.">
                        {([['team', 'Rotação do time'], ['member', `Só ${ref.character}`], ['move', 'Um golpe']] as [Scope, string][]).map(([k, label]) => (
                          <button key={k} type="button" aria-pressed={ui.scope === k} onClick={() => setUi({ ...ui, scope: k })}>{label}</button>
                        ))}
                      </div>
                    </div>
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
                  <div className="ot-field mostrar">
                    <span className="lbl">Mostrar</span>
                    <select className="dz-input sm" aria-label="Melhores a mostrar" value={ui.topN} onChange={(e) => setUi({ ...ui, topN: Number(e.target.value) })}>
                      {[1, 2, 3, 4, 5, 8, 10].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
                <div className="ot-bar-line">
                  <div className="ot-field grow">
                    <span className="lbl">Golpe</span>
                    <button type="button" className="ot-movebtn" disabled={!moveOn} aria-haspopup="dialog" aria-label="Escolher o golpe a otimizar" onClick={() => setPickingMove(true)}>
                      {moveChosen && <KindBadge kind={kindOf(moveChosen)} />}
                      <span className="n" style={{ color: damageColor(moveElement, moveChosen ? specialOfMove(moveChosen, 0, effect) : undefined) }}>{moveChosen ? displayName(moveChosen) : 'Escolher o golpe'}</span>
                      {moveChosen && <FamilyBadge special={specialOfMove(moveChosen, 0, effect)} />}
                      <span className="chev" aria-hidden="true">▾</span>
                    </button>
                  </div>
                  <div className="ot-field">
                    <span className="lbl">Reação</span>
                    <div className="ot-seg" role="group" aria-label="Reação" data-off={!moveOn}>
                      {reactions.map((r) => (
                        <button key={r} type="button" disabled={!moveOn} aria-pressed={reaction === r} onClick={() => setUi({ ...ui, reaction: r })}>{REACTION_LABEL[r] ?? r}</button>
                      ))}
                    </div>
                  </div>
                  <div className="ot-field">
                    <span className="lbl">Crítico</span>
                    <div className="ot-seg" role="group" aria-label="Crítico" data-off={!moveOn}>
                      {(Object.keys(CRIT_LABEL) as Crit[]).map((c) => (
                        <button key={c} type="button" disabled={!moveOn} title={CRIT_LABEL[c]} aria-pressed={ui.crit === c} onClick={() => setUi({ ...ui, crit: c })}>{CRIT_SHORT[c]}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="ot-bar-min" role="group" aria-label="Mínimos nos stats">
                <div className="ot-min-head">
                  <span className="lbl">Mínimos nos stats</span>
                  <span className="dz-badge num gold">{minsOn} {minsOn === 1 ? 'ativo' : 'ativos'}</span>
                </div>
                {minsOn > 0 && (
                  <div className="ot-min-chips">
                    {activeMins(ui.mins).map((m) => (
                      <span key={m.k} className="ot-minchip">
                        {m.label} ≥ <b className="num">{formatMin(m.k, m.value)}</b>
                        <button type="button" aria-label={`Remover mínimo de ${m.label}`} onClick={() => setUi({ ...ui, mins: { ...ui.mins, [m.k]: '' } })}>×</button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="ot-min-add">
                  <select className="dz-input sm" aria-label="Stat do mínimo" value={minKey} onChange={(e) => setMinKey(e.target.value as MinKey)}>
                    {MIN_DEFS.map((d) => <option key={d.k} value={d.k}>{d.label}</option>)}
                  </select>
                  <span className="val">
                    <input className="num" inputMode="decimal" aria-label="Valor do mínimo" placeholder="—" value={minVal} onChange={(e) => setMinVal(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addMin(); }} />
                    <i>{MIN_DEFS.find((d) => d.k === minKey)?.pct ? '%' : ''}</i>
                  </span>
                  <button type="button" className="dz-btn" onClick={addMin} disabled={!Number.isFinite(Number(minVal.replace(',', '.'))) || minVal.trim() === ''}>Adicionar</button>
                </div>
                {erNeeded !== null && (
                  <span className="ot-min-calc">Calculadora de recarga pede <b className="num">{formatDecimal(erNeeded, 1)}%</b>{erInUse ? ' · em uso' : ''}</span>
                )}
                {running ? (
                  <Button variant="secondary" size="lg" className="ot-go-btn" onClick={stop}>Parar</Button>
                ) : (
                  <Button variant="primary" size="lg" className="ot-go-btn" onClick={run}>Otimizar</Button>
                )}
              </div>
            </div>
            {pickingMove && character && (
              <MovePickerDialog
                moves={moves}
                current={moveChosen?.id}
                character={character}
                elementMode={kitMode ? 'kit' : 'character'}
                infusion={infusion}
                effect={effect}
                onPick={(id) => { setUi({ ...ui, moveId: id }); setPickingMove(false); }}
                onClose={() => setPickingMove(false)}
              />
            )}
            <div className="ot-strip" role="status" aria-live="polite">
              <StarIcon size={14} />
              {running ? (
                <>
                  <b>Buscando…</b>
                  <span className="stat num">
                    {progress ? `${formatInt(progress.evaluations)} combinações testadas · ${(progress.elapsedMs / 1000).toFixed(0)} s` : 'preparando'}
                    {progress && Number.isFinite(progress.best) ? ` · melhor até agora ${focusValue({ value: progress.best } as OptimizedBuild['report'])}` : ''}
                  </span>
                </>
              ) : error ? (
                <span className="err" role="alert">{error}</span>
              ) : result ? (
                <>
                  <b>{result.stopped ? 'Busca parada' : 'Busca completa'}</b>
                  <span className="stat num">
                    {formatInt(result.stats.evaluations)} avaliações de {bigNumber(result.stats.combinations)} · {result.inventory.pieces} peças ({preview?.perSlot.join(' · ')})
                    {ui.borrow ? ' · inclui peças de outros personagens' : result.inventory.removed.equippedByOthers > 0 ? ` · ${result.inventory.removed.equippedByOthers} de outros personagens fora` : ''}
                  </span>
                </>
              ) : preview ? (
                <span className="stat num">
                  {preview.total} peças ({preview.perSlot.join(' · ')})
                  {ui.borrow ? ' · inclui peças de outros personagens' : preview.removed.equippedByOthers > 0 ? ` · ${preview.removed.equippedByOthers} de outros personagens fora` : ''}
                </span>
              ) : null}
              {current && (unmet ? (
                <span className="ot-eq bad">Equipado hoje não atinge {unmet.label} ≥ {formatMin(unmet.k, unmet.value)} (tem {formatMin(unmet.k, unmet.have)})</span>
              ) : (
                <span className="ot-eq">Equipado hoje <b className="num">{focusValue(current.report)}</b></span>
              ))}
            </div>
          </section>

          {result && (
            <>
              <section className="ot-results" aria-label="Builds encontrados">
                {result.builds.length === 0 && <p className="note">Nenhum conjunto cumpre os mínimos escolhidos. Afrouxe um deles.</p>}
                {cards.slice(0, showMore ? cards.length : 2).map((c, i) => (
                  <ResultCard
                    key={c.build.key + (c.outside ? ':hoje' : '')}
                    rank={c.outside ? 'Hoje' : `#${i + 1}`}
                    build={c.build}
                    now={current}
                    field={fieldMode}
                    compare={compareOf(c, i)}
                    currentSig={currentSig}
                    sets={data.game.artifacts}
                    caption={goalCaption}
                    focusValue={focusValue}
                    onEquip={c.outside ? undefined : () => equip(c.build)}
                    equipped={equippedKey === c.build.key}
                    isCurrent={c.isCurrent}
                    mine={mineKey}
                    ownerOf={ownerOf}
                  />
                ))}
              </section>
              {cards.length > 2 && (
                <button type="button" className="ot-more-btn" onClick={() => setShowMore(!showMore)}>{showMore ? 'Mostrar menos' : `Mostrar mais · ${cards.length - 2} builds`}</button>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
