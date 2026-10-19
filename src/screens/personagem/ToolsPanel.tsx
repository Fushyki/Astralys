/** Ferramentas do personagem: otimizador de crítico, valor de +1 roll e inventário GOOD (com busca do melhor build). */
import { useEffect, useRef, useState } from 'react';
import type { ProjectView } from '../../app/ProjectContext';
import { Panel, Segmented } from '../../design/primitives';
import { SUBSTATS, type Substat } from '../../engine';
import { enkaToGood, mergeGood } from '../../features/enka/enkaImport';
import { fetchEnka, UID_PATTERN } from '../../online/enka';
import { ONLINE_ENABLED } from '../../online/config';
import { buildFromGood, goodCharacterNames, parseGood, type Good } from '../../features/good/goodImport';
import { clearGood, loadGood, saveGood } from '../../features/good/goodStore';
import { searchBestLoadout, weightsFromGains, type SearchResult } from '../../features/good/loadoutSearch';
import { useCritSweep } from '../../features/rotation/useCritSweep';
import { useRotationStore } from '../../features/rotation/store';
import { formatDecimal, formatInt, formatPercent } from '../../ui/format';

export type ToolTab = 'optimizer' | 'rolls' | 'good';

const LABEL: Record<Substat, string> = {
  CR: 'Taxa Crítica', CD: 'Dano Crítico', 'ATK%': 'ATK%', EM: 'Maestria', ER: 'Recarga', ATK: 'ATK fixo', 'HP%': 'HP%', HP: 'HP fixo', 'DEF%': 'DEF%', DEF: 'DEF fixo',
};

export function ToolsPanel({ v, index, tab, onTab }: { v: ProjectView; index: number; tab: ToolTab; onTab: (t: ToolTab) => void }) {
  return (
    <Panel
      title="Ferramentas"
      aside={
        <Segmented
          label="Ferramenta"
          value={tab}
          options={[
            { value: 'optimizer', label: 'Otimizador' },
            { value: 'rolls', label: 'Valor de +1 roll' },
            { value: 'good', label: 'Inventário GOOD' },
          ]}
          onChange={onTab}
        />
      }
    >
      {tab === 'optimizer' && <Optimizer v={v} index={index} />}
      {tab === 'rolls' && <RollValue v={v} index={index} />}
      {tab === 'good' && <GoodView v={v} index={index} />}
    </Panel>
  );
}

// ---------- Otimizador de crítico ----------

const W = 640;
const H = 220;
const PAD = { l: 64, r: 16, t: 14, b: 30 };

