/**
 * Alvo "Manual" da aba Otimizar: o build do personagem é feito à mão ou pelo KQM automático.
 *  - KQM (otimizado): sem peças; o motor distribui os rolls nos substats úteis (o build genérico).
 *  - Manual: 5 artefatos feitos aqui (ou gerados do KQM para ajustar). Ficam só neste personagem deste time e NÃO vão para o inventário.
 * O dano aparece em Resumo e build e em Avançado, como em qualquer build equipado.
 */
import { useState } from 'react';
import { Panel } from '../../design/primitives';
import { SUBSTATS, type Rolls } from '../../engine/artifacts';
import type { MemberRef } from '../../engine/project';
import { artifactProcs } from '../../features/good/artifactProcs';
import { setKeyOf } from '../../features/good/artifactOcr';
import type { GoodArtifact } from '../../features/good/goodImport';
import { MANUAL_LOCATION, kqmPieces } from '../../features/good/kqmPieces';
import { MAIN_LABEL, SUB_LABEL } from '../../features/good/labels';
import { AddArtifact, MAIN_BY_SLOT } from '../inventario/AddArtifact';
import { PieceArt, SLOTS } from './shared';

interface SetData { id: number; name: string; namePt?: string; rarity?: number }

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
  const used = SUBSTATS.filter((s) => rolls[s] >= 0.5).map((s) => `${s} ${Math.round(rolls[s])}`);

  return (
    <Panel bar title="Build do personagem" badge={<span className="dz-badge num">{manual ? 'Manual' : fromInventory ? 'Inventário' : 'KQM'}</span>}>
      <div className="ot-seg" role="group" aria-label="Como montar o build">
        <button type="button" aria-pressed={pieces.length === 0} onClick={toKqm} title="O motor distribui os procs nos substats úteis (padrão KQM)">KQM (otimizado)</button>
        <button type="button" aria-pressed={manual} disabled={!manual && !fromInventory && !member.primarySet} onClick={manual ? undefined : toManual} title={member.primarySet ? 'Cria 5 artefatos a partir do KQM para você ajustar' : 'Escolha o set em Resumo e build'}>Manual</button>
      </div>
      {pieces.length === 0 ? (
        <>
          <p className="muted small">O motor distribui os rolls nos substats úteis para o dano do time, com Recarga mínima primeiro. Set e stats principais: aba Resumo e build.</p>
          {used.length > 0 && <p className="num small">Rolls: {used.join(' · ')}</p>}
          {!member.primarySet && <p className="note">Escolha o set em Resumo e build para montar peças à mão.</p>}
        </>
      ) : (
        <>
          <p className="muted small">{fromInventory ? 'Peças do inventário equipadas. Ao editar uma, as 5 viram cópias manuais (o inventário não muda). ' : ''}Estes artefatos valem só para este personagem neste time e não entram no inventário. O dano aparece em Resumo e build e em Avançado.</p>
          <ul className="ot-manual">
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
        </>
      )}
      {editing && <AddArtifact sets={sets} initial={editing.piece ?? initialFor(editing.slot)} onSubmit={submit} onClose={() => setEditing(null)} />}
    </Panel>
  );
}
