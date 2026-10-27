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
}

export const POINT_MOVES: Record<string, PointMoveCur[]> = {
  Mavuika: [
    { talent: 'burst', labels: ['Skill DMG'], kitTalent: 'burst', key: 'Sunfell Slice DMG Bonus', unit: 'Espírito Lutador', max: 200 },
    {
      talent: 'skill',
      labels: ['Flamestrider Normal Attack 1-Hit DMG', 'Flamestrider Normal Attack 2-Hit DMG', 'Flamestrider Normal Attack 3-Hit DMG', 'Flamestrider Normal Attack 4-Hit DMG', 'Flamestrider Normal Attack 5-Hit DMG'],
      kitTalent: 'burst', key: 'Flamestrider Normal Attack DMG Bonus', unit: 'Espírito Lutador', max: 200,
    },
    { talent: 'skill', labels: ['Flamestrider Charged Attack Cyclic DMG', 'Flamestrider Charged Attack Final DMG'], kitTalent: 'burst', key: 'Flamestrider Charged Attack DMG Bonus', unit: 'Espírito Lutador', max: 200 },
  ],
};
