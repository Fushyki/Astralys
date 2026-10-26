/**
 * Otimizador de artefatos, como aba "Otimizar" da página do personagem (/projeto/:id/personagem/:nome?aba=otimizar):
 * a otimização é individual de cada personagem. A rota antiga /projeto/:id/otimizador/:nome? redireciona para lá.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useProjectView, type ProjectView } from '../app/ProjectContext';
import { Chip, Panel, StarIcon } from '../design/primitives';
import { DualRange, SecHead, StatChip, STAT_COLOR, STAT_TAG } from '../design/filtros';
import { pieceIconUrl } from '../design/images';
import { norm, type Good, type GoodArtifact } from '../features/good/goodImport';
import { loadGood } from '../features/good/goodStore';
import { startOptimizerJob, type OptimizerJob, type OptimizerProgress } from '../features/optimizer/client';
import type { Constraints, Objective } from '../features/optimizer/evaluator';
import { DEFAULT_CONFIG, countCandidates, type OptimizedBuild, type OptimizerConfig, type OptimizerResult } from '../features/optimizer/run';
import { REACTION_LABEL, displayName, reactionOptions } from '../features/character/characterModel';
import { useRotationStore } from '../features/rotation/store';
import { energyMembers, energyResults } from '../features/energy/energyModel';
import { kitElement, type ElementOrPhysical, type ReactionChoice } from '../engine';
import { mainStatValue } from '../engine/pieces';
import { formatDecimal, formatInt } from '../ui/format';
import './otimizador.css';
import { Button, ButtonLink } from '../design/Button';
import { TeamBuffsStrip } from './personagem/AsideExtras';
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
/** Quantos main stats e sets aparecem antes do botão "Mostrar todos". */
const MAINS_SHOWN = 12;
const SETS_SHOWN = 18;
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
  const [showAllSets, setShowAllSets] = useState(false);
  const [pickingMove, setPickingMove] = useState(false);
  const [showAllMains, setShowAllMains] = useState<Record<'sands' | 'goblet' | 'circlet', boolean>>({ sands: false, goblet: false, circlet: false });
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
  const visibleSets = showAllSets ? setInfo : setInfo.filter((s, i) => i < SETS_SHOWN || pickedSets.includes(s));

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
            <ButtonLink variant="primary" to="/inventario">Importar o inventário</ButtonLink>
          </div>
        </Panel>
      ) : (
        <>
          <div className="ot-top">
            <Panel
              bar
              title="Mínimos nos stats"
              badge={<span className="dz-badge num">{minsOn} ativos</span>}
              foot={
                erNeeded !== null ? (
                  <div className="ot-tip">
                    <span>A calculadora de recarga pede <b className="num">{formatDecimal(erNeeded, 1)}%</b> para {ref.character}.</span>
                    <span className="ot-tip-acts">
                      <Button variant="ghost" size="sm" onClick={() => setUi({ ...ui, mins: { ...ui.mins, er: String(erNeeded) } })}>Usar como mínimo</Button>
                      <ButtonLink variant="ghost" size="sm" to={`/projeto/${v.id}/recarga`}>Abrir a calculadora</ButtonLink>
                    </span>
                  </div>
                ) : (
                  <p className="ot-tip">Ex.: Recarga ≥ 120% para não faltar energia na rotação.</p>
                )
              }
            >
              <div className="ot-mins">
                {([['er', 'Recarga', '%'], ['cr', 'Taxa crítica', '%'], ['cd', 'Dano crítico', '%'], ['em', 'Maestria', ''], ['hp', 'HP', ''], ['atk', 'ATK', ''], ['def', 'DEF', '']] as const).map(([k, label, suf]) => (
                  <label key={k}>
                    <span>{label}</span>
                    <span className="in">
                      <input inputMode="decimal" placeholder="—" value={ui.mins[k]} onChange={(e) => setUi({ ...ui, mins: { ...ui.mins, [k]: e.target.value } })} aria-label={`${label} mínima`} />
                      {suf && <i>{suf}</i>}
                    </span>
                  </label>
                ))}
              </div>
            </Panel>

            <Panel bar title="Filtro de artefatos" badge={<span className="dz-badge num">{levelCount}/{allArt.length}</span>}>
              <div className="ot-sec">
                <span className="lb">Nível</span>
                <DualRange min={0} max={20} low={ui.levelMin} high={ui.levelMax} label="Nível" onChange={(lo, hi) => setUi({ ...ui, levelMin: lo, levelMax: hi })} />
              </div>
              <div className="ot-sec">
                <span className="lb">Peças disponíveis</span>
                <div className="fx-grid">
                  {SLOTS.map((sl) => <StatChip key={sl.key} tag={sl.label} n={slotCount(sl.key)} on={slotCount(sl.key) > 0} label={`${sl.label}: ${slotCount(sl.key)} de ${slotTotal(sl.key)} no filtro de nível`} />)}
                </div>
              </div>
              {(['sands', 'goblet', 'circlet'] as const).map((slot) => {
                const mains = mainsOf(slot);
                const on = mains.filter(([k]) => !ui.offMains[slot].includes(k)).length;
                const shown = showAllMains[slot] ? mains : mains.slice(0, MAINS_SHOWN);
                return (
                  <div className="ot-sec ruled" key={slot} data-slot={slot}>
                    <div className="ot-sec-head">
                      <span className="lb">{SLOTS.find((x) => x.key === slot)!.label} · <span className="num">{on}/{mains.length}</span></span>
                      <span className="ot-sec-acts">
                        {mains.length > MAINS_SHOWN && (
                          <Button variant="ghost" size="sm" onClick={() => setShowAllMains({ ...showAllMains, [slot]: !showAllMains[slot] })}>{showAllMains[slot] ? 'Menos' : `Mostrar todos (${mains.length})`}</Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => setUi({ ...ui, offMains: { ...ui.offMains, [slot]: [] } })} disabled={on === mains.length}>Todos</Button>
                        <Button variant="ghost" size="sm" onClick={() => setUi({ ...ui, offMains: { ...ui.offMains, [slot]: mains.map(([k]) => k) } })} disabled={on === 0}>Nenhum</Button>
                      </span>
                    </div>
                    <div className="fx-grid">
                      {shown.map(([k, n]) => (
                        <StatChip key={k} tag={STAT_TAG[k] ?? k} n={n} on={!ui.offMains[slot].includes(k)} color={STAT_COLOR[k]} label={`${MAIN_LABEL[k] ?? k}: ${n} peças`} className="ot-chip-main"
                          onClick={() => setUi({ ...ui, offMains: { ...ui.offMains, [slot]: toggle(ui.offMains[slot], k) } })} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </Panel>

            <Panel
              bar
              className="ot-sets-panel"
              title="Sets"
              badge={<span className={`dz-badge num${ui.offSets.length ? ' gold' : ''}`}>{setsOn}/{setInfo.length}</span>}
              aside={<Button variant="ghost" size="sm" onClick={() => setUi({ ...ui, offSets: ui.offSets.length ? [] : setInfo.map((x) => x.key) })}>{ui.offSets.length ? 'Marcar todos' : 'Nenhum'}</Button>}
              foot={
                <div className="ot-switches">
                  <button type="button" className="ot-switch" aria-pressed={ui.fillerSets} title="Ligado: só os sets marcados dão bônus, mas as outras peças podem completar o build (ex.: 4 peças de um set e a quinta de outro). Desligado: só entram peças dos sets marcados." onClick={() => setUi({ ...ui, fillerSets: !ui.fillerSets })}>
                    <span className="box" aria-hidden="true">✓</span><span className="t">Aceitar peças de outros sets, sem bônus</span>
                  </button>
                  <button type="button" className="ot-switch" aria-pressed={ui.borrow} onClick={() => setUi({ ...ui, borrow: !ui.borrow })}>
                    <span className="box" aria-hidden="true">✓</span><span className="t">Usar artefatos de outros personagens</span>
                    <span className="dz-badge num">{ui.borrow ? othersCount : 0}/{othersCount}</span>
                  </button>
                </div>
              }
            >
              {pickedSets.length > 0 ? (
                <div className="ot-picked">
                  {pickedSets.slice(0, 3).map((x) => (
                    <div className="ot-pick" key={x.key}>
                      <span className="ico"><Img src={x.id ? pieceIconUrl(x.id, 'flower') : undefined} fallback="◆" /></span>
                      <span className="t"><b>{x.name}</b><small className="num">{x.count} peças · dá bônus de set</small></span>
                    </div>
                  ))}
                  {pickedSets.length > 3 && <span className="ot-more num">+{pickedSets.length - 3} sets marcados</span>}
                </div>
              ) : (
                <p className="ot-tip">Todos os sets podem dar bônus de 2 ou 4 peças. Marque só os que quer: as outras peças completam o build sem bônus.</p>
              )}
              <div className="ot-sets">
                {visibleSets.map((x) => (
                  <button key={x.key} type="button" className="ot-set" aria-pressed={!ui.offSets.includes(x.key)} onClick={() => setUi({ ...ui, offSets: toggle(ui.offSets, x.key) })} title={`${x.name}: ${x.count} peças`} aria-label={`${x.name}: ${x.count} peças`}>
                    <Img src={x.id ? pieceIconUrl(x.id, 'flower') : undefined} fallback="◆" />
                    <small className="num">{x.count}</small>
                  </button>
                ))}
              </div>
              {setInfo.length > SETS_SHOWN && (
                <Button variant="ghost" size="sm" className="ot-showall" onClick={() => setShowAllSets(!showAllSets)}>{showAllSets ? 'Mostrar menos' : `Mostrar todos (${setInfo.length})`}</Button>
              )}
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
                        <button type="button" className="ot-movebtn" aria-haspopup="dialog" aria-label="Escolher o golpe a otimizar" onClick={() => setPickingMove(true)}>
                          {moveChosen && <KindBadge kind={kindOf(moveChosen)} />}
                          <span className="n" style={{ color: damageColor(moveElement, moveChosen ? specialOfMove(moveChosen, 0, effect) : undefined) }}>{moveChosen ? displayName(moveChosen) : 'Escolher o golpe'}</span>
                          {moveChosen && <FamilyBadge special={specialOfMove(moveChosen, 0, effect)} />}
                          <span className="chev" aria-hidden="true">▾</span>
                        </button>
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
                <Button variant="secondary" size="lg" onClick={stop}>Parar</Button>
              ) : (
                <Button variant="primary" size="lg" onClick={run}>Otimizar</Button>
              )}
              {preview && (
                <span className="muted small">
                  {preview.total} peças entram ({preview.perSlot.join(' / ')} por posição)
                  {preview.removed.equippedByOthers > 0 && !ui.borrow ? ` · ${preview.removed.equippedByOthers} em outros personagens ficam de fora` : ''}
                </span>
              )}
            </div>

            <TeamBuffsStrip v={v} index={index} />
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
                <StarIcon size={20} />
                <b className="msg">{result.builds.length > 0 && result.equipped && result.builds[0].key === result.equipped.key ? 'Seu build equipado já é o melhor com estes filtros.' : result.stopped ? 'Busca parada: estes são os melhores achados até aqui.' : 'Busca completa: nenhum conjunto melhor existe com estes filtros.'}</b>
                <span className="stat num">
                  {result.stopped ? 'Busca parada' : 'Busca completa'} · {formatInt(result.stats.evaluations)} avaliações de {bigNumber(result.stats.combinations)} combinações · {result.inventory.pieces} peças entram
                  {result.inventory.removed.equippedByOthers > 0 && !ui.borrow ? `, ${result.inventory.removed.equippedByOthers} de outros personagens ficaram de fora` : ''}
                </span>
                {result.equippedOutside && <span className="ot-warn">Seu build equipado usa peças que os filtros deixam de fora (nível, main stat, set ou dono); por isso ele não entra na busca.</span>}
                {result.equipped && <span className="ot-now"><span className="lb">Equipado hoje</span><b className="num">{focusValue(result.equipped.report)}</b></span>}
              </div>
            )}
            {!running && !result && !error && <p className="ot-tip">Escolha o foco e os filtros e toque em <b>Otimizar</b>.</p>}
          </section>

          {result && (
            <section className="ot-results" aria-label="Builds encontrados">
              {result.builds.length === 0 && <p className="note">Nenhum conjunto cumpre os mínimos escolhidos. Afrouxe um deles.</p>}
              {result.builds.map((b, i) => (
                <BuildCard key={b.key} title={`#${i + 1}`} build={b} base={base} now={result.equipped?.report} equippedSig={equippedSig} focusValue={focusValue} data={data.game.artifacts} caption={goalCaption} onEquip={() => equip(b)} equipped={equippedKey === b.key} />
              ))}
              {result.equipped && (
                <BuildCard title="Hoje" build={result.equipped} equippedSig={equippedSig} focusValue={focusValue} data={data.game.artifacts} caption={goalCaption} />
              )}
            </section>
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
          <Button variant="primary" onClick={onEquip} disabled={equipped}>{equipped ? 'Equipado' : 'Equipar'}</Button>
        )}
      </header>
      <div className="pieces">
        {build.pieces.map((a: GoodArtifact) => {
          const set = data.find((x) => norm(x.name) === norm(a.setKey));
          const kept = equippedSig.has(pieceSig(a));
          const slotLabel = SLOTS.find((x) => x.key === a.slotKey)?.label ?? a.slotKey;
          return (
            <div className="piece" key={`${a.slotKey}`} data-rarity={a.rarity} data-change={!isNow && !kept} aria-label={`${slotLabel}: ${set?.name ?? a.setKey}`}>
              <span className="top">
                <span className="slot">{slotLabel}</span>
                {!isNow && <em>{kept ? 'equipada' : 'troca'}</em>}
              </span>
              <span className="art" title={set?.name ?? a.setKey}>
                <Img src={set ? pieceIconUrl(set.id, a.slotKey as 'flower') : undefined} fallback={SLOT_GLYPH[a.slotKey] ?? '◆'} />
                <b className="lv num">+{a.level ?? 0}</b>
              </span>
              <span className="main">{MAIN_LABEL[a.mainStatKey] ?? a.mainStatKey} <b className="num">{fmtStat(a.mainStatKey, mainStatValue(a.mainStatKey, a.rarity, a.level))}</b></span>
              <ul>
                {a.substats.map((s) => <li key={s.key} data-crit={s.key === 'critRate_' || s.key === 'critDMG_'}><span>{SUB_LABEL[s.key] ?? s.key}</span><b className="num">{fmtStat(s.key, s.value)}</b></li>)}
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
