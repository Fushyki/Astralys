/** Nível do personagem (1 a 90) editável: muda os stats base (HP, ATK, DEF e o stat de ascensão) e as fórmulas que dependem do nível. */
import { useEffect, useState } from 'react';
import { useProjectView } from '../../app/ProjectContext';
import { ASCENSION_CAPS, MAX_CHARACTER_LEVEL, ascensionAt, hasLevelData } from '../../data/levels';
import { useRotationStore } from '../../features/rotation/store';

export function LevelControl({ name, index, level, className = '' }: { name: string; index: number; level: number; className?: string }) {
  const v = useProjectView();
  const update = useRotationStore((s) => s.updateMember);
  const can = hasLevelData(name, v.data.game.levels);
  const shown = Math.min(MAX_CHARACTER_LEVEL, level);
  const [text, setText] = useState(String(shown));
  useEffect(() => setText(String(shown)), [shown]);

  const set = (n: number) => {
    if (!Number.isFinite(n)) return setText(String(shown));
    const lv = Math.min(MAX_CHARACTER_LEVEL, Math.max(1, Math.round(n)));
    setText(String(lv));
    if (lv !== shown) update(index, { level: lv });
  };
  /** Pula para o nível-limite de ascensão vizinho (20, 40, 50…) com Shift, ou de 1 em 1. */
  const step = (dir: 1 | -1, big: boolean) => {
    if (!big) return set(shown + dir);
    const caps = [1, ...ASCENSION_CAPS, MAX_CHARACTER_LEVEL];
    set(dir > 0 ? (caps.find((c) => c > shown) ?? MAX_CHARACTER_LEVEL) : ([...caps].reverse().find((c) => c < shown) ?? 1));
  };

  if (!can) return <span className={`lvl num ${className}`} title="Sem a curva de nível deste personagem: vale o nível 90">{shown} / 90</span>;
  return (
    <span className={`lvl lvlctl num ${className}`} title="Nível do personagem. Shift pula para o nível de ascensão (20, 40, 50…). Os stats base seguem o nível.">
      <button type="button" aria-label="Diminuir o nível" disabled={shown <= 1} onClick={(e) => step(-1, e.shiftKey)}>−</button>
      <input inputMode="numeric" aria-label="Nível do personagem" value={text} onChange={(e) => setText(e.target.value.replace(/\D/g, '').slice(0, 2))} onBlur={() => set(Number(text))} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
      <span>/ 90</span>
      <small>A{ascensionAt(shown)}</small>
      <button type="button" aria-label="Aumentar o nível" disabled={shown >= MAX_CHARACTER_LEVEL} onClick={(e) => step(1, e.shiftKey)}>+</button>
    </span>
  );
}