function Optimizer({ v, index }: { v: ProjectView; index: number }) {
  const update = useRotationStore((s) => s.updateMember);
  const { sweep, error } = useCritSweep(v.resolved, v.bundle, index);
  const [picked, setPicked] = useState<number | null>(null);
  const ref = v.project.members[index];
  useEffect(() => setPicked(null), [index]);

  if (error) return <p className="dz-error" role="alert">{error}</p>;
  if (!sweep) return <p className="note">Calculando as distribuições…</p>;
  if (sweep.points.length === 0) return <p className="note">Este personagem usa rolls definidos à mão, ou não causa dano na rotação. Volte para "Otimizar" nos substats para ver a curva.</p>;

  const pts = sweep.points;
  const cur = v.bundle.optimization.rolls[index];
  const curCrit = cur.CR + cur.CD;
  const curIdx = Math.max(0, pts.findIndex((p) => p.critRolls === curCrit));
  const sel = Math.min(picked ?? curIdx, pts.length - 1);
  const p = pts[sel];
  const best = pts[sweep.best];
  const ys = pts.map((q) => q.teamAvg);
  const lo = Math.min(...ys);
  const hi = Math.max(...ys);
  const span = hi - lo || 1;
  const x = (i: number) => PAD.l + (pts.length === 1 ? 0 : (i / (pts.length - 1)) * (W - PAD.l - PAD.r));
  const y = (val: number) => PAD.t + (1 - (val - lo) / span) * (H - PAD.t - PAD.b);
  const path = pts.map((q, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(q.teamAvg).toFixed(1)}`).join(' ');
  const diff = (a: number, b: number) => (b ? (a / b - 1) * 100 : 0);
  const vsCur = diff(p.teamAvg, pts[curIdx].teamAvg);
  const rest = SUBSTATS.filter((s) => s !== 'CR' && s !== 'CD' && p.rolls[s] > 0);
  const applied = ref.forcedCritRolls === p.critRolls;
  const tickEvery = Math.ceil(pts.length / 8);

  return (
    <div className="pc-opt">
      <p className="note">
        Cada ponto é uma divisão dos rolls livres: quanto vai para crítico (Taxa + Dano) e o resto, distribuído da melhor forma para a rotação. A linha mostra o dano médio da equipe. O eixo vertical não começa em zero.
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Dano médio da equipe conforme os rolls em crítico de ${ref.character}. Melhor com ${best.critRolls} rolls em crítico.`}>
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(lo + t * span)} y2={y(lo + t * span)} className="grid" />
            <text x={PAD.l - 8} y={y(lo + t * span) + 4} textAnchor="end" className="tick">{formatInt(lo + t * span)}</text>
          </g>
        ))}
        {pts.map((q, i) => (i % tickEvery === 0 || i === pts.length - 1 ? <text key={q.critRolls} x={x(i)} y={H - 8} textAnchor="middle" className="tick">{q.critRolls}</text> : null))}
        <path d={path} className="line" />
        <line x1={x(sel)} x2={x(sel)} y1={PAD.t} y2={H - PAD.b} className="cursor" />
        <circle cx={x(sweep.best)} cy={y(best.teamAvg)} r={7} className="best" />
        <circle cx={x(curIdx)} cy={y(pts[curIdx].teamAvg)} r={4.5} className="cur" />
        <circle cx={x(sel)} cy={y(p.teamAvg)} r={3} className="sel" />
      </svg>
      <p className="axis muted small">Rolls em Taxa + Dano Crítico</p>
      <label className="pc-slider">
        <span>Rolls em crítico</span>
        <input type="range" min={0} max={pts.length - 1} step={1} value={sel} onChange={(e) => setPicked(Number(e.target.value))} aria-valuetext={`${p.critRolls} rolls em crítico`} />
        <b className="num" data-testid="opt-rolls">{p.critRolls}</b>
      </label>
      <div className="pc-info">
        <div><span className="k">Dano médio da equipe</span><span className="num">{formatInt(p.teamAvg)}</span></div>
        <div><span className="k">Contra o build atual</span><span className="num" data-testid="opt-vs-current">{Math.abs(vsCur) < 0.005 ? 'igual' : `${vsCur > 0 ? '+' : ''}${formatDecimal(vsCur, 2)}%`}</span></div>
        <div><span className="k">Contra o melhor</span><span className="num">{sel === sweep.best ? 'é o melhor' : `${formatDecimal(diff(p.teamAvg, best.teamAvg), 2)}%`}</span></div>
        <div><span className="k">Taxa / Dano Crítico</span><span className="num">{formatPercent(p.critRate)} / {formatPercent(p.critDmg)}</span></div>
        <div><span className="k">Rolls em Taxa / Dano</span><span className="num">{p.rolls.CR} / {p.rolls.CD}</span></div>
        <div className="wide"><span className="k">Resto dos rolls</span><span>{rest.map((s) => `${LABEL[s]} ${p.rolls[s]}`).join(' · ') || 'nenhum'}</span></div>
      </div>
      <p className="muted small"><span className="legend best" /> melhor distribuição ({best.critRolls} rolls em crítico) <span className="legend cur" /> build atual ({curCrit})</p>
      <div className="pc-acts">
        <button type="button" className="dz-btn sm" disabled={applied} onClick={() => update(index, { forcedCritRolls: p.critRolls })}>{applied ? 'Em uso' : `Usar ${p.critRolls} rolls em crítico`}</button>
        <button type="button" className="dz-btn sm" disabled={ref.forcedCritRolls === undefined} onClick={() => update(index, { forcedCritRolls: undefined })}>Deixar o otimizador escolher</button>
      </div>
    </div>
  );
}

