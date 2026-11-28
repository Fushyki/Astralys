/**
 * Passivas, constelações e talentos de personagem com duração no texto (#75): quantos segundos e
 * que golpes abrem a janela sozinha. A chave é o id do buff; num buff fixo, vale para o dano fixo dele. Todo número é
 * conferido por `curate-effects.ts` no texto do Lunaris (o do próprio buff ou o de `from`) ou lido da linha do
 * talento (`row`). Sem `auto`, a condição não aparece na rotação (abater, apanhar, sorteio) e o usuário cria a janela,
 * já com a duração. Por enquanto só a Mona está aqui; os outros personagens continuam com a janela do usuário.
 */
import type { HitType } from '../../src/data/schema';

export interface CharAuto {
  /** Tipos de golpe que abrem a janela (vazio = qualquer golpe). */
  on?: HitType[];
  by?: 'team';
  /** Espera entre ativações (s), conferida no texto. */
  cd?: number;
  /** "Ao usar": as execuções seguintes de um golpe contínuo não abrem. */
  cast?: true;
  /** Só os golpes cujo nome contém um destes trechos (toque ou segurado). */
  labels?: string[];
  extend?: { on: HitType[]; add: number; max: number; every?: number };
  /** Acúmulos que o 1º golpe de um aliado com a reação gasta (ver `AutoWindow.consume`). */
  consume?: { reaction: 'vaporize'; max: number };
}

export interface CharTime {
  s?: number;
  /** Linha de duração do talento (muda com o nível quando o jogo muda). */
  row?: ['skill' | 'burst', string];
  /** Texto onde o número `s` está, se não for o do próprio buff: `p1`, `const2`... */
  from?: string;
  /** A partir da constelação, soma segundos; `check` é o trecho a conferir no texto dela. */
  plus?: [constellation: number, seconds: number, check: string, from: string];
  /** A janela começa tanto depois do golpe (ex.: quando o estado do talento acaba). */
  delay?: number | ['skill' | 'burst', string];
  auto?: CharAuto;
  /** Só com Hexerei: Secret Rite e o dono Hexerei: golpes que alongam a janela (texto da passiva `from`). */
  hex?: { on: HitType[]; add: number; max: number; every: number; from: string };
  /** Segundos que o efeito ainda dura depois da janela, e o texto onde está o número. */
  tail?: [seconds: number, from: string];
}

const BURST: CharAuto = { on: ['burst'] };
const CHARGED: CharAuto = { on: ['charged'] };
const USE_BURST: CharAuto = { ...BURST, cast: true };

const t = (s: number, auto?: CharAuto, more: Omit<CharTime, 's' | 'auto'> = {}): CharTime => ({ s, ...(auto ? { auto } : {}), ...more });
const r = (talent: 'skill' | 'burst', key: string, auto?: CharAuto, more: Omit<CharTime, 'row' | 'auto'> = {}): CharTime => ({ row: [talent, key], ...(auto ? { auto } : {}), ...more });
/** Vários buffs com o mesmo tempo e o mesmo gatilho. */
const each = (ids: string[], time: CharTime): Record<string, CharTime> => Object.fromEntries(ids.map((id) => [id, time]));

const OMEN: CharTime = r('burst', 'Omen Duration', USE_BURST, { hex: { on: ['normal', 'charged'], add: 2, max: 8, every: 0.5, from: 'p4' } });

export const CHARACTER_TIMING: Record<string, Record<string, CharTime>> = {
  // C1: 8 s depois de cada acerto num inimigo com Presságio, então até 8 s depois do fim dele.
  Mona: {
    c2: t(12, CHARGED), burst: OMEN, c1: { ...OMEN, tail: [8, 'const1'] }, ...each(['c4', 'c4h', 'c6omen'], OMEN), c6: t(8, { on: ['burst', 'charged'] }),
    hexglow: t(8, { on: ['normal', 'charged'], consume: { reaction: 'vaporize', max: 3 } }),
  },
};

/** Buffs de janela que o texto não limita no tempo. */
export const CHARACTER_NO_WINDOW: Record<string, Record<string, string>> = {};
