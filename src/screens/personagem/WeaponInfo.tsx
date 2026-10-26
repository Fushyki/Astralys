/** Popup da arma (no ícone do Resumo e build): passiva no refinamento dele, stats e os buffs da arma, cada um com o botão de ativar. */
import { useEffect, useMemo } from 'react';
import { useProjectView } from '../../app/ProjectContext';
import { cleanLunarisMarkup } from '../../data/clean';
import { weaponIconUrl } from '../../design/images';
import { weaponStatsAt } from '../../effects/schema';
import { memberBuffCards, type BuffCard } from '../../features/character/characterModel';
import { useRotationStore } from '../../features/rotation/store';
import { formatDecimal, formatInt } from '../../ui/format';

const TYPE_LABEL: Record<string, string> = { Sword: 'Espada', Claymore: 'Espadão', Polearm: 'Lança', Catalyst: 'Catalisador', Bow: 'Arco' };

/** Os ids do motor que vêm da arma do membro `index` (o bônus fixo, os buffs em janela e o buff de time da arma). */
const isWeaponId = (id: string, index: number, teamGear: boolean) =>
  id === `m${index}:weapon` || id.startsWith(`cbuff-${index}-arma:`) || id.startsWith(`m${index}:cbuff-arma:`) || (teamGear && id === `gear-${index}`);

export function WeaponInfoDialog({ index, onClose }: { index: number; onClose: () => void }) {
  const v = useProjectView();
  const setBuff = useRotationStore((s) => s.setBuff);
  const ref = v.project.members[index];
  const weapon = v.data.game.weapons.find((w) => w.name === ref.weapon);
  const effect = v.data.effects.weapons.find((e) => e.weapon === ref.weapon);
  const refine = Math.min(5, Math.max(1, ref.refinement ?? 1));
  const passive = weapon?.passive?.refinements?.[refine - 1];
  const teamGear = !!effect && (() => { const t = weaponStatsAt(effect, refine).team; return !!t && (t.atkPct > 0 || t.dmgPct > 0 || t.em > 0); })();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Um cartão por buff da arma (os mesmos números de "Buffs recebidos"), mesmo que só os aliados o recebam.
  const buffs = useMemo(() => {
    const seen = new Map<string, BuffCard>();
    v.project.members.forEach((_, m) => {
      for (const c of memberBuffCards(v.project, v.resolved, v.bundle, m)) {
        const base = c.toggleId.split('@')[0];
        if (c.giver === index && isWeaponId(base, index, teamGear) && !seen.has(base)) seen.set(base, c);
      }
    });
    return [...seen.entries()].map(([base, card]) => ({ base, card }));
  }, [v.project, v.resolved, v.bundle, index, teamGear]);

  const gearIds = v.resolved.gearIds;
  const isOn = (base: string) => !v.project.disabled.includes(base) && !(gearIds.includes(base) && !v.project.enabled.includes(base));
  const toggle = (base: string, on: boolean) =>
    setBuff({ toggleId: base, baseId: base, gear: gearIds.includes(base), receiver: ref.character, receivers: [] }, on);

  const substat = weapon?.substat ? `${weapon.substat.stat} ${formatDecimal(weapon.substat.value < 1 ? weapon.substat.value * 100 : weapon.substat.value, 1)}${weapon.substat.value < 1 ? '%' : ''}` : null;

  return (
    <div className="dz-modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dz-dialog wi" role="dialog" aria-modal="true" aria-label={`Passiva de ${ref.weapon}`}>
        <header>
          <h2 className="h2">{ref.weapon}</h2>
          <button type="button" className="dz-btn sm" onClick={onClose}>Fechar</button>
        </header>
        <div className="wi-top" data-rarity={weapon?.rarity ?? 5}>
          <span className="art">{weapon?.icon ? <img src={weaponIconUrl(weapon.icon)} alt="" crossOrigin="anonymous" /> : <b aria-hidden="true">⚔</b>}</span>
          <span className="t">
            <small>{weapon ? TYPE_LABEL[weapon.type] ?? weapon.type : ''} · Nv 90/90 · R{refine}</small>
            <span className="num">{weapon ? `ATK base ${formatInt(weapon.baseAtk)}` : ''}{substat ? ` · ${substat}` : ''}</span>
          </span>
        </div>
        <section className="wi-sec">
          <h3>{weapon?.passive ? (weapon.passive.namePt ?? weapon.passive.name) : 'Passiva'}</h3>
          <p className="wi-desc">{passive ? cleanLunarisMarkup(passive.descriptionPt ?? passive.description) : 'Esta arma não tem passiva nos dados.'}</p>
        </section>
        <section className="wi-sec">
          <h3>Buffs</h3>
          {buffs.length === 0 && <p className="muted">Esta arma não tem buff com número cadastrado.</p>}
          {buffs.map(({ base, card }) => {
            const on = isOn(base);
            return (
              <label key={base} className="wi-buff" data-on={on}>
                <input type="checkbox" checked={on} onChange={(e) => toggle(base, e.target.checked)} aria-label={`${card.name}: ativar`} />
                <span className="b">
                  <b>{card.name}</b>
                  {card.chips.length > 0 && <span className="num chips">{card.chips.join(' · ')}</span>}
                  <small>{card.timed ? `Janela: ${card.window}` : 'Vale o tempo todo'}</small>
                </span>
                <span className="st">{on ? 'Ativo' : 'Desligado'}</span>
              </label>
            );
          })}
          {effect?.note && <p className="muted small">{effect.note}</p>}
        </section>
      </div>
    </div>
  );
}
