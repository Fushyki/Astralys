/**
 * Alvo "Manual" da aba Otimizar: o build do personagem é feito à mão ou pelo KQM automático. Nos dois modos a tabela mostra,
 * por substat, os procs e o valor total.
 *  - KQM (otimizado): sem peças; o motor distribui os rolls nos substats úteis (o build genérico).
 *  - Manual: 5 artefatos feitos aqui (ou gerados do KQM para ajustar). Ficam só neste personagem deste time e NÃO vão para o inventário.
 * O dano aparece em Resumo e build e em Avançado, como em qualquer build equipado.
 */
import { useState } from 'react';
import { Panel } from '../../design/primitives';
import { SUBSTATS, SUBSTAT_ROLL_VALUES, type Rolls, type Substat } from '../../engine/artifacts';
import type { MemberRef } from '../../engine/project';
import { artifactProcs, maxProcs, type SubKey } from '../../features/good/artifactProcs';
import { setKeyOf } from '../../features/good/artifactOcr';
import type { GoodArtifact } from '../../features/good/goodImport';
import { MANUAL_LOCATION, SUB_KEY, kqmPieces } from '../../features/good/kqmPieces';
import { MAIN_LABEL, SUB_LABEL, formatSub } from '../../features/good/labels';
import { formatDecimal } from '../../ui/format';
import { AddArtifact, MAIN_BY_SLOT } from '../inventario/AddArtifact';
import { PieceArt, SLOTS } from './shared';

interface SetData { id: number; name: string; namePt?: string; rarity?: number }
interface Row { key: SubKey; procs: number; value: number }

const SUB_NAME: Record<SubKey, string> = {
  critRate_: 'Taxa Crítica', critDMG_: 'Dano Crítico', atk_: 'ATK%', atk: 'ATK', eleMas: 'Maestria', enerRech_: 'Recarga', hp_: 'HP%', hp: 'HP', def_: 'DEF%', def: 'DEF',
};

/** Linhas da tabela: procs e valor somados de cada substat, do que tem mais procs para o que tem menos. */
function tableRows(manual: boolean, pieces: GoodArtifact[], rolls: Rolls): Row[] {
  const sum = new Map<SubKey, Row>();
  const add = (key: SubKey, procs: number, value: number) => {
    const cur = sum.get(key) ?? { key, procs: 0, value: 0 };
    sum.set(key, { key, procs: cur.procs + procs, value: cur.value + value });
  };
  if (manual) {
    for (const p of pieces) for (const s of p.substats) add(s.key as SubKey, artifactProcs([s], p.rarity === 4 ? 4 : 5).total, s.value);
  } else {
    for (const s of SUBSTATS as readonly Substat[]) {
      const key = SUB_KEY[s];
      // Valor médio por roll do KQM (frações viram pontos percentuais, como nos artefatos).
      const per = SUBSTAT_ROLL_VALUES[s][0] * (key.endsWith('_') ? 100 : 1);
      if (rolls[s] > 0) add(key, rolls[s], rolls[s] * per);
    }
  }
  return [...sum.values()].filter((r) => r.procs > 0).sort((a, b) => b.procs - a.procs);
}

