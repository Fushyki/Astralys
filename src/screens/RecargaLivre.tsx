/** Recarga de energia avulsa (/recarga): monta um time só para calcular a ER, sem projeto nem rotação. */
import { useEffect, useState } from 'react';
import { AppHeader } from '../app/AppHeader';
import { CharacterPickerDialog } from '../design/CharacterPickerDialog';
import '../design/design.css';
import { MAX_TEAM_SIZE, type RotationProject } from '../engine';
import { useGameData } from '../features/rotation/data';
import { sampleProject } from '../features/rotation/persistence';
import { defaultMember } from '../features/rotation/teamOps';
import { EnergyView } from './recarga/EnergyView';
import './recarga.css';

const KEY = 'astralys.recarga-livre';

const load = (): RotationProject | null => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RotationProject) : null;
  } catch {
    return null;
  }
};

export default function RecargaLivre() {
  const { data } = useGameData();
  const [project, setProject] = useState<RotationProject>(() => load() ?? { ...sampleProject(), id: 'recarga-livre', name: 'Recarga avulsa', members: [], actions: [], buffWindows: [] });
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(project));
    } catch {
      /* sem armazenamento: a tela continua funcionando */
    }
  }, [project]);

  const add = (name: string) => {
    if (!data) return;
    setProject((p) => ({ ...p, members: [...p.members, defaultMember(name, data.game)] }));
    setPicking(false);
  };
  const remove = (i: number) => setProject((p) => ({ ...p, members: p.members.filter((_, k) => k !== i) }));

  return (
    <div className="dz">
      <AppHeader />
      <main className="dz-page">
        <section className="dz-pagehead">
          <div className="titles">
            <h1 className="h1">Recarga de energia</h1>
            <span className="muted">Escolha até {MAX_TEAM_SIZE} personagens e veja a recarga que cada um precisa. Não depende de um projeto.</span>
          </div>
        </section>

        {!data ? (
          <p className="note" role="status">Carregando os dados do jogo…</p>
        ) : (
          <>
            <div className="rc-team" aria-label="Time">
              {project.members.map((m, i) => (
                <span key={m.character} className="dz-chip">
                  {m.character}
                  <button type="button" className="dz-link" onClick={() => remove(i)} aria-label={`Remover ${m.character}`}>remover</button>
                </span>
              ))}
              {project.members.length < MAX_TEAM_SIZE && <button type="button" className="dz-btn gold" onClick={() => setPicking(true)}>Adicionar personagem</button>}
            </div>
            {project.members.length > 0 ? <EnergyView project={project} data={data} onChange={setProject} /> : <p className="note">Adicione personagens para calcular.</p>}
            {picking && <CharacterPickerDialog title="Adicionar personagem" characters={data.game.characters} exclude={project.members.map((m) => m.character)} onPick={add} onClose={() => setPicking(false)} />}
          </>
        )}
      </main>
    </div>
  );
}
