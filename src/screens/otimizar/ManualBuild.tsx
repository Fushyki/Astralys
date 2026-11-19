/**
 * Alvo "Manual" da aba Otimizar: o build do personagem é feito à mão ou pelo KQM automático. Nos dois modos a tabela mostra,
 * por substat, os procs e o valor total.
 *  - KQM (otimizado): sem peças; o motor distribui os rolls nos substats úteis (o build genérico).
 *  - Manual: 5 artefatos feitos aqui. Dá para digitar os procs de cada substat (as peças são refeitas a partir deles) ou
 *    editar uma peça no formulário do inventário. Ficam só neste personagem deste time e NÃO vão para o inventário.
 * O dano aparece em Resumo e build e em Avançado, como em qualquer build equipado.
 */
import { useState, type ReactNode } from 'react';
import { Panel } from '../../design/primitives';
import { MAIN_STAT_VALUES, MAX_ROLLS_PER_SUBSTAT, ROLLS_PER_PIECE, SUBSTATS, SUBSTAT_ROLL_VALUES, type Rolls, type Substat } from '../../engine/artifacts';
import type { MemberRef } from '../../engine/project';
import { artifactProcs, maxProcs, type SubKey } from '../../features/good/artifactProcs';
import { setKeyOf } from '../../features/good/artifactOcr';
import type { GoodArtifact } from '../../features/good/goodImport';
import { MANUAL_LOCATION, SUB_KEY, kqmPieces, type KqmConfig } from '../../features/good/kqmPieces';
import { MAIN_LABEL, SUB_LABEL, formatSub } from '../../features/good/labels';
import { formatDecimal } from '../../ui/format';
import { AddArtifact, MAIN_BY_SLOT } from '../inventario/AddArtifact';
import { PieceArt, SLOTS } from './shared';

interface SetData { id: number; name: string; namePt?: string; rarity?: number }
interface Row { key: SubKey; procs: number; value: number }

const SUB_NAME: Record<SubKey, string> = {
  critRate_: 'Taxa Crítica', critDMG_: 'Dano Crítico', atk_: 'ATK%', atk: 'ATK', eleMas: 'Maestria', enerRech_: 'Recarga', hp_: 'HP%', hp: 'HP', def_: 'DEF%', def: 'DEF',
};
const MAIN_NAME: Record<string, string> = { 'ATK%': 'ATK%', 'HP%': 'HP%', 'DEF%': 'DEF%', EM: 'Maestria', ER: 'Recarga', CR: 'Taxa Crítica', CD: 'Dano Crítico', 'DMG%': 'Bônus de dano', Healing: 'Cura' };
const SUBSTAT_OF =Object.fromEntries((SUBSTATS as readonly Substat[]).map((s) => [SUB_KEY[s], s])) as Record<SubKey, Substat>;
const ALL_KEYS = (SUBSTATS as readonly Substat[]).map((s) => SUB_KEY[s]);
/** Set provisório das peças manuais quando o personagem ainda não tem set: não casa com nenhum set, então não dá bônus. */
const NO_SET = 'SemSet';
const rar = (p: GoodArtifact): 4 | 5 => (p.rarity === 4 ? 4 : 5);

/** Linhas da tabela: procs e valor somados de cada substat. No manual aparecem todos (dá para digitar); no KQM só os que têm procs. */
function tableRows(manual: boolean, pieces: GoodArtifact[], rolls: Rolls): Row[] {
  const sum = new Map<SubKey, Row>();
  const add = (key: SubKey, procs: number, value: number) => {
    const cur = sum.get(key) ?? { key, procs: 0, value: 0 };
    sum.set(key, { key, procs: cur.procs + procs, value: cur.value + value });
  };
  if (manual) {
    for (const k of ALL_KEYS) add(k, 0, 0);
    for (const p of pieces) for (const s of p.substats) add(s.key as SubKey, artifactProcs([s], rar(p)).total, s.value);
    return ALL_KEYS.map((k) => sum.get(k)!).sort((a, b) => b.procs - a.procs);
  }
  for (const s of SUBSTATS as readonly Substat[]) {
    const key = SUB_KEY[s];
    // Valor médio por roll do KQM (frações viram pontos percentuais, como nos artefatos).
    const per = SUBSTAT_ROLL_VALUES[s][0] * (key.endsWith('_') ? 100 : 1);
    if (rolls[s] > 0) add(key, rolls[s], rolls[s] * per);
  }
  return [...sum.values()].filter((r) => r.procs > 0).sort((a, b) => b.procs - a.procs);
}