export function ManualBuild({ member, rolls, element, sets, onChange }: {
  member: MemberRef;
  /** Rolls que o KQM distribui para este personagem (build genérico). */
  rolls: Rolls;
  element: string;
  sets: readonly SetData[];
  onChange: (patch: Partial<MemberRef>) => void;
}) {
  const pieces = (member.pieces ?? []) as GoodArtifact[];
  const manual = pieces.length > 0 && pieces.every((p) => p.location === MANUAL_LOCATION);
  const fromInventory = pieces.length > 0 && !manual;
  const mark = (list: GoodArtifact[]) => list.map((p) => ({ ...p, location: MANUAL_LOCATION }));
  const [editing, setEditing] = useState<{ slot: string; piece?: GoodArtifact } | null>(null);
  const setOf = (key: string) => sets.find((s) => setKeyOf(s.name) === key);

  const toKqm = () => onChange({ pieces: undefined, piecesChoice: 'generic', noArtifacts: undefined });
  const toManual = () => {
    if (fromInventory) return onChange({ pieces: mark(pieces) }); // copia as peças do inventário para editar sem mexer nele
    if (!member.primarySet) return;
    const first = setKeyOf(member.primarySet);
    const second = member.secondarySet && member.fourPiece !== true ? setKeyOf(member.secondarySet) : first;
    const { pieces: gen } = kqmPieces(rolls, member.artifacts, first, element);
    // 2 + 2: flor e pluma do primeiro set, areia e cálice do segundo, tiara do primeiro.
    onChange({ pieces: gen.map((p) => (p.slotKey === 'sands' || p.slotKey === 'goblet' ? { ...p, setKey: second } : p)), piecesChoice: undefined });
  };
  const submit = (a: GoodArtifact) => onChange({ pieces: mark([...pieces.filter((p) => p.slotKey !== a.slotKey && p !== editing?.piece), a]), piecesChoice: undefined });
  const initialFor = (slot: string): GoodArtifact => ({
    setKey: pieces[0]?.setKey ?? (member.primarySet ? setKeyOf(member.primarySet) : ''), slotKey: slot as GoodArtifact['slotKey'], rarity: 5, level: 20,
    mainStatKey: MAIN_BY_SLOT[slot as keyof typeof MAIN_BY_SLOT][0], substats: [], location: '',
  });

  const rows = tableRows(pieces.length > 0, pieces, rolls);
  const totalProcs = rows.reduce((t, r) => t + r.procs, 0);
  const cap = pieces.length > 0 ? pieces.reduce((t, p) => t + maxProcs(p.rarity === 4 ? 4 : 5, p.level ?? 20), 0) : 45;
  const fmtProcs = (n: number) => formatDecimal(n, Number.isInteger(n) ? 0 : 1);

  return (
    <Panel bar title="Build do personagem" badge={<span className="dz-badge num">{manual ? 'Manual' : fromInventory ? 'Inventário' : 'KQM'}</span>}>
      <div className="ot-seg" role="group" aria-label="Como montar o build">
        <button type="button" aria-pressed={pieces.length === 0} onClick={toKqm} title="O motor distribui os procs nos substats úteis (padrão KQM)">KQM (otimizado)</button>
        <button type="button" aria-pressed={manual} disabled={!manual && !fromInventory && !member.primarySet} onClick={manual ? undefined : toManual} title={member.primarySet ? 'Cria 5 artefatos a partir do KQM para você ajustar' : 'Escolha o set em Resumo e build'}>Manual</button>
      </div>

      <div className="ot-mb">
        <table className="ot-mtable" aria-label="Substats do build">
          <thead>
            <tr><th scope="col">Status</th><th scope="col" className="r">Procs</th><th scope="col" className="r">Valor</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={3} className="muted">Sem substats ainda.</td></tr>}
            {rows.map((r) => (
              <tr key={r.key}>
                <th scope="row">{SUB_NAME[r.key]}</th>
                <td className="r num">{fmtProcs(r.procs)}</td>
                <td className="r num">{formatSub(r.key, r.value)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><th scope="row">Total</th><td className="r num">{fmtProcs(totalProcs)} <span className="muted">/ {cap}</span></td><td /></tr>
          </tfoot>
        </table>

        {pieces.length === 0 ? (
          <div className="ot-mnote">
            <p className="muted small">O motor distribui os rolls nos substats úteis para o dano do time, com Recarga mínima primeiro. Set e stats principais ficam na aba Resumo e build.</p>
            {!member.primarySet && <p className="note">Escolha o set em Resumo e build para montar as peças à mão.</p>}
          </div>
        ) : (
          <ul className="ot-manual" aria-label="Peças do build">
            {SLOTS.map((sl) => {
              const p = pieces.find((x) => x.slotKey === sl.key);
              const set = p ? setOf(p.setKey) : undefined;
              const procs = p ? artifactProcs(p.substats, p.rarity === 4 ? 4 : 5).total : 0;
              return (
                <li key={sl.key}>
                  {p ? <PieceArt piece={p} setId={set?.id} setName={set?.name} /> : <span className="ot-art"><b className="ph" aria-hidden="true" /></span>}
                  <span className="t">
                    <span><b>{sl.label}</b> {p ? <>· {MAIN_LABEL[p.slotKey === 'flower' ? 'hp' : p.slotKey === 'plume' ? 'atk' : p.mainStatKey] ?? p.mainStatKey} · <span className="num">{procs} procs</span></> : <span className="muted">vazia</span>}</span>
                    {p && <small className="num">{p.substats.map((s) => `${SUB_LABEL[s.key] ?? s.key} ${artifactProcs([s], p.rarity === 4 ? 4 : 5).total}`).join(' · ')}</small>}
                  </span>
                  <button type="button" className="dz-btn sm" onClick={() => setEditing({ slot: sl.key, piece: p })}>{p ? 'Editar' : 'Adicionar'}</button>
                  {p && <button type="button" className="dz-btn sm" aria-label={`Remover ${sl.label}`} onClick={() => { const rest = pieces.filter((x) => x !== p); onChange(rest.length ? { pieces: mark(rest) } : { pieces: undefined, piecesChoice: 'generic' }); }}>×</button>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {fromInventory && <p className="muted small">Peças do inventário equipadas. Ao editar uma, as 5 viram cópias manuais (o inventário não muda).</p>}
      {pieces.length > 0 && <p className="muted small">Estas peças valem só para este personagem neste time e não entram no inventário. O dano aparece em Resumo e build e em Avançado.</p>}
      {editing && <AddArtifact sets={sets} initial={editing.piece ?? initialFor(editing.slot)} onSubmit={submit} onClose={() => setEditing(null)} />}
    </Panel>
  );
}
