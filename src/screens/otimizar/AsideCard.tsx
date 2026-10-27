/** Coluna do personagem na aba Otimizar: um painel só (arte, nome, facção, constelação, talentos e a arma no rodapé). */
import { useState } from 'react';
import type { ProjectView } from '../../app/ProjectContext';
import { CharacterAvatar } from '../../design/primitives';
import { elementColor } from '../../design/elements';
import { weaponIconUrl } from '../../design/images';
import { LevelControl } from '../personagem/LevelControl';
import { effectiveTalents, factionsOf } from '../../engine';
import { effectStatus } from '../../features/rotation/teamInfo';
import { weaponsFor } from '../../features/rotation/teamOps';
import { useRotationStore } from '../../features/rotation/store';
import { formatDecimal, formatInt, formatPercent } from '../../ui/format';
import { WeaponPickerDialog } from '../personagem/WeaponPicker';

const WEAPON_LABEL: Record<string, string> = { Sword: 'Espada', Claymore: 'Espadão', Polearm: 'Lança', Catalyst: 'Catalisador', Bow: 'Arco' };
const FACTION_LABEL = { moonsign: 'Moonsign', hexerei: 'Hexerei' } as const;
const SPLASH = 'https://api.lunaris.moe/data/assets/gachaimg';
const clamp = (n: number) => Math.max(1, Math.min(15, Math.round(n)));

function Img({ src, fallback }: { src: string | undefined; fallback: string }) {
  const [failed, setFailed] = useState(false);
  return src && !failed ? <img src={src} alt="" loading="lazy" crossOrigin="anonymous" onError={() => setFailed(true)} /> : <b className="ph" aria-hidden="true">{fallback}</b>;
}

export function AsideCard({ v, index }: { v: ProjectView; index: number }) {
  const update = useRotationStore((s) => s.updateMember);
  const ref = v.project.members[index];
  const character = v.data.game.characters.find((c) => c.name === ref.character)!;
  const weapon = v.data.game.weapons.find((w) => w.name === ref.weapon);
  const [failed, setFailed] = useState(false);
  const [pick, setPick] = useState(false);
  const color = v.colors[index];
  const share = v.summary.members[index]?.fraction ?? 0;
  const eligible = v.data.effects.characters.find((c) => c.character === character.name)?.factions ?? [];
  const cons = ref.constellation ?? 0;
  const eff = effectiveTalents(ref.talents, ref.constellation, character);
  const refine = Math.min(5, Math.max(1, ref.refinement ?? 1));
  const substatValue = weapon?.substat ? `${formatDecimal(weapon.substat.value < 1 ? weapon.substat.value * 100 : weapon.substat.value, 1)}${weapon.substat.value < 1 ? '%' : ''}` : '—';

  return (
    <section className="dz-panel oa" style={{ ['--c' as string]: color, ['--e' as string]: elementColor(character.element) }} aria-label={`${character.name}, ${character.element}`}>
      <div className="oa-art">
        {character.splash && !failed ? (
          <img src={`${SPLASH}/${character.splash}.webp`} alt="" crossOrigin="anonymous" loading="lazy" onError={() => setFailed(true)} />
        ) : (
          <CharacterAvatar name={character.name} icon={character.icon} color={color} size={120} />
        )}
        <span className="elem">{character.element.toUpperCase()}</span>
        <LevelControl name={character.name} index={index} level={ref.level ?? v.project.config.characterLevel} />
      </div>
      <div className="oa-body">
        <div className="oa-id">
          <h2>{character.name}</h2>
          <span>{WEAPON_LABEL[character.weapon] ?? character.weapon}</span>
        </div>
        {eligible.length > 0 && (
          <div className="oa-fac" role="group" aria-label="Facção">
            {eligible.map((f) => {
              const cur = factionsOf(ref.factions, eligible);
              const on = cur.includes(f);
              const rest = cur.filter((x) => x !== f);
              return <button key={f} type="button" aria-pressed={on} onClick={() => update(index, { factions: on ? rest : [...rest, f] })}>{FACTION_LABEL[f]}</button>;
            })}
          </div>
        )}
        <button type="button" className="oa-weapon" data-rarity={weapon?.rarity ?? 5} onClick={() => setPick(true)} aria-label={`Trocar arma (atual: ${ref.weapon})`}>
          <span className="top">
            <span className="art">
              <Img src={weapon?.icon ? weaponIconUrl(weapon.icon) : undefined} fallback="⚔" />
              <b className="rf num">R{refine}</b>
            </span>
            <span className="t">
              <small className="lbl">Arma</small>
              <b className="n" title={ref.weapon}>{ref.weapon}</b>
              <i className="stars" aria-label={`${weapon?.rarity ?? 5} estrelas`}>{'★'.repeat(weapon?.rarity ?? 5)}</i>
              <small className="num">{WEAPON_LABEL[character.weapon] ?? character.weapon} · Nv 90/90</small>
            </span>
          </span>
          <span className="mini">
            <span><small>ATK base</small><b className="num">{weapon ? formatInt(weapon.baseAtk) : '—'}</b></span>
            <span><small>{weapon?.substat?.stat ?? 'Substat'}</small><b className="num gold">{substatValue}</b></span>
          </span>
        </button>
        <div className="oa-sec">
          <span className="lbl">Constelação</span>
          <div className="oa-cons" role="group" aria-label="Constelação">
            {[0, 1, 2, 3, 4, 5, 6].map((n) => (
              <button key={n} type="button" aria-pressed={cons === n} aria-label={`Constelação ${n}`} onClick={() => update(index, { constellation: n || undefined })}>C{n}</button>
            ))}
          </div>
        </div>
        <div className="oa-sec">
          <span className="lbl">Talentos · normal · habilidade · supremo</span>
          <div className="oa-tal">
            {(['normal', 'skill', 'burst'] as const).map((k) => (
              <input
                key={`${k}${ref.talents[k]}`}
                className="num" type="number" inputMode="numeric" min={1} max={15} step={1}
                aria-label={`Nível de talento: ${k === 'normal' ? 'Normal' : k === 'skill' ? 'Habilidade' : 'Supremo'}${eff[k] > ref.talents[k] ? ` (efetivo ${eff[k]})` : ''}`}
                defaultValue={ref.talents[k]}
                onBlur={(e) => {
                  const n = Number(e.currentTarget.value);
                  if (Number.isFinite(n) && clamp(n) !== ref.talents[k]) update(index, { talents: { ...ref.talents, [k]: clamp(n) } });
                  else e.currentTarget.value = String(ref.talents[k]);
                }}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              />
            ))}
          </div>
          <span className="oa-share num">{formatPercent(share, 1)} do dano do time</span>
        </div>
      </div>
      {pick && (
        <WeaponPickerDialog
          weapons={weaponsFor(character, v.data.game.weapons)}
          current={ref.weapon}
          status={(name) => effectStatus(v.data.effects.weapons.find((e) => e.weapon === name))}
          onPick={(name) => { update(index, { weapon: name }); setPick(false); }}
          onClose={() => setPick(false)}
        />
      )}
    </section>
  );
}
