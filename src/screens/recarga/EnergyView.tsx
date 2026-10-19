/** Cartões da calculadora de recarga, usados na aba do projeto e na aba livre. */
import { useMemo } from 'react';
import { CharacterAvatar, Chip } from '../../design/primitives';
import { elementColor } from '../../design/elements';
import { NumberInput, SelectField } from '../../design/fields';
import type { RotationProject } from '../../engine';
import type { LoadedData } from '../../features/rotation/data';
import {
  DEFAULT_ENEMY_PARTICLES,
  MARGIN_FACTOR,
  MARGIN_LABEL,
  energyMembers,
  energyResults,
  slotOf,
  withEnergy,
  type Margin,
  type StoredSlot,
} from '../../features/energy/energyModel';
import { formatDecimal, formatPercent } from '../../ui/format';

const STATUS_TEXT = {
  ignored: 'Não usa o Supremo (ER não importa)',
  comfortable: 'Confortável (até 135%)',
  balanced: 'Equilibrada (135 a 175%)',
  high: 'Alta (175 a 215%)',
  critical: 'Crítica (215% ou mais)',
} as const;

export function EnergyView({
  project,
  data,
  buildEr,
  onChange,
  onUseAsMinimum,
}: {
  project: RotationProject;
  data: LoadedData;
  /** ER real do build de cada membro (só no modo projeto). */
  buildEr?: number[];
  onChange: (next: RotationProject) => void;
  onUseAsMinimum?: (index: number, er: number) => void;
}) {
  const infos = useMemo(() => energyMembers(project, data.game.characters, data.particles), [project, data]);
  const results = useMemo(() => energyResults(project, infos), [project, infos]);
  const margin: Margin = project.meta.energy?.margin ?? 'medium';
  const enemyParticles = project.meta.energy?.enemyParticles ?? DEFAULT_ENEMY_PARTICLES;
  const names = project.members.map((m) => m.character);
  const setSlot = (name: string, value: Partial<StoredSlot>) => onChange(withEnergy(project, { slot: { name, value } }));

  return (
    <>
      <section className="dz-panel rc-scenario" aria-label="Cenário da recarga">
        <NumberInput label="Partículas dos inimigos" value={enemyParticles} min={0} step={1} onCommit={(v) => onChange(withEnergy(project, { enemyParticles: Math.max(0, v) }))} />
        <SelectField<Margin>
          label="Folga sobre o necessário"
          value={margin}
          onChange={(m) => onChange(withEnergy(project, { margin: m }))}
          options={(Object.keys(MARGIN_LABEL) as Margin[]).map((m) => ({ value: m, label: MARGIN_LABEL[m] }))}
        />
        <p className="note">Quantas partículas de inimigos caem na rotação (6 é o padrão do Abismo). A folga serve para chefes e para falhas de posicionamento.</p>
      </section>

      <div className="rc-grid">
        {infos.map((info, i) => {
          const m = info.member;
          const r = results[i];
          const s = slotOf(project, m.name);
          const color = elementColor(m.element);
          const character = data.game.characters.find((c) => c.name === m.name);
          const target = r.status === 'ignored' ? 1 : Math.max(1, r.neededER * MARGIN_FACTOR[margin]);
          const have = buildEr?.[i];
          const gap = have === undefined ? undefined : have - target;
          const scaleMax = Math.max(target, have ?? 0, 1.5) * 1.1;
          return (
            <section className="dz-panel rc-card" key={m.name} style={{ ['--c' as string]: color }} aria-label={`Recarga de ${m.name}`}>
              <div className="who">
                <CharacterAvatar name={m.name} icon={character?.icon} color={color} size={56} />
                <div>
                  <h2 className="h2">{m.name}</h2>
                  <span className="sub">{m.element} · Supremo {m.burstCost > 0 ? `${m.burstCost} de energia` : 'sem custo'}</span>
                </div>
              </div>

              <div className="need" data-status={r.status}>
                <span className="v num">{r.status === 'ignored' ? '—' : formatPercent(target, 1)}</span>
                <Chip tone={color}>{STATUS_TEXT[r.status]}</Chip>
                {r.status !== 'ignored' && have !== undefined && (
                  <>
                    <div className="meter" role="img" aria-label={`Necessária ${formatPercent(target, 0)}, build com ${formatPercent(have, 0)}`}>
                      <i style={{ width: `${(target / scaleMax) * 100}%` }} />
                      <b style={{ left: `${(have / scaleMax) * 100}%` }} />
                    </div>
                    <p className="cmp">
                      {gap! >= -0.0005 ? `O build tem ${formatPercent(have, 1)}: sobra ${formatDecimal(gap! * 100, 1)} pontos.` : `O build tem ${formatPercent(have, 1)}: faltam ${formatDecimal(-gap! * 100, 1)} pontos.`}
                    </p>
                  </>
                )}
                {r.status !== 'ignored' && onUseAsMinimum && (
                  <button type="button" className="dz-btn" onClick={() => onUseAsMinimum(i, target)} title="O otimizador passa a garantir esta recarga, gastando só os rolls de ER necessários">
                    Usar como ER mínimo do build
                  </button>
                )}
              </div>

              <div className="split" aria-label="Fontes de energia">
                <span>Habilidade <b className="num">{formatDecimal(r.baseFromSkills, 1)}</b></span>
                <span>Inimigos <b className="num">{formatDecimal(r.baseFromEnemies, 1)}</b></span>
                {r.baseFromFavonius > 0 && <span>Favonius <b className="num">{formatDecimal(r.baseFromFavonius, 1)}</b></span>}
                {r.flatEnergy > 0 && <span>Fixa <b className="num">+{formatDecimal(r.flatEnergy, 1)}</b></span>}
              </div>

              <div className="fields">
                {m.burstCost > 0 && (
                  <label className="dz-check">
                    <input type="checkbox" checked={s.useBurst} onChange={(e) => setSlot(m.name, { useBurst: e.target.checked })} /> Usa o Supremo na rotação
                  </label>
                )}
                <NumberInput label="Usos da habilidade" value={s.skillUses} min={0} step={1} onCommit={(v) => setSlot(m.name, { skillUses: Math.max(0, v) })} />
                <NumberInput
                  label={`Partículas por uso${info.tableParticles === undefined ? ' (sem dado)' : ''}`}
                  value={s.particles ?? m.particles}
                  min={0}
                  step={0.25}
                  onCommit={(v) => setSlot(m.name, { particles: v === info.tableParticles ? undefined : Math.max(0, v) })}
                />
                <NumberInput label="Energia fixa" value={s.flat} min={0} step={1} onCommit={(v) => setSlot(m.name, { flat: Math.max(0, v) })} />
                <NumberInput label="Tempo em campo" value={Math.round(s.fieldTime * 100)} min={0} max={100} step={5} suffix="%" onCommit={(v) => setSlot(m.name, { fieldTime: Math.min(100, Math.max(0, v)) / 100 })} />
                <NumberInput label="Ativações de Favonius" value={s.favProcs} min={0} step={1} onCommit={(v) => setSlot(m.name, { favProcs: Math.max(0, Math.round(v)) })} />
                {s.favProcs > 0 && (
                  <SelectField<string>
                    label="Quem está em campo nas ativações"
                    value={s.favTarget ?? ''}
                    onChange={(v) => setSlot(m.name, { favTarget: v || null })}
                    options={[{ value: '', label: 'Ninguém (todos fora)' }, ...names.map((n) => ({ value: n, label: n }))]}
                  />
                )}
              </div>

              <fieldset className="rc-field">
                <legend>Em campo quando as partículas da habilidade caem</legend>
                {names.map((n) => (
                  <label key={n} className="dz-check">
                    <input type="checkbox" checked={s.onField.includes(n)} onChange={(e) => setSlot(m.name, { onField: e.target.checked ? [...s.onField, n] : s.onField.filter((x) => x !== n) })} />
                    {n}
                  </label>
                ))}
                <p className="note">Quem está marcado recebe as partículas em campo (mais energia); marcando mais de um, elas se dividem. Sem ninguém marcado, todos recebem fora de campo.</p>
              </fieldset>
              {info.note && info.tableParticles !== undefined && <p className="note">Partículas: {info.note}</p>}
            </section>
          );
        })}
      </div>
    </>
  );
}
