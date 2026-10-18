/**
 * Barra da equipe: os membros (selecionar, trocar, remover), "adicionar" quando há vaga e a ressonância elemental.
 */
import { useState } from 'react';
import { MAX_TEAM_SIZE, type RotationProject } from '../../engine';
import { ELEMENT_COLOR } from '../../ui/format';
import { CharacterPicker } from './CharacterPicker';
import type { LoadedData } from './data';
import { useRotationStore } from './store';
import { resonanceOf } from './teamInfo';
import { defaultMember } from './teamOps';

type PickerState = { mode: 'replace'; index: number } | { mode: 'add' } | null;

export function TeamBar({ project, data }: { project: RotationProject; data: LoadedData }) {
  const selected = useRotationStore((s) => s.selectedMember);
  const selectMember = useRotationStore((s) => s.selectMember);
  const replaceMember = useRotationStore((s) => s.replaceMember);
  const addMember = useRotationStore((s) => s.addMember);
  const removeMember = useRotationStore((s) => s.removeMember);
  const [picker, setPicker] = useState<PickerState>(null);
  const [error, setError] = useState<string | null>(null);

  const characters = data.game.characters;
  const element = (name: string) => characters.find((c) => c.name === name)?.element;
  const resonances = resonanceOf(project.members.map((m) => element(m.character)).filter((e): e is NonNullable<typeof e> => !!e));

  const pick = (name: string) => {
    try {
      const ref = defaultMember(name, data.game);
      if (picker?.mode === 'replace') replaceMember(picker.index, ref);
      else addMember(ref);
      setError(null);
      setPicker(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const actionsOf = (i: number) => project.actions.filter((a) => a.member === i).length;

  return (
    <div className="ast-team">
      <div className="ast-members" role="tablist" aria-label="Equipe">
        {project.members.map((m, i) => {
          const el = element(m.character);
          const isSel = i === selected;
          return (
            <div className="ast-slot" key={m.character} data-selected={isSel} style={{ ['--c' as string]: el ? ELEMENT_COLOR[el] : '#d8b668' }}>
              <button type="button" role="tab" aria-selected={isSel} className="ast-slot-main" onClick={() => selectMember(i)}>
                <i />
                <span className="n">{m.character}</span>
                <span className="w">{m.weapon}</span>
              </button>
              <span className="ast-slot-actions">
                <button type="button" className="ast-link" onClick={() => setPicker({ mode: 'replace', index: i })}>Trocar</button>
                <button type="button" className="ast-link" onClick={() => removeMember(i)} disabled={project.members.length <= 1}>Remover</button>
              </span>
            </div>
          );
        })}
        {project.members.length < MAX_TEAM_SIZE && (
          <button type="button" className="ast-slot add" onClick={() => setPicker({ mode: 'add' })}>+ Adicionar personagem</button>
        )}
      </div>

      <p className="ast-res">
        {resonances.length === 0 ? (
          'Sem ressonância elemental (precisa de 2 personagens do mesmo elemento).'
        ) : (
          resonances.map((r) => (
            <span key={r.element} className={r.applied ? 'on' : ''}>
              <b className="ast-caps">Ressonância {r.element}</b> {r.text}
            </span>
          ))
        )}
      </p>
      {error && <p className="ast-error" role="alert">{error}</p>}

      {picker && (
        <CharacterPicker
          title={picker.mode === 'replace' ? `Trocar ${project.members[picker.index].character}` : 'Adicionar personagem'}
          note={
            picker.mode === 'replace' && actionsOf(picker.index) > 0
              ? `Os ${actionsOf(picker.index)} golpes deste personagem saem da rotação, porque o novo personagem tem golpes diferentes. Dá para desfazer.`
              : 'O personagem entra com a melhor arma disponível e substats otimizados; ajuste o build depois.'
          }
          characters={characters}
          exclude={project.members.map((m) => m.character)}
          onPick={pick}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
