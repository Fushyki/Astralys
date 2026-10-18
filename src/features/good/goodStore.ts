/** Guarda o inventário GOOD no navegador (localStorage). Tudo é validado na leitura; falhas de armazenamento são toleradas. */
import { parseGood, type Good } from './goodImport';

const KEY = 'astralys:inventario-good';

export function saveGood(good: Good): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(good));
    return true;
  } catch {
    return false;
  }
}

export function loadGood(): Good | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? parseGood(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function clearGood(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* sem armazenamento: nada a apagar */
  }
}
