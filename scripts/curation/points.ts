/**
 * Golpes cujo dano soma "% do ATK por ponto" de um recurso que o usuário escolhe (ex.: Espírito Lutador da Mavuika). O valor por
 * ponto sai da linha de multiplicadores do Lunaris no nível do talento indicado; o número de pontos é escolha do usuário no golpe.
 */
export interface PointMoveCur {
  /** Golpes que ganham o bônus (talento e rótulo do Lunaris). */
  talent: 'normal' | 'skill' | 'burst';
  labels: string[];
  /** Talento cuja linha de multiplicadores traz o valor por ponto e cujo nível o escolhe. */
  kitTalent: 'normal' | 'skill' | 'burst';
  /** Linha de multiplicadores (ex.: "Sunfell Slice DMG Bonus", valores como "2.88% ATK per Fighting Spirit"). */
  key: string;
  unit: string;
  max: number;
  maxBy?: { constellation: number; max: number };
  /** Qual porcentagem da linha vale (ex.: Raiden, "7% Initial/1.31% ATK DMG Per Stack"). */
  part?: number;
  /** Linha com o bônus extra no teto de pontos. */
  fullKey?: string;
  /** O valor por ponto vale por acerto: multiplica pelo número de acertos do golpe. */
  times?: number;
  /** Duração (s) da janela em que o golpe usa os pontos do Supremo lançado antes (Cadinho da Vida e da Morte). */
  cadinho?: number;
}

export const POINT_MOVES: Record<string, PointMoveCur[]> = {
  Lyney: [{ talent: 'skill', labels: ['Skill DMG'], kitTalent: 'skill', key: 'Skill DMG Bonus', unit: 'Prop Surplus', max: 5 }],
  'Shikanoin Heizou': [{ talent: 'skill', labels: ['Skill DMG'], kitTalent: 'skill', key: 'Declension DMG Bonus', fullKey: 'Conviction DMG Bonus', unit: 'Declension', max: 4 }],
  'Raiden Shogun': [
    { talent: 'burst', labels: ['Musou no Hitotachi Base DMG'], kitTalent: 'burst', key: 'Resolve Bonus', unit: 'Resolve', max: 60, times: 1 },
    { talent: 'burst', labels: ['1-Hit DMG','2-Hit DMG','3-Hit DMG','5-Hit DMG','Plunge DMG','Low/High Plunge DMG'], kitTalent: 'burst', key: 'Resolve Bonus', part: 1, unit: 'Resolve', max: 60, times: 1 },
    { talent: 'burst', labels: ['4-Hit DMG','Charged Attack DMG'], kitTalent: 'burst', key: 'Resolve Bonus', part: 1, unit: 'Resolve', max: 60, times: 2 },
  ],
  Skirk: [
    { talent: 'burst', labels: ['Slash DMG'], kitTalent: 'burst', key: "Serpent's Subtlety Bonus", unit: "Serpent's Subtlety acima de 50", max: 12, maxBy: { constellation: 2, max: 22 }, times: 5 },
    { talent: 'burst', labels: ['Final Slash DMG'], kitTalent: 'burst', key: "Serpent's Subtlety Bonus", unit: "Serpent's Subtlety acima de 50", max: 12, maxBy: { constellation: 2, max: 22 } },
  ],
  Mavuika: [
    { talent: 'burst', labels: ['Skill DMG'], kitTalent: 'burst', key: 'Sunfell Slice DMG Bonus', unit: 'Espírito Lutador', max: 200 },
    {
      talent: 'skill',
      labels: ['Flamestrider Normal Attack 1-Hit DMG', 'Flamestrider Normal Attack 2-Hit DMG', 'Flamestrider Normal Attack 3-Hit DMG', 'Flamestrider Normal Attack 4-Hit DMG', 'Flamestrider Normal Attack 5-Hit DMG'],
      kitTalent: 'burst', key: 'Flamestrider Normal Attack DMG Bonus', unit: 'Espírito Lutador', max: 200, cadinho: 7,
    },
    { talent: 'skill', labels: ['Flamestrider Charged Attack Cyclic DMG', 'Flamestrider Charged Attack Final DMG'], kitTalent: 'burst', key: 'Flamestrider Charged Attack DMG Bonus', unit: 'Espírito Lutador', max: 200, cadinho: 7 },
  ],
};
