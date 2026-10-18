/** Recarga de energia dentro do projeto (/projeto/:id/recarga): usa a equipe, o build real e a rotação do projeto. */
import { useProjectView } from '../app/ProjectContext';
import { useRotationStore } from '../features/rotation/store';
import { withEnergy } from '../features/energy/energyModel';
import { EnergyView } from './recarga/EnergyView';
import './recarga.css';

export default function Recarga() {
  const v = useProjectView();
  const setEnergy = useRotationStore((s) => s.setEnergy);
  const updateMember = useRotationStore((s) => s.updateMember);

  /** Usos da habilidade e do Supremo contados na rotação do projeto. */
  const fillFromRotation = () => {
    let next = v.project;
    v.project.members.forEach((m, i) => {
      const mine = v.resolved.actions.filter((a) => a.member === i);
      next = withEnergy(next, {
        slot: { name: m.character, value: { skillUses: mine.filter((a) => a.move.hitType === 'skill').length, useBurst: mine.some((a) => a.move.hitType === 'burst') } },
      });
    });
    setEnergy(next);
  };

  return (
    <main className="dz-page">
      <section className="dz-pagehead">
        <div className="titles">
          <span className="lbl">Projeto · {v.project.name}</span>
          <h1 className="h1">Recarga de energia</h1>
        </div>
        <div className="actions">
          <button type="button" className="dz-btn gold" onClick={fillFromRotation} title="Conta quantas vezes cada personagem usa a habilidade e o Supremo na rotação">Preencher com a rotação</button>
        </div>
      </section>
      {v.inSync ? (
        <EnergyView
          project={v.project}
          data={v.data}
          buildEr={v.bundle.memberStats.map((s) => s.er)}
          onChange={setEnergy}
          onUseAsMinimum={(i, er) => updateMember(i, { minER: Math.round(er * 1000) / 1000 })}
        />
      ) : (
        <p className="note" role="status">Atualizando a equipe…</p>
      )}
    </main>
  );
}
