/** Aba Otimizar: no espaço sob o cartão do personagem, a arma que ele usa e os buffs que o time dá a ele. */
import { useMemo, useState } from 'react';
import { Panel } from '../../design/primitives';
import { weaponIconUrl } from '../../design/images';
import { receivedBuffs } from '../../features/character/characterModel';
import { formatDecimal, formatInt } from '../../ui/format';
import type { ProjectView } from '../../app/ProjectContext';

function Img({ src, fallback }: { src: string | undefined; fallback: string }) {
  const [failed, setFailed] = useState(false);
  return src && !failed ? <img src={src} alt="" loading="lazy" crossOrigin="anonymous" onError={() => setFailed(true)} /> : <b className="ph" aria-hidden="true">{fallback}</b>;
}

export function AsideExtras({ v, index }: { v: ProjectView; index: number }) {
  const ref = v.project.members[index];
  const weapon = v.data.game.weapons.find((w) => w.name === ref.weapon);
  const refine = Math.min(5, Math.max(1, ref.refinement ?? 1));
  const buffs = useMemo(() => receivedBuffs(v.project, v.resolved, v.bundle, index).filter((b) => b.active), [v.project, v.resolved, v.bundle, index]);
  const sub = weapon?.substat ? `${weapon.substat.stat} ${formatDecimal(weapon.substat.value < 1 ? weapon.substat.value * 100 : weapon.substat.value, 1)}${weapon.substat.value < 1 ? '%' : ''}` : '';
  return (
    <>
      <Panel className="ax-weapon">
        <div className="ax-weapon-body" data-rarity={weapon?.rarity ?? 5}>
          <span className="art"><Img src={weapon?.icon ? weaponIconUrl(weapon.icon) : undefined} fallback="⚔" /></span>
          <span className="n">{ref.weapon}</span>
          <span className="num sub">Nv 90 · R{refine}{weapon ? ` · ATK ${formatInt(weapon.baseAtk)}` : ''}{sub ? ` · ${sub}` : ''}</span>
        </div>
      </Panel>
      <Panel title="Buffs do time" aside={<span className="num muted small">{buffs.length} ativos</span>} className="ax-buffs">
        {buffs.length === 0 && <p className="note">O time não dá buffs a {ref.character} neste projeto.</p>}
        <ul>
          {buffs.map((b) => (
            <li key={b.id}>
              <span className="n">{b.name}</span>
              <span className="num val">{b.value}</span>
              <span className="src" style={{ color: b.giver !== null ? v.colors[b.giver] : undefined }}>{b.giverName}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
