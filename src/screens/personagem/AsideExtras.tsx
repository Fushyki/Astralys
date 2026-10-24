/** Aba Otimizar: no espaço sob o cartão do personagem, a arma que ele usa e os buffs que o time dá a ele. */
import { useMemo, useState } from 'react';
import { Panel } from '../../design/primitives';
import { weaponIconUrl } from '../../design/images';
import { memberBuffCards } from '../../features/character/characterModel';
import { Button } from '../../design/Button';
import { aggregateBuffs } from './Dashboard';
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
  const sub = weapon?.substat ? `${weapon.substat.stat} ${formatDecimal(weapon.substat.value < 1 ? weapon.substat.value * 100 : weapon.substat.value, 1)}${weapon.substat.value < 1 ? '%' : ''}` : '';
  return (
    <Panel className="ax-weapon">
      <div className="ax-weapon-body" data-rarity={weapon?.rarity ?? 5}>
        <span className="art"><Img src={weapon?.icon ? weaponIconUrl(weapon.icon) : undefined} fallback="⚔" /></span>
        <span className="n">{ref.weapon}</span>
        <span className="num sub">Nv 90 · R{refine}{weapon ? ` · ATK ${formatInt(weapon.baseAtk)}` : ''}{sub ? ` · ${sub}` : ''}</span>
      </div>
    </Panel>
  );
}

/** Buffs que o time dá ao personagem e que entram na busca, somados por atributo, numa faixa recolhível da barra de foco. */
export function TeamBuffsStrip({ v, index }: { v: ProjectView; index: number }) {
  const [open, setOpen] = useState(false);
  const buffs = useMemo(() => aggregateBuffs(memberBuffCards(v.project, v.resolved, v.bundle, index).filter((b) => b.active)), [v.project, v.resolved, v.bundle, index]);
  return (
    <div className="ax-strip">
      <Button variant="ghost" size="sm" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Esconder' : 'Ver'} os buffs do time que entram na busca ({buffs.length})</Button>
      {open && (
        <ul className="ax-chips">
          {buffs.length === 0 && <li className="muted small">O time não dá buffs a {v.project.members[index].character} neste projeto.</li>}
          {buffs.map((b) => (
            <li key={b.key} title={b.sources.join(' · ')}>
              <span>{b.label}</span>
              <b className="num">{b.pct ? `${b.total >= 0 ? '+' : '−'}${formatDecimal(Math.abs(b.total), Math.abs(b.total) % 1 ? 1 : 0)}%` : `${b.total >= 0 ? '+' : '−'}${formatInt(Math.abs(b.total))}`}</b>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
