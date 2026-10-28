/**
 * Buff que vale só para os N primeiros golpes de uma janela (`BuffWindow.maxHits`): o Rift da Skirk dá +20% de Normal por 10 golpes,
 * então não basta uma janela de tempo. Conta, em ordem de tempo, os golpes que o buff realmente afeta (de quem o recebe e do tipo que ele
 * muda, ex.: só Normais) e tira a etiqueta dos que passam do limite.
 */
import type { RotationAction } from './rotation';
import type { BuffWindow } from './project';
import type { TeamAssembly } from './team';
import type { TeamBuff } from './stats';

const TYPE_KEYS: readonly string[] = ['dmgByType', 'critRateByType', 'critDmgByType', 'baseMultByType'];

/** Tipos de golpe que o buff afeta: os dos campos "por tipo"; null se ele muda algo geral (ATK, DMG% comum...) e vale para qualquer golpe. */
export function hitTypesOf(buffs: readonly TeamBuff[]): Set<string> | null {
  const types = new Set<string>();
  for (const b of buffs) {
    let generic = false;
    let typed = false;
    for (const [k, v] of Object.entries(b.delta as Record<string, unknown>)) {
      if (typeof v === 'number') {
        if (v !== 0) generic = true;
      } else if (v && typeof v === 'object') {
        for (const [t, x] of Object.entries(v)) {
          if (!x) continue;
          if (TYPE_KEYS.includes(k)) {
            types.add(t);
            typed = true;
          } else generic = true;
        }
      }
    }
    if (generic || !typed) return null;
  }
  return types;
}

/** Tira a etiqueta da janela dos golpes além do limite (muda `activeTags` das ações; as listas de etiquetas são novas). */
export function applyHitLimits(windows: readonly BuffWindow[], actions: RotationAction[], assembly: Pick<TeamAssembly, 'buffs'>, names: readonly string[]): void {
  for (const w of windows) {
    if (!w.maxHits) continue;
    const buffs = assembly.buffs.filter((b) => b.tag === w.tag && !b.always);
    if (buffs.length === 0) continue;
    const types = hitTypesOf(buffs);
    const receives = (member: number) => buffs.some((b) => b.targets === 'all' || b.targets.includes(names[member]));
    const inWindow = (t: number) => w.whole || (t >= w.start && t < w.end);
    const order = actions.map((_, i) => i).sort((x, y) => (actions[x].time ?? 0) - (actions[y].time ?? 0) || x - y);
    let n = 0;
    for (const i of order) {
      const a = actions[i];
      if (!inWindow(a.time ?? 0) || !a.activeTags.includes(w.tag) || !receives(a.member)) continue;
      if (types && !types.has(a.move.hitType)) continue;
      n++;
      if (n > w.maxHits) a.activeTags = a.activeTags.filter((t) => t !== w.tag);
    }
  }
}
