/**
 * Semeia src/effects/*.json a partir das abas "(efeitos)" da planilha de referência.
 *
 * USO ÚNICO: depois de semeado, os JSON passam a ser editados à mão. Por isso o script se recusa a
 * sobrescrever arquivos existentes (use --force só se quiser descartar as edições).
 *   npx tsx scripts/seed-effects.ts [--force]
 */
import { readFileSync } from 'node:fs';
import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import * as XLSX from 'xlsx';
import {
  CharacterEffectSchema,
  FlatDamageEffectSchema,
  SetEffectSchema,
  WeaponEffectSchema,
} from '../src/effects/schema';
import type { HitType } from '../src/data/schema';

const FORCE = process.argv.includes('--force');
const SHEET = path.resolve('reference/Mavuika_Iansan_Combo2.xlsx');
const OUT = path.resolve('src/effects');
const ORIGEM = 'planilha Mavuika_Iansan_Combo2';

const wb = XLSX.read(readFileSync(SHEET)); // em ESM o xlsx não traz acesso a ficheiros
const rows = (tab: string) =>
  XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[tab], { header: 1, defval: '' }).slice(1).filter((r) => String(r[0]).trim() !== '');

const num = (v: unknown) => (v === '' || v == null ? 0 : Number(v));
const yes = (v: unknown) => v === true || String(v).trim().toLowerCase() === 'sim';
const list = (v: unknown) => String(v ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const note = (tab: string, obs: unknown) => `${ORIGEM}, aba "${tab}"${String(obs ?? '').trim() ? `. ${String(obs).trim()}` : ''}`;

const HIT_TYPES: Record<string, HitType> = { Normal: 'normal', Carregado: 'charged', Outro: 'plunge', Habilidade: 'skill', Supremo: 'burst' };

async function write(file: string, data: unknown[]) {
  const target = path.join(OUT, file);
  const exists = await access(target).then(() => true, () => false);
  if (exists && !FORCE) {
    console.log(`  = ${file} já existe, mantido (use --force para sobrescrever)`);
    return;
  }
  await writeFile(target, '[\n' + data.map((d) => '  ' + JSON.stringify(d)).join(',\n') + '\n]\n');
  console.log(`  + ${file} (${data.length})`);
}

async function main() {
  await mkdir(OUT, { recursive: true });

  // Personagens: Personagem | ATK% | DMG% | CR | CD | EM | ATK fixo×base | ATK fixo×total | limite | vale p/ si? | RES | elementos | fonte
  const characters = rows('Personagens (efeitos)').map((r) => {
    const flat = { perBaseAtk: num(r[6]), perTotalAtk: num(r[7]), cap: num(r[8]) };
    const hasFlat = flat.perBaseAtk || flat.perTotalAtk;
    return CharacterEffectSchema.parse({
      character: String(r[0]).trim(),
      atkPct: num(r[1]), dmgPct: num(r[2]), critRate: num(r[3]), critDmg: num(r[4]), em: num(r[5]),
      ...(hasFlat ? { teamFlatAtk: flat } : {}),
      appliesToSelf: yes(r[9]),
      ...(num(r[10]) ? { resShred: { value: num(r[10]), elements: list(r[11]) } } : {}),
      fonte_info: note('Personagens (efeitos)', r[12]),
    });
  });

  // Armas: Arma | ATK% | DMG% | CR | CD | EM | ER | ATK% por ER (coef) | limite | time ATK% | time DMG% | time EM | fonte
  const weapons = rows('Armas (efeitos)').map((r) => {
    const team = { atkPct: num(r[9]), dmgPct: num(r[10]), em: num(r[11]) };
    return WeaponEffectSchema.parse({
      weapon: String(r[0]).trim(),
      atkPct: num(r[1]), dmgPct: num(r[2]), critRate: num(r[3]), critDmg: num(r[4]), em: num(r[5]), er: num(r[6]),
      ...(num(r[7]) ? { atkPctPerEr: { coef: num(r[7]), cap: num(r[8]) } } : {}),
      ...(team.atkPct || team.dmgPct || team.em ? { team } : {}),
      fonte_info: note('Armas (efeitos)', r[12]),
    });
  });

  // Sets: Set | 2p stat | 2p valor | 4p: ATK% DMG% CR CD EM | DMG% Normal/Carregado/Habilidade/Supremo | Derreter | Vaporizar | time ATK% DMG% EM | obs
  const sets = rows('Sets (efeitos)').map((r) => {
    const byType: Partial<Record<HitType, number>> = {};
    ([['normal', 8], ['charged', 9], ['skill', 10], ['burst', 11]] as const).forEach(([t, i]) => {
      if (num(r[i])) byType[t] = num(r[i]);
    });
    const team = { atkPct: num(r[14]), dmgPct: num(r[15]), em: num(r[16]) };
    const four = {
      atkPct: num(r[3]), dmgPct: num(r[4]), critRate: num(r[5]), critDmg: num(r[6]), em: num(r[7]),
      dmgPctByType: byType, meltBonus: num(r[12]), vaporizeBonus: num(r[13]),
      ...(team.atkPct || team.dmgPct || team.em ? { team } : {}),
    };
    const hasFour = Object.values(four).some((v) => (typeof v === 'number' ? v !== 0 : Object.keys(v as object).length > 0));
    return SetEffectSchema.parse({
      set: String(r[0]).trim(),
      ...(String(r[1]).trim() && num(r[2]) ? { twoPiece: { stat: String(r[1]).trim(), value: num(r[2]) } } : {}),
      ...(hasFour ? { fourPiece: four } : {}),
      fonte_info: note('Sets (efeitos)', r[17]),
    });
  });

  // Dano fixo: Nome | Fonte | Stat | Coef | Limiar | Máx por hit | Alvos | Elementos | Tipos | Stacks | Ativo | (calculado) | Obs
  const flatDamage = rows('Dano fixo').map((r) =>
    FlatDamageEffectSchema.parse({
      name: String(r[0]).trim(),
      source: String(r[1]).trim(),
      sourceStat: String(r[2]).trim().toUpperCase(),
      perPoint: num(r[3]),
      threshold: num(r[4]),
      ...(r[5] !== '' ? { capPerHit: num(r[5]) } : {}),
      targets: String(r[6]).trim().toLowerCase() === 'todos' ? 'all' : list(r[6]),
      elements: list(r[7]),
      hitTypes: list(r[8]).map((t) => {
        if (!HIT_TYPES[t]) throw new Error(`Tipo de golpe desconhecido em "Dano fixo": ${t}`);
        return HIT_TYPES[t];
      }),
      ...(r[9] !== '' ? { stacks: num(r[9]) } : {}),
      active: yes(r[10]),
      fonte_info: note('Dano fixo', r[12]),
    }),
  );

  console.log('Semeando src/effects/:');
  await write('characters.json', characters);
  await write('weapons.json', weapons);
  await write('sets.json', sets);
  await write('flatDamage.json', flatDamage);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
