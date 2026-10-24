/** Leitura dos bônus de 2 peças a partir da descrição do Lunaris (conjunto fechado de padrões). */
import type { SetEffect } from '../../src/effects/schema';

type TwoPiece = NonNullable<SetEffect['twoPiece']>;
const round = (n: number) => Math.round(n * 1e6) / 1e6;
const ELEMENTS = ['Pyro', 'Hydro', 'Anemo', 'Electro', 'Dendro', 'Cryo', 'Geo'] as const;
const pct = (m: RegExpMatchArray) => round(Number(m[1]) / 100);

/** Devolve os bônus de 2 peças que o motor sabe aplicar; null se a descrição não bate com nenhum padrão conhecido. */
export function parseTwoPiece(description: string): TwoPiece[] | null {
  const d = description.replace(/\s+/g, ' ').trim();
  let m: RegExpMatchArray | null;
  if ((m = d.match(/^ATK \+(\d+(?:\.\d+)?)%/))) return [{ stat: 'ATK%', value: pct(m) }];
  if ((m = d.match(/^HP \+(\d+(?:\.\d+)?)%/))) return [{ stat: 'HP%', value: pct(m) }];
  if ((m = d.match(/^DEF \+(\d+(?:\.\d+)?)%/))) return [{ stat: 'DEF%', value: pct(m) }];
  if ((m = d.match(/^Energy Recharge \+(\d+(?:\.\d+)?)%/))) return [{ stat: 'ER', value: pct(m) }];
  if ((m = d.match(/^CRIT Rate \+(\d+(?:\.\d+)?)%/))) return [{ stat: 'CR', value: pct(m) }];
  if ((m = d.match(/^Increases Elemental Mastery by (\d+)/))) return [{ stat: 'EM', value: Number(m[1]) }];
  if ((m = d.match(/^(Pyro|Hydro|Anemo|Electro|Dendro|Cryo|Geo) DMG Bonus \+(\d+(?:\.\d+)?)%/))) {
    return [{ stat: 'DMG%', value: round(Number(m[2]) / 100), element: m[1] as (typeof ELEMENTS)[number] }];
  }
  if ((m = d.match(/^Gain an? (\d+(?:\.\d+)?)% (Pyro|Hydro|Anemo|Electro|Dendro|Cryo|Geo) DMG Bonus/))) {
    return [{ stat: 'DMG%', value: round(Number(m[1]) / 100), element: m[2] as (typeof ELEMENTS)[number] }];
  }
  if ((m = d.match(/^Physical DMG (?:\+|is increased by )(\d+(?:\.\d+)?)%/))) return [{ stat: 'Physical DMG%', value: pct(m) }];
  if ((m = d.match(/^Normal and Charged Attack DMG \+(\d+(?:\.\d+)?)%/))) {
    return [{ stat: 'DMG% Normal', value: pct(m) }, { stat: 'DMG% Charged', value: pct(m) }];
  }
  if ((m = d.match(/^Increases Elemental Skill DMG by (\d+(?:\.\d+)?)%/))) return [{ stat: 'DMG% Skill', value: pct(m) }];
  if ((m = d.match(/^Elemental Burst DMG \+(\d+(?:\.\d+)?)%/))) return [{ stat: 'DMG% Supremo', value: pct(m) }];
  if ((m = d.match(/^Plunging Attack DMG increased by (\d+(?:\.\d+)?)%/))) return [{ stat: 'DMG% Plunge', value: pct(m) }];
  return null;
}

