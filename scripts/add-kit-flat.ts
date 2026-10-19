/**
 * Acrescenta a `src/effects/flatDamage.json` os efeitos de dano fixo do kit que crescem com o nível do talento
 * (Shenhe, Yun Jin, Kokomi). A tabela de 15 níveis vem dos multiplicadores do Lunaris. Rode uma vez; ignora o que já existe.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = <T>(rel: string): T => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const meta = read<{ gameVersion: string }>('src/data/generated/meta.json');
const chars = read<{ id: string; name: string }[]>('src/data/generated/characters.json');
const file = 'src/effects/flatDamage.json';
const list = read<{ name: string }[]>(file);

const percent = (t: string) => Math.round(Number(/^\s*(-?\d+(?:\.\d+)?)\s*%/.exec(t)![1]) * 1e4) / 1e6;
const SKILL = { skill: 'elementalskill', burst: 'elementalburst' } as const;

function table(character: string, talent: keyof typeof SKILL, key: string): number[] {
  const c = chars.find((x) => x.name === character)!;
  const raw = read<{ skills: Record<string, { multipliers: Record<string, string[]> }> }>(`data/raw/lunaris/${meta.gameVersion}/en/char/${c.id}.json`);
  const row = raw.skills[SKILL[talent]].multipliers[key];
  if (!row || row.length !== 15) throw new Error(`${character}: linha "${key}" inválida`);
  return row.map(percent);
}

const from = (character: string, talent: keyof typeof SKILL, key: string) =>
  `Lunaris ${meta.gameVersion}, ${character}, ${talent === 'skill' ? 'habilidade' : 'supremo'}, linha "${key}" (tabela por nível de talento).`;

const entries = [
  {
    name: 'Shenhe: Pena Gélida (Icy Quill)', source: 'Shenhe', sourceStat: 'ATK', perPoint: 1, threshold: 0, targets: 'all', elements: ['Cryo'],
    hitTypes: ['normal', 'charged', 'plunge', 'skill', 'burst'], stacks: 5, active: true,
    level: { talent: 'skill', table: table('Shenhe', 'skill', 'DMG Bonus') },
    fonte_info: `${from('Shenhe', 'skill', 'DMG Bonus')} DMG Cryo somado = % do ATK dela. 5 usos (versão apertada da habilidade; segurada dá 7), consumidos pelos primeiros golpes Cryo.`,
  },
  {
    name: 'Yun Jin: Formação da Bandeira', source: 'Yun Jin', sourceStat: 'DEF', perPoint: 1, threshold: 0, targets: 'all', elements: [],
    hitTypes: ['normal'], stacks: 30, active: true,
    level: { talent: 'burst', table: table('Yun Jin', 'burst', 'DMG Increase') },
    fonte_info: `${from('Yun Jin', 'burst', 'DMG Increase')} Dano somado nos Ataques Normais = % da DEF dela, até 30 acertos no total (a cota real é de 30 por personagem).`,
  },
  {
    name: 'Kokomi: Vestes (Ataque Normal)', source: 'Sangonomiya Kokomi', sourceStat: 'HP', perPoint: 1, threshold: 0, targets: ['Sangonomiya Kokomi'], elements: [],
    hitTypes: ['normal'], active: true,
    level: { talent: 'burst', table: table('Sangonomiya Kokomi', 'burst', 'Normal Attack DMG Bonus') },
    fonte_info: `${from('Sangonomiya Kokomi', 'burst', 'Normal Attack DMG Bonus')} Dano somado = % do HP máximo dela. Assume todo Ataque Normal dela dentro do Supremo.`,
  },
  {
    name: 'Kokomi: Vestes (Ataque Carregado)', source: 'Sangonomiya Kokomi', sourceStat: 'HP', perPoint: 1, threshold: 0, targets: ['Sangonomiya Kokomi'], elements: [],
    hitTypes: ['charged'], active: true,
    level: { talent: 'burst', table: table('Sangonomiya Kokomi', 'burst', 'Charged Attack DMG Bonus') },
    fonte_info: `${from('Sangonomiya Kokomi', 'burst', 'Charged Attack DMG Bonus')} Dano somado = % do HP máximo dela. Assume todo Ataque Carregado dela dentro do Supremo.`,
  },
];

const fresh = entries.filter((e) => !list.some((x) => x.name === e.name));
const raw = readFileSync(path.join(root, file), 'utf8');
const crlf = raw.includes('\r\n');
const next = [...list, ...fresh];
const out = '[\n' + next.map((e) => '  ' + JSON.stringify(e)).join(',\n') + '\n]\n';
writeFileSync(path.join(root, file), crlf ? out.replace(/\n/g, '\r\n') : out, 'utf8');
console.log(`flatDamage.json: +${fresh.length} efeitos (${next.length} no total)`);
