/**
 * Família do dano de um golpe: elemental (cor do elemento; branco = Físico), Lunar ou Estelar. Lunar e Estelar não são um
 * elemento: usam outra fórmula (base × reação) e por isso ganham cor, glifo e etiqueta próprios em toda lista de golpes.
 */
import { elementColor } from './elements';

export type DamageFamily = 'lunar' | 'stellar';

export const SPECIAL_LABEL: Record<string, string> = {
  lunarcharged: 'Lunar-Carregado',
  lunarbloom: 'Lunar-Florescer',
  lunarcrystallize: 'Lunar-Cristalizar',
  stellarconduct: 'Condução Estelar',
  stellarswirl: 'Redemoinho Estelar',
};
export const FAMILY_COLOR: Record<DamageFamily, string> = { lunar: 'var(--dmg-lunar)', stellar: 'var(--dmg-stellar)' };
const GLYPH: Record<DamageFamily, string> = { lunar: '☾', stellar: '✦' };
const FAMILY_NAME: Record<DamageFamily, string> = { lunar: 'Lunar', stellar: 'Estelar' };

export const familyOf = (special?: string | null): DamageFamily | undefined => (special ? (special.startsWith('lunar') ? 'lunar' : 'stellar') : undefined);

/** Cor do nome do golpe: a da família (Lunar/Estelar) ou a do elemento; undefined = Físico (texto normal). */
export function damageColor(element: string | undefined, special?: string | null): string | undefined {
  const fam = familyOf(special);
  if (fam) return FAMILY_COLOR[fam];
  return element && element !== 'Physical' ? elementColor(element) : undefined;
}

/** Etiqueta "☾ Lunar" ou "✦ Estelar"; sem reação Lunar/Estelar não mostra nada. */
export function FamilyBadge({ special, long }: { special?: string | null; long?: boolean }) {
  const fam = familyOf(special);
  if (!fam) return null;
  return (
    <span className="fam" data-family={fam} title={`Dano ${FAMILY_NAME[fam]}: ${SPECIAL_LABEL[special!] ?? special}. Não é elemental: usa a fórmula da reação.`}>
      {GLYPH[fam]} {long ? SPECIAL_LABEL[special!] ?? FAMILY_NAME[fam] : FAMILY_NAME[fam]}
    </span>
  );
}

/** Legenda das cores de dano (elementos, Físico, Lunar e Estelar), para as listas de golpes. */
export function DamageLegend() {
  return (
    <span className="fam-legend" aria-label="Cores do tipo de dano">
      <span><i style={{ background: 'var(--el-pyro)' }} />Elemental (cor do elemento)</span>
      <span><i style={{ background: 'var(--el-physical)' }} />Físico (branco)</span>
      <span><i style={{ background: 'var(--dmg-lunar)' }} />☾ Lunar</span>
      <span><i style={{ background: 'var(--dmg-stellar)' }} />✦ Estelar</span>
    </span>
  );
}
