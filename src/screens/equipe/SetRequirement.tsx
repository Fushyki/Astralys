import { useProjectView } from '../../app/ProjectContext';
import { fourPieceActive } from '../../engine';
import { useRotationStore } from '../../features/rotation/store';

/** Set cujo 4 peças exige que o portador seja Hexerei (Dádiva Celestial): sem isso nada entra, e aqui se liga. */
export function SetRequirement({ index }: { index: number }) {
  const v = useProjectView();
  const update = useRotationStore((s) => s.updateMember);
  const m = v.resolved.team.members[index];
  if (!m || !fourPieceActive(m)) return null;
  const need = m.primarySet?.effect?.fourPiece?.buffs?.find((b) => b.team?.ownerFaction)?.team?.ownerFaction;
  if (need !== 'hexerei' || m.factions?.includes(need)) return null;
  const eligible = !!v.data.effects.characters.find((c) => c.character === m.character.name)?.factions?.includes(need);
  return (
    <div className="react" role="note">
      <span className="lbl">{m.primarySet!.name} · 4 peças desligado</span>
      <span className="muted small">
        {eligible
          ? 'Só vale com o portador Hexerei (Tarefa da Bruxa concluída). Depois de marcar, ligue o buff do set.'
          : `${m.character.name} não pode ser Hexerei, então o 4 peças não vale neste personagem.`}
      </span>
      {eligible && (
        <button type="button" className="dz-btn sm" onClick={() => update(index, { factions: [...(m.factions ?? []), need] })}>Marcar como Hexerei</button>
      )}
    </div>
  );
}