// ---------- Valor de +1 roll ----------

function RollValue({ v, index }: { v: ProjectView; index: number }) {
  const gains = v.bundle.gains.filter((g) => g.member === index);
  const max = Math.max(1e-12, ...gains.filter((g) => !g.atCap).map((g) => g.relativeGain));
  const rows = SUBSTATS.map((s) => gains.find((g) => g.substat === s)).filter((g): g is NonNullable<typeof g> => !!g && g.relativeGain > 1e-9).sort((a, b) => b.relativeGain - a.relativeGain);
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <p className="note">Quanto o dano da equipe sobe com mais um roll de cada substat deste personagem. "máx." = já está no limite de rolls, então o ganho é só teórico.</p>
      {rows.map((g) => (
        <div className="dz-barrow" key={g.substat}>
          <span className="name">{LABEL[g.substat]}{g.atCap ? <span className="dz-chip" style={{ marginLeft: 6 }}>máx.</span> : null}</span>
          <div className="dz-bar"><i style={{ width: `${g.atCap ? 0 : (g.relativeGain / max) * 100}%` }} /></div>
          <span className="val num" title={`+${formatInt(g.dpsGain)} DPS`}>+{formatDecimal(g.relativeGain * 100, 2)}%</span>
        </div>
      ))}
      {rows.length === 0 && <p className="note">Nenhum substat aumenta o dano deste personagem.</p>}
    </div>
  );
}

// ---------- Inventário GOOD ----------

const SLOT_LABEL: Record<string, string> = { flower: 'Flor', plume: 'Pena', sands: 'Areia', goblet: 'Cálice', circlet: 'Tiara' };
const STAT_LABEL: Record<string, string> = { hp: 'HP', hp_: 'HP%', atk: 'ATK', atk_: 'ATK%', def: 'DEF', def_: 'DEF%', eleMas: 'EM', enerRech_: 'ER', critRate_: 'Taxa Crít.', critDMG_: 'Dano Crít.', heal_: 'Cura' };
const statLabel = (k: string) => STAT_LABEL[k] ?? (/_dmg_$/.test(k) ? `DMG ${k.replace('_dmg_', '')}` : k);
const statValue = (k: string, val: number) => (/_$/.test(k) ? `${formatDecimal(val, 1)}%` : formatInt(val));

