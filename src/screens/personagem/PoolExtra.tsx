/** Acúmulos compartilhados de um personagem (Canção de Luscinia do Illuga): o total e o seletor dos extras. */
import type { ProjectView } from '../../app/ProjectContext';
import { useRotationStore } from '../../features/rotation/store';
import { StackInput } from './StackInput';

export function PoolExtra({ v, member }: { v: ProjectView; member: number }) {
  const updateMember = useRotationStore((s) => s.updateMember);
  const ref = v.project.members[member];
  const flat = v.resolved.team.members[member]?.characterEffect?.buffs.flatMap((b) => b.flat ?? []).find((f) => f.extra);
  if (!ref || !flat?.extra || !flat.pool) return null;
  const { max, step, label } = flat.extra;
  const key = `pool:${flat.pool}`;
  const n = Math.min(max, ref.stacks?.[key] ?? 0);
  return (
    <div className="tl-cond" data-active="true">
      <div className="tl-stacks" role="group" aria-label={label}>
        <span>{label} · total de {flat.stacks} acúmulos</span>
        <StackInput value={n} max={max} step={step} label={label} onChange={(x) => updateMember(member, { stacks: { ...ref.stacks, [key]: x } })} />
      </div>
    </div>
  );
}
