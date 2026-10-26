/** Card de um build do otimizador: posição, valor, comparação, sets, as 5 peças e os stats com a diferença contra o Build atual. */
import { norm, type GoodArtifact } from '../../features/good/goodImport';
import { MAIN_LABEL, SUB_LABEL, formatMain, formatSub } from '../../features/good/labels';
import type { OptimizedBuild } from '../../features/optimizer/run';
import { mainStatValue } from '../../engine/pieces';
import { formatDecimal, formatInt } from '../../ui/format';
import { PieceArt, SLOTS, fmtInt, fmtPct, setColor } from './shared';

export interface CardCompare {
  /** Texto e tom do chip de comparação do cabeçalho. */
  text: string;
  tone: 'good' | 'bad';
}

/** "Emblem of Severed Fate" → "Emblem"; "Silken Moon's Serenade" → "Silken Moon". */
const shortSet = (name: string) => name.split(/ of |'s /i)[0];

export const pieceSig = (a: GoodArtifact) => `${a.slotKey}|${a.setKey}|${a.mainStatKey}|${a.level ?? 0}|${a.substats.map((s) => `${s.key}:${s.value}`).join(',')}`;

function Diff({ d, text }: { d: number; text: string }) {
  if (!Number.isFinite(d) || Math.abs(d) < 1e-9) return null;
  return <small className="d num" data-sign={d > 0 ? 'up' : 'down'}>{text}</small>;
}

const signed = (d: number, digits: number, suffix = '') => `${d > 0 ? '+' : '−'}${digits === 0 ? formatInt(Math.abs(d)) : formatDecimal(Math.abs(d), digits)}${suffix}`;

export function ResultCard({ rank, build, now, field, compare, currentSig, sets, caption, focusValue, onEquip, equipped, isCurrent }: {
  rank: string;
  build: OptimizedBuild;
  /** O Build atual (base das diferenças); null se o personagem não tem peças. */
  now: OptimizedBuild | null;
  field: boolean;
  compare?: CardCompare;
  currentSig: Set<string>;
  sets: { name: string; id: number }[];
  caption: string;
  focusValue: (r: OptimizedBuild['report']) => string;
  onEquip?: () => void;
  equipped?: boolean;
  isCurrent?: boolean;
}) {
  const r = build.report;
  const s = field ? r.fieldStats : r.stats;
  const p = now ? (field ? now.report.fieldStats : now.report.stats) : undefined;
  const setOf = (key: string) => sets.find((x) => norm(x.name) === norm(key));
  const counts = new Map<string, number>();
  for (const a of build.pieces) {
    const name = setOf(a.setKey)?.name ?? a.setKey;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const chips = [...counts.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]);
  const bySlot = new Map(build.pieces.map((a) => [a.slotKey, a]));

  const rows: { k: string; v: string; d?: React.ReactNode }[] = [
    { k: 'ATK', v: fmtInt(s.atk), d: p && <Diff d={s.atk - p.atk} text={signed(s.atk - p.atk, 0)} /> },
    { k: 'HP', v: fmtInt(s.hp), d: p && <Diff d={s.hp - p.hp} text={signed(s.hp - p.hp, 0)} /> },
    { k: 'DEF', v: fmtInt(s.def), d: p && <Diff d={s.def - p.def} text={signed(s.def - p.def, 0)} /> },
    { k: 'Maestria', v: fmtInt(s.em), d: p && <Diff d={s.em - p.em} text={signed(s.em - p.em, 0)} /> },
    { k: 'Taxa crít.', v: fmtPct(s.critRate), d: p && <Diff d={s.critRate - p.critRate} text={signed((s.critRate - p.critRate) * 100, 1)} /> },
    { k: 'Dano crít.', v: fmtPct(s.critDmg), d: p && <Diff d={s.critDmg - p.critDmg} text={signed((s.critDmg - p.critDmg) * 100, 1)} /> },
    { k: 'Recarga', v: fmtPct(s.er), d: p && <Diff d={s.er - p.er} text={signed((s.er - p.er) * 100, 1)} /> },
    { k: 'DPR do time', v: fmtInt(r.teamAvg), d: now && now.report.teamAvg > 0 && <Diff d={r.teamAvg / now.report.teamAvg - 1} text={signed((r.teamAvg / now.report.teamAvg - 1) * 100, 2, '%')} /> },
  ];

  return (
    <article className="ot-build" data-current={isCurrent ? true : undefined}>
      <header>
        <span className="rank">{rank}</span>
        <span className="val">
          <b className="num">{focusValue(r)}</b>
          <small>{caption}</small>
        </span>
        {compare && <span className="cmp num" data-tone={compare.tone}>{compare.text}</span>}
        {isCurrent && <span className="cur">equipado hoje</span>}
        <span className="sets">
          {chips.map(([name, n]) => <span key={name}><i style={{ background: setColor(name) }} />{shortSet(name)} {n}</span>)}
        </span>
        {onEquip && <button type="button" className="dz-btn sm gold equip" onClick={onEquip} disabled={equipped}>{equipped ? 'Equipado' : 'Equipar'}</button>}
      </header>
      <div className="pieces">
        {SLOTS.map((sl) => {
          const a = bySlot.get(sl.key);
          if (!a) return <div className="piece" key={sl.key} data-change="false" />;
          const set = setOf(a.setKey);
          const key = a.slotKey === 'flower' ? 'hp' : a.slotKey === 'plume' ? 'atk' : a.mainStatKey;
          const kept = currentSig.has(pieceSig(a));
          return (
            <div className="piece" key={sl.key} data-change={!kept} aria-label={`${sl.label}: ${set?.name ?? a.setKey}`}>
              <div className="top">
                <PieceArt piece={a} setId={set?.id} setName={set?.name} />
                <span className="t">
                  <small>{sl.label} · {MAIN_LABEL[key] ?? key}</small>
                  <b className="num">{formatMain(key, mainStatValue(key, a.rarity, a.level))}</b>
                </span>
              </div>
              <span className="tag" data-kind={kept ? 'kept' : 'swap'}>{kept ? 'equipada' : 'troca'}</span>
              <div className="subs">
                {a.substats.slice(0, 4).map((x) => (
                  <span key={x.key} data-crit={x.key === 'critRate_' || x.key === 'critDMG_'}><span>{SUB_LABEL[x.key] ?? x.key}</span><b className="num">{formatSub(x.key, x.value)}</b></span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <dl className="stats num">
        {rows.map((x) => (
          <div key={x.k}><dt>{x.k}</dt><dd>{x.v}</dd>{x.d}</div>
        ))}
      </dl>
    </article>
  );
}
