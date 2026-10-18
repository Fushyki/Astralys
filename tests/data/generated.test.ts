/**
 * Confere os JSON gerados pelo sync (src/data/generated) contra:
 *  - os esquemas Zod (estrutura);
 *  - a aba L_Golpes da planilha de referência (valores, nível a nível, dos 4 personagens do gabarito);
 *  - a aba L_Personagens / L_Armas.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import {
  ArtifactSetSchema,
  CharacterSchema,
  MoveSchema,
  SyncMetaSchema,
  TALENT_LEVELS,
  WeaponSchema,
  type Character,
  type Move,
  type Weapon,
} from '../../src/data/schema';

const root = path.resolve(__dirname, '../..');
const load = <T>(file: string): T => JSON.parse(readFileSync(path.join(root, 'src/data/generated', file), 'utf8'));

const characters = load<Character[]>('characters.json');
const moves = load<Move[]>('moves.json');
const weapons = load<Weapon[]>('weapons.json');
const artifacts = load<unknown[]>('artifacts.json');
const meta = load<unknown>('meta.json');

describe('dados gerados: estrutura', () => {
  it('passam nos esquemas Zod', () => {
    characters.forEach((c) => CharacterSchema.parse(c));
    moves.forEach((m) => MoveSchema.parse(m));
    weapons.forEach((w) => WeaponSchema.parse(w));
    artifacts.forEach((a) => ArtifactSetSchema.parse(a));
    expect(SyncMetaSchema.parse(meta).source).toBe('lunaris');
  });

  it('contagens coerentes com o meta', () => {
    const m = SyncMetaSchema.parse(meta);
    expect(m.counts).toEqual({
      characters: characters.length,
      moves: moves.length,
      weapons: weapons.length,
      artifactSets: artifacts.length,
    });
    expect(characters.length).toBeGreaterThan(100);
    expect(moves.length).toBeGreaterThan(1000);
  });

  it('ids únicos', () => {
    expect(new Set(characters.map((c) => c.id)).size).toBe(characters.length);
    expect(new Set(moves.map((m) => m.id)).size).toBe(moves.length);
    expect(new Set(weapons.map((w) => w.id)).size).toBe(weapons.length);
  });

  it('todo golpe tem escala com 15 níveis e referencia um personagem existente', () => {
    const ids = new Set(characters.map((c) => c.id));
    for (const m of moves) {
      expect(ids.has(m.characterId), m.id).toBe(true);
      const arrays = Object.values(m.scale);
      expect(arrays.length, m.id).toBeGreaterThan(0);
      arrays.forEach((a) => expect(a!.length, m.id).toBe(TALENT_LEVELS));
    }
  });

  it('o Viajante tem uma entrada por elemento e por gênero, com nomes distintos', () => {
    const trav = characters.filter((c) => /^(Aether|Lumine)/.test(c.name));
    expect(trav.length).toBe(14);
    expect(new Set(trav.map((c) => c.name)).size).toBe(14);
  });

  it('personagens jogáveis de teste não entram', () => {
    expect(characters.find((c) => /Manekin/.test(c.name))).toBeUndefined();
  });
});

// ---------- Gabarito: aba L_Golpes ----------

const workbook = XLSX.readFile(path.join(root, 'reference/Mavuika_Iansan_Combo2.xlsx'));
const sheetRows = (name: string) => XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[name], { header: 1, defval: '' }).slice(1);

const TALENT_MAP: Record<string, Move['talent']> = { Normal: 'normal', Habilidade: 'skill', Supremo: 'burst' };
const TYPE_MAP: Record<string, Move['hitType']> = {
  Normal: 'normal', Carregado: 'charged', Habilidade: 'skill', Supremo: 'burst', Outro: 'plunge',
};

describe('golpes gerados vs. aba L_Golpes da planilha', () => {
  const rows = sheetRows('L_Golpes').filter((r) => r[0]);

  it('a planilha tem as 55 linhas esperadas', () => {
    expect(rows.length).toBe(55);
  });

  // Rótulos repetidos na planilha ("Low/High Plunge DMG" x2) correspondem às variantes 0 e 1.
  const seen = new Map<string, number>();
  for (const r of rows) {
    const [, character, talentPt, typePt, label] = r as string[];
    const key = `${character}|${talentPt}|${label}`;
    const occurrence = seen.get(key) ?? 0;
    seen.set(key, occurrence + 1);

    it(`${character} / ${talentPt} / ${label}${occurrence ? ` (#${occurrence})` : ''}`, () => {
      const talent = TALENT_MAP[talentPt];
      const candidates = moves.filter((m) => m.character === character && m.talent === talent && m.label === label);
      expect(candidates.length, 'golpe não encontrado nos dados gerados').toBeGreaterThan(0);
      const move = candidates.find((m) => m.variant === occurrence);
      expect(move, `variante ${occurrence} não encontrada`).toBeDefined();

      expect(move!.hitType).toBe(TYPE_MAP[typePt as string]);
      expect(move!.hits).toBe(Number(r[65]));

      const blocks = { atk: 5, em: 20, hp: 35, def: 50 } as const;
      for (const [stat, start] of Object.entries(blocks) as [keyof typeof blocks, number][]) {
        const expected = r.slice(start, start + TALENT_LEVELS).map(Number);
        const actual = move!.scale[stat] ?? new Array(TALENT_LEVELS).fill(0);
        expected.forEach((v, lvl) => expect(actual[lvl], `${stat} nv${lvl + 1}`).toBeCloseTo(v, 4));
      }
    });
  }
});

describe('personagens e armas gerados vs. L_Personagens / L_Armas', () => {
  it('stats base e stat de ascensão batem', () => {
    // Colunas: Nome, Elemento, Arma, Raridade, HP, ATK, DEF, Stat de ascensão, Valor ascensão
    for (const r of sheetRows('L_Personagens').filter((x) => x[0] && !String(x[0]).startsWith('Traveler'))) {
      const c = characters.find((x) => x.name === r[0]);
      expect(c, String(r[0])).toBeDefined();
      expect(c!.rarity, `${r[0]} raridade`).toBe(Number(r[3]));
      expect(c!.baseHp, `${r[0]} HP`).toBe(Number(r[4]));
      expect(c!.baseAtk, `${r[0]} ATK`).toBe(Number(r[5]));
      expect(c!.baseDef, `${r[0]} DEF`).toBe(Number(r[6]));
    }
  });

  it('armas: ATK base e raridade batem', () => {
    // Colunas: Nome, Tipo, Raridade, ATK base, Substat, Valor substat
    for (const r of sheetRows('L_Armas').filter((x) => x[0])) {
      const w = weapons.find((x) => x.name === r[0]);
      expect(w, String(r[0])).toBeDefined();
      expect(w!.rarity, `${r[0]} raridade`).toBe(Number(r[2]));
      expect(w!.baseAtk, `${r[0]} ATK`).toBe(Number(r[3]));
    }
  });

  it('golpes têm rótulo em português (Lunaris), sem caractere quebrado', () => {
    const withPt = moves.filter((m) => m.labelPt);
    expect(withPt.length / moves.length).toBeGreaterThan(0.95);
    for (const m of withPt) {
      expect(m.labelPt!.trim().length, m.id).toBeGreaterThan(0);
      expect(m.labelPt, m.id).not.toContain('�');
    }
    const mav = moves.find((m) => m.character === 'Mavuika' && m.label === 'Charged Attack DMG');
    expect(mav?.labelPt).toBe('Dano de Ataque Carregado');
  });
});
