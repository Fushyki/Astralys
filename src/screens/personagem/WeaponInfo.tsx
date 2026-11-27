/** Buffs da arma (bloco do refino e popup do ícone): passiva no refinamento dele, stacks e o botão de ativar cada buff. */
import { useEffect, useMemo } from 'react';
import { useProjectView } from '../../app/ProjectContext';
import { cleanLunarisMarkup } from '../../data/clean';
import { weaponIconUrl } from '../../design/images';
import { weaponStatsAt } from '../../effects/schema';
import { pickedReceivers, stacksOf } from '../../engine';
import { memberGivenCards, type BuffCard } from '../../features/character/characterModel';
import { useRotationStore } from '../../features/rotation/store';
import { formatDecimal, formatInt } from '../../ui/format';
import { StackInput } from './StackInput';

const TYPE_LABEL: Record<string, string> = { Sword: 'Espada', Claymore: 'Espadão', Polearm: 'Lança', Catalyst: 'Catalisador', Bow: 'Arco' };

/** Os ids do motor que vêm da arma do membro `index` (o bônus fixo, os buffs em janela e o buff de time da arma). */
const isWeaponId = (id: string, index: number, teamGear: boolean) =>
  id === `m${index}:weapon` || id.startsWith(`cbuff-${index}-arma:`) || id.startsWith(`m${index}:cbuff-arma:`) || (teamGear && id === `gear-${index}`);

/** Os cartões de buff da arma do membro, e quais estão ligados. */
function useWeaponCards(index: number) {
  const v = useProjectView();
  const ref = v.project.members[index];
  const effect = v.data.effects.weapons.find((e) => e.weapon === ref.weapon);
  const refine = Math.min(5, Math.max(1, ref.refinement ?? 1));
  const teamGear = !!effect && (() => { const t = weaponStatsAt(effect, refine).team; return !!t && (t.atkPct > 0 || t.dmgPct > 0 || t.em > 0); })();
  // Um cartão por buff da arma (os mesmos números de "Buffs recebidos"), mesmo que só os aliados o recebam.
  const buffs = useMemo(
    () => memberGivenCards(v.project, v.resolved, v.bundle, index).filter((c) => isWeaponId(c.baseId, index, teamGear)).map((c) => ({ base: c.baseId, card: c as BuffCard })),
    [v.project, v.resolved, v.bundle, index, teamGear],
  );
  const isOn = (base: string) => !v.project.disabled.includes(base) && !(v.resolved.gearIds.includes(base) && !v.project.enabled.includes(base));
  return { effect, buffs, isOn };
}

/** A passiva da arma na coluna do Otimizar: fechada, diz quantos buffs estão ligados. */
export function WeaponPassiveDetails({ index }: { index: number }) {
  const { buffs, isOn } = useWeaponCards(index);
  const on = buffs.filter((b) => isOn(b.base)).length;
  return (
    <details className="oa-passive">
      <summary>Passiva da arma{buffs.length > 0 ? ` · ${on}/${buffs.length} ativas` : ''}</summary>
      <div className="body">
        <WeaponBuffs index={index} />
        <p className="muted small">Em "Um golpe" vale o que está marcado. Em "Rotação completa" o otimizador conta a arma como ligada, menos o que você desmarcar.</p>
      </div>
    </details>
  );
}

