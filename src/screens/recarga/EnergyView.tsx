/** Cartões da calculadora de recarga (um por slot), usados na aba do projeto e na calculadora avulsa. */
import { useMemo } from 'react';
import { Chip } from '../../design/primitives';
import { splashUrl } from '../card/cardParts';
import { elementColor } from '../../design/elements';
import { NumberInput, SelectField } from '../../design/fields';
import { RAIDEN_TEAM_ENERGY, SAFETY_MARGIN, type RotationProject } from '../../engine';
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

const CUSTOM = '__custom';

/** Opções do menu "quem absorve as partículas": ele mesmo, passar para um aliado, dividir entre dois ou ninguém (fora de campo). */
export function funnelOptions(self: string, names: string[]): { value: string; label: string }[] {
  const others = names.filter((n) => n !== self);
  const opts = [{ value: `to:${self}`, label: 'Ele mesmo (em campo)' }, ...others.map((n) => ({ value: `to:${n}`, label: `Passar para ${n}` }))];
  const all = [self, ...others];
  for (let a = 0; a < all.length; a++) for (let b = a + 1; b < all.length; b++) opts.push({ value: `to:${all[a]}|${all[b]}`, label: `Dividir entre ${all[a]} e ${all[b]}` });
  opts.push({ value: 'to:', label: 'Fora de campo (ninguém recebe em campo)' });
  return opts;
}

export function funnelValue(onField: string[], names: string[]): string {
  const valid = onField.filter((n) => names.includes(n));
  if (valid.length > 2) return CUSTOM;
  return `to:${[...valid].sort((a, b) => names.indexOf(a) - names.indexOf(b)).join('|')}`;
}

export function funnelReceivers(value: string, names: string[]): string[] {
  return value
    .slice(3)
    .split('|')
    .filter((n) => n && names.includes(n));
}

