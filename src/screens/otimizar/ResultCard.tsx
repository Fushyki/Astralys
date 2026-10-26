/** Card de um build do otimizador: posição, valor, comparação, sets, as 5 peças (com CV e dono) e os stats com a diferença contra o Build atual. */
import { CharacterAvatar } from '../../design/primitives';
import { artifactSig, norm, type GoodArtifact } from '../../features/good/goodImport';
import { MAIN_LABEL, SUB_LABEL, formatMain, formatSub } from '../../features/good/labels';
import type { OptimizedBuild } from '../../features/optimizer/run';
import { mainStatValue } from '../../engine/pieces';
import { formatDecimal, formatInt } from '../../ui/format';
import { ArtImg, SLOTS, fmtInt, fmtPct, setColor } from './shared';

export interface CardCompare {
  /** Texto e tom do chip de comparação do cabeçalho. */
  text: string;
  tone: 'good' | 'bad';
}

/** Quem é o dono de uma peça equipada em outro personagem: nome, inicial e cor (a do time, se ele for do time). */
export interface Owner { name: string; color: string; icon?: string }

/** "Emblem of Severed Fate" → "Emblem"; "Silken Moon's Serenade" → "Silken Moon". */
const shortSet = (name: string) => name.split(/ of |'s /i)[0];

export const pieceSig = (a: GoodArtifact) => artifactSig(a);

/** CV (Crit Value) da peça: 2 × Taxa Crítica + Dano Crítico das substats (o main stat não entra). */
export const pieceCv = (a: Pick<GoodArtifact, 'substats'>): number => {
  const sum = (key: string) => a.substats.filter((s) => s.key === key).reduce((n, s) => n + s.value, 0);
  return 2 * sum('critRate_') + sum('critDMG_');
};

function Diff({ d, text }: { d: number; text: string }) {
  if (!Number.isFinite(d) || Math.abs(d) < 1e-9) return null;
  return <small className="d num" data-sign={d > 0 ? 'up' : 'down'}>{text}</small>;
}

const signed = (d: number, digits: number, suffix = '') => `${d > 0 ? '+' : '−'}${digits === 0 ? formatInt(Math.abs(d)) : formatDecimal(Math.abs(d), digits)}${suffix}`;

export function ResultCard({ rank, build, now, field, compare, currentSig, sets, caption, focusValue, onEquip, equipped, isCurrent, ownerOf, blocked, onBlock }: {
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
  /** Quem tem a peça equipada agora (null = está no inventário). */
  ownerOf: (a: GoodArtifact) => Owner | null;
  /** Artefatos bloqueados (fora da otimização) e como bloquear/desbloquear um clicando nele. */
  blocked: Set<string>;
  onBlock: (a: GoodArtifact) => void;
}) {
  const r = build.report;
  const s = field ? r.fieldStats : r.stats;
  const p = now ? (field ? now.report.fieldStats : now.report.stats) : undefined;
  const setOf = (key: string) => sets.find((x) => norm(x.name) === norm(key));
  const bySlot = new Map(build.pieces.map((a) => [a.slotKey, a]));
  const counts = new Map<string, number>();
  for (const a of build.pieces) {
    const name = setOf(a.setKey)?.name ?? a.setKey;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const chips = [...counts.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]);
  const swaps = isCurrent ? 0 : build.pieces.filter((a) => !currentSig.has(pieceSig(a))).length;

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
          <small>{caption}</small>
        </div>
        {isCurrent && <span className="cur">equipado hoje</span>}
        {compare && <span className="cmp num" data-tone={compare.tone}>{compare.text}</span>}
        <span className="sets">
          {chips.map(([name, n]) => <span key={name}><i style={{ background: setColor(name) }} />{shortSet(name)} {n}</span>)}
          {swaps > 0 && <span className="swaps">{swaps} {swaps === 1 ? 'troca' : 'trocas'}</span>}
        </span>
        {onEquip && <button type="button" className="dz-btn gold equip" onClick={onEquip} disabled={equipped}>{equipped ? 'Equipado' : 'Equipar'}</button>}
      </header>
      <div className="pieces">
        {SLOTS.map((sl) => {
          const a = bySlot.get(sl.key);
          if (!a) return <div className="piece" key={sl.key} data-change="false" />;
          const set = setOf(a.setKey);
          const name = set?.name ?? a.setKey;
          const key = a.slotKey === 'flower' ? 'hp' : a.slotKey === 'plume' ? 'atk' : a.mainStatKey;
          const kept = currentSig.has(pieceSig(a));
          const cv = pieceCv(a);
          // O mini ícone é de quem está com a peça equipada, seja o personagem desta aba ou outro.
          const owner = ownerOf(a);
          return (
            <div
              className="piece" key={sl.key} data-rarity={a.rarity} data-change={!kept} data-blocked={blocked.has(pieceSig(a)) ? true : undefined}
              role="button" tabIndex={0} aria-pressed={blocked.has(pieceSig(a))}
              aria-label={`${sl.label}: ${name}. ${blocked.has(pieceSig(a)) ? 'Bloqueado: fora da otimização. Clique para habilitar.' : 'Clique para tirar este artefato da otimização.'}`}
              title={blocked.has(pieceSig(a)) ? 'Bloqueado: fora da otimização (clique para habilitar)' : 'Clique para tirar este artefato da otimização'}
              onClick={() => onBlock(a)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onBlock(a); } }}
            >
              <i className="bar" style={{ background: setColor(name) }} />
              <div className="phead">
                <span className="slot">{sl.label}</span>
                <em>{kept ? 'equipada' : 'troca'}</em>
              </div>
              <div className="pic">
                <span className="art" title={name}>
                  <ArtImg setId={set?.id} slot={a.slotKey} />
                  <b className="lv num">+{a.level ?? 0}</b>
                  {blocked.has(pieceSig(a)) && <i className="lock" aria-hidden="true">🔒</i>}
                  {owner && <span className="owner" title={`equipada em ${owner.name}`} aria-label={`equipada em ${owner.name}`}><CharacterAvatar name={owner.name} icon={owner.icon} color={owner.color} size={26} /></span>}
                </span>
                <i className="stars" aria-label={`${a.rarity} estrelas`}>{'★'.repeat(a.rarity)}</i>
              </div>
              <div className="main">
                <small>{MAIN_LABEL[key] ?? key}</small>
                <span className="mv">
                  <b className="num">{formatMain(key, mainStatValue(key, a.rarity, a.level))}</b>
                  <span className="cv num" data-hi={cv >= 30}>CV {formatDecimal(cv, 1)}</span>
                </span>
              </div>
              <ul>
                {a.substats.slice(0, 4).map((x) => (
                  <li key={x.key} data-crit={x.key === 'critRate_' || x.key === 'critDMG_'}><span>{SUB_LABEL[x.key] ?? x.key}</span><b className="num">{formatSub(x.key, x.value)}</b></li>
                ))}
              </ul>
              {!owner && <span className="foot">no inventário</span>}
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