/** Os buffs da arma do membro: a quantidade de stacks e o botão de ativar cada um. */
export function WeaponBuffs({ index }: { index: number }) {
  const v = useProjectView();
  const setBuff = useRotationStore((s) => s.setBuff);
  const updateMember = useRotationStore((s) => s.updateMember);
  const { buffs, isOn } = useWeaponCards(index);
  const ref = v.project.members[index];
  const effect = v.data.effects.weapons.find((e) => e.weapon === ref.weapon);
  const refine = Math.min(5, Math.max(1, ref.refinement ?? 1));
  // Saem do kit resolvido, não dos cartões: com 0 stacks o cartão some e a quantidade precisa continuar à vista.
  const stacked = (v.resolved.team.members[index].characterEffect?.buffs ?? []).filter((b) => b.id.startsWith('arma:') && b.stacks && !b.stacks.of);

  // Buffs que vão só para quem o usuário escolher (ex.: quem recebe a cura).
  const names = v.resolved.team.members.map((m) => m.character.name);
  const pickable = (v.resolved.team.members[index].characterEffect?.buffs ?? []).filter((b) => b.id.startsWith('arma:') && b.pickReceiver);

  const gearIds = v.resolved.gearIds;
  const toggle = (base: string, on: boolean) =>
    setBuff({ toggleId: base, baseId: base, gear: gearIds.includes(base), receiver: ref.character, receivers: [] }, on);

  return (
    <>
      {stacked.map((b) => (
        <div className="tl-cond" data-active="true" key={b.id}>
          <div className="tl-stacks" role="group" aria-label={`Quantidade de ${b.stacks!.unit ?? 'stacks'} de ${b.label}`}>
            <span>{b.label}</span>
            <StackInput value={stacksOf(b, ref.stacks?.[b.id])} max={b.stacks!.max} step={b.stacks!.step} label={`${b.stacks!.unit ?? 'Stacks'} de ${b.label}`} onChange={(n) => updateMember(index, { stacks: { ...ref.stacks, [b.id]: n } })} />
          </div>
        </div>
      ))}
      {pickable.map((b) => {
        const chosen = pickedReceivers(names, index, ref.receivers?.[b.id]);
        return (
          <div className="wi-who" role="group" aria-label={`Quem recebe: ${b.label}`} key={b.id}>
            <span>Quem recebe: {b.label}</span>
            {names.filter((_, j) => j !== index).map((n) => (
              <button type="button" className="dz-btn sm" key={n} aria-pressed={chosen.includes(n)} onClick={() => updateMember(index, { receivers: { ...ref.receivers, [b.id]: chosen.includes(n) ? chosen.filter((x) => x !== n) : [...chosen, n] } })}>{chosen.includes(n) ? '✓ ' : ''}{n}</button>
            ))}
          </div>
        );
      })}
      {buffs.length === 0 && stacked.length === 0 && <p className="muted">Esta arma não tem buff com número cadastrado.</p>}
      {buffs.map(({ base, card }) => {
        const on = isOn(base);
        return (
          <label key={base} className="wi-buff" data-on={on}>
            <input type="checkbox" checked={on} onChange={(e) => toggle(base, e.target.checked)} aria-label={`${card.name}: ativar`} />
            <span className="b">
              <b>{card.name}</b>
              {card.chips.length > 0 && <span className="num chips">{card.chips.join(' · ')}</span>}
              <small>{card.timed ? `Janela: ${card.window}${card.window === 'sem janela' ? ' (crie em Rotação e buffs)' : ''}` : 'Vale o tempo todo'}</small>
            </span>
            <span className="st">{on ? 'Ativo' : 'Desligado'}</span>
          </label>
        );
      })}
      {effect?.note && <p className="muted small">{effect.note}</p>}
    </>
  );
}

export function WeaponInfoDialog({ index, onClose }: { index: number; onClose: () => void }) {
  const v = useProjectView();
  const ref = v.project.members[index];
  const weapon = v.data.game.weapons.find((w) => w.name === ref.weapon);
  const refine = Math.min(5, Math.max(1, ref.refinement ?? 1));
  const passive = weapon?.passive?.refinements?.[refine - 1];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const substat = weapon?.substat ? `${weapon.substat.stat} ${formatDecimal(weapon.substat.value < 1 ? weapon.substat.value * 100 : weapon.substat.value, 1)}${weapon.substat.value < 1 ? '%' : ''}` : null;

  return (
    <div className="dz-modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dz-dialog wi" role="dialog" aria-modal="true" aria-label={`Passiva de ${ref.weapon}`}>
        <header>
          <h2 className="h2">{ref.weapon}</h2>
          <button type="button" className="dz-btn sm" onClick={onClose}>Fechar</button>
        </header>
        <div className="wi-body">
        <div className="wi-top" data-rarity={weapon?.rarity ?? 5}>
          <span className="art">{weapon?.icon ? <img src={weaponIconUrl(weapon.icon)} alt="" crossOrigin="anonymous" /> : <b aria-hidden="true" />}</span>
          <span className="t">
            <small>{weapon ? TYPE_LABEL[weapon.type] ?? weapon.type : ''} · {'★'.repeat(weapon?.rarity ?? 5)} · Nv 90/90 · R{refine}</small>
            <span className="wi-stats">
              {weapon && <span className="wi-stat"><small>ATK base</small><b className="num">{formatInt(weapon.baseAtk)}</b></span>}
              {substat && <span className="wi-stat"><small>Substat</small><b className="num">{substat}</b></span>}
            </span>
          </span>
        </div>
        <section className="wi-sec">
          <h3>{weapon?.passive ? (weapon.passive.namePt ?? weapon.passive.name) : 'Passiva'}</h3>
          <p className="wi-desc">{passive ? cleanLunarisMarkup(passive.descriptionPt ?? passive.description) : 'Esta arma não tem passiva nos dados.'}</p>
        </section>
        <section className="wi-sec">
          <h3>Buffs</h3>
          <WeaponBuffs index={index} />
        </section>
        </div>
      </div>
    </div>
  );
}
