/** Buffs de teste (no Editar build): qualquer tipo de bônus, sempre ligado, para testar sem montar a rotação. */
import { useState } from 'react';
import { useProjectView } from '../../app/ProjectContext';
import { CUSTOM_GROUPS, TEST_PREFIX, customStat, customValueText, makeCustomBuff } from '../../features/rotation/customBuffs';
import { useRotationStore } from '../../features/rotation/store';

export function CustomBuffs({ character }: { character: string }) {
  const v = useProjectView();
  const addExtra = useRotationStore((s) => s.addExtra);
  const removeExtra = useRotationStore((s) => s.removeExtra);
  const [stat, setStat] = useState('ATK%');
  const [value, setValue] = useState('');
  const [target, setTarget] = useState<'self' | 'all'>('self');
  const mine = v.project.extras.map((e, i) => ({ e, i })).filter(({ e }) => e.team === false && !!e.description?.startsWith(TEST_PREFIX) && (e.target === character || e.target === 'all') && !!customStat(e.stat));
  const def = customStat(stat);
  const typed = Number(value.replace(',', '.'));
  const ok = value.trim() !== '' && Number.isFinite(typed);
  const add = () => {
    const extra = makeCustomBuff(target === 'all' ? 'all' : character, stat, typed);
    if (!extra) return;
    addExtra(extra);
    setValue('');
  };

  return (
    <section className="cb" aria-label="Buffs de teste">
      <h3>Buffs de teste</h3>
      <p className="muted small">Qualquer bônus, sempre ligado, só para testar. Valem para {character} ou para o time todo e aparecem em "Buffs recebidos", onde se desligam.</p>
      {mine.length > 0 && (
        <ul className="cb-list">
          {mine.map(({ e, i }) => (
            <li key={i}>
              <span className="n">{customStat(e.stat)!.label}</span>
              <b className="num">{customValueText(e.stat, e.value)}</b>
              <small>{e.target === 'all' ? 'time todo' : character}</small>
              <button type="button" aria-label={`Remover ${customStat(e.stat)!.label}`} onClick={() => removeExtra(i)}>×</button>
            </li>
          ))}
        </ul>
      )}
      <div className="cb-add">
        <select className="dz-input" aria-label="Tipo de bônus" value={stat} onChange={(e) => setStat(e.target.value)}>
          {CUSTOM_GROUPS.map((g) => (
            <optgroup key={g.title} label={g.title}>
              {g.stats.map((s) => <option key={s.stat} value={s.stat}>{s.label}</option>)}
            </optgroup>
          ))}
        </select>
        <span className="val">
          <input className="num" inputMode="decimal" aria-label="Valor do bônus" placeholder="—" value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && ok && add()} />
          <i>{def?.pct ? '%' : ''}</i>
        </span>
        <select className="dz-input" aria-label="Para quem" value={target} onChange={(e) => setTarget(e.target.value as 'self' | 'all')}>
          <option value="self">{character}</option>
          <option value="all">Time todo</option>
        </select>
        <button type="button" className="dz-btn" disabled={!ok} onClick={add}>Adicionar</button>
      </div>
    </section>
  );
}