function GoodView({ v, index }: { v: ProjectView; index: number }) {
  const update = useRotationStore((s) => s.updateMember);
  const name = v.project.members[index].character;
  const [good, setGood] = useState<Good | null>(() => loadGood());
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const [allowOthers, setAllowOthers] = useState(false);
  const [searching, setSearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [found, setFound] = useState<SearchResult | null>(null);
  const stop = useRef(false);

  const onFile = async (file: File) => {
    setError(null);
    setNotes([]);
    try {
      const g = parseGood(JSON.parse(await file.text()));
      if (!saveGood(g)) throw new Error('Não foi possível guardar o inventário: o armazenamento do navegador está cheio ou bloqueado.');
      setGood(g);
    } catch (e) {
      setError(e instanceof SyntaxError ? 'O arquivo não é um JSON válido.' : e instanceof Error ? e.message : String(e));
    }
  };

  const [uid, setUid] = useState(() => {
    try {
      return localStorage.getItem('astralys.uid') ?? '';
    } catch {
      return '';
    }
  });
  const [fetching, setFetching] = useState(false);
  const fromGame = async () => {
    setError(null);
    setNotes([]);
    setFetching(true);
    try {
      const enka = await fetchEnka(uid);
      const r = enkaToGood(enka, v.data.game);
      if (!r.characters.length) {
        setError(r.notes[0] ?? 'Nenhum personagem importável na vitrine deste jogador.');
        return;
      }
      const merged = mergeGood(loadGood(), r.good);
      if (!saveGood(merged)) throw new Error('Não foi possível guardar o inventário: o armazenamento do navegador está cheio ou bloqueado.');
      try {
        localStorage.setItem('astralys.uid', uid.trim());
      } catch {
        /* sem armazenamento: o UID não fica lembrado */
      }
      setGood(merged);
      setNotes([
        `${r.nickname ? `${r.nickname} (UID ${r.uid})` : `UID ${r.uid}`}: ${r.characters.length} ${r.characters.length === 1 ? 'personagem importado' : 'personagens importados'} da vitrine (${r.characters.join(', ')}).`,
        r.characters.includes(name) ? `${name} está na vitrine: use "Aplicar o build de ${name}".` : `${name} não está na vitrine deste jogador; coloque-o na vitrine do jogo para importar.`,
        ...r.notes,
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setFetching(false);
    }
  };

  const apply = () => {
    if (!good) return;
    try {
      const b = buildFromGood(good, name, v.data.game);
      update(index, b.patch);
      setNotes([`Build de ${name} aplicado do inventário${b.refinement ? ` (arma R${b.refinement})` : ''}.`, ...b.notes]);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const search = async () => {
    if (!good) return;
    setSearching(true);
    setError(null);
    setFound(null);
    setProgress(0);
    stop.current = false;
    try {
      const r = await searchBestLoadout({
        good,
        characterName: name,
        member: index,
        team: v.resolved.team,
        ref: v.project.members[index],
        rolls: v.bundle.optimization.rolls,
        actions: v.resolved.actions,
        flatEffects: v.resolved.flatEffects,
        ampCoefficient: v.resolved.ampCoefficient,
        game: v.data.game,
        effects: v.data.effects,
        minRolls: v.project.config.minRollsPerSubstat,
        weights: weightsFromGains(v.bundle.gains, index),
        allowEquippedByOthers: allowOthers,
        candidatesPerSlot: 60,
        onProgress: setProgress,
        shouldStop: () => stop.current,
      });
      setFound(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSearching(false);
    }
  };

  const applyFound = () => {
    if (!found) return;
    const { artifacts, primarySet, secondarySet, fourPiece, manualRolls } = found.loadout;
    update(index, { artifacts, primarySet, secondarySet, fourPiece, manualRolls });
    setNotes([`Build do inventário aplicado a ${name}: ${found.loadout.primarySet ?? 'sem set'}${found.loadout.secondarySet ? ` + ${found.loadout.secondarySet}` : ''}.`]);
    setFound(null);
  };

  const has = good ? goodCharacterNames(good, v.data.game.characters).includes(name) : false;

  return (
    <div className="pc-good">
      {ONLINE_ENABLED && (
        <div className="pc-uid">
          <p className="note">Pelo UID do jogo: traz os personagens da sua vitrine (até 8), com arma e artefatos reais. É a mesma fonte do akasha.cv (Enka.Network). A vitrine precisa estar com os detalhes visíveis.</p>
          <form className="pc-acts" onSubmit={(e) => { e.preventDefault(); void fromGame(); }}>
            <input className="dz-input" inputMode="numeric" placeholder="UID (9 ou 10 números)" aria-label="UID do jogo" value={uid} onChange={(e) => setUid(e.target.value.replace(/\D/g, '').slice(0, 10))} />
            <button type="submit" className="dz-btn sm" disabled={fetching || !UID_PATTERN.test(uid.trim())}>{fetching ? 'Buscando…' : 'Buscar pelo UID'}</button>
          </form>
        </div>
      )}
      <p className="note">Importe o arquivo do Genshin Optimizer (Configurações, Baixar dados) para usar o build real dos seus personagens. O arquivo fica só no seu navegador.</p>
      <div className="pc-acts">
        <button type="button" className="dz-btn sm" onClick={() => input.current?.click()}>{good ? 'Trocar o inventário' : 'Importar inventário GOOD'}</button>
        {good && <button type="button" className="dz-btn sm" onClick={() => { clearGood(); setGood(null); setNotes([]); setFound(null); }}>Remover o inventário</button>}
        <input ref={input} type="file" accept=".json,application/json" hidden aria-label="Escolher inventário GOOD" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void onFile(f); }} />
      </div>
      {good && (
        <p className="muted small summary">
          {formatInt(good.characters.length)} personagens, {formatInt(good.weapons.length)} armas e {formatInt(good.artifacts.length)} artefatos{good.source ? ` (exportado por ${good.source})` : ''}.
        </p>
      )}
      {good && (
        <div className="pc-acts">
          <button type="button" className="dz-btn" disabled={!has} onClick={apply} title={has ? undefined : `${name} não está neste inventário`}>Aplicar o build de {name}</button>
          {!has && <span className="muted small">{name} não está neste inventário.</span>}
        </div>
      )}
      {good && (
        <div className="pc-loadout">
          <h3 className="h2">Melhor build do inventário</h3>
          <p className="note">Procura o conjunto de 5 artefatos que mais aumenta o dano da rotação da equipe, usando os substats reais. É uma busca por trocas de uma peça de cada vez, não exaustiva.</p>
          <div className="pc-acts">
            <button type="button" className="dz-btn" disabled={!has || searching} onClick={() => void search()}>{searching ? `Buscando… ${formatInt(progress)} conjuntos` : `Buscar o melhor build de ${name}`}</button>
            {searching && <button type="button" className="dz-btn sm" onClick={() => { stop.current = true; }}>Parar</button>}
            <label className="dz-check"><input type="checkbox" checked={allowOthers} onChange={(e) => setAllowOthers(e.target.checked)} /> Usar também peças equipadas em outros personagens</label>
          </div>
          {found && (
            <div className="found" role="status">
              <p className="summary">
                <b>{formatInt(found.teamAvg)}</b> de dano da equipe
                {found.equippedAvg ? ` (${found.teamAvg >= found.equippedAvg ? '+' : ''}${formatDecimal((found.teamAvg / found.equippedAvg - 1) * 100, 2)}% contra o conjunto equipado)` : ''}
                {found.stopped ? ' · busca interrompida' : ''} · {formatInt(found.evaluated)} conjuntos avaliados.
              </p>
              <div className="dz-scroll">
                <table className="dz-table pc-found">
                  <thead><tr><th scope="col">Posição</th><th scope="col">Set</th><th scope="col">Main</th><th scope="col">Substats</th></tr></thead>
                  <tbody>
                    {(['flower', 'plume', 'sands', 'goblet', 'circlet'] as const).map((slot) => {
                      const a = found.pieces[slot];
                      return (
                        <tr key={slot}>
                          <td>{SLOT_LABEL[slot]}</td>
                          <td style={{ textAlign: 'left' }}>{a.setKey}</td>
                          <td style={{ textAlign: 'left' }}>{statLabel(a.mainStatKey)}</td>
                          <td style={{ textAlign: 'left' }}>{a.substats.map((s) => `${statLabel(s.key)} ${statValue(s.key, s.value)}`).join(' · ')}{a.location ? <span className="dz-chip" style={{ marginLeft: 6 }}>em {a.location}</span> : null}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <button type="button" className="dz-btn" onClick={applyFound}>Aplicar este build</button>
            </div>
          )}
        </div>
      )}
      {error && <p className="dz-error" role="alert">{error}</p>}
      {notes.length > 0 && (
        <ul className="pc-notes" role="status">
          {notes.map((n, i) => (<li key={i}>{n}</li>))}
        </ul>
      )}
    </div>
  );
}
