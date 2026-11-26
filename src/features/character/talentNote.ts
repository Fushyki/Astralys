import type { Character } from '../../data/schema';
import { MAX_BASE_TALENT, effectiveTalents } from '../../engine';

type Levels = { normal: number; skill: number; burst: number };
const LABEL = { normal: 'no Normal', skill: 'na Habilidade', burst: 'no Supremo' } as const;
const KEYS = ['normal', 'skill', 'burst'] as const;

/** De onde vêm os níveis efetivos, entre parênteses, para a tela (ex.: " (+1 na Habilidade pela passiva do time)"). */
export function talentNote(base: Levels, constellation: number | undefined, character: Pick<Character, 'constellationBoosts'>, effective: Levels): string {
  const own = effectiveTalents(base, constellation, character);
  const parts = [
    ...(KEYS.some((k) => own[k] > base[k]) ? ['com o +3 da constelação'] : []),
    ...KEYS.filter((k) => effective[k] > own[k]).map((k) => `+1 ${LABEL[k]} pela passiva do time`),
    ...(KEYS.some((k) => base[k] > MAX_BASE_TALENT) ? ['nível digitado acima de 10 já inclui os bônus'] : []),
  ];
  return parts.length ? ` (${parts.join('; ')})` : '';
}