const GOOD_OF: Record<string, string> = { 'ATK%': 'atk_', 'HP%': 'hp_', 'DEF%': 'def_', EM: 'eleMas', ER: 'enerRech_', CR: 'critRate_', CD: 'critDMG_', Healing: 'heal_' };
/** Stat principal da peça no nome do motor (o cálice com DMG% de qualquer elemento vira "DMG%"). */
const engineMain = (p: GoodArtifact): string => (p.slotKey === 'goblet' && p.mainStatKey.endsWith('_dmg_') ? 'DMG%' : (Object.entries(GOOD_OF).find(([, g]) => g === p.mainStatKey)?.[0] ?? p.mainStatKey));

export function ManualBuild({ member, rolls, element, sets, onChange, focus, redistribute }: {
  /** Escolha do golpe de foco do KQM (o mesmo seletor de golpes da otimização). */
  focus?: ReactNode;
  member: MemberRef;
  /** Rolls que o KQM distribui para o build genérico deste personagem (mostrados enquanto não há peças próprias). */
  rolls: Rolls;
  element: string;
  sets: readonly SetData[];
  onChange: (patch: Partial<MemberRef>) => void;
  /** Roda o KQM para estas 5 peças (stats principais e sets delas) e devolve os procs distribuídos. */
  redistribute: (pieces: GoodArtifact[]) => Rolls;
}) {
  const real = (member.pieces ?? []) as GoodArtifact[];
  const fromInventory = real.length > 0 && !real.every((p) => p.location === MANUAL_LOCATION);
  const mark = (list: GoodArtifact[]) => list.map((p) => ({ ...p, location: MANUAL_LOCATION }));
  const [editing, setEditing] = useState<{ slot: string; piece?: GoodArtifact } | null>(null);
  const [leftover, setLeftover] = useState(0);
  const setOf = (key: string) => sets.find((s) => setKeyOf(s.name) === key);

  const first = member.primarySet ? setKeyOf(member.primarySet) : NO_SET;
  const second = member.secondarySet && member.fourPiece !== true ? setKeyOf(member.secondarySet) : first;
  // Sem peças próprias a tabela mostra o build genérico do KQM como 5 peças; a primeira edição as grava no personagem.
  // 2 + 2: flor e pluma do primeiro set, areia e cálice do segundo, tiara do primeiro.
  const pieces: GoodArtifact[] = real.length > 0
    ? real
    : kqmPieces(rolls, member.artifacts, first, element).pieces.map((p) => (p.slotKey === 'sands' || p.slotKey === 'goblet' ? { ...p, setKey: second } : p));
  const by = (slot: string) => pieces.find((p) => p.slotKey === slot);
  const save = (list: GoodArtifact[]) => onChange({ pieces: mark(list), piecesChoice: undefined });
  const submit = (a: GoodArtifact) => save([...pieces.filter((p) => p.slotKey !== a.slotKey && p !== editing?.piece), a]);
  const initialFor = (slot: string): GoodArtifact => ({
    setKey: pieces[0]?.setKey && pieces[0].setKey !== NO_SET ? pieces[0].setKey : member.primarySet ? setKeyOf(member.primarySet) : '', slotKey: slot as GoodArtifact['slotKey'], rarity: 5, level: 20,
    mainStatKey: MAIN_BY_SLOT[slot as keyof typeof MAIN_BY_SLOT][0], substats: [], location: '',
  });

  const rows = tableRows(true, pieces, rolls);
  const totalProcs = rows.reduce((t, r) => t + r.procs, 0);
  const cap = pieces.reduce((t, p) => t + maxProcs(rar(p), p.level ?? 20), 0);
  const fmtProcs = (n: number) => formatDecimal(n, Number.isInteger(n) ? 0 : 1);

  /** Refaz os substats das 5 peças a partir dos procs (set, raridade, nível e stat principal de cada peça continuam). */
  const rebuild = (next: Rolls) => {
    const cfg: KqmConfig = {
      rarity: { flower: by('flower') ? rar(by('flower')!) : 5, plume: by('plume') ? rar(by('plume')!) : 5, sands: by('sands') ? rar(by('sands')!) : 5, goblet: by('goblet') ? rar(by('goblet')!) : 5, circlet: by('circlet') ? rar(by('circlet')!) : 5 },
      sands: by('sands')?.mainStatKey ?? MAIN_BY_SLOT.sands[0], goblet: by('goblet')?.mainStatKey ?? MAIN_BY_SLOT.goblet[0], circlet: by('circlet')?.mainStatKey ?? MAIN_BY_SLOT.circlet[0],
    };
    const { pieces: gen, leftover: left } = kqmPieces(next, cfg, pieces[0]?.setKey ?? first, element);
    setLeftover(left);
    onChange({ pieces: gen.map((p) => ({ ...p, setKey: by(p.slotKey)?.setKey ?? p.setKey, level: by(p.slotKey)?.level ?? p.level })), piecesChoice: undefined });
  };
  /** Digitar os procs de um substat refaz os substats das 5 peças. */
  const setProcs = (key: SubKey, n: number) => {
    const next = Object.fromEntries(rows.map((r) => [SUBSTAT_OF[r.key], Math.round(r.procs)])) as Rolls;
    next[SUBSTAT_OF[key]] = Math.max(0, Math.min(30, Math.round(n) || 0));
    rebuild(next);
  };
  /** KQM: redistribui os procs considerando as peças que estão aí (stats principais, sets) e o foco escolhido. */
  const kqm = () => rebuild(redistribute(pieces));
  const setMain = (slot: 'sands' | 'goblet' | 'circlet', key: string) => {
    const good = key === 'DMG%' ? `${element.toLowerCase()}_dmg_` : (GOOD_OF[key] ?? key);
    save(pieces.map((p) => (p.slotKey === slot ? { ...p, mainStatKey: good, substats: p.substats.filter((x) => x.key !== good) } : p)));
  };

  return (
    <Panel bar title="Build do personagem" badge={<span className="dz-badge num">{fromInventory ? 'Inventário' : 'Manual'}</span>}>
      <div className="ot-mb" data-manual="true">
        {/* São 10 substats: duas tabelas lado a lado (5 + 5) deixam o box baixo o bastante para caber na tela. */}
        <div className="ot-mtables" data-split="true">
          {[rows.slice(0, 5), rows.slice(5)].map((part, ti, all) => (
            <table className="ot-mtable" key={ti} aria-label="Substats do build">
              <thead>
                <tr><th scope="col">Status</th><th scope="col" className="r">Procs</th><th scope="col" className="r">Valor</th></tr>
              </thead>
              <tbody>
                {part.map((r) => (
                  <tr key={r.key}>
                    <th scope="row">{SUB_NAME[r.key]}</th>
                    <td className="r num">
                      <input className="dz-input ot-procin" type="number" min={0} max={30} step={1} value={fmtProcs(r.procs)} aria-label={`Procs de ${SUB_NAME[r.key]}`}
                        onChange={(e) => setProcs(r.key, Number(e.target.value))} />
                    </td>
                    <td className="r num">{formatSub(r.key, r.value)}</td>
                  </tr>
                ))}
              </tbody>
              {ti === all.length - 1 && (
                <tfoot>
                  <tr><th scope="row">Total</th><td className="r num">{fmtProcs(totalProcs)} <span className="muted">/ {cap}</span></td><td /></tr>
                </tfoot>
              )}
            </table>
          ))}
        </div>

        <div className="ot-mnote">
          <h3 className="ot-mh">Stats principais</h3>
          <div className="ot-mains">
            {(['sands', 'goblet', 'circlet'] as const).map((slot) => (
              <label key={slot} className="ot-field">
                <span className="lbl">{SLOTS.find((x) => x.key === slot)?.label}</span>
                <select className="dz-input" value={by(slot) ? engineMain(by(slot)!) : ''} aria-label={`Stat principal: ${slot}`} onChange={(e) => setMain(slot, e.target.value)}>
                  {Object.keys(MAIN_STAT_VALUES[slot]).map((k) => <option key={k} value={k}>{MAIN_NAME[k] ?? k}</option>)}
                </select>
              </label>
            ))}
          </div>
          {focus}
          <button type="button" className="dz-btn gold" onClick={kqm} title="Redistribui os procs pelos substats úteis, considerando os stats principais, o set e os buffs ativos">Otimizado (KQM)</button>
          <p className="small">O KQM redistribui até 36 procs úteis (Taxa e Dano Crítico, ATK%/HP%/DEF%, Maestria e Recarga) para o dano do foco, considerando os stats principais, o set e os buffs ativos. A Recarga mínima sai primeiro; o que sobra vai para HP, DEF e ATK fixo. Cada proc vale 85% do máximo. Você pode ajustar os procs na tabela ou editar uma peça.</p>
          {!member.primarySet && real.length === 0 && <p className="note">Sem set escolhido: as peças ficam sem bônus de set. Escolha o set em Resumo e build ou em Editar, em cada peça.</p>}
          {leftover > 0 && <p className="note">{leftover} {leftover === 1 ? 'proc não coube' : 'procs não couberam'} nas peças (limite de 4 substats e de {ROLLS_PER_PIECE[0]} procs por peça).</p>}
          {fromInventory && <p className="muted small">Peças do inventário equipadas. Ao editar uma ou usar o KQM, as 5 viram cópias manuais (o inventário não muda).</p>}
        </div>
      </div>

      <ul className="ot-pieces" aria-label="Peças do build">
        {SLOTS.map((sl) => {
          const p = by(sl.key);
          const set = p ? setOf(p.setKey) : undefined;
          const procs = p ? artifactProcs(p.substats, rar(p)).total : 0;
          return (
            <li key={sl.key} className="ot-pc">
              <div className="ot-pc-head">
                {p ? <PieceArt piece={p} setId={set?.id} setName={set?.name} /> : <span className="ot-art"><b className="ph" aria-hidden="true" /></span>}
                <span className="t">
                  <b>{sl.label}</b>
                  <small>{p ? (p.setKey === NO_SET ? 'sem set' : (set?.namePt ?? set?.name ?? p.setKey)) : 'vazia'}</small>
                </span>
              </div>
              <div className="ot-pc-main">{p ? (MAIN_LABEL[p.slotKey === 'flower' ? 'hp' : p.slotKey === 'plume' ? 'atk' : p.mainStatKey] ?? p.mainStatKey) : '—'}</div>
              <ul className="ot-pc-subs">
                {[0, 1, 2, 3].map((i) => {
                  const s = p?.substats[i];
                  return s
                    ? <li key={i}><span>{SUB_LABEL[s.key] ?? s.key}</span><span className="num">{artifactProcs([s], rar(p!)).total}</span></li>
                    : <li key={i} className="muted"><span>—</span><span /></li>;
                })}
              </ul>
              <div className="ot-pc-foot">
                <span className="num muted small">{p ? `${procs} procs` : ''}</span>
                <span className="ot-pc-btns">
                  <button type="button" className="dz-btn sm" onClick={() => setEditing({ slot: sl.key, piece: p })}>{p ? 'Editar' : 'Adicionar'}</button>
                  {p && <button type="button" className="dz-btn sm" aria-label={`Remover ${sl.label}`} onClick={() => { const rest = pieces.filter((x) => x !== p); if (rest.length) save(rest); else onChange({ pieces: undefined, piecesChoice: 'generic' }); }}>×</button>}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="muted small">Estas peças valem só para este personagem neste time e não entram no inventário. O dano aparece em Resumo e build e em Avançado.</p>
      {editing && <AddArtifact sets={sets} initial={editing.piece ?? initialFor(editing.slot)} onSubmit={submit} onClose={() => setEditing(null)} />}
    </Panel>
  );
}
