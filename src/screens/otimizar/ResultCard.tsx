/** Card de um build do otimizador: posição, valor, comparação, sets, as 5 peças e os stats com a diferença contra o Build atual. */
import { norm, type GoodArtifact } from '../../features/good/goodImport';
import { MAIN_LABEL, SUB_LABEL, formatMain, formatSub } from '../../features/good/labels';
import type { OptimizedBuild } from '../../features/optimizer/run';
import { mainStatValue } from '../../engine/pieces';
import { formatDecimal, formatInt } from '../../ui/format';
import { ArtImg, SLOTS, fmtInt, fmtPct } from './shared';

export interface CardCompare {
  /** Texto e tom do chip de comparação do cabeçalho. */
  text: string;
  tone: 'good' | 'bad';
}

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
        <div className="val">
          <b className="num">{focusValue(r)}</b>
          <small>{caption} · {build.setLabel}</small>
        </div>
        {isCurrent && <span className="cur">equipado hoje</span>}
        {compare && <span className="cmp num" data-tone={compare.tone}>{compare.text}</span>}
        {onEquip && <button type="button" className="dz-btn gold equip" onClick={onEquip} disabled={equipped}>{equipped ? 'Equipado' : 'Equipar'}</button>}
      </header>
      <div className="pieces">
        {SLOTS.map((sl) => {
          const a = bySlot.get(sl.key);
          if (!a) return <div className="piece" key={sl.key} data-change="false" />;
          const set = setOf(a.setKey);
          const key = a.slotKey === 'flower' ? 'hp' : a.slotKey === 'plume' ? 'atk' : a.mainStatKey;
          const kept = currentSig.has(pieceSig(a));
          return (
            <div className="piece" key={sl.key} data-rarity={a.rarity} data-change={!kept} aria-label={`${sl.label}: ${set?.name ?? a.setKey}`}>
              <span className="top">
                <span className="slot">{sl.label}</span>
                <em>{kept ? 'equipada' : 'troca'}</em>
              </span>
              <span className="art" title={set?.name ?? a.setKey}>
                <ArtImg setId={set?.id} slot={a.slotKey} />
                <b className="lv num">+{a.level ?? 0}</b>
              </span>
              <span className="main">{MAIN_LABEL[key] ?? key} <b className="num">{formatMain(key, mainStatValue(key, a.rarity, a.level))}</b></span>
              <ul>
                {a.substats.map((x) => (
                  <li key={x.key} data-crit={x.key === 'critRate_' || x.key === 'critDMG_'}><span>{SUB_LABEL[x.key] ?? x.key}</span><b className="num">{formatSub(x.key, x.value)}</b></li>
                ))}
              </ul>
              {a.location && <span className="loc">de {a.location}</span>}
            </div>
          );
        })}
      </div>
      <dl className="stats num">
        {rows.map((x) => (
          <div key={x.k}><dt>{x.k}</dt><dd>{x.v}{x.d}</dd></div>
        ))}
      </dl>
    </article>
  );
}
