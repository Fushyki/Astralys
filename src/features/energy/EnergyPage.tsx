/**
 * Calculadora de Recarga de Energia (`/rotacao/:id/recarga`): para cada personagem da equipe do projeto, quanta ER
 * precisa para soltar o Supremo a cada rotação, comparada com a ER que o build atual realmente tem.
 */
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import '../../ui/ast.css';
import type { RotationProject } from '../../engine';
import { ELEMENT_COLOR, formatDecimal, formatPercent } from '../../ui/format';
import { NumberField } from '../../ui/NumberField';
import { useGameData } from '../rotation/data';
import { SAMPLE_ID, loadProject, saveProject } from '../rotation/persistence';
import { useAnalysis } from '../rotation/useAnalysis';
import { Portrait } from '../rotation/TeamBar';
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
} from './energyModel';

const STATUS_TEXT = {
  ignored: 'Não usa o Supremo (ER não importa)',
  comfortable: 'Confortável (até 135%)',
  balanced: 'Equilibrada (135 a 175%)',
  high: 'Alta (175 a 215%)',
  critical: 'Crítica (215% ou mais)',
} as const;

export default function EnergyPage() {
  const { id = SAMPLE_ID } = useParams();
  const { data } = useGameData();
  const [project, setProject] = useState<RotationProject | null>(() => loadProject(id));
  const analysis = useAnalysis(project, data);

  const save = (next: RotationProject) => {
    setProject(next);
    saveProject(next);
  };

  const infos = useMemo(() => (project && data ? energyMembers(project, data.game.characters, data.particles) : []), [project, data]);
  const results = useMemo(() => (project && infos.length ? energyResults(project, infos) : []), [project, infos]);

  if (!project) {
    return (
      <div className="ast-app">
        <div className="ast-state">
          <h1 className="ast-caps">Projeto não encontrado</h1>
          <p>Não existe um projeto salvo com o id “{id}” neste navegador.</p>
          <Link className="ast-btn" to="/rotacao">Meus projetos</Link>
        </div>
      </div>
    );
  }

  const margin: Margin = project.meta.energy?.margin ?? 'medium';
  const enemyParticles = project.meta.energy?.enemyParticles ?? DEFAULT_ENEMY_PARTICLES;
  const buildEr = analysis.status === 'ready' ? analysis.bundle.memberStats.map((s) => s.er) : [];
  const names = project.members.map((m) => m.character);

  const setSlot = (name: string, value: Partial<StoredSlot>) => save(withEnergy(project, { slot: { name, value } }));
  const useAsMinimum = (i: number, er: number) => {
    const members = project.members.map((m, k) => (k === i ? { ...m, minER: Math.round(er * 1000) / 1000 } : m));
    save({ ...project, members, meta: { ...project.meta, updatedAt: new Date().toISOString() } });
  };

  return (
    <div className="ast-app">
      <div className="ast-shell">
        <header className="ast-title">
          <h1 className="ast-caps">Recarga de {project.name}</h1>
          <Link className="ast-btn" to={`/rotacao/${project.id}`}>Voltar ao editor</Link>
          <Link className="ast-btn" to="/rotacao">Meus projetos</Link>
        </header>

        <div className="ast-scenario" aria-label="Cenário da recarga">
          <NumberField label="Partículas dos inimigos" value={enemyParticles} min={0} step={1} onCommit={(v) => save(withEnergy(project, { enemyParticles: Math.max(0, v) }))} />
          <label className="ast-field">
            <span>Folga sobre o necessário</span>
            <select value={margin} onChange={(e) => save(withEnergy(project, { margin: e.target.value as Margin }))} aria-label="Folga sobre a recarga necessária">
              {(Object.keys(MARGIN_LABEL) as Margin[]).map((m) => (<option key={m} value={m}>{MARGIN_LABEL[m]}</option>))}
            </select>
          </label>
          <p className="ast-hint" style={{ margin: 0, flex: 1, minWidth: 240 }}>
            Quantas partículas de inimigos caem na rotação (6 é o padrão do Abismo). A folga serve para chefes e para falhas de posicionamento.
          </p>
        </div>

        <div className="ast-energy">
          {infos.map((info, i) => {
            const m = info.member;
            const r = results[i];
            const s = slotOf(project, m.name);
            const color = ELEMENT_COLOR[m.element] ?? '#d8b668';
            const character = data?.game.characters.find((c) => c.name === m.name);
            const target = r.status === 'ignored' ? 1 : Math.max(1, r.neededER * MARGIN_FACTOR[margin]);
            const have = buildEr[i];
            const gap = have === undefined ? undefined : have - target;
            const scaleMax = Math.max(target, have ?? 0, 1.5) * 1.1;
            return (
              <section className="ast-ecard" key={m.name} style={{ ['--c' as string]: color }} aria-label={`Recarga de ${m.name}`}>
                <div className="head">
                  <Portrait icon={character?.icon} name={m.name} />
                  <div>
                    <h2 className="ast-caps">{m.name}</h2>
                    <p>{m.element} · Supremo {m.burstCost > 0 ? `${m.burstCost} de energia` : 'sem custo'}</p>
                  </div>
                </div>

                <div className="need" data-status={r.status}>
                  <span className="v">{r.status === 'ignored' ? '—' : formatPercent(target, 1)}</span>
                  <span className="l">{STATUS_TEXT[r.status]}</span>
                  {r.status !== 'ignored' && (
                    <>
                      <div className="meter" role="img" aria-label={`Necessária ${formatPercent(target, 0)}${have !== undefined ? `, build com ${formatPercent(have, 0)}` : ''}`}>
                        <i className="need-bar" style={{ width: `${(target / scaleMax) * 100}%` }} />
                        {have !== undefined && <b className="have-mark" style={{ left: `${(have / scaleMax) * 100}%` }} />}
                      </div>
                      <p className="cmp">
                        {have === undefined
                          ? 'Calculando o build…'
                          : gap! >= -0.0005
                            ? `O build tem ${formatPercent(have, 1)}: sobra ${formatDecimal(gap! * 100, 1)} pontos.`
                            : `O build tem ${formatPercent(have, 1)}: faltam ${formatDecimal(-gap! * 100, 1)} pontos.`}
                      </p>
                      <button type="button" className="ast-btn sm" onClick={() => useAsMinimum(i, target)} title="O otimizador passa a garantir esta recarga, gastando só os rolls de ER necessários">
                        Usar como ER mínimo do build
                      </button>
                    </>
                  )}
                </div>

                <div className="split" aria-label="Fontes de energia">
                  <span>Habilidade <b>{formatDecimal(r.baseFromSkills, 1)}</b></span>
                  <span>Inimigos <b>{formatDecimal(r.baseFromEnemies, 1)}</b></span>
                  {r.baseFromFavonius > 0 && <span>Favonius <b>{formatDecimal(r.baseFromFavonius, 1)}</b></span>}
                  {r.flatEnergy > 0 && <span>Fixa <b>+{formatDecimal(r.flatEnergy, 1)}</b></span>}
                </div>

                <div className="fields">
                  {m.burstCost > 0 && (
                    <label className="ast-check">
                      <input type="checkbox" checked={s.useBurst} onChange={(e) => setSlot(m.name, { useBurst: e.target.checked })} /> Usa o Supremo na rotação
                    </label>
                  )}
                  <NumberField label="Usos da habilidade" value={s.skillUses} min={0} step={1} onCommit={(v) => setSlot(m.name, { skillUses: Math.max(0, v) })} />
                  <NumberField
                    label={`Partículas por uso${info.tableParticles === undefined ? ' (sem dado)' : ''}`}
                    value={s.particles ?? m.particles}
                    min={0}
                    step={0.25}
                    onCommit={(v) => setSlot(m.name, { particles: v === info.tableParticles ? undefined : Math.max(0, v) })}
                  />
                  <NumberField label="Energia fixa" value={s.flat} min={0} step={1} onCommit={(v) => setSlot(m.name, { flat: Math.max(0, v) })} />
                  <NumberField label="Tempo em campo" value={Math.round(s.fieldTime * 100)} min={0} max={100} step={5} suffix="%" onCommit={(v) => setSlot(m.name, { fieldTime: Math.min(100, Math.max(0, v)) / 100 })} />
                  <NumberField label="Ativações de Favonius" value={s.favProcs} min={0} step={1} onCommit={(v) => setSlot(m.name, { favProcs: Math.max(0, Math.round(v)) })} />
                  {s.favProcs > 0 && (
                    <label className="ast-field">
                      <span>Quem está em campo nas ativações</span>
                      <select value={s.favTarget ?? ''} onChange={(e) => setSlot(m.name, { favTarget: e.target.value || null })}>
                        <option value="">Ninguém (todos fora)</option>
                        {names.map((n) => (<option key={n} value={n}>{n}</option>))}
                      </select>
                    </label>
                  )}
                </div>

                <fieldset className="ast-source">
                  <legend>Em campo quando as partículas da habilidade caem</legend>
                  {names.map((n) => (
                    <label key={n} className="ast-check">
                      <input
                        type="checkbox"
                        checked={s.onField.includes(n)}
                        onChange={(e) => setSlot(m.name, { onField: e.target.checked ? [...s.onField, n] : s.onField.filter((x) => x !== n) })}
                      />{' '}
                      {n}
                    </label>
                  ))}
                  <p className="ast-hint" style={{ margin: '4px 0 0' }}>
                    Quem está marcado recebe as partículas em campo (mais energia); marcando mais de um, elas se dividem. Sem ninguém marcado, todos recebem fora de campo.
                  </p>
                </fieldset>
                {info.note && info.tableParticles !== undefined && <p className="ast-hint" style={{ margin: 0 }}>Partículas: {info.note}</p>}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
