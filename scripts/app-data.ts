/**
 * Cópias dos dados que o SITE importa, derivadas de `src/data/generated/` (gravado pelos syncs) e de `src/effects/`. Os
 * originais continuam completos para a curadoria e os testes. Saída em `src/data/app/`, fora do git: o vite e o vitest
 * geram ao iniciar (`appDataPlugin`). Nenhum número muda; só sai o que o site não lê.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import type { ArtifactSet, Character, Weapon } from '../src/data/schema';

const SRC = fileURLToPath(new URL('../src', import.meta.url));
const OUT = path.join(SRC, 'data', 'app');
const read = <T>(file: string): T => JSON.parse(fs.readFileSync(path.join(SRC, file), 'utf8')) as T;

/** Sem os `params` (só a curadoria lê) e sem o texto em inglês quando há o português (a tela usa o inglês só de reserva). */
const slimText = ({ params: _, description, ...rest }: { params: number[]; description: string; descriptionPt?: string }) =>
  rest.descriptionPt ? rest : { ...rest, description };

/** Caminho relativo a `src/data/app/` → conteúdo. */
export function appData(): Record<string, unknown> {
  return {
    'weapons.json': read<Weapon[]>('data/generated/weapons.json').map((w) => ({ ...w, passive: w.passive && { ...w.passive, refinements: w.passive.refinements.map(slimText) } })),
    // O bônus de 1 peça não aparece no site.
    'artifacts.json': read<ArtifactSet[]>('data/generated/artifacts.json').map((s) => ({ ...s, bonuses: Object.fromEntries(Object.entries(s.bonuses).filter(([k]) => k !== 'onePiece').map(([k, b]) => [k, slimText(b)])) })),
    // A Recarga usa `effects/particles.json`.
    'characters.json': read<Character[]>('data/generated/characters.json').map(({ particles: _, ...c }) => c),
  };
}

/** Grava só o que mudou (não acorda o vite à toa) e apaga o que sobrou. */
export function writeAppData(): void {
  const files = new Map(Object.entries(appData()).map(([name, data]) => [path.join(OUT, name), JSON.stringify(data)]));
  if (fs.existsSync(OUT)) {
    for (const f of fs.readdirSync(OUT, { recursive: true }) as string[]) {
      const full = path.join(OUT, f);
      if (full.endsWith('.json') && !files.has(full)) fs.rmSync(full);
    }
  }
  for (const [file, text] of files) {
    if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === text) continue;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, text);
  }
}

export function appDataPlugin(): Plugin {
  return {
    name: 'astralys-dados-do-site',
    config() {
      writeAppData();
    },
    configureServer(server) {
      server.watcher.on('change', (file) => {
        if (/[\\/]src[\\/](data[\\/]generated|effects)[\\/].*\.json$/.test(file)) writeAppData();
      });
    },
  };
}
