/** Buff manual da rotação: qualquer bônus com nome, que vira uma faixa na linha do tempo (com janela) e pode valer só para os N primeiros golpes. */
import { useState } from 'react';
import type { ProjectView } from '../../app/ProjectContext';
import { Button } from '../../design/Button';
import { effectiveDuration, type ExtraBuff } from '../../engine';
import { CUSTOM_GROUPS, customStat } from '../../features/rotation/customBuffs';
import { useRotationStore } from '../../features/rotation/store';

/** O buff manual desta faixa (o extra de time com a etiqueta), se ele é um. */
export const MANUAL_SUFFIX = ' (manual)';
export const manualIndex = (extras: readonly ExtraBuff[], tag: string): number => extras.findIndex((e) => e.team && !!e.label && `label:${e.label.trim()}` === tag && !!e.description?.endsWith(MANUAL_SUFFIX));

export function ManualBuffForm({ v }: { v: ProjectView }) {
  const st = useRotationStore.getState;
  const [label, setLabel] = useState('');
  const [stat, setStat] = useState('DMG% Normal');
  const [value, setValue] = useState('');
  const [target, setTarget] = useState('all');
  const [limit, setLimit] = useState('');
  const def = customStat(stat);
  const typed = Number(value.replace(',', '.'));
  const n = limit.trim() === '' ? 0 : Math.round(Number(limit));
  const names = v.project.members.map((m) => m.character);
  const clash = v.project.extras.some((e) => e.label?.trim() === label.trim()) || v.project.buffWindows.some((w) => w.tag === `label:${label.trim()}`);
  const ok = label.trim() !== '' && !clash && value.trim() !== '' && Number.isFinite(typed) && (limit.trim() === '' || (Number.isFinite(n) && n > 0));

  const add = () => {
    if (!def || !ok) return;
    const name = label.trim();
    st().addExtra({ target, stat, value: def.pct ? typed / 100 : typed, team: true, label: name, description: `${name}${MANUAL_SUFFIX}` });
    // A faixa nasce com a rotação inteira; o limite de golpes (se houver) já vale.
    const id = st().addWindow(`label:${name}`, 0, effectiveDuration(st().project ?? v.project));
    if (id) {
      st().setWindowMode(id, 'whole');
      if (n > 0) st().updateWindow(id, { maxHits: n });
      st().selectWindow(id);
    }
    setLabel('');
    setValue('');
    setLimit('');
  };

  return (
    <details className="rt-manual">
      <summary>Criar buff manual</summary>
      <p className="rt-note">Qualquer bônus com um nome, para valer na rotação (ex.: Rift da Skirk: +20% de DMG Normal nos 10 primeiros golpes). Aparece como uma faixa na linha do tempo.</p>
      <label className="rt-fld">Nome<input className="dz-input" value={label} maxLength={40} placeholder="Ex.: Rift da Skirk" onChange={(e) => setLabel(e.target.value)} /></label>
      <label className="rt-fld">Tipo de bônus
        <select className="dz-input" value={stat} onChange={(e) => setStat(e.target.value)}>
          {CUSTOM_GROUPS.map((g) => (
            <optgroup key={g.title} label={g.title}>{g.stats.map((s) => <option key={s.stat} value={s.stat}>{s.label}</option>)}</optgroup>
          ))}
        </select>
      </label>
      <div className="rt-two">
        <label className="rt-fld">Valor{def?.pct ? ' (%)' : ''}<input className="dz-input num" inputMode="decimal" value={value} placeholder="20" onChange={(e) => setValue(e.target.value)} /></label>
        <label className="rt-fld">Só os N primeiros golpes<input className="dz-input num" inputMode="numeric" value={limit} placeholder="todos" onChange={(e) => setLimit(e.target.value)} /></label>
      </div>
      <label className="rt-fld">Para quem
        <select className="dz-input" value={target} onChange={(e) => setTarget(e.target.value)}>
          <option value="all">Time todo</option>
          {names.map((nm) => <option key={nm} value={nm}>{nm}</option>)}
        </select>
      </label>
      {clash && label.trim() !== '' && <span className="rt-note">Já existe uma faixa com esse nome.</span>}
      <Button variant="secondary" size="sm" disabled={!ok} onClick={add}>Criar buff</Button>
    </details>
  );
}