export function EnergyView({
  project,
  data,
  buildEr,
  onChange,
  onUseAsMinimum,
  onSwap,
  onRemove,
}: {
  project: RotationProject;
  data: LoadedData;
  /** ER real do build de cada membro (só no modo projeto). */
  buildEr?: number[];
  onChange: (next: RotationProject) => void;
  onUseAsMinimum?: (index: number, er: number) => void;
  /** Na calculadora avulsa, cada slot tem um menu para trocar o personagem. */
  onSwap?: (index: number, name: string) => void;
  /** Na calculadora avulsa, tira o slot do time. */
  onRemove?: (index: number) => void;
}) {
  const infos = useMemo(() => energyMembers(project, data.game.characters, data.particles), [project, data]);
  const results = useMemo(() => energyResults(project, infos), [project, infos]);
  const margin: Margin = project.meta.energy?.margin ?? 'medium';
  const enemyParticles = project.meta.energy?.enemyParticles ?? DEFAULT_ENEMY_PARTICLES;
  const names = project.members.map((m) => m.character);
  const setSlot = (name: string, value: Partial<StoredSlot>) => onChange(withEnergy(project, { slot: { name, value } }));
  const hasRaiden = results.some((r) => r.teamFlat > 0);
  const allNames = useMemo(() => data.game.characters.map((c) => c.name).sort((a, b) => a.localeCompare(b)), [data]);

  const top = results.reduce<number>((best, r, i) => (r.status !== 'ignored' && (best < 0 || r.neededER > results[best].neededER) ? i : best), -1);

  return (
    <>
      <section className="rc-hero" aria-label="Resumo da recarga">
        <div style={{ ['--accent' as string]: top >= 0 ? elementColor(infos[top].member.element) : undefined }}>
          <span className="k">Maior recarga necessária</span>
          <b className="big num">{top >= 0 ? formatPercent(results[top].neededER, 0) : '—'}</b>
          {top >= 0 && <span className="who-top">{infos[top].member.name}</span>}
        </div>
        <div className="kpis">
          {infos.map((info, i) => (
            <div key={info.member.name} style={{ ['--c' as string]: elementColor(info.member.element) }}>
              <b className="v num">{results[i].status === 'ignored' ? '—' : formatPercent(results[i].neededER, 0)}</b>
              <span className="l">{info.member.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="dz-panel rc-scenario" aria-label="Cenário da recarga">
        <NumberInput label="Partículas dos inimigos" value={enemyParticles} min={0} step={1} onCommit={(v) => onChange(withEnergy(project, { enemyParticles: Math.max(0, v) }))} />
        <SelectField<Margin>
          label="Folga sobre o necessário"
          value={margin}
          onChange={(m) => onChange(withEnergy(project, { margin: m }))}
          options={(Object.keys(MARGIN_LABEL) as Margin[]).map((m) => ({ value: m, label: MARGIN_LABEL[m] }))}
        />
        <p className="note">
          Quantas partículas de inimigos caem na rotação (6 é o padrão do Abismo). A folga serve para chefes e para falhas de posicionamento.
          {hasRaiden && ` A Raiden Shogun no time dá +${RAIDEN_TEAM_ENERGY} de energia fixa aos aliados.`}
        </p>
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
          const fun = funnelValue(s.onField, names);
          const funOpts = funnelOptions(m.name, names);
          return (
            <section className="dz-panel rc-card" key={m.name} style={{ ['--c' as string]: color }} aria-label={`Recarga de ${m.name}`}>
              <img className="splash" src={splashUrl(character?.icon ?? '')} alt="" loading="lazy" crossOrigin="anonymous" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              <div className="rc-head">
                <span className="rc-slot">Slot {i + 1}</span>
                <span className="rc-pills">
                  <Chip tone={color}>{m.element}</Chip>
                  <Chip>{m.burstCost > 0 ? `Custo: ${m.burstCost}` : 'Sem custo'}</Chip>
                  {onRemove && names.length > 1 && <button type="button" className="x" onClick={() => onRemove(i)} aria-label={`Remover ${m.name}`} title="Remover do time">×</button>}
                </span>
              </div>

              <div className="who">
                {onSwap ? (
                  <select className="dz-input" aria-label={`Personagem do slot ${i + 1}`} value={m.name} onChange={(e) => onSwap(i, e.target.value)}>
                    {allNames.map((n) => (
                      <option key={n} value={n} disabled={n !== m.name && names.includes(n)}>{n}</option>
                    ))}
                  </select>
                ) : (
                  <h2 className="h2">{m.name}</h2>
                )}
              </div>

              <div className="need" data-status={r.status}>
                <span className="v num">{r.status === 'ignored' ? '—' : formatPercent(r.neededER, 1)}</span>
                <Chip tone={color}>{STATUS_TEXT[r.status]}</Chip>
                {r.status !== 'ignored' && (
                  <span className="safe">Margem de segurança (+{Math.round((SAFETY_MARGIN - 1) * 100)}% chefe): <b className="num">{formatPercent(r.safeER, 1)}</b></span>
                )}
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

              <div className="rc-params">
                {m.burstCost > 0 && (
                  <SelectField<'sim' | 'nao'>
                    label="Usa o Supremo (Q)?"
                    value={s.useBurst ? 'sim' : 'nao'}
                    onChange={(v) => setSlot(m.name, { useBurst: v === 'sim' })}
                    options={[{ value: 'sim', label: 'Sim (a cada ciclo)' }, { value: 'nao', label: 'Não (ignora a ER)' }]}
                  />
                )}
                <NumberInput label="Usos da habilidade (E)" value={s.skillUses} min={0} step={1} onCommit={(v) => setSlot(m.name, { skillUses: Math.max(0, v) })} />
                <NumberInput
                  label={`Partículas por uso do E${info.tableParticles === undefined ? ' (sem dado)' : ''}`}
                  value={s.particles ?? m.particles}
                  min={0}
                  step={0.25}
                  onCommit={(v) => setSlot(m.name, { particles: v === info.tableParticles ? undefined : Math.max(0, v) })}
                />
                <SelectField<string>
                  label="Quem absorve as partículas do E"
                  value={fun}
                  onChange={(v) => v !== CUSTOM && setSlot(m.name, { onField: funnelReceivers(v, names) })}
                  options={fun === CUSTOM ? [...funOpts, { value: CUSTOM, label: `Personalizado (${s.onField.length} em campo)` }] : funOpts}
                />
                <NumberInput label="Ativações de Favonius" value={s.favProcs} min={0} step={1} onCommit={(v) => setSlot(m.name, { favProcs: Math.max(0, Math.round(v)) })} />
                {s.favProcs > 0 && (
                  <SelectField<string>
                    label="Quem absorve a Favonius"
                    value={s.favTarget ?? ''}
                    onChange={(v) => setSlot(m.name, { favTarget: v || null })}
                    options={[{ value: '', label: 'Ninguém (todos fora)' }, ...names.map((n) => ({ value: n, label: n === m.name ? 'Ele mesmo (em campo)' : `Passar para ${n}` }))]}
                  />
                )}
                <NumberInput label="Energia fixa direta (flat)" value={s.flat} min={0} step={1} onCommit={(v) => setSlot(m.name, { flat: Math.max(0, v) })} />
                <NumberInput label="Tempo em campo" value={Math.round(s.fieldTime * 100)} min={0} max={100} step={5} suffix="%" onCommit={(v) => setSlot(m.name, { fieldTime: Math.min(100, Math.max(0, v)) / 100 })} />
              </div>

              <dl className="rc-break" aria-label="Fontes de energia">
                <div><dt>De habilidades do time</dt><dd className="num">{formatDecimal(r.baseFromSkills, 1)}</dd></div>
                <div><dt>De armas Favonius</dt><dd className="num">{formatDecimal(r.baseFromFavonius, 1)}</dd></div>
                <div><dt>De drops de inimigos</dt><dd className="num">{formatDecimal(r.baseFromEnemies, 1)}</dd></div>
                {r.flatEnergy - r.teamFlat > 0 && <div className="hl"><dt>Energia fixa (flat)</dt><dd className="num">{formatDecimal(r.flatEnergy - r.teamFlat, 1)}</dd></div>}
                {r.teamFlat > 0 && <div className="hl"><dt>Raiden Shogun no time</dt><dd className="num">{formatDecimal(r.teamFlat, 1)}</dd></div>}
                <div className="total"><dt>Total de energia base</dt><dd className="num">{formatDecimal(r.totalBase, 1)}</dd></div>
              </dl>
              {info.note && info.tableParticles !== undefined && <p className="note">Partículas: {info.note}</p>}
            </section>
          );
        })}
      </div>

      <details className="dz-panel rc-tips">
        <summary>Entendendo a matemática da recarga</summary>
        <ul>
          <li><b>Partículas:</b> do mesmo elemento rendem ×3 em campo e ×1,8 fora; de outro elemento, ×1 em campo e ×0,6 fora; as neutras (inimigos e Favonius), ×2 em campo e ×1,2 fora.</li>
          <li><b>Canalização dividida:</b> se um personagem solta partículas no começo e depois troca para outro (ex.: Mavuika para Iansan e depois Bennett), escolha "Dividir entre…" em quem absorve as partículas do E.</li>
          <li><b>Sem Supremo:</b> quem não usa o Supremo (Vodyanitsa sem Ult, Skirk com custo 0) fica com a ER ignorada, mas o E continua gerando partículas para o time.</li>
          <li><b>Favonius:</b> cada crítico com a arma solta 3 partículas neutras que alimentam o time inteiro; diga quem está em campo nas ativações.</li>
        </ul>
      </details>
    </>
  );
}
