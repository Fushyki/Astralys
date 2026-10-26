/** Painel "Build atual": as 5 peças que o personagem usa hoje, os sets, os stats e o botão "Status em campo". */
import { Panel, StarIcon } from '../../design/primitives';
import { norm } from '../../features/good/goodImport';
import { MAIN_LABEL, SUB_LABEL, formatMain, formatSub } from '../../features/good/labels';
import type { OptimizedBuild } from '../../features/optimizer/run';
import { mainStatValue } from '../../engine/pieces';
import { PieceArt, SLOTS, critValue, fmtInt, fmtPct, setColor } from './shared';
import { formatDecimal } from '../../ui/format';

interface SetInfo { name: string; id: number }

export function currentStats(build: OptimizedBuild, field: boolean): { k: string; v: string; gold?: boolean }[] {
  const s = field ? build.report.fieldStats : build.report.stats;
  return [
    { k: 'ATK', v: fmtInt(s.atk) }, { k: 'HP', v: fmtInt(s.hp) }, { k: 'DEF', v: fmtInt(s.def) }, { k: 'Maestria', v: fmtInt(s.em) },
    { k: 'Taxa crít.', v: fmtPct(s.critRate), gold: true }, { k: 'Dano crít.', v: fmtPct(s.critDmg), gold: true },
    { k: 'Recarga', v: fmtPct(s.er) }, { k: 'Crit Value', v: formatDecimal(critValue(s), 1) },
  ];
}

export function CurrentBuild({ build, field, onField, sets }: { build: OptimizedBuild | null; field: boolean; onField: () => void; sets: SetInfo[] }) {
  const setOf = (key: string) => sets.find((x) => norm(x.name) === norm(key));
  const bySlot = new Map((build?.pieces ?? []).map((p) => [p.slotKey, p]));
  const counts = new Map<string, number>();
  for (const p of build?.pieces ?? []) counts.set(setOf(p.setKey)?.name ?? p.setKey, (counts.get(setOf(p.setKey)?.name ?? p.setKey) ?? 0) + 1);
  const chips = [...counts.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <Panel bar title="Build atual" badge={<span className="dz-badge num">{bySlot.size}/5 peças</span>}>
      <ul className="ot-cur">
        {SLOTS.map((sl) => {
          const a = bySlot.get(sl.key);
          const set = a ? setOf(a.setKey) : undefined;
          const key = a ? (a.slotKey === 'flower' ? 'hp' : a.slotKey === 'plume' ? 'atk' : a.mainStatKey) : '';
          return (
            <li key={sl.key} data-empty={!a}>
              {a ? <PieceArt piece={a} setId={set?.id} setName={set?.name} dot /> : <span className="ot-art empty" aria-hidden="true" />}
              <span className="t">
                <b className="set">{a ? (set?.name ?? a.setKey) : 'sem peça'}</b>
                <small>{sl.label}{a ? ` · ${MAIN_LABEL[key] ?? key}` : ''}</small>
                {a && <small className="subs">{a.substats.map((x) => `${SUB_LABEL[x.key] ?? x.key} ${formatSub(x.key, x.value)}`).join(' · ')}</small>}
              </span>
              {a && <b className="v num">{formatMain(key, mainStatValue(key, a.rarity, a.level))}</b>}
            </li>
          );
        })}
      </ul>
      {chips.length > 0 && (
        <div className="ot-setchips">
          {chips.map(([name, n]) => (
            <span key={name} data-on={n >= 2}><i style={{ background: setColor(name) }} />{name} · {n} pç</span>
          ))}
        </div>
      )}
      {build && (
        <dl className="ot-cur-stats num">
          {currentStats(build, field).map((x) => <div key={x.k}><dt>{x.k}</dt><dd data-gold={x.gold}>{x.v}</dd></div>)}
        </dl>
      )}
      <button type="button" className="ot-field-btn" aria-pressed={field} onClick={onField}><StarIcon size={12} />Status em campo</button>
    </Panel>
  );
}
